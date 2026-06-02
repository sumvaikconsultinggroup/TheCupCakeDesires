'use server'

import connectDb from '@/lib/mongodb'
import Payment from '@/models/Payment'

const serialize = <T>(data: T): T => JSON.parse(JSON.stringify(data))

/**
 * Admin payments list (Stripe-only).
 *
 * Filter shape:
 *   page, limit
 *   status      → 'pending' | 'captured' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'
 *   search      → matches paymentId, providerPaymentId, providerOrderId, customerEmail
 *   dateFrom, dateTo → ISO date strings
 */
export async function getPayments(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
} = {}) {
  try {
    await connectDb()

    const { page = 1, limit = 50, status, search, dateFrom, dateTo } = params

    const query: any = {}
    if (status && status !== 'all') query.status = status
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { providerPaymentId: { $regex: search, $options: 'i' } },
        { providerOrderId: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ]
    }
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom)
      if (dateTo) query.createdAt.$lte = new Date(dateTo)
    }

    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query),
    ])

    return {
      success: true,
      payments: serialize(items),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error: any) {
    console.error('getPayments error:', error)
    return { success: false, message: error.message, payments: [], pagination: null }
  }
}

/**
 * Aggregate payment metrics for the dashboard cards.
 */
export async function getPaymentStats(dateRange: '7d' | '30d' | '90d' | '1y' = '30d') {
  try {
    await connectDb()

    const now = new Date()
    const start = new Date(now)
    switch (dateRange) {
      case '7d':
        start.setDate(now.getDate() - 7)
        break
      case '30d':
        start.setDate(now.getDate() - 30)
        break
      case '90d':
        start.setDate(now.getDate() - 90)
        break
      case '1y':
        start.setFullYear(now.getFullYear() - 1)
        break
    }

    const [total, captured, failed, refunded, revenueAgg, refundedAgg] = await Promise.all([
      Payment.countDocuments({ createdAt: { $gte: start, $lte: now } }),
      Payment.countDocuments({ status: 'captured', createdAt: { $gte: start, $lte: now } }),
      Payment.countDocuments({ status: 'failed', createdAt: { $gte: start, $lte: now } }),
      Payment.countDocuments({
        status: { $in: ['refunded', 'partially_refunded'] },
        createdAt: { $gte: start, $lte: now },
      }),
      Payment.aggregate([
        { $match: { status: 'captured', createdAt: { $gte: start, $lte: now } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: { $in: ['refunded', 'partially_refunded'] },
            createdAt: { $gte: start, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountRefunded' } } },
      ]),
    ])

    const grossRevenue = revenueAgg[0]?.total || 0
    const refundsTotal = refundedAgg[0]?.total || 0

    return {
      success: true,
      stats: {
        total,
        captured,
        failed,
        refunded,
        grossRevenue,
        refundsTotal,
        netRevenue: grossRevenue - refundsTotal,
        successRate: total > 0 ? Math.round((captured / total) * 100) : 0,
      },
    }
  } catch (error: any) {
    console.error('getPaymentStats error:', error)
    return { success: false, message: error.message }
  }
}
