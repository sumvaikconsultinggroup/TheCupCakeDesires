/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events and reconciles them with our Order + Payment models.
 * Signature is verified using STRIPE_WEBHOOK_SECRET.
 *
 * To test locally:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 *
 * Events handled:
 *   - checkout.session.completed   → mark Payment captured, Order paid
 *   - payment_intent.succeeded     → ensure Payment captured (backup path)
 *   - payment_intent.payment_failed → mark Payment + Order failed
 *   - charge.refunded               → record refund on Payment
 *
 * Returning 200 to Stripe is critical even when we don't recognise the event —
 * otherwise Stripe will keep retrying. Errors that should retry use 5xx.
 */

import connectDb from '@/lib/mongodb'
import { fromStripeAmount, getStripeWebhookSecret, requireStripe } from '@/lib/stripe'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function upsertPaymentFromSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const orderId = (session.metadata?.orderId as string | undefined) ?? ''
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id

  // Fetch the PaymentIntent to extract payment-method details
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

  // Mark the order as paid
  if (orderId) {
    try {
      await Order.findOneAndUpdate(
        { $or: [{ _id: orderId }, { orderId }] },
        {
          $set: {
            'paymentDetails.paymentStatus': 'paid',
            'paymentDetails.paymentMethod': 'stripe',
            'paymentDetails.transactionId': paymentIntentId,
            'paymentDetails.stripeSessionId': session.id,
            'paymentDetails.cardLast4': cardLast4,
            'paymentDetails.cardNetwork': cardNetwork,
            status: 'confirmed',
          },
        }
      )
    } catch (err) {
      // Don't fail the webhook just because we can't find the order — log and move on
      console.error('Order update on checkout.session.completed failed:', err)
    }
  }
}

async function markPaymentFailed(stripe: Stripe, paymentIntent: Stripe.PaymentIntent) {
  await Payment.findOneAndUpdate(
    { providerPaymentId: paymentIntent.id },
    {
      $set: {
        status: 'failed',
        failedAt: new Date(),
        errorCode: paymentIntent.last_payment_error?.code,
        errorMessage: paymentIntent.last_payment_error?.message,
        errorSource: paymentIntent.last_payment_error?.type,
      },
      $push: {
        statusHistory: {
          status: 'failed',
          timestamp: new Date(),
          reason: paymentIntent.last_payment_error?.message ?? 'payment_intent.payment_failed',
        },
      },
    }
  )

  const orderId = paymentIntent.metadata?.orderId
  if (orderId) {
    try {
      await Order.findOneAndUpdate(
        { $or: [{ _id: orderId }, { orderId }] },
        {
          $set: {
            'paymentDetails.paymentStatus': 'failed',
          },
        }
      )
    } catch (err) {
      console.error('Order update on payment_intent.payment_failed failed:', err)
    }
  }
}

async function recordRefund(charge: Stripe.Charge) {
  const refundCents = charge.amount_refunded
  if (!refundCents) return

  await Payment.findOneAndUpdate(
    { providerPaymentId: charge.payment_intent as string },
    {
      $set: {
        amountRefunded: fromStripeAmount(refundCents),
        status: charge.refunded ? 'refunded' : 'partially_refunded',
      },
      $push: {
        statusHistory: {
          status: charge.refunded ? 'refunded' : 'partially_refunded',
          timestamp: new Date(),
          reason: 'charge.refunded',
        },
      },
    }
  )
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is missing — webhook not verifiable.')
    return NextResponse.json({ received: false, message: 'webhook secret not set' }, { status: 503 })
  }

  let stripe: Stripe
  try {
    stripe = requireStripe()
  } catch (err: any) {
    return NextResponse.json({ received: false, message: err.message }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ received: false, message: 'missing stripe-signature header' }, { status: 400 })
  }

  // Stripe webhooks need the raw body, not the parsed JSON
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ received: false, message: 'invalid signature' }, { status: 400 })
  }

  await connectDb()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === 'paid') {
          await upsertPaymentFromSession(stripe, session)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        // Fallback path — if the session.completed event didn't reach us
        await Payment.findOneAndUpdate(
          { providerPaymentId: pi.id },
          {
            $set: {
              status: 'captured',
              capturedAt: new Date(),
            },
          }
        )
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        await markPaymentFailed(stripe, pi)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await recordRefund(charge)
        break
      }

      default:
        // Acknowledge but ignore — list more event types here as needed
        break
    }

    // Record raw event on the matching Payment for audit trail (best effort)
    try {
      const objectAny = event.data.object as any
      const paymentIntentId =
        objectAny?.payment_intent ||
        (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed'
          ? objectAny?.id
          : undefined)
      if (paymentIntentId) {
        await Payment.findOneAndUpdate(
          { providerPaymentId: paymentIntentId },
          {
            $push: {
              webhookEvents: {
                eventType: event.type,
                eventId: event.id,
                receivedAt: new Date(),
                payload: event.data.object,
              },
            },
          }
        )
      }
    } catch (auditErr) {
      console.warn('Webhook audit log skipped:', auditErr)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error(`Webhook handler error for ${event.type}:`, err)
    // 5xx → Stripe will retry
    return NextResponse.json({ received: false, message: err.message }, { status: 500 })
  }
}
