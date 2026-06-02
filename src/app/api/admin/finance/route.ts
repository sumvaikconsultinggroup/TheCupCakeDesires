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
    const paidOrders = orders.filter(
      (order) => order.paymentDetails?.paymentStatus === 'paid' || order.payment?.status === 'paid'
    )

    const refundedOrders = orders.filter(
      (order) =>
        order.paymentDetails?.paymentStatus === 'refunded' ||
        order.payment?.status === 'refunded' ||
        order.status === 'refunded'
    )

    const grossRevenue = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const totalRefunds = refundedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    // Calculate processing fees (assuming 2% average)
    const processingFees = grossRevenue * 0.02
    const netRevenue = grossRevenue - totalRefunds - processingFees

    // Calculate average order value
    const avgOrderValue = paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0

    // Calculate refund rate
    const refundRate = paidOrders.length > 0 ? (refundedOrders.length / paidOrders.length) * 100 : 0

    // Calculate previous period for comparison
    const prevStartDate = new Date(startDate)
    const prevEndDate = new Date(startDate)
    const periodDiff = now.getTime() - startDate.getTime()
    prevStartDate.setTime(startDate.getTime() - periodDiff)

    const prevOrders = (await Order.find({
      createdAt: { $gte: prevStartDate, $lt: startDate },
    }).lean()) as unknown as Array<any & { _id: mongoose.Types.ObjectId }>

    const prevPaidOrders = prevOrders.filter(
      (order) => order.paymentDetails?.paymentStatus === 'paid' || order.payment?.status === 'paid'
    )

    const prevGrossRevenue = prevPaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const prevRefunds = prevOrders
      .filter((order) => order.status === 'refunded')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    // Calculate changes
    const grossRevenueChange = prevGrossRevenue > 0 ? ((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100 : 0
    const netRevenueChange =
      prevGrossRevenue > 0
        ? ((netRevenue - (prevGrossRevenue - prevRefunds)) / (prevGrossRevenue - prevRefunds)) * 100
        : 0
    const refundsChange = prevRefunds > 0 ? ((totalRefunds - prevRefunds) / prevRefunds) * 100 : 0

    // Revenue by payment method (using PayU mode field)
    const paymentMethodMap: { [key: string]: { name: string; amount: number; count: number } } = {}

    // Map PayU modes to readable names
    const modeToMethodName: { [key: string]: string } = {
      CC: 'Credit Card',
      DC: 'Debit Card',
      NB: 'Net Banking',
      UPI: 'UPI',
      Cash: 'Cash on Delivery',
      wallet: 'Wallet',
      EMI: 'EMI',
      Lazypay: 'LazyPay',
    }

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

    // No COD support — Stripe-only checkout
    const codOrders: any[] = []
    const codAmount = 0
    if (codAmount > 0) {
      if (!paymentMethodMap['Cash on Delivery']) {
        paymentMethodMap['Cash on Delivery'] = { name: 'Cash on Delivery', amount: 0, count: 0 }
      }
      paymentMethodMap['Cash on Delivery'].amount += codAmount
      paymentMethodMap['Cash on Delivery'].count += codOrders.length
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

    // Revenue by day
    const revenueByDay: { [key: string]: { revenue: number; orders: number } } = {}
    const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Initialize all days
    for (let i = daysInRange - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      revenueByDay[dateKey] = { revenue: 0, orders: 0 }
    }

    // Aggregate revenue by day
    for (const order of paidOrders) {
      const orderDate = new Date(order.createdAt)
      const dateKey = orderDate.toISOString().split('T')[0]
      if (revenueByDay[dateKey]) {
        revenueByDay[dateKey].revenue += order.totalAmount || 0
        revenueByDay[dateKey].orders += 1
      }
    }

    // Convert to array and format for chart (show last 7 days for weekly view)
    const daysToShow = dateRange === '7d' ? 7 : dateRange === '30d' ? 7 : 12
    const revenueByDayArray = Object.entries(revenueByDay)
      .slice(-daysToShow)
      .map(([date, data]) => {
        const d = new Date(date)
        const dayName =
          dateRange === '7d' || dateRange === '30d'
            ? d.toLocaleDateString('en-US', { weekday: 'short' })
            : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        return {
          date: dayName,
          revenue: Math.round(data.revenue),
          orders: data.orders,
        }
      })

    // Today's revenue
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayOrders = paidOrders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === today.getTime()
    })
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    // Yesterday's revenue for comparison
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayOrders = paidOrders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === yesterday.getTime()
    })
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const todayRevenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    // No COD support — Stripe-only checkout
    const codPendingOrders: any[] = []
    const codPending = 0

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

    // TAX CALCULATION (5% GST on delivered items)
    const taxStartDate = new Date()
    taxStartDate.setFullYear(taxStartDate.getFullYear() - 1)
    taxStartDate.setDate(1)
    taxStartDate.setHours(0, 0, 0, 0)

    const taxOrders = (await Order.find({
      status: 'delivered',
      createdAt: { $gte: taxStartDate },
    }).lean()) as unknown as Array<any & { _id: mongoose.Types.ObjectId }>

    const getMonthKey = (date: Date): string => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }

    const monthlyTaxData = new Map<string, { sales: number; tax: number; orders: number; timestamp: number }>()

    let totalTaxCollected = 0
    let totalTaxableSales = 0

    for (const order of taxOrders) {
      const d = new Date(order.createdAt)
      const key = getMonthKey(d)

      const taxableAmount = order.totalAmount || 0
      const tax = Math.round(((taxableAmount * 5) / 105) * 100) / 100 // GST extracted from inclusive total

      if (!monthlyTaxData.has(key)) {
        const timestamp = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
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
          prefix: '₹',
        },
        {
          label: 'Net Revenue',
          value: Math.round(netRevenue),
          change: Math.abs(netRevenueChange),
          changeType: netRevenueChange >= 0 ? 'increase' : 'decrease',
          prefix: '₹',
        },
        {
          label: 'Total Refunds',
          value: Math.round(totalRefunds),
          change: Math.abs(refundsChange),
          changeType: refundsChange >= 0 ? 'increase' : 'decrease',
          prefix: '₹',
        },
        {
          label: 'Processing Fees',
          value: Math.round(processingFees),
          change: Math.abs(grossRevenueChange),
          changeType: grossRevenueChange >= 0 ? 'increase' : 'decrease',
          prefix: '₹',
        },
        {
          label: 'Avg Order Value',
          value: Math.round(avgOrderValue),
          change: 0,
          changeType: 'increase',
          prefix: '₹',
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
      codPending: Math.round(codPending),
      codPendingCount: codPendingOrders.length,
      avgFeeRate: 2.1, // Fixed rate for now
      taxReport,
      totalTaxCollected: Math.round(totalTaxCollected),
      totalTaxableSales: Math.round(totalTaxableSales),
    })
  } catch (error: any) {
    console.error('Finance API error:', error)
    return NextResponse.json({ error: 'Failed to fetch finance data', details: error.message }, { status: 500 })
  }
}
