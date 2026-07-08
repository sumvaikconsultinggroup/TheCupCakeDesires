import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Payment from '@/models/Payment'
import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const searchParams = request.nextUrl.searchParams
    const dateRange = searchParams.get('dateRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Fetch all orders within date range
    const orders = (await Order.find({
      createdAt: { $gte: startDate, $lte: now },
    }).lean()) as unknown as Array<any & { _id: mongoose.Types.ObjectId }>

    // Fetch Stripe payment records for the orders
    const orderIds = orders.map((order) => order.orderId || order._id.toString())
    const stripePayments = await Payment.find({
      orderId: { $in: orderIds },
      status: 'captured',
    }).lean()
    void stripePayments // exposed for future per-payment metrics; currently aggregated from orders

    // Calculate metrics
    const isPaidOrder = (order: any) =>
      order.paymentDetails?.paymentStatus === 'paid' || order.payment?.status === 'paid'
    const isRefundedOrder = (order: any) =>
      order.paymentDetails?.paymentStatus === 'refunded' ||
      order.payment?.status === 'refunded' ||
      order.status === 'refunded'

    const paidOrders = orders.filter(isPaidOrder)
    const refundedOrders = orders.filter(isRefundedOrder)

    // Gross includes refunded orders' sales (the money was captured once); net subtracts refunds
    const grossOrders = orders.filter((order) => isPaidOrder(order) || isRefundedOrder(order))
    const grossRevenue = grossOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const totalRefunds = refundedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    const netRevenue = grossRevenue - totalRefunds

    // Calculate average order value
    const avgOrderValue = grossOrders.length > 0 ? grossRevenue / grossOrders.length : 0

    // Calculate refund rate
    const refundRate = grossOrders.length > 0 ? (refundedOrders.length / grossOrders.length) * 100 : 0

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    const periodDiff = now.getTime() - startDate.getTime()
    prevStartDate.setTime(startDate.getTime() - periodDiff)

    const prevOrders = (await Order.find({
      createdAt: { $gte: prevStartDate, $lt: startDate },
    }).lean()) as unknown as Array<any & { _id: mongoose.Types.ObjectId }>

    const prevGrossOrders = prevOrders.filter((order) => isPaidOrder(order) || isRefundedOrder(order))

    const prevGrossRevenue = prevGrossOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const prevRefunds = prevOrders
      .filter(isRefundedOrder)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    // Calculate changes
    const grossRevenueChange = prevGrossRevenue > 0 ? ((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100 : 0
    const prevNetRevenue = prevGrossRevenue - prevRefunds
    const netRevenueChange = prevNetRevenue !== 0 ? ((netRevenue - prevNetRevenue) / prevNetRevenue) * 100 : 0
    const refundsChange = prevRefunds > 0 ? ((totalRefunds - prevRefunds) / prevRefunds) * 100 : 0

    // Revenue by payment method (Stripe-only)
    const paymentMethodMap: { [key: string]: { name: string; amount: number; count: number } } = {}

    // Process Stripe payments — bucket by card network when available
    for (const payment of stripePayments as any[]) {
      const network = payment.paymentMethod?.cardNetwork
      const type = payment.paymentMethod?.type
      const methodName = network
        ? `Stripe · ${String(network).toUpperCase()}`
        : type === 'apple_pay'
          ? 'Apple Pay'
          : type === 'google_pay'
            ? 'Google Pay'
            : type === 'afterpay_clearpay'
              ? 'Afterpay'
              : type === 'link'
                ? 'Stripe Link'
                : 'Stripe'

      const amount = payment.amount || 0
      if (!paymentMethodMap[methodName]) {
        paymentMethodMap[methodName] = { name: methodName, amount: 0, count: 0 }
      }
      paymentMethodMap[methodName].amount += amount
      paymentMethodMap[methodName].count += 1
    }

    // Convert to array and calculate percentages
    const totalPaymentRevenue = Object.values(paymentMethodMap).reduce((sum, method) => sum + method.amount, 0)
    const revenueByGateway = Object.values(paymentMethodMap)
      .map((method) => ({
        gateway: method.name,
        amount: Math.round(method.amount),
        percentage: totalPaymentRevenue > 0 ? Math.round((method.amount / totalPaymentRevenue) * 100) : 0,
        count: method.count,
      }))
      .sort((a, b) => b.amount - a.amount)

    // Revenue trend — bucketed by Melbourne calendar day (DST-safe via Intl)
    const melbourneDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' })
    const toMelbourneDateKey = (date: Date | string) => melbourneDayFormat.format(new Date(date)) // YYYY-MM-DD

    const DAY_MS = 24 * 60 * 60 * 1000
    // Treat Melbourne date keys as pure calendar dates (parsed as UTC) for day arithmetic
    const dateKeyToDayNumber = (key: string) => Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY_MS)
    const dayNumberToDateKey = (dayNumber: number) => new Date(dayNumber * DAY_MS).toISOString().split('T')[0]
    const formatDateKey = (key: string, options: Intl.DateTimeFormatOptions) =>
      new Date(`${key}T00:00:00Z`).toLocaleDateString('en-AU', { ...options, timeZone: 'UTC' })

    const todayDayNumber = dateKeyToDayNumber(toMelbourneDateKey(now))
    let revenueByDayArray: { date: string; revenue: number; orders: number }[] = []

    if (dateRange === '7d' || dateRange === '30d') {
      // Daily buckets: 7 or 30 points
      const days = dateRange === '7d' ? 7 : 30
      const buckets = new Map<string, { date: string; revenue: number; orders: number }>()
      for (let i = days - 1; i >= 0; i--) {
        const dateKey = dayNumberToDateKey(todayDayNumber - i)
        const label =
          dateRange === '7d'
            ? formatDateKey(dateKey, { weekday: 'short' })
            : formatDateKey(dateKey, { day: 'numeric', month: 'short' })
        buckets.set(dateKey, { date: label, revenue: 0, orders: 0 })
      }
      for (const order of paidOrders) {
        const bucket = buckets.get(toMelbourneDateKey(order.createdAt))
        if (bucket) {
          bucket.revenue += order.totalAmount || 0
          bucket.orders += 1
        }
      }
      revenueByDayArray = Array.from(buckets.values())
    } else if (dateRange === '90d') {
      // 13 weekly buckets, labelled by week-start date
      const weeks = 13
      const weekBuckets: { date: string; revenue: number; orders: number }[] = []
      for (let k = weeks - 1; k >= 0; k--) {
        const weekStartKey = dayNumberToDateKey(todayDayNumber - (k * 7 + 6))
        weekBuckets.push({
          date: formatDateKey(weekStartKey, { day: 'numeric', month: 'short' }),
          revenue: 0,
          orders: 0,
        })
      }
      for (const order of paidOrders) {
        const diff = todayDayNumber - dateKeyToDayNumber(toMelbourneDateKey(order.createdAt))
        if (diff < 0 || diff >= weeks * 7) continue
        const bucket = weekBuckets[weeks - 1 - Math.floor(diff / 7)]
        bucket.revenue += order.totalAmount || 0
        bucket.orders += 1
      }
      revenueByDayArray = weekBuckets
    } else {
      // 1y: 12 monthly buckets by Melbourne year-month
      const [thisYear, thisMonth] = toMelbourneDateKey(now).split('-').map(Number)
      const monthBuckets = new Map<string, { date: string; revenue: number; orders: number }>()
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(thisYear, thisMonth - 1 - i, 1))
        const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
        monthBuckets.set(monthKey, {
          date: d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
          revenue: 0,
          orders: 0,
        })
      }
      for (const order of paidOrders) {
        const bucket = monthBuckets.get(toMelbourneDateKey(order.createdAt).slice(0, 7))
        if (bucket) {
          bucket.revenue += order.totalAmount || 0
          bucket.orders += 1
        }
      }
      revenueByDayArray = Array.from(monthBuckets.values())
    }
    revenueByDayArray = revenueByDayArray.map((bucket) => ({ ...bucket, revenue: Math.round(bucket.revenue) }))

    // Today's revenue (Melbourne calendar day)
    const todayKey = dayNumberToDateKey(todayDayNumber)
    const todayOrders = paidOrders.filter((order) => toMelbourneDateKey(order.createdAt) === todayKey)
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    // Yesterday's revenue for comparison (Melbourne calendar day)
    const yesterdayKey = dayNumberToDateKey(todayDayNumber - 1)
    const yesterdayOrders = paidOrders.filter((order) => toMelbourneDateKey(order.createdAt) === yesterdayKey)
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const todayRevenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    // Build transaction list (Stripe sales + refunds)
    const transactions = []

    const validOrders = orders.filter((order) => order.status !== 'cancelled' && order.status !== 'expired')

    for (const order of validOrders.slice(-100).reverse()) {
      const paymentStatus = order.paymentDetails?.paymentStatus || order.payment?.status
      let transactionStatus: 'completed' | 'pending' | 'failed' = 'pending'
      if (paymentStatus === 'paid' || order.status === 'delivered') {
        transactionStatus = 'completed'
      } else if (paymentStatus === 'failed') {
        transactionStatus = 'failed'
      }

      transactions.push({
        id: order._id.toString(),
        type: 'sale',
        description: `Order #${order.orderId || order._id.toString().slice(-8)}`,
        amount: order.totalAmount || 0,
        status: transactionStatus,
        date: order.createdAt,
        orderId: order.orderId || order._id.toString(),
        gateway: 'Stripe',
      })
    }

    for (const order of refundedOrders.slice(-20).reverse()) {
      transactions.push({
        id: `REF_${order._id.toString()}`,
        type: 'refund',
        description: `Refund for #${order.orderId || order._id.toString().slice(-8)}`,
        amount: -(order.totalAmount || 0),
        status: 'completed',
        date: order.updatedAt || order.createdAt,
        orderId: order.orderId || order._id.toString(),
        gateway: 'Stripe',
      })
    }

    // Sort by date (most recent first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // TAX CALCULATION (10% Australian GST, inclusive in totals — all paid orders)
    const taxStartDate = new Date()
    taxStartDate.setFullYear(taxStartDate.getFullYear() - 1)
    taxStartDate.setDate(1)
    taxStartDate.setHours(0, 0, 0, 0)

    const taxOrders = (await Order.find({
      'paymentDetails.paymentStatus': 'paid',
      createdAt: { $gte: taxStartDate },
    }).lean()) as unknown as Array<any & { _id: mongoose.Types.ObjectId }>

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const monthlyTaxData = new Map<string, { sales: number; tax: number; orders: number; timestamp: number }>()

    let totalTaxCollected = 0
    let totalTaxableSales = 0

    for (const order of taxOrders) {
      // Bucket by Melbourne year-month
      const [year, month] = toMelbourneDateKey(order.createdAt).split('-').map(Number)
      const key = `${months[month - 1]} ${year}`

      const total = order.totalAmount || 0
      // Prefer stored GST figures; fall back to 10/110 inclusive extraction
      const storedTax = typeof order.taxes === 'number' && order.taxes > 0 ? order.taxes : undefined
      const storedTaxable =
        typeof order.gstDetails?.taxableValue === 'number' && order.gstDetails.taxableValue > 0
          ? order.gstDetails.taxableValue
          : undefined
      const tax = storedTax ?? Math.round(((total * 10) / 110) * 100) / 100 // GST extracted from inclusive total
      const taxableAmount = storedTaxable ?? total - tax

      if (!monthlyTaxData.has(key)) {
        const timestamp = Date.UTC(year, month - 1, 1)
        monthlyTaxData.set(key, { sales: 0, tax: 0, orders: 0, timestamp })
      }

      const data = monthlyTaxData.get(key)!
      data.sales += taxableAmount
      data.tax += tax
      data.orders += 1

      totalTaxCollected += tax
      totalTaxableSales += taxableAmount
    }

    const taxReport = Array.from(monthlyTaxData.entries())
      .map(([month, data]) => ({
        month,
        sales: data.sales, // Keep as numbers, let frontend format
        tax: Number(data.tax.toFixed(2)),
        orders: data.orders,
        timestamp: data.timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({
      metrics: [
        {
          label: 'Gross Revenue',
          value: Math.round(grossRevenue),
          change: Math.abs(grossRevenueChange),
          changeType: grossRevenueChange >= 0 ? 'increase' : 'decrease',
          prefix: '$',
        },
        {
          label: 'Net Revenue',
          value: Math.round(netRevenue),
          change: Math.abs(netRevenueChange),
          changeType: netRevenueChange >= 0 ? 'increase' : 'decrease',
          prefix: '$',
        },
        {
          label: 'Total Refunds',
          value: Math.round(totalRefunds),
          change: Math.abs(refundsChange),
          changeType: refundsChange >= 0 ? 'increase' : 'decrease',
          prefix: '$',
        },
        {
          label: 'Avg Order Value',
          value: Math.round(avgOrderValue),
          change: 0,
          changeType: 'increase',
          prefix: '$',
        },
        {
          label: 'Refund Rate',
          value: parseFloat(refundRate.toFixed(1)),
          change: 0,
          changeType: 'decrease',
          prefix: '',
        },
      ],
      revenueByGateway,
      revenueByDay: revenueByDayArray,
      transactions: transactions.slice(0, 20),
      todayRevenue: Math.round(todayRevenue),
      todayRevenueChange: Math.abs(todayRevenueChange),
      todayRevenueChangeType: todayRevenueChange >= 0 ? 'increase' : 'decrease',
      refundedTotal: Math.round(totalRefunds),
      refundedCount: refundedOrders.length,
      taxReport,
      totalTaxCollected: Math.round(totalTaxCollected),
      totalTaxableSales: Math.round(totalTaxableSales),
    })
  } catch (error: any) {
    console.error('Finance API error:', error)
    return NextResponse.json({ error: 'Failed to fetch finance data', details: error.message }, { status: 500 })
  }
}
