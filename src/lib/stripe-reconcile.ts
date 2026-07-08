/**
 * Shared Stripe → Order/Payment reconciliation.
 *
 * Used by BOTH the async webhook (`/api/stripe/webhook`) and the synchronous
 * success-page verifier (`/api/stripe/verify-session`). Whichever runs first
 * wins; everything here is idempotent so the second call is a no-op. This is why
 * an order still flips to "paid" locally even when `stripe listen` isn't
 * forwarding the webhook — the success page reconciles it on return.
 */

import { sendOperationsNewOrderEmail, sendOrderConfirmedEmail } from '@/lib/email-service'
import { fromStripeAmount } from '@/lib/stripe'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import PromoCode from '@/models/PromoCode'
import type Stripe from 'stripe'

/**
 * Flip an order to paid exactly once (idempotent across retried/duplicate calls)
 * and burn a promo redemption + send confirmation emails on the first transition.
 */
export async function markOrderPaidOnce(
  orderId: string,
  info: { transactionId?: string; sessionId?: string; cardLast4?: string; cardNetwork?: string }
) {
  if (!orderId) return
  try {
    const set: Record<string, unknown> = {
      'paymentDetails.paymentStatus': 'paid',
      'paymentDetails.paymentMethod': 'stripe',
      status: 'paid',
    }
    if (info.transactionId) set['paymentDetails.transactionId'] = info.transactionId
    if (info.sessionId) set['paymentDetails.stripeSessionId'] = info.sessionId
    if (info.cardLast4) set['paymentDetails.cardLast4'] = info.cardLast4
    if (info.cardNetwork) set['paymentDetails.cardNetwork'] = info.cardNetwork

    const updatedOrder = await Order.findOneAndUpdate(
      {
        $or: [{ _id: orderId }, { orderId }],
        'paymentDetails.paymentStatus': { $ne: 'paid' },
      },
      { $set: set },
      { new: true }
    )

    // First transition only → burn a promo redemption (respecting usageLimit).
    // Later calls won't match the { $ne: 'paid' } guard, so this can't double-count.
    if (updatedOrder) {
      const code: string | undefined =
        updatedOrder.couponCode || updatedOrder.discountCode || undefined
      if (code) {
        const promo = await PromoCode.findOne({ code: code.toUpperCase() }).select(
          '_id usageLimit usageCount'
        )
        if (promo) {
          const incQuery: Record<string, unknown> = { _id: promo._id }
          if (promo.usageLimit) {
            incQuery.usageCount = { $lt: promo.usageLimit }
          }
          await PromoCode.updateOne(incQuery, { $inc: { usageCount: 1 } })
        }
      }

      // Payment just cleared → send the customer confirmation + the internal
      // "paid" ops alert. Best-effort; only on the first paid-transition, so
      // repeated reconciliation can't duplicate them.
      const plain = updatedOrder.toObject()
      try {
        await sendOrderConfirmedEmail(plain)
      } catch (e) {
        console.error('Order confirmed email failed:', e)
      }
      try {
        await sendOperationsNewOrderEmail(plain, 'confirmed')
      } catch (e) {
        console.error('Ops paid email failed:', e)
      }
    }
  } catch (err) {
    console.error('markOrderPaidOnce failed:', err)
  }
}

/**
 * Upsert the Payment record from a completed Checkout Session and mark the order
 * paid. Safe to call multiple times for the same session.
 */
export async function reconcileCheckoutSession(stripe: Stripe, session: Stripe.Checkout.Session) {
  const orderId = (session.metadata?.orderId as string | undefined) ?? ''
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

  // Fetch the PaymentIntent to extract payment-method details.
  let paymentMethodInfo: any = undefined
  let cardLast4: string | undefined
  let cardNetwork: string | undefined
  if (paymentIntentId) {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.payment_method_details'],
    })
    const charge = pi.latest_charge as Stripe.Charge | null
    const pmDetails = charge?.payment_method_details
    if (pmDetails?.card) {
      paymentMethodInfo = {
        type: 'card',
        cardNetwork: pmDetails.card.brand,
        cardLast4: pmDetails.card.last4,
        cardType: pmDetails.card.funding,
      }
      cardLast4 = pmDetails.card.last4 ?? undefined
      cardNetwork = pmDetails.card.brand ?? undefined
    } else if (pmDetails?.afterpay_clearpay) {
      paymentMethodInfo = { type: 'afterpay_clearpay' }
    } else if (pmDetails?.link) {
      paymentMethodInfo = { type: 'link' }
    }
  }

  const totalDollars = fromStripeAmount(session.amount_total ?? 0)
  const customer = session.customer_details

  await Payment.findOneAndUpdate(
    { providerOrderId: session.id },
    {
      $set: {
        paymentId: paymentIntentId || session.id,
        orderId,
        provider: 'stripe',
        amount: totalDollars,
        currency: (session.currency ?? 'aud').toUpperCase(),
        providerPaymentId: paymentIntentId,
        providerOrderId: session.id,
        providerCustomerId:
          typeof session.customer === 'string' ? session.customer : session.customer?.id,
        status: 'captured',
        customerEmail: customer?.email ?? '',
        customerPhone: customer?.phone ?? '',
        customerName: customer?.name ?? '',
        paymentMethod: paymentMethodInfo,
        capturedAt: new Date(),
      },
      $push: {
        statusHistory: {
          status: 'captured',
          timestamp: new Date(),
          reason: 'checkout.session.completed',
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (orderId) {
    await markOrderPaidOnce(orderId, {
      transactionId: paymentIntentId,
      sessionId: session.id,
      cardLast4,
      cardNetwork,
    })
  }
}
