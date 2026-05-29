'use server'

import connectDb from '@/lib/mongodb'
import Product, { IProduct } from '@/models/product.model'
import Order from '@/models/Order'
import User from '@/models/User'
import AbandonedCart from '@/models/AbandonedCart'
import mongoose from 'mongoose'
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'

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

    // Revenue
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          $or: [
            { 'paymentDetails.paymentStatus': 'paid' },
            { status: 'paid' }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ])
    const totalRevenue = totalRevenueResult[0]?.total || 0
    const totalPaidOrders = totalRevenueResult[0]?.count || 0

    // Calculate period revenue for change percentage (using same criteria)
    const currentPeriodRevenue = orders
      .filter(o => o.paymentDetails?.paymentStatus === 'paid' || o.status === 'paid')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    const prevPeriodRevenue = prevOrders
      .filter(o => o.paymentDetails?.paymentStatus === 'paid' || o.status === 'paid')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0)

    const revenueChange = prevPeriodRevenue === 0 ? 100 : ((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100

    // Orders Count
    const totalOrders = await Order.countDocuments()
    const prevOrdersCount = prevOrders.length
    const ordersChange = prevOrdersCount === 0 ? 100 : ((orders.length - prevOrdersCount) / prevOrdersCount) * 100

    // Visitors (Users) Count
    const totalVisitors = await User.countDocuments()
    const prevUsersCount = prevUsers.length
    const visitorsChange = prevUsersCount === 0 ? 100 : ((users.length - prevUsersCount) / prevUsersCount) * 100

    // Conversion Rate (Paid Orders / Total Orders)
    const conversionRate = totalOrders > 0 
      ? (totalPaidOrders / totalOrders) * 100 
      : 0

    // Average Order Value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // 5. Category Sales Aggregation
    for (const order of orders) {
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

    // 6. Sales by Channel (Payment Method for now)
    const channelMap = new Map<string, number>()
    for (const order of orders) {
      // Check order.paymentDetails?.paymentMethod or order.paymentMethod (schema ambiguity coverage)
      let method = 'Unknown'
      if (order.paymentDetails?.paymentMethod) method = order.paymentDetails.paymentMethod
      else if (order.paymentMethod) method = order.paymentMethod

      // Normalize
      method = method.toUpperCase() // COD, PREPAID, UPI, etc.
      channelMap.set(method, (channelMap.get(method) || 0) + 1)
    }

    // Convert channel map to required format
    const salesByChannel = Array.from(channelMap.entries()).map(([channel, value], index) => ({
      channel,
      value,
      color: ['#1B198F', '#10B981', '#F59E0B', '#EC4899', '#6366f1'][index % 5]
    }))


    // 7. Abandoned Cart Rate
    const totalAbandonedCarts = await AbandonedCart.countDocuments({ status: 'abandoned' })
    const abandonedCartRate = (totalAbandonedCarts + totalOrders) > 0 
      ? (totalAbandonedCarts / (totalAbandonedCarts + totalOrders)) * 100 
      : 0


    // 8. Chart Data Generation (Group by Date)
    const paidOrders = orders.filter((o: any) => o.status === 'paid' || o.paymentDetails?.paymentStatus === 'paid')
    const revenueChartData = generateChartData(paidOrders, startDate, now, 'totalAmount')
    const ordersChartData = generateChartData(orders, startDate, now, null) // Count only
    const visitorsChartData = generateChartData(users, startDate, now, null) // Count only

    // 8. Recent Activity (Mix of recent orders and maybe new users)
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10).lean()
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).lean()

    let activities: any[] = []

    recentOrders.forEach((o: any) => {
      activities.push({
        type: 'order',
        description: `Order #${o.orderId || o._id.toString().slice(-6)} placed - ₹${o.totalAmount}`,
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

// Helper to group data by date (Daily/Weekly/Monthly)
function generateChartData(data: any[], startDate: Date, endDate: Date, valueKey: string | null) {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const chartData: { date: string; value: number }[] = []
  const lookup: Record<string, { date: string; value: number }> = {}

  const init = (key: string) => {
    const entry = { date: key, value: 0 }
    chartData.push(entry)
    lookup[key] = entry
  }

  if (daysDiff <= 1) {
    for (let i = 0; i < 24; i++) init(`${i.toString().padStart(2, '0')}:00`)
    data.forEach((item: any) => {
      const key = format(new Date(item.createdAt), 'HH') + ':00'
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  } else if (daysDiff <= 31) {
    eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => init(format(date, 'MMM dd')))
    data.forEach((item: any) => {
      const key = format(new Date(item.createdAt), 'MMM dd')
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  } else if (daysDiff <= 90) {
    eachWeekOfInterval({ start: startDate, end: endDate }).forEach(date => init('Week ' + format(date, 'w')))
    data.forEach((item: any) => {
      const key = 'Week ' + format(new Date(item.createdAt), 'w')
      if (lookup[key]) lookup[key].value += valueKey ? (item[valueKey] || 0) : 1
    })
  } else {
    eachMonthOfInterval({ start: startDate, end: endDate }).forEach(date => init(format(date, 'MMM yyyy')))
    data.forEach((item: any) => {
      const key = format(new Date(item.createdAt), 'MMM yyyy')
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
