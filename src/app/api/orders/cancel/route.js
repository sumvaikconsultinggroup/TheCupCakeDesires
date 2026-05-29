import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'

/**
 * POST /api/orders/cancel
 * Cancel a pending payment order
 */
export async function POST(request) {
  try {
    await connectDb()

    const { orderId, userEmail } = await request.json()

    if (!orderId || !userEmail) {
      return NextResponse.json({ success: false, message: 'Order ID and user email are required' }, { status: 400 })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const userId = user?.clerkId || user?._id?.toString()

    // Find and cancel the order (only if it belongs to the user and is pending)
    const order = await Order.findOne({
      _id: orderId,
      userId: userId.toString(),
      status: { $in: ['pending', 'pending_payment'] }
    })

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found or cannot be cancelled' 
      }, { status: 404 })
    }

    // Update order status to cancelled
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          status: 'cancelled',
          'paymentDetails.paymentStatus': 'failed'
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('❌ Error cancelling order:', error)
    return NextResponse.json({ success: false, message: 'Failed to cancel order' }, { status: 500 })
  }
}
