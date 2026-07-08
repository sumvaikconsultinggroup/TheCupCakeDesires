'use server'

import connectDb from '@/lib/mongodb'
import Product, { IProduct } from '@/models/product.model'
import Order from '@/models/Order'
import User from '@/models/User'
import AbandonedCart from '@/models/AbandonedCart'
import mongoose from 'mongoose'
import { format } from 'date-fns'

export interface AnalyticsData {
  revenue: {
    total: number
    change: number
    chartData: { date: string; value: number }[]
  }
  orders: {
    total: number
    change: number
    chartData: { date: string; value: number }[]
  }
  visitors: {
    total: number
    change: number
    chartData: { date: string; value: number }[]
  }
  conversionRate: number
  conversionChange: number
  averageOrderValue: number
  topCategories: { name: string; sales: number; percentage: number }[]
  salesByChannel: { channel: string; value: number; color: string }[]
  recentActivity: { type: string; description: string; time: string }[]
  productCount: number  
  inventoryValue: number
  abandonedCartRate: number
}

export async function getAnalyticsData(timeRange: string = '7d'): Promise<{ success: boolean; data: AnalyticsData | null }> {
  try {
    await connectDb()

    // Calculate accumulation start date based on timeRange
    const now = new Date()
    const startDate = new Date()
    let days = 7 // Default to 7 days
    if (timeRange === '30d') days = 30
    if (timeRange === '90d') days = 90
    startDate.setDate(now.getDate() - days)

    // Comparison period (previous period)
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - days)

    // 1. Fetch Orders Data
    const orders = await Order.find({
      createdAt: { $gte: startDate }
    }).lean()

    const prevOrders = await Order.find({
      createdAt: { $gte: prevStartDate, $lt: startDate }
    }).lean()

    const users = await User.find({
      createdAt: { $gte: startDate }
    }).lean()

    const prevUsers = await User.find({
      createdAt: { $gte: prevStartDate, $lt: startDate }
    }).lean()

    // 2. Fetch Products Data
    const products = await Product.find({ isDeleted: { $ne: true } }).lean() as unknown as Array<IProduct & { _id: mongoose.Types.ObjectId }>
    const productCount = products.length

    // 3. Inventory Value & Category Mapping
    let inventoryValue = 0
    const categoryMap = new Map<string, number>()
    const productCategoryLookup = new Map<string, string>()

    for (const product of products) {
      const cat = product.productCategory || 'Other'
      productCategoryLookup.set(product._id.toString(), cat)

      for (const v of product.variants || []) {
        const qty = v.inventoryQty || 0
        const price = v.costPerItem || v.price || 0
        inventoryValue += qty * price
      }
    }

    // 4. Calculate Metrics

    // Paid order predicate (Stripe-only store; paid also covers in_kitchen/out_for_delivery/delivered)
    const isPaid = (o: any) => o.paymentDetails?.paymentStatus === 'paid' || o.status === 'paid'
    const paidOrders = orders.filter(isPaid)
    const prevPaidOrders = prevOrders.filter(isPaid)

    // Revenue (period-scoped paid orders, so headline, change % and chart agree)
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const prevPeriodRevenue = prevPaidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    const revenueChange = calcChange(totalRevenue, prevPeriodRevenue)

    // Orders Count (period paid orders, consistent with revenue)
    const totalOrders = paidOrders.length
    const ordersChange = calcChange(paidOrders.length, prevPaidOrders.length)

    // Visitors (new users in period)
    const totalVisitors = users.length
    const visitorsChange = calcChange(users.length, prevUsers.length)

    // Conversion Rate (period paid orders / period visitors), with change vs previous period
    const conversionRate = users.length > 0
      ? (paidOrders.length / users.length) * 100
      : 0
    const prevConversionRate = prevUsers.length > 0
      ? (prevPaidOrders.length / prevUsers.length) * 100
      : 0
    const conversionChange = calcChange(conversionRate, prevConversionRate)

    // Average Order Value (period paid revenue / period paid order count)
    const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

    // 5. Category Sales Aggregation (paid orders only)
    for (const order of paidOrders) {
      for (const item of order.items || []) {
        // Try to find category from product lookup
        const cat = productCategoryLookup.get(item.productId?.toString() || '') || 'Other'
        const itemTotal = (item.price || 0) * (item.quantity || 1)
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + itemTotal)
      }
    }

    const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
    const topCategories = Array.from(categoryMap.entries())
      .map(([name, sales]) => ({
        name,
        sales,
        percentage: totalCategoryRevenue > 0 ? Math.round((sales / totalCategoryRevenue) * 100) : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // 6. Sales by Channel (paid orders only, grouped by payment method, as percentages)
    const channelMap = new Map<string, number>()
    for (const order of paidOrders) {
      // Stripe is the only gateway; keep the lookup defensive for legacy data
      const method = (order.paymentDetails?.paymentMethod || order.paymentMethod || 'stripe').toLowerCase()
      const label = method === 'stripe'
        ? 'Card / Online'
        : method.charAt(0).toUpperCase() + method.slice(1)
      channelMap.set(label, (channelMap.get(label) || 0) + 1)
    }

    // Convert channel counts to percentages that sum to 100 (guard zero-total)
    const channelTotal = Array.from(channelMap.values()).reduce((a, b) => a + b, 0)
    const channelEntries = Array.from(channelMap.entries()).sort((a, b) => b[1] - a[1])
    let percentRemaining = 100
    const salesByChannel = channelEntries.map(([channel, count], index) => {
      const isLast = index === channelEntries.length - 1
      const value = channelTotal > 0
        ? (isLast ? percentRemaining : Math.round((count / channelTotal) * 100))
        : 0
      percentRemaining -= value
      return {
        channel,
        value,
        color: ['#2e1f15', '#10B981', '#F59E0B', '#EC4899', '#6366f1'][index % 5]
      }
    })


    // 7. Abandoned Cart Rate (lifetime)
    const totalAbandonedCarts = await AbandonedCart.countDocuments({ status: 'abandoned' })
    const lifetimeOrderCount = await Order.countDocuments()
    const abandonedCartRate = (totalAbandonedCarts + lifetimeOrderCount) > 0
      ? (totalAbandonedCarts / (totalAbandonedCarts + lifetimeOrderCount)) * 100
      : 0


    // 8. Chart Data Generation (Group by Date)
    const revenueChartData = generateChartData(paidOrders, startDate, now, 'totalAmount')
    const ordersChartData = generateChartData(paidOrders, startDate, now, null) // Count only
    const visitorsChartData = generateChartData(users, startDate, now, null) // Count only

    // 8. Recent Activity (Mix of recent orders and maybe new users)
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).lean()
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean()

    let activities: any[] = []

    recentOrders.forEach((o: any) => {
      activities.push({
        type: 'order',
        description: `Order #${o.orderId || o._id.toString().slice(-6)} placed - $${o.totalAmount}`,
        time: getTimeAgo(new Date(o.createdAt)),
        timestamp: new Date(o.createdAt).getTime()
      })
    })

    recentUsers.forEach((u: any) => {
      const name = u.firstName || u.billing_fullname || (u.email ? u.email.split('@')[0] : 'User')
      activities.push({
        type: 'customer',
        description: `New customer ${name} registered`,
        time: getTimeAgo(new Date(u.createdAt)),
        timestamp: new Date(u.createdAt).getTime()
      })
    })

    // Sort by time descending
    activities.sort((a, b) => b.timestamp - a.timestamp)
    const recentActivity = activities.slice(0, 10).map(({ timestamp, ...rest }) => rest)

    return {
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          change: revenueChange,
          chartData: revenueChartData,
        },
        orders: {
          total: totalOrders,
          change: ordersChange,
          chartData: ordersChartData,
        },
        visitors: {
          total: totalVisitors,
          change: visitorsChange,
          chartData: visitorsChartData,
        },
        conversionRate,
        conversionChange,
        averageOrderValue,
        topCategories: topCategories.length > 0 ? topCategories : [
          { name: 'No Sales Yet', sales: 0, percentage: 0 }
        ],
        salesByChannel: salesByChannel.length > 0 ? salesByChannel : [
          { channel: 'No Data', value: 0, color: '#e5e5e5' }
        ],
        recentActivity,
        productCount,
        inventoryValue,
        abandonedCartRate,
      }
    }

  } catch (error) {
    console.error('Get analytics error:', error)
    return { success: false, data: null }
  }
}

// Change % helper: previous of 0 only counts as +100% when there is current activity
function calcChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Melbourne wall-clock helpers — all "today"/day bucketing uses Australia/Melbourne
const MELBOURNE_TZ = 'Australia/Melbourne'

function melbourneDateKey(d: Date) {
  // en-CA gives an ISO-like YYYY-MM-DD string
  return new Intl.DateTimeFormat('en-CA', { timeZone: MELBOURNE_TZ }).format(d)
}

function melbourneHour(d: Date) {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: MELBOURNE_TZ, hour: '2-digit', hour12: false }).formatToParts(d)
  const hour = parts.find(p => p.type === 'hour')?.value || '00'
  return (hour === '24' ? '00' : hour).padStart(2, '0')
}

// Helper to group data by date (Daily/Weekly/Monthly) using Melbourne wall-clock time
function generateChartData(data: any[], startDate: Date, endDate: Date, valueKey: string | null) {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const chartData: { date: string; value: number }[] = []
  const lookup: Record<string, { date: string; value: number }> = {}

  const init = (key: string, label?: string) => {
    if (lookup[key]) return
    const entry = { date: label || key, value: 0 }
    chartData.push(entry)
    lookup[key] = entry
  }

  // Melbourne calendar days covered by the period (en-CA date keys, in order)
  const dayMs = 24 * 60 * 60 * 1000
  const dayKeys: string[] = []
  for (let t = startDate.getTime(); t <= endDate.getTime() + dayMs; t += dayMs) {
    const key = melbourneDateKey(new Date(Math.min(t, endDate.getTime())))
    if (!dayKeys.includes(key)) dayKeys.push(key)
  }

  if (daysDiff <= 1) {
    for (let i = 0; i < 24; i++) init(`${i.toString().padStart(2, '0')}:00`)
    data.forEach((item: any) => {
      const key = melbourneHour(new Date(item.createdAt)) + ':00'
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  } else if (daysDiff <= 31) {
    dayKeys.forEach(key => init(key, format(new Date(key + 'T00:00:00'), 'MMM dd')))
    data.forEach((item: any) => {
      const key = melbourneDateKey(new Date(item.createdAt))
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  } else if (daysDiff <= 90) {
    dayKeys.forEach(key => init('Week ' + format(new Date(key + 'T00:00:00'), 'w')))
    data.forEach((item: any) => {
      const key = 'Week ' + format(new Date(melbourneDateKey(new Date(item.createdAt)) + 'T00:00:00'), 'w')
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  } else {
    dayKeys.forEach(key => init(format(new Date(key + 'T00:00:00'), 'MMM yyyy')))
    data.forEach((item: any) => {
      const key = format(new Date(melbourneDateKey(new Date(item.createdAt)) + 'T00:00:00'), 'MMM yyyy')
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  }

  return chartData
}

function getTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " mins ago"
  return Math.floor(seconds) + " seconds ago"
}
