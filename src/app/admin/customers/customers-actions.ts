'use server'

import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'

const serialize = <T>(data: T): T => JSON.parse(JSON.stringify(data))

export interface CustomerData {
  id: string
  name: string
  email: string
  phone?: string
  totalOrders: number
  totalSpent: number
  lastOrder?: string
  createdAt: string
  status: 'active' | 'inactive'
  addresses?: any[]
  gender?: string
  dob?: string
  wishlist?: any[]
  orders?: any[]
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  averageOrderValue: number
}

// Get all customers with their order stats
export async function getCustomers(
  params: {
    search?: string
    status?: 'all' | 'active' | 'inactive'
    page?: number
    limit?: number
  } = {}
): Promise<{
  success: boolean
  customers: CustomerData[]
  stats: CustomerStats
  total: number
}> {
  try {
    await connectDb()

    const { search, status = 'all', page = 1, limit = 20 } = params

    // Build filter
    const filter: any = {}

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { billing_fullname: { $regex: search, $options: 'i' } },
        { billing_phone: { $regex: search, $options: 'i' } },
      ]
    }

    // Get total count
    const totalCount = await User.countDocuments(filter)

    // Get customers with pagination
    const users: any[] = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Get all unique order IDs from all users
    const allOrderIds = users.reduce((acc: any[], user: any) => {
      if (user.orders && Array.isArray(user.orders)) {
        user.orders.forEach((o: any) => {
          if (o._id) acc.push(o._id)
        })
      }
      return acc
    }, [])

    // Fetch all orders that match the order IDs
    const orders = await Order.find({ _id: { $in: allOrderIds } })
      .select('_id totalAmount paymentDetails.paymentStatus createdAt status')
      .lean()

    // Create a map of orders by their ID for quick lookup
    const ordersMap = new Map(orders.map((o: any) => [o._id.toString(), o]))

    // Transform to CustomerData
    const customers: CustomerData[] = users.map((user: any) => {
      let totalOrders = 0
      let totalSpent = 0
      let lastOrderDate: Date | null = null

      if (user.orders && Array.isArray(user.orders)) {
        for (const orderRef of user.orders) {
          const order = ordersMap.get(orderRef._id?.toString())
          if (order) {
            totalOrders++
            
            // Only add to totalSpent if payment status is 'paid'
            if (order.paymentDetails?.paymentStatus === 'paid') {
              totalSpent += (order.totalAmount || 0)
            }
            
            const orderDate = new Date(order.createdAt)
            if (!lastOrderDate || orderDate > lastOrderDate) {
              lastOrderDate = orderDate
            }
          }
        }
      }

      const name = user.billing_fullname || user.email?.split('@')[0] || 'Unknown'

      return {
        id: user._id?.toString() || '',
        name,
        email: user.email || '',
        phone: user.billing_phone,
        totalOrders,
        totalSpent,
        lastOrder: lastOrderDate ? lastOrderDate.toISOString().split('T')[0] : undefined,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
        status: 'active',
        addresses: serialize(user.billing_address || []),
        gender: user.billing_customer_gender,
        dob: user.billing_customer_dob ? new Date(user.billing_customer_dob).toISOString().split('T')[0] : undefined,
        wishlist: user.wishlist || [],
      }
    })

    // Filter by status if needed
    const filteredCustomers = status === 'all' ? customers : customers.filter((c) => c.status === status)

    // Calculate stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const allUsers = await User.find({}).lean()
    const activeCount = totalCount
    const newThisMonth = allUsers.filter((u) => new Date(u.createdAt) >= startOfMonth).length

    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
    const totalOrdersCount = customers.reduce((sum, c) => sum + c.totalOrders, 0)

    const stats: CustomerStats = {
      totalCustomers: totalCount,
      activeCustomers: activeCount,
      newCustomersThisMonth: newThisMonth,
      averageOrderValue: totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0,
    }

    return {
      success: true,
      customers: filteredCustomers,
      stats,
      total: totalCount,
    }
  } catch (error) {
    console.error('Error fetching customers:', error)
    return {
      success: false,
      customers: [],
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        newCustomersThisMonth: 0,
        averageOrderValue: 0,
      },
      total: 0,
    }
  }
}

// Get single customer details
export async function getCustomerDetails(customerId: string): Promise<{
  success: boolean
  customer?: CustomerData
}> {
  try {
    await connectDb()

    const user: any = await User.findById(customerId).lean()
    if (!user) {
      return { success: false }
    }

    // Get customer's order IDs from the orders array
    const orderIds = user.orders?.map((o: any) => o._id) || []
    
    // Fetch orders that match the order IDs
    const orders: any[] = await Order.find({ _id: { $in: orderIds } })
      .sort({ createdAt: -1 })
      .lean()

    // Calculate total spent (only paid orders)
    const totalSpent = orders.reduce((sum, o) => {
      if (o.paymentDetails?.paymentStatus === 'paid') {
        return sum + (o.totalAmount || 0)
      }
      return sum
    }, 0)
    
    const lastOrder = orders[0]

    const name = user.billing_fullname || user.email?.split('@')[0] || 'Unknown'

    return {
      success: true,
      customer: {
        id: user._id?.toString() || '',
        name,
        email: user.email || '',
        phone: user.billing_phone,
        totalOrders: orders.length,
        totalSpent,
        lastOrder: lastOrder?.createdAt ? new Date(lastOrder.createdAt).toISOString().split('T')[0] : undefined,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
        status: 'active',
        addresses: serialize(user.billing_address || []),
        gender: user.billing_customer_gender,
        dob: user.billing_customer_dob ? new Date(user.billing_customer_dob).toISOString().split('T')[0] : undefined,
        orders: orders.map((o: any) => ({
          id: o._id?.toString(),
          orderId: o.orderId,
          status: o.status,
          totalAmount: o.totalAmount || 0,
          paymentStatus: o.paymentDetails?.paymentStatus,
          createdAt: o.createdAt,
        })),
        wishlist: user.wishlist || [],
      },
    }
  } catch (error) {
    console.error('Error fetching customer details:', error)
    return { success: false }
  }
}

// Get customer by userId (e.g. Clerk ID)
export async function getCustomerByUserId(userId: string): Promise<{ success: boolean; customer?: CustomerData }> {
  try {
    await connectDb()

    
    // Try to find by userId field (Clerk ID)
    let user: any = await User.findOne({ userId }).lean()

    
    if (!user) {
      // Fallback to findById if it looks like an ObjectId
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
         user = await User.findById(userId).lean()
      }
    }

    if (!user) {
      return { success: false }
    }

    const name = user.billing_fullname || user.email?.split('@')[0] || 'Unknown'

    return {
      success: true,
      customer: {
        id: user._id?.toString() || '',
        name,
        email: user.email || '',
        phone: user.billing_phone,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
        status: 'active',
        addresses: serialize(user.billing_address || []),
        wishlist: user.wishlist || [],
      }
    }
  } catch (error) {
    console.error('Error fetching customer by userId:', error)
    return { success: false }
  }
}