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

    // Generate payment hash for PayU
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const merchantKey = process.env.PAYU_MERCHANT_KEY || 'your-merchant-key'
    const salt = process.env.PAYU_SALT || 'your-salt'
    const productInfo = 'CupCake Desires Products'
    const firstName = deliveryAddress?.name || order.shippingAddress?.street || ''
    const email = deliveryAddress?.email || user?.billing_email || userEmail
    const txnid = order._id.toString()
    const surl = `${baseUrl}/api/after-payment/success`
    const furl = `${baseUrl}/api/after-payment/failure`

    const hashString = `${merchantKey}|${txnid}|${order.totalAmount}|${productInfo}|${firstName}|${email}|||||||||||${salt}`
    const hash = crypto.SHA512(hashString).toString(crypto.enc.Hex)

    return NextResponse.json({
      success: true,
      orderId: order._id,
      txnid,
      hash,
      merchantKey,
      totalAmount: order.totalAmount,
      productInfo,
      firstName,
      email,
      surl,
      furl,
    })
  } catch (error) {
    console.error('❌ Error resuming order payment:', error)
    return NextResponse.json({ success: false, message: 'Failed to resume payment' }, { status: 500 })
  }
}
