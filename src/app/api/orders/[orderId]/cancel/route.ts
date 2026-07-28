import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { cancelOrder } from '@/lib/order-cancellation'
import { currentUser } from '@clerk/nextjs/server'

/**
 * Cancel an order as the signed-in customer who owns it.
 *
 * The guard here is ownership; everything after it — refund record, status
 * transition, confirmation email — lives in cancelOrder() so this path and the
 * guest path can never drift apart.
 */
export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    await connectDb()

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await context.params
    const { reason } = await request.json().catch(() => ({ reason: undefined }))

    const order = await Order.findOne({ orderId })
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to cancel this order' },
        { status: 403 }
      )
    }

    const result = await cancelOrder({
      order,
      reason,
      cancelledBy: 'user',
      actorId: user.id,
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
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
