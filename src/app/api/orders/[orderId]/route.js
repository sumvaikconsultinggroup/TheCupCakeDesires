import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request, { params }) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    await connectDb()

    // The unguessable orderId (24-char Mongo _id, or our ORD-… code) IS the access
    // token for the confirmation page — so we skip the Clerk `currentUser()`
    // round-trip that made this slow on the post-payment redirect. Guarding the
    // _id lookup also avoids a CastError when the id isn't an ObjectId.
    const isObjectId = /^[a-f0-9]{24}$/i.test(orderId)
    const orderQuery = isObjectId ? { $or: [{ _id: orderId }, { orderId }] } : { orderId }

    const order = await Order.findOne(orderQuery)
      .select(
        'orderId totalAmount subtotal taxableValue taxes shipping discount items createdAt status paymentDetails deliveryDate deliverySlot'
      )
      .lean()

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Convert MongoDB _id to string for JSON serialization
    const formattedOrder = {
      ...order,
      _id: order._id.toString(),
      id: order._id.toString(),
    }

    return NextResponse.json({ success: true, order: formattedOrder })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
