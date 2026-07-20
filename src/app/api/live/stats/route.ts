import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import AbandonedCart from '@/models/AbandonedCart'

export const dynamic = 'force-dynamic'

// All "today"/"yesterday" bucketing uses Melbourne wall-clock time
const MELBOURNE_TZ = 'Australia/Melbourne'

const melbourneDateKey = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: MELBOURNE_TZ }).format(d)

// Change % helper: previous of 0 only counts as +100% when there is current activity
const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

/**
 * GET /api/live/stats
 * Real-time store stats for the admin Live View page
 */
export async function GET() {
    try {
        await connectDb()

        const now = new Date()
        const todayKey = melbourneDateKey(now)
        const yesterdayKey = melbourneDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))

        // A 48h UTC window is guaranteed to cover Melbourne "today" and "yesterday"
        const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)

        // Paid order predicate (Stripe-only; paid also covers in_kitchen/out_for_delivery/delivered)
        const isPaid = (o: any) => o.paymentDetails?.paymentStatus === 'paid' || o.status === 'paid'

        const recentOrders = await Order.find({ createdAt: { $gte: windowStart } })
            .select('totalAmount status paymentDetails createdAt')
            .lean() as any[]

        const todayPaidOrders = recentOrders.filter(
            o => isPaid(o) && melbourneDateKey(new Date(o.createdAt)) === todayKey
        )
        const yesterdayPaidOrders = recentOrders.filter(
            o => isPaid(o) && melbourneDateKey(new Date(o.createdAt)) === yesterdayKey
        )

        const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        const yesterdayRevenue = yesterdayPaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

        // Carts (from the abandonedcarts collection)
        const recentCarts = await AbandonedCart.find({
            $or: [
                { createdAt: { $gte: windowStart } },
                { lastUpdatedAt: { $gte: windowStart } },
            ],
        })
            .select('totalValue status abandonedAt lastUpdatedAt createdAt')
            .lean() as any[]

        // Active carts = still-abandoned (not recovered/expired) carts touched in the last hour
        const activeCutoff = new Date(now.getTime() - 60 * 60 * 1000)
        const activeCartDocs = recentCarts.filter(
            c => c.status === 'abandoned' && new Date(c.lastUpdatedAt || c.createdAt) >= activeCutoff
        )
        const activeCartValue = activeCartDocs.reduce((sum, c) => sum + (c.totalValue || 0), 0)

        // Abandoned today (Melbourne calendar day)
        const abandonedTodayDocs = recentCarts.filter(
            c => c.status === 'abandoned' && melbourneDateKey(new Date(c.abandonedAt || c.createdAt)) === todayKey
        )
        const abandonedValue = abandonedTodayDocs.reduce((sum, c) => sum + (c.totalValue || 0), 0)

        // Conversion = today's paid orders / today's carts (zero-guarded)
        const todayCartsCount = recentCarts.filter(
            c => melbourneDateKey(new Date(c.createdAt || c.abandonedAt)) === todayKey
        ).length
        const conversionRate = todayCartsCount > 0
            ? Number(((todayPaidOrders.length / todayCartsCount) * 100).toFixed(1))
            : 0

        return NextResponse.json({
            // No visitor-tracking infrastructure exists yet — these stay at 0
            activeVisitors: 0,
            inCheckout: 0,
            deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
            topCities: [],
            // Real numbers from MongoDB
            activeCarts: activeCartDocs.length,
            activeCartValue,
            todayRevenue,
            todayOrders: todayPaidOrders.length,
            abandonedCarts: abandonedTodayDocs.length,
            abandonedValue,
            conversionRate,
            revenueChange: calcChange(todayRevenue, yesterdayRevenue).toFixed(1),
        })
    } catch (error) {
        console.error('Error fetching live stats:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch live stats' },
            { status: 500 }
        )
    }
}
