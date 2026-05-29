import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Build query for cancelled orders with refunds
    const query: any = {
      status: 'cancelled',
      'paymentDetails.paymentStatus': 'refunded'
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.email': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ]
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ])

    // Format refunds data
    const refunds = orders.map((order: any) => ({
      orderId: order._id?.toString(),
      orderNumber: order.orderId,
      customerName: order.deliveryAddress?.firstName && order.deliveryAddress?.lastName
        ? `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}`.trim()
        : (order.customer?.name || order.customer?.firstName || 'Guest'),
      customerEmail: order.deliveryAddress?.email || order.customer?.email || '',
      amount: order.totalAmount || 0,
      paymentMethod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod' ? 'COD' : 'Prepaid',
      transactionId: order.paymentDetails?.transactionId || '',
      refundedAt: order.paymentDetails?.refundedAt || order.updatedAt,
      status: 'refunded',
      reason: 'Order cancelled by admin',
    }))

    // Calculate stats
    const allRefunds = await Order.find({
      status: 'cancelled',
      'paymentDetails.paymentStatus': 'refunded'
    }).lean()

    const stats = {
      total: allRefunds.length,
      totalAmount: allRefunds.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
      processing: 0, // Can be enhanced to track processing refunds
      completed: allRefunds.length,
    }

    return NextResponse.json({
      success: true,
      refunds,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch refunds' },
      { status: 500 }
    )
  }
}
