// src/app/api/delivery-ship/process-refund/route.js
import connectDb from '@/lib/mongodb'
import { isStripeConfigured, requireStripe, toStripeAmount } from '@/lib/stripe'
import Order from '@/models/Order'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDb()
    const { internal_order_id, amount_to_refund } = await request.json()

    if (!internal_order_id || !amount_to_refund) {
      return NextResponse.json(
        { success: false, message: 'Internal Order ID and amount are required' },
        { status: 400 }
      )
    }

    const order = await Order.findById(internal_order_id)
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured.' },
        { status: 503 }
      )
    }

    const stripe = requireStripe()
    const paymentIntentId =
      order.payment?.stripePaymentIntentId || order.payment?.transactionId

    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, message: 'No Stripe PaymentIntent recorded against this order.' },
        { status: 400 }
      )
    }

    try {
      const stripeRefund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: toStripeAmount(Number(amount_to_refund)),
        reason: 'requested_by_customer',
        metadata: { orderId: String(internal_order_id) },
      })

      await Order.findByIdAndUpdate(internal_order_id, {
        orderStatus: 'refunded',
        'payment.status': 'refunded',
        'paymentDetails.stripeRefundId': stripeRefund.id,
        $push: {
          statusLogs: {
            status: 'refunded',
            timestamp: new Date(),
            message: `Refund of $${amount_to_refund} processed via Stripe (${stripeRefund.id}).`,
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully.',
        stripeRefundId: stripeRefund.id,
        status: stripeRefund.status,
      })
    } catch (stripeError) {
      console.error('Stripe refund initiation failed:', stripeError.message)
      return NextResponse.json(
        { success: false, message: stripeError.message || 'Stripe refund failed.' },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Error processing refund:', error.message)
    return NextResponse.json({ success: false, message: 'Failed to process refund' }, { status: 500 })
  }
}
