import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import mongoose from 'mongoose'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const txnid = searchParams.get('txnid')

    if (!txnid) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    await connectDb()

    // Find order by transaction ID in paymentDetails.transactionId
    // Also check orderId and _id as fallback
    const order = await Order.findOne({
      $or: [
        { 'paymentDetails.transactionId': txnid },
        { orderId: txnid },
        { _id: txnid }
      ]
    }).lean() as unknown as (any & { _id: mongoose.Types.ObjectId }) | null

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Format order for response
    const formattedOrder = {
      ...order,
      _id: order._id?.toString(),
      id: order._id?.toString(),
      items: order.items || order.products || [],
    }

    return NextResponse.json({ success: true, order: formattedOrder })
  } catch (error: any) {
    console.error('Error fetching order by transaction ID:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
