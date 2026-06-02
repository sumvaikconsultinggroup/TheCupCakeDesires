import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import crypto from 'crypto-js'

/**
 * POST /api/orders/resume
 * Resume payment for an existing pending order
 */
export async function POST(request) {
  try {
    await connectDb()

    const { orderId, userEmail, deliveryAddress } = await request.json()

    if (!orderId || !userEmail) {
      return NextResponse.json({ success: false, message: 'Order ID and user email are required' }, { status: 400 })
    }

    const user = await User.findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const userId = user?.clerkId || user?._id?.toString()

    // Find the pending order
    const order = await Order.findOne({
      _id: orderId,
      userId: userId.toString(),
      status: 'pending_payment'
    })

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found or payment cannot be resumed' 
      }, { status: 404 })
    }

    // Check if order is expired
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const isExpired = order.expiresAt && order.expiresAt < new Date()
    const isOld = order.createdAt && new Date(order.createdAt) < thirtyMinutesAgo

    if (isExpired || isOld) {
      // Mark as expired
      await Order.updateOne(
        { _id: orderId },
        { $set: { status: 'expired' } }
      )
      return NextResponse.json({ 
        success: false, 
        message: 'Order has expired. Please create a new order.' 
      }, { status: 400 })
    }

    // Update expiration time if needed (extend by 30 minutes)
    const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await Order.updateOne(
      { _id: orderId },
      { $set: { expiresAt: newExpiresAt } }
    )

    // Stripe is handled separately via /api/stripe/checkout — caller passes the
    // returned orderId there to mint a fresh Checkout Session for the resume.
    return NextResponse.json({
      success: true,
      orderId: order._id,
      totalAmount: order.totalAmount,
      customerName: deliveryAddress?.name || order.shippingAddress?.street || '',
      customerEmail: deliveryAddress?.email || user?.billing_email || userEmail,
    })
  } catch (error) {
    console.error('❌ Error resuming order payment:', error)
    return NextResponse.json({ success: false, message: 'Failed to resume payment' }, { status: 500 })
  }
}
