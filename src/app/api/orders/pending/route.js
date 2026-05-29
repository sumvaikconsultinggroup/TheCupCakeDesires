import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'

/**
 * GET /api/orders/pending
 * Check if user has a pending payment order
 */
export async function GET(request) {
  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ success: false, message: 'User email is required' }, { status: 400 })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const userId = user?.clerkId || user?._id?.toString()

    // Auto-expire old pending_payment orders
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    await Order.updateMany(
      {
        userId: userId.toString(),
        status: 'pending_payment',
        $or: [
          { expiresAt: { $lt: new Date() } },
          { createdAt: { $lt: thirtyMinutesAgo } }
        ]
      },
      {
        $set: { status: 'expired' }
      }
    )

    // Find active pending_payment order
    const pendingOrder = await Order.findOne({
      userId: userId.toString(),
      status: 'pending_payment'
    }).sort({ createdAt: -1 })

    if (pendingOrder) {
      return NextResponse.json({
        success: true,
        hasPendingOrder: true,
        order: {
          _id: pendingOrder._id,
          orderId: pendingOrder.orderId,
          totalAmount: pendingOrder.totalAmount,
          createdAt: pendingOrder.createdAt,
          expiresAt: pendingOrder.expiresAt,
          items: pendingOrder.items,
        }
      })
    }

    return NextResponse.json({
      success: true,
      hasPendingOrder: false,
      order: null
    })
  } catch (error) {
    console.error('❌ Error checking pending order:', error)
    return NextResponse.json({ success: false, message: 'Failed to check pending order' }, { status: 500 })
  }
}
