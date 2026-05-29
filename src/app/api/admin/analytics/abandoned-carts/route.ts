import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'
import Order from '@/models/Order'

/**
 * GET /api/admin/analytics/abandoned-carts
 * Fetch abandoned carts with filtering and pagination
 */
export async function GET(request: NextRequest) {
    try {
        await connectDb()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || 'abandoned'
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        const sortBy = searchParams.get('sortBy') || 'value' // 'value', 'date'

        // Build query
        const query: any = {}
        if (status && status !== 'all') {
            query.status = status
        }

        // Build sort
        let sort: any = {}
        if (sortBy === 'value') {
            sort = { totalValue: -1 }
        } else if (sortBy === 'date') {
            sort = { abandonedAt: -1 }
        }

        // Fetch carts
        const carts = await AbandonedCart
            .find(query)
            .sort(sort)
            .limit(limit)
            .skip(offset)
            .lean()

        // Get total count
        const totalCount = await AbandonedCart.countDocuments(query)

        // Calculate stats
        const stats = await AbandonedCart.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: '$totalValue' },
                    averageValue: { $avg: '$totalValue' },
                    count: { $sum: 1 },
                },
            },
        ])

        // Get total orders count for rate calculation
        const totalOrders = await Order.countDocuments()
        const abandonedCartRate = (totalCount + totalOrders) > 0 
            ? (totalCount / (totalCount + totalOrders)) * 100 
            : 0

        return NextResponse.json({
            success: true,
            data: {
                carts,
                pagination: {
                    total: totalCount,
                    limit,
                    offset,
                    hasMore: offset + limit < totalCount,
                },
                stats: stats[0] || { totalValue: 0, averageValue: 0, count: 0 },
                abandonedCartRate,
            },
        })
    } catch (error) {
        console.error('Error fetching abandoned carts:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch abandoned carts' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/admin/analytics/abandoned-carts
 * Update abandoned cart status
 */
export async function PATCH(request: NextRequest) {
    try {
        await connectDb()

        const { cartId, status } = await request.json()

        if (!cartId || !status) {
            return NextResponse.json(
                { success: false, message: 'Cart ID and status are required' },
                { status: 400 }
            )
        }

        const cart = await AbandonedCart.findByIdAndUpdate(
            cartId,
            { status, lastUpdatedAt: new Date() },
            { new: true }
        )

        if (!cart) {
            return NextResponse.json(
                { success: false, message: 'Cart not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: cart,
        })
    } catch (error) {
        console.error('Error updating abandoned cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update cart' },
            { status: 500 }
        )
    }
}
