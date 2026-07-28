import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { cancelOrder } from '@/lib/order-cancellation'
import { verifyOrderAccessToken } from '@/lib/order-access-token'

/**
 * Cancel an order as a guest, authorised by the signed link we emailed.
 *
 * The token IS the credential — it is signed with a server-side secret and names
 * exactly one order, so it cannot be edited to reach a different booking. We
 * deliberately take the order id from the *verified token payload* and never
 * from the request body, so the client has no say in which order is cancelled.
 */
export async function POST(request: Request) {
  try {
    const { token, reason } = await request.json().catch(() => ({}) as any)

    const verified = verifyOrderAccessToken(String(token || ''))
    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'This link is invalid or has expired. Please check your email for the latest one.' },
        { status: 403 }
      )
    }

    await connectDb()

    const order = await Order.findOne({ orderId: verified.orderId })
    if (!order) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 })
    }

    const cleanReason =
      typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 300) : undefined

    const result = await cancelOrder({
      order,
      reason: cleanReason,
      cancelledBy: 'guest',
      actorId: order.deliveryAddress?.email || order.shippingAddress?.email || undefined,
    })

    return NextResponse.json(
      {
        success: result.ok,
        message: result.message,
        refundId: result.refundId,
        needsRefund: result.needsRefund,
        emailSent: result.emailSent,
      },
      { status: result.status }
    )
  } catch (error: any) {
    console.error('Guest cancellation failed:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please contact us and we’ll sort it out.' },
      { status: 500 }
    )
  }
}
