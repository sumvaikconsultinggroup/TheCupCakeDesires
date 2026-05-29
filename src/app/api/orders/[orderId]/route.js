import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request, { params }) {
  try {
    const user = await currentUser()
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    await connectDb()

    // Build query: find by MongoDB _id or orderId
    const orderQuery = {
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    }

    // If user is logged in, restrict to their orders only
    if (user) {
      orderQuery.userId = user.id
    }
    // If guest (no user), allow fetching - orderId in URL acts as access token for order-successful page

    const order = await Order.findOne(orderQuery).lean()

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
