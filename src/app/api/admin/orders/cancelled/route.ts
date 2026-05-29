import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Auth guard
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 200)
    const skip = (page - 1) * limit

    const queryFilter = {
      status: { $in: ['cancelled', 'refund_initiated', 'refunded'] },
    }

    // Run paginated query and total count in parallel
    const [orders, total] = await Promise.all([
      Order.find(queryFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(queryFilter),
    ])

    return NextResponse.json({
      success: true,
      orders: JSON.parse(JSON.stringify(orders)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cancelled orders'
    console.error('Error fetching cancelled orders:', error)
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
