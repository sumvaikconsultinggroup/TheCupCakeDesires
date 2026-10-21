import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import AbandonedCart from '@/models/AbandonedCart'

export const dynamic = 'force-dynamic'

const MELBOURNE_TZ = 'Australia/Melbourne'

const melbourneDateKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: MELBOURNE_TZ }).format(d)

const calcChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * GET /api/live/stats
 * Aggregations only — avoids loading 48h of order/cart docs into memory.
 */
export async function GET() {
  try {
    await connectDb()

    const now = new Date()
    const todayKey = melbourneDateKey(now)
    const yesterdayKey = melbourneDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))
    const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const activeCutoff = new Date(now.getTime() - 60 * 60 * 1000)

    const paidMatch = {
      $or: [{ 'paymentDetails.paymentStatus': 'paid' }, { status: 'paid' }],
    }

    const [orderAgg, cartAgg] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: windowStart }, ...paidMatch } },
        {
          $project: {
            totalAmount: 1,
            day: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: MELBOURNE_TZ },
            },
          },
        },
        {
          $group: {
            _id: '$day',
            revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
            orders: { $sum: 1 },
          },
        },
      ]),
      AbandonedCart.aggregate([
        {
          $match: {
            $or: [{ createdAt: { $gte: windowStart } }, { lastUpdatedAt: { $gte: windowStart } }],
          },
        },
        {
          $project: {
            totalValue: 1,
            status: 1,
            lastTouch: { $ifNull: ['$lastUpdatedAt', '$createdAt'] },
            abandonDay: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $ifNull: ['$abandonedAt', '$createdAt'] },
                timezone: MELBOURNE_TZ,
              },
            },
            createdDay: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $ifNull: ['$createdAt', '$abandonedAt'] },
                timezone: MELBOURNE_TZ,
              },
            },
          },
        },
        {
          $facet: {
            active: [
              {
                $match: {
                  status: 'abandoned',
                  lastTouch: { $gte: activeCutoff },
                },
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  value: { $sum: { $ifNull: ['$totalValue', 0] } },
                },
              },
            ],
            abandonedToday: [
              {
                $match: {
                  status: 'abandoned',
                  abandonDay: todayKey,
                },
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  value: { $sum: { $ifNull: ['$totalValue', 0] } },
                },
              },
            ],
            cartsToday: [
              { $match: { createdDay: todayKey } },
              { $count: 'count' },
            ],
          },
        },
      ]),
    ])

    const todayOrders = orderAgg.find((r: any) => r._id === todayKey)
    const yesterdayOrders = orderAgg.find((r: any) => r._id === yesterdayKey)
    const todayRevenue = todayOrders?.revenue || 0
    const yesterdayRevenue = yesterdayOrders?.revenue || 0
    const todayOrderCount = todayOrders?.orders || 0

    const facet = cartAgg[0] || {}
    const active = facet.active?.[0] || { count: 0, value: 0 }
    const abandonedToday = facet.abandonedToday?.[0] || { count: 0, value: 0 }
    const todayCartsCount = facet.cartsToday?.[0]?.count || 0
    const conversionRate =
      todayCartsCount > 0 ? Number(((todayOrderCount / todayCartsCount) * 100).toFixed(1)) : 0

    return NextResponse.json({
      activeVisitors: 0,
      inCheckout: 0,
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      topCities: [],
      activeCarts: active.count || 0,
      activeCartValue: active.value || 0,
      todayRevenue,
      todayOrders: todayOrderCount,
      abandonedCarts: abandonedToday.count || 0,
      abandonedValue: abandonedToday.value || 0,
      conversionRate,
      revenueChange: calcChange(todayRevenue, yesterdayRevenue).toFixed(1),
    })
  } catch (error) {
    console.error('Error fetching live stats:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch live stats' }, { status: 500 })
  }
}
