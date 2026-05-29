/**
 * GET /api/admin/orders
 *
 * Response shape:
 * {
 *   orders: Array<{
 *     ...orderFields,                  // all order fields except timeline
 *     id: string,                      // _id stringified
 *     customerName: string,            // customer.firstName+lastName or user.billing_fullname
 *     customerPhone: string,           // customer.phone or user.billing_phone
 *     customerOrderCount: number,      // total orders placed by this customer (by email)
 *     customerLifetimeValue: number,   // sum of totalAmount for delivered orders (by email)
 *     customerIsRepeat: boolean,       // customerOrderCount > 1
 *   }>,
 *   pagination: {
 *     total: number,
 *     page: number,
 *     limit: number,
 *     pages: number,
 *     from: number,   // 1-based index of first item in page
 *     to: number,     // 1-based index of last item in page
 *   },
 *   statusCounts: Record<string, number>,
 *   stats: {
 *     totalRevenue: number,
 *     pendingRevenue: number,
 *     refundedAmount: number,
 *     paidOrderCount: number,
 *     pendingOrderCount: number,
 *     cancelledOrderCount: number,
 *     avgOrderValue: number,
 *     successRate: number,   // (paidOrderCount / total) * 100
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderQuery {
  status?: string
  'paymentDetails.paymentStatus'?: string
  assignedTo?: string
  createdAt?: { $gte?: Date; $lte?: Date }
  $or?: Array<Record<string, { $regex: string; $options: string }>>
}

interface SortSpec {
  [key: string]: 1 | -1
}

// ─── CORS helpers ─────────────────────────────────────────────────────────────

function getAllowedOrigin(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  // Fall back to localhost in dev
  return 'http://localhost:3000'
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function createResponse(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...corsHeaders(),
    },
  })
}

// ─── OPTIONS (CORS preflight) ─────────────────────────────────────────────────

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

// ─── GET /api/admin/orders ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Auth guard
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const assignedTo = searchParams.get('assignedTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    const query: OrderQuery = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (paymentStatus && paymentStatus !== 'all') {
      // Correct schema field: paymentDetails.paymentStatus (not paymentDetails.status)
      query['paymentDetails.paymentStatus'] = paymentStatus
    }

    if (assignedTo) {
      query.assignedTo = assignedTo
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.email': { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.firstName': { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.lastName': { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.phone': { $regex: escapeRegex(search), $options: 'i' } },
      ]
    }

    // Sort configuration
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'totalAmount', 'status', 'orderId'] as const
    const safeSortBy = (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortBy) ? sortBy : 'createdAt'
    const sort: SortSpec = {}
    sort[safeSortBy] = sortOrder === 'asc' ? 1 : -1

    // ── Customer-enrichment aggregation pipeline ──────────────────────────────
    //
    // Single aggregation that:
    //  1. Filters with the same query as countDocuments
    //  2. Sorts + paginates
    //  3. $lookup into users by userId == clerkId to get user doc (may be empty for guests)
    //  4. $lookup a sub-pipeline that groups all orders by customer.email to compute
    //     customerOrderCount and customerLifetimeValue in ONE pass (no N+1)
    //
    // NOTE: Both $lookup stages run once per matched order document in the page,
    // but each $lookup is a single indexed join — not N separate queries.

    const enrichedOrdersPipeline = [
      { $match: query },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      // Lookup user record by userId (= clerkId)
      {
        $lookup: {
          from: 'users',
          let: { uid: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$clerkId', '$$uid'] },
              },
            },
            {
              $project: {
                _id: 0,
                billing_fullname: 1,
                billing_phone: 1,
                email: 1,
              },
            },
          ],
          as: '_userDocs',
        },
      },
      // Lookup all orders for this customer by email to compute lifetime stats
      {
        $lookup: {
          from: 'orders',
          let: { email: '$customer.email' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$email', null] },
                    { $ne: ['$$email', ''] },
                    { $eq: ['$customer.email', '$$email'] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                orderCount: { $sum: 1 },
                lifetimeValue: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0],
                  },
                },
              },
            },
          ],
          as: '_customerStats',
        },
      },
      // Compute derived customer fields
      {
        $addFields: {
          _user: { $arrayElemAt: ['$_userDocs', 0] },
          _stats: { $arrayElemAt: ['$_customerStats', 0] },
        },
      },
      {
        $addFields: {
          customerOrderCount: { $ifNull: ['$_stats.orderCount', 1] },
          customerLifetimeValue: { $ifNull: ['$_stats.lifetimeValue', 0] },
          customerIsRepeat: {
            $gt: [{ $ifNull: ['$_stats.orderCount', 1] }, 1],
          },
          // customerName: customer.firstName+lastName first, fall through to user.billing_fullname
          customerName: {
            $let: {
              vars: {
                fullFromOrder: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ['$customer.firstName', ''] },
                        ' ',
                        { $ifNull: ['$customer.lastName', ''] },
                      ],
                    },
                  },
                },
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: '$$fullFromOrder' }, 0] },
                  '$$fullFromOrder',
                  { $ifNull: ['$_user.billing_fullname', 'Guest'] },
                ],
              },
            },
          },
          // customerPhone: customer.phone first, fall through to user.billing_phone
          customerPhone: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $ifNull: ['$customer.phone', ''] }, ''] },
                ],
              },
              '$customer.phone',
              { $ifNull: ['$_user.billing_phone', ''] },
            ],
          },
        },
      },
      // Drop internal lookup arrays from output
      {
        $project: {
          _userDocs: 0,
          _customerStats: 0,
          _user: 0,
          _stats: 0,
          timeline: 0, // excluded per .select('-timeline')
        },
      },
    ]

    // ── Stats aggregation pipeline ────────────────────────────────────────────

    const statsPipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'paid'] }, '$totalAmount', 0],
            },
          },
          pendingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'pending'] }, '$totalAmount', 0],
            },
          },
          refundedAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'refunded'] }, '$totalAmount', 0],
            },
          },
          paidOrderCount: {
            $sum: { $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'paid'] }, 1, 0] },
          },
          pendingOrderCount: {
            $sum: { $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'pending'] }, 1, 0] },
          },
          cancelledOrderCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          totalAmountSum: { $sum: '$totalAmount' },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          pendingRevenue: 1,
          refundedAmount: 1,
          paidOrderCount: 1,
          pendingOrderCount: 1,
          cancelledOrderCount: 1,
          avgOrderValue: {
            $cond: [
              { $gt: ['$totalCount', 0] },
              { $divide: ['$totalAmountSum', '$totalCount'] },
              0,
            ],
          },
          successRate: {
            $cond: [
              { $gt: ['$totalCount', 0] },
              { $multiply: [{ $divide: ['$paidOrderCount', '$totalCount'] }, 100] },
              0,
            ],
          },
        },
      },
    ]

    // Run all three in parallel
    const [enrichedOrders, total, statusCountsRaw, statsRaw] = await Promise.all([
      Order.aggregate(enrichedOrdersPipeline),
      Order.countDocuments(query),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate(statsPipeline),
    ])

    // Stringify _id → id for every order
    const formattedOrders = (enrichedOrders as Array<Record<string, unknown>>).map((order) => ({
      ...order,
      _id: order._id ? String(order._id) : undefined,
      id: order._id ? String(order._id) : undefined,
    }))

    // Build statusCounts map
    const statusCountMap: Record<string, number> = {}
    ;(statusCountsRaw as Array<{ _id: string; count: number }>).forEach((item) => {
      statusCountMap[item._id] = item.count
    })

    // Fallback empty stats if no documents matched
    const defaultStats = {
      totalRevenue: 0,
      pendingRevenue: 0,
      refundedAmount: 0,
      paidOrderCount: 0,
      pendingOrderCount: 0,
      cancelledOrderCount: 0,
      avgOrderValue: 0,
      successRate: 0,
    }
    const stats = (statsRaw as Array<typeof defaultStats>)[0] ?? defaultStats

    return createResponse({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        from: total === 0 ? 0 : skip + 1,
        to: Math.min(skip + limit, total),
      },
      statusCounts: statusCountMap,
      paymentStats: stats,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return createResponse({ error: 'Failed to fetch orders' }, 500)
  }
}
