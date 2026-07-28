import Refund from '@/models/Refund'
import { sendOrderCancelledEmail } from '@/lib/email-service'

/**
 * Order cancellation, in one place.
 *
 * Two routes cancel an order — a signed-in customer and a guest holding a signed
 * link — and they must behave identically: the same status guards, the same
 * refund record, the same email. Keeping the rules here means a change to the
 * refund policy can't be applied to one path and forgotten on the other.
 *
 * Caller is responsible for authorising the request; by the time this runs the
 * order is assumed to belong to whoever asked.
 */

export interface CancelOrderResult {
  ok: boolean
  /** HTTP status the caller should return. */
  status: number
  message: string
  needsRefund?: boolean
  refundId?: string
  /** False when the order was cancelled but the confirmation email failed. */
  emailSent?: boolean
}

export interface CancelOrderInput {
  /** Mongoose Order document (not a lean object — this saves it). */
  order: any
  reason?: string
  /** Who pressed the button. Recorded on the refund + status log. */
  cancelledBy: 'user' | 'guest'
  /** Identifier for the audit trail — Clerk id, or the guest's email. */
  actorId?: string
}

export async function cancelOrder({
  order,
  reason,
  cancelledBy,
  actorId,
}: CancelOrderInput): Promise<CancelOrderResult> {
  // NOTE: the legal Order.status values are
  //   pending_payment | paid | in_kitchen | out_for_delivery | delivered | cancelled | refunded
  // There is no 'shipped' or 'refund_initiated' on an order — refund progress is
  // tracked on the Refund record, which has its own status enum. Guarding or
  // assigning those values here would either be dead code or fail validation.

  // Already terminal — nothing to do.
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return { ok: false, status: 400, message: 'This booking has already been cancelled.' }
  }

  // Once it is on the van it is too late to stop it.
  if (order.status === 'out_for_delivery' || order.status === 'delivered') {
    const label = order.status === 'delivered' ? 'already been delivered' : 'already out for delivery'
    return {
      ok: false,
      status: 400,
      message: `This booking has ${label} and can no longer be cancelled online. Please contact us and we'll help.`,
    }
  }

  const paymentStatus = order.paymentDetails?.paymentStatus
  const paymentMethod = (order.paymentDetails?.paymentMethod || order.paymentMethod || 'cod').toLowerCase()
  const needsRefund = paymentStatus === 'paid' && paymentMethod !== 'cod'

  let refundRecord: any = null
  if (needsRefund) {
    const existingRefund = await Refund.findOne({ orderId: order.orderId })
    if (existingRefund) {
      return { ok: false, status: 400, message: 'A refund request already exists for this order.' }
    }

    const addressData = order.deliveryAddress || order.shippingAddress
    const refundId = `REF-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`

    try {
      refundRecord = await Refund.create({
        refundId,
        orderId: order.orderId,
        orderMongoId: order._id,
        userId: order.userId || actorId || 'guest',
        userEmail: addressData?.email || order.userEmail || actorId || 'no-email@example.com',
        userName:
          `${addressData?.firstName || ''} ${addressData?.lastName || ''}`.trim() || 'Customer',
        userPhone: addressData?.phone || '',
        paymentGateway: 'Stripe',
        transactionId: order.paymentDetails?.transactionId || '',
        stripePaymentIntentId: order.paymentDetails?.transactionId || '',
        refundAmount: order.totalAmount,
        orderAmount: order.totalAmount,
        refundType: 'full' as const,
        status: 'refund_initiated' as const,
        // The Refund model only recognises 'user' | 'admin' — a guest is still
        // the customer acting on their own order.
        cancelledBy: 'user' as const,
        cancellationReason: reason || `Cancelled by ${cancelledBy}`,
        cancellationDate: new Date(),
        orderSnapshot: {
          items:
            order.items?.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })) || [],
          shippingAddress: order.shippingAddress || order.deliveryAddress,
          paymentMethod: order.paymentDetails?.paymentMethod,
          status: order.status,
        },
        estimatedRefundDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        statusHistory: [
          {
            status: 'refund_initiated' as const,
            timestamp: new Date(),
            note: reason || 'Refund initiated due to customer cancellation',
            updatedBy: actorId || cancelledBy,
          },
        ],
      })
    } catch (refundError: any) {
      console.error('Refund creation error:', refundError)
      return {
        ok: false,
        status: 500,
        message: 'We could not start the refund. Nothing has been cancelled — please contact us.',
      }
    }
  }

  // Always 'cancelled' — 'refund_initiated' is not a legal Order status and would
  // throw on save(). The Refund record created above carries the refund state.
  order.status = 'cancelled'
  if (!order.statusLogs) order.statusLogs = []
  order.statusLogs.push({
    status: order.status,
    timestamp: new Date(),
    message: needsRefund
      ? `Order cancelled by ${cancelledBy} — refund initiated, pending admin approval.`
      : `Order cancelled by ${cancelledBy}.`,
  })

  await order.save()

  // The order IS cancelled at this point. A failed email must not turn that into
  // an error response, or the customer would retry a cancellation that already
  // succeeded — so failures are logged and reported, never thrown.
  let emailSent = false
  try {
    const res = await sendOrderCancelledEmail(
      typeof order.toObject === 'function' ? order.toObject() : order,
      reason
    )
    emailSent = !!res?.success
    if (!emailSent) {
      console.error('Cancellation email not sent:', order.orderId, res?.error)
    }
  } catch (err) {
    console.error('Cancellation email threw:', order.orderId, err)
  }

  return {
    ok: true,
    status: 200,
    message: needsRefund
      ? 'Your booking has been cancelled. Your refund will be processed within 3–7 business days.'
      : 'Your booking has been cancelled.',
    needsRefund,
    refundId: refundRecord?.refundId,
    emailSent,
  }
}
