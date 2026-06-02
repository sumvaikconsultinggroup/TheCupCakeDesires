'use server'

import { createShiprocketOrderForOrder } from '@/lib/createShiprocketOrder'
import { sendOrderCancelledEmail, sendOrderConfirmedEmail, sendRefundInitiatedEmail } from '@/lib/email-service'
import { amountInWords, getStateCode } from '@/lib/gst'
import connectDb from '@/lib/mongodb'
import { getShiprocketToken } from '@/lib/shiprocket'
import Order from '@/models/Order'
import Refund from '@/models/Refund'
import Shipment from '@/models/Shipment'
import User from '@/models/User'
import type { OrderItem } from '@/types/orders'
import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns'
import nodemailer from 'nodemailer'
import { v4 as uuidv4 } from 'uuid'

const toPlain = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: (process.env.SMTP_PORT || '587') === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensureTimelineArray = (order: any) => {
  if (!Array.isArray(order.timeline)) {
    order.timeline = []
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order.timeline = order.timeline.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item))
}

const createEmailTemplate = (title: string, customerName: string, content: string, orderId: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">
<tr>
<td style="background-color:#2e1f15;padding:24px 40px;text-align:center;">
<p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">CupCake Desires</p>
</td>
</tr>
<tr>
<td style="padding:36px 40px;">
<h2 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;">${title}</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Hi ${customerName},</p>
<div style="font-size:14px;color:#374151;line-height:1.7;">${content}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;background-color:#f9fafb;border-radius:4px;">
<tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Order ID: <strong style="color:#111827;">${orderId}</strong></td></tr>
</table>
<p style="margin:20px 0 0;font-size:13px;color:#6b7280;">If you have any questions, please reply to this email.</p>
</td>
</tr>
<tr>
<td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;">CupCake Desires</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} CupCake Desires. All rights reserved.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// Get all orders with filtering
export async function getOrdersAction(params: {
  page?: number
  limit?: number
  status?: string
  paymentStatus?: string
  search?: string
  startDate?: string
  endDate?: string
  assignedTo?: string
  sortBy?: string
  sortOrder?: string
}) {
  try {
    await connectDb()

    const page = params.page || 1
    const limit = Math.min(params.limit || 20, 100)
    const skip = (page - 1) * limit

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {}

    if (params.status && params.status !== 'all') {
      // For 'paid' and 'pending', filter by payment status instead of order status
      if (params.status === 'paid' || params.status === 'pending') {
        query['paymentDetails.paymentStatus'] = params.status
      } else {
        query.status = params.status
      }
    }

    if (params.paymentStatus && params.paymentStatus !== 'all') {
      query['paymentDetails.paymentStatus'] = params.paymentStatus
    }

    if (params.assignedTo) {
      query.assignedTo = params.assignedTo
    }

    if (params.startDate || params.endDate) {
      query.createdAt = {}
      if (params.startDate) query.createdAt.$gte = new Date(params.startDate)
      if (params.endDate) query.createdAt.$lte = new Date(params.endDate)
    }

    if (params.search) {
      query.$or = [
        { orderId: { $regex: params.search, $options: 'i' } },
        { 'customer.email': { $regex: params.search, $options: 'i' } },
        { 'customer.firstName': { $regex: params.search, $options: 'i' } },
        { 'customer.lastName': { $regex: params.search, $options: 'i' } },
        { 'customer.phone': { $regex: params.search, $options: 'i' } },
      ]
    }

    // Sort configuration
    const sortBy = params.sortBy || 'createdAt'
    const sortOrder = params.sortOrder || 'desc'
    const sort: Record<string, 1 | -1> = {} as Record<string, 1 | -1>
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Build date-only filter for stats (respects date range but not status filter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateQuery: Record<string, any> = {}
    if (params.startDate || params.endDate) {
      dateQuery.createdAt = {}
      if (params.startDate) dateQuery.createdAt.$gte = new Date(params.startDate)
      if (params.endDate) dateQuery.createdAt.$lte = new Date(params.endDate)
    }

    // Execute query with pagination
    const [orders, total, statusCounts, paymentStats] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(limit).select('-timeline -notes').lean(),
      Order.countDocuments(query),
      Order.aggregate([
        ...(Object.keys(dateQuery).length > 0 ? [{ $match: dateQuery }] : []),
        {
          $facet: {
            // Group by order status (for confirmed/shipped/delivered/cancelled tabs)
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            // Group by payment status (for paid/pending tabs whose values live in paymentDetails)
            byPayment: [{ $group: { _id: '$paymentDetails.paymentStatus', count: { $sum: 1 } } }],
          },
        },
      ]),
      Order.aggregate([
        ...(Object.keys(dateQuery).length > 0 ? [{ $match: dateQuery }] : []),
        {
          $group: {
            _id: null,
            totalPayments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentDetails.paymentStatus', 'paid'] },
                      {
                        $not: {
                          $in: [
                            '$status',
                            ['refund_initiated', 'refunded', 'cancelled', 'return_initiated', 'return_completed'],
                          ],
                        },
                      },
                    ],
                  },
                  '$totalAmount',
                  0,
                ],
              },
            },
            totalTransactions: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentDetails.paymentStatus', 'paid'] },
                      {
                        $not: {
                          $in: [
                            '$status',
                            ['refund_initiated', 'refunded', 'cancelled', 'return_initiated', 'return_completed'],
                          ],
                        },
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalOrders: { $sum: 1 },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'paid'] }, 1, 0] },
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'pending'] }, 1, 0] },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'failed'] }, 1, 0] },
            },
          },
        },
      ]),
    ])

    // Get unique userIds from orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = [...new Set((orders as any[]).map((order: any) => order.userId).filter(Boolean))]

    // Fetch user emails for all userIds
    const userEmailMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const users = await User.find({
        $or: [
          { clerkId: { $in: userIds } },
          { _id: { $in: userIds.filter((id: string) => /^[0-9a-fA-F]{24}$/.test(id)) } },
        ],
      })
        .select('clerkId _id email billing_email')
        .lean()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(users as any[]).forEach((user: any) => {
        const email = user.email || user.billing_email || ''
        if (user.clerkId) {
          userEmailMap[user.clerkId] = email
        }
        if (user._id) {
          userEmailMap[user._id.toString()] = email
        }
      })
    }

    // Get shipment info for orders to check if they're confirmed in Shiprocket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderIds = (orders as any[]).map((order: any) => order.orderId).filter(Boolean)
    const shipments = await Shipment.find({
      orderId: { $in: orderIds },
      provider: 'shiprocket',
    })
      .select('orderId providerOrderId providerShipmentId status')
      .lean()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipmentMap: Record<string, any> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(shipments as any[]).forEach((shipment: any) => {
      if (shipment.orderId) {
        shipmentMap[shipment.orderId] = shipment
      }
    })

    // Format orders for response with all required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedOrders = (orders as any[]).map((order: any) => {
      // Normalize payment method (handle both old and new formats)
      let paymentMethod = (order.paymentDetails?.paymentMethod || order.paymentMethod || 'cod').toLowerCase()
      if (paymentMethod !== 'cod') {
        paymentMethod = 'prepaid' // Normalize all non-COD to prepaid
      }

      const paymentStatus = order.paymentDetails?.paymentStatus || order.payment?.status || 'pending'

      // Resolve real name with full fallback chain (customer → deliveryAddress → user snapshot)
      const cName = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ').trim()
      const dName = [order.deliveryAddress?.firstName, order.deliveryAddress?.lastName].filter(Boolean).join(' ').trim()
      const uName = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ').trim()
      const resolvedName = cName || dName || uName || order.customer?.name || 'Guest'
      const resolvedPhone =
        order.customer?.phone || order.deliveryAddress?.phone || order.user?.phoneNumber || order.user?.phone || ''
      const resolvedEmail =
        order.customer?.email ||
        order.deliveryAddress?.email ||
        (order.userId ? userEmailMap[order.userId] || '' : '') ||
        order.user?.email ||
        ''

      return {
        ...order,
        _id: order._id?.toString(),
        id: order._id?.toString(),
        orderId: order.orderId,
        customerName: resolvedName,
        customerPhone: resolvedPhone,
        userEmail: order.userId ? userEmailMap[order.userId] || resolvedEmail : resolvedEmail,
        userName: resolvedName,
        items: order.items || order.products || [],
        status: order.status || 'pending',
        paymentStatus,
        paymentMethod: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
        transactionId: order.paymentDetails?.transactionId || '',
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
        hasShiprocketShipment: !!shipmentMap[order.orderId],
        shipment: shipmentMap[order.orderId] || null,
      }
    })
    const safeOrders = toPlain(formattedOrders)

    // Format status counts: merge byStatus + byPayment so tabs (paid/pending live in paymentStatus,
    // confirmed/shipped/etc live in status) all get a real count.
    const statusCountMap: Record<string, number> = {}
    const facet = (
      statusCounts as Array<{
        byStatus: Array<{ _id: string; count: number }>
        byPayment: Array<{ _id: string; count: number }>
      }>
    )[0] || { byStatus: [], byPayment: [] }
    facet.byStatus.forEach((item) => {
      if (item._id) statusCountMap[item._id] = item.count
    })
    // Map payment statuses ('paid', 'pending') into the same map for the Paid/Pending tabs
    facet.byPayment.forEach((item) => {
      if (item._id === 'paid' || item._id === 'pending') statusCountMap[item._id] = item.count
    })

    const stats = paymentStats[0] || {
      totalPayments: 0,
      totalTransactions: 0,
      totalOrders: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
    }

    return {
      success: true,
      orders: safeOrders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      statusCounts: statusCountMap,
      paidPaymentCount: stats.paidCount,
      pendingPaymentCount: stats.pendingCount,
      paymentStats: {
        totalPayments: stats.totalPayments,
        totalTransactions: stats.totalTransactions,
        totalOrders: stats.totalOrders,
        successRate: stats.totalOrders > 0 ? Math.round((stats.paidCount / stats.totalOrders) * 100) : 0,
      },
    }
  } catch (error: unknown) {
    console.error('Error fetching orders:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch orders',
    }
  }
}

// Get single order
export async function getOrderAction(orderId: string) {
  try {
    await connectDb()

    // Find order by orderId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any = await Order.findOne({ orderId }).lean()

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Get shipment if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let shipment: any = null
    if (order.shippingDetails?.shiprocket_shipment_id) {
      shipment = await Shipment.findOne({
        providerShipmentId: order.shippingDetails.shiprocket_shipment_id,
      }).lean()
    }

    // Get customer details from User model if userId exists
    let customerDetails = null
    if (order.userId) {
      // Check if userId is a valid MongoDB ObjectId (24 hex characters)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(order.userId)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userQuery: Record<string, any> = isValidObjectId
        ? {
            $or: [{ clerkId: order.userId }, { _id: order.userId }],
          }
        : { clerkId: order.userId }

      const user = await User.findOne(userQuery).lean()

      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userData = user as any
        const customerOrders = await Order.aggregate([
          { $match: { userId: order.userId } },
          { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
        ])

        customerDetails = {
          firstName: userData.billing_fullname?.split(' ')[0] || '',
          lastName: userData.billing_fullname?.split(' ').slice(1).join(' ') || '',
          name: userData.billing_fullname || '',
          email: userData.email || userData.billing_email || '',
          phone: userData.billing_phone || '',
          totalOrders: customerOrders[0]?.count || 1,
          totalSpent: customerOrders[0]?.total || order.totalAmount,
        }
      }
    }

    // Normalize payment method
    let paymentMethod = (order.paymentDetails?.paymentMethod || order.paymentMethod || 'cod').toLowerCase()
    if (paymentMethod !== 'cod') {
      paymentMethod = 'prepaid'
    }

    // Format order with latest model structure
    const orderResponse = {
      ...order,
      _id: undefined,
      id: order._id?.toString(),
      // Use items from new model, fallback to products for backward compatibility
      items: order.items || order.products || [],
      // Use shippingAddress from new model, fallback to deliveryAddress
      shippingAddress: order.shippingAddress || order.deliveryAddress || {},
      // Use paymentDetails from new model with normalized values
      paymentDetails: {
        ...(order.paymentDetails || order.payment || {}),
        paymentMethod,
        paymentStatus: order.paymentDetails?.paymentStatus || order.payment?.status || 'pending',
      },
      // Use status from model
      status: order.status || 'pending',
      customer: customerDetails || {
        name: 'Guest',
        email: '',
        phone: '',
      },
      shipment: shipment
        ? {
            ...shipment,
            _id: undefined,
            id: shipment._id?.toString(),
          }
        : null,
    }

    return {
      success: true,
      order: toPlain(orderResponse),
    }
  } catch (error: unknown) {
    console.error('Error fetching order:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch order',
    }
  }
}

// Confirm order (for COD orders)
export async function confirmOrderAction(orderId: string) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Check if order can be confirmed
    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot confirm order with status: ${order.status}` }
    }

    // Update order status to confirmed
    order.status = 'confirmed'

    // Add status log
    if (!order.statusLogs) {
      order.statusLogs = []
    }
    order.statusLogs.push({
      status: 'confirmed',
      timestamp: new Date(),
      message: 'Order confirmed by admin',
    })

    await order.save()

    // Get user for email
    // Check if userId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = order.userId && /^[0-9a-fA-F]{24}$/.test(order.userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userQuery: Record<string, any> = isValidObjectId
      ? {
          $or: [{ clerkId: order.userId }, { _id: order.userId }],
        }
      : { clerkId: order.userId }

    const user = await User.findOne(userQuery)

    // Prepare address data for Shiprocket
    const addressData = order.deliveryAddress || order.shippingAddress
    const paymentMethod = order.paymentDetails?.paymentMethod || order.paymentMethod || 'cod'
    const customerEmail = addressData?.email || user?.billing_email || user?.email || ''
    const customerPhone = addressData?.phone || user?.billing_phone || ''
    const customerName =
      addressData?.firstName && addressData?.lastName
        ? `${addressData.firstName} ${addressData.lastName}`.trim()
        : addressData?.firstName || user?.billing_fullname || 'Customer'

    // Create Shiprocket order
    let shiprocketCreated = false
    if (addressData && order.items && order.items.length > 0) {
      const customerAddress = addressData.address || addressData.address1 || addressData.street
      const customerCity = addressData.city
      const customerPincode = addressData.zipcode || addressData.postalCode
      const customerState = addressData.state

      if (customerAddress && customerCity && customerPincode && customerState && customerPhone) {
        try {
          const shiprocketResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/delivery-ship/create-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order_id: order._id.toString(),
              customer: {
                name: customerName,
                address: customerAddress,
                city: customerCity,
                pincode: customerPincode,
                state: customerState,
                email: customerEmail || process.env.SUPPORT_EMAIL || 'support@cupcakedesires.com',
                phone: customerPhone,
              },
              products: order.items.map((item: OrderItem) => ({
                name: item.name,
                sku: item.variants?.[0]?.option || item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
              payment_method: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
              sub_total: order.totalAmount,
            }),
          })

          if (shiprocketResponse.ok) {
            shiprocketCreated = true
          }
        } catch (error) {
          console.error('Error creating Shiprocket order:', error)
        }
      }
    }

    const orderData = toPlain(order.toObject())

    // Send confirmation email
    try {
      await sendOrderConfirmedEmail(order.toObject())
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return {
      success: true,
      message: shiprocketCreated
        ? 'Order confirmed and Shiprocket shipment created successfully'
        : 'Order confirmed successfully',
      order: {
        ...orderData,
        id: order._id?.toString(),
      },
      shiprocketCreated,
    }
  } catch (error: unknown) {
    console.error('Error confirming order:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to confirm order',
    }
  }
}

// Update order
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateOrderAction(orderId: string, action: string, data: any) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    switch (action) {
      case 'update_status': {
        const previousStatus = order.status
        order.status = data.status
        // Ensure timeline is always an array of objects
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'status',
          title: 'Status Updated',
          description: `Order status changed from ${previousStatus} to ${data.status}`,
          user: data.user || 'Admin',
          timestamp: new Date(),
        })
        // Also update statusLogs for user-facing timeline
        if (!order.statusLogs) {
          order.statusLogs = []
        }
        // Get status label for message
        const statusLabels: Record<string, string> = {
          order_created: 'Order placed',
          paid: 'Payment confirmed',
          cod: 'COD order placed',
          pending: 'Order pending',
          confirmed: 'Order confirmed',
          processing: 'Order is being processed',
          shipped: 'Order has been shipped',
          delivered: 'Order has been delivered',
          cancelled: 'Order cancelled',
          refund_initiated: 'Refund initiated',
          refunded: 'Refund completed',
        }
        const statusMessage = statusLabels[data.status] || `Order status changed to ${data.status}`
        order.statusLogs.push({
          status: data.status,
          timestamp: new Date(),
          message: statusMessage,
        })

        // If status is being changed to "confirmed", create Shiprocket order
        if (data.status === 'confirmed' && previousStatus !== 'confirmed') {
          // Check if order already has a Shiprocket shipment
          const existingShipment = await Shipment.findOne({
            orderId: order.orderId,
            provider: 'shiprocket',
          })

          if (!existingShipment) {
            try {
              const shiprocketResult = await createShiprocketOrderForOrder(order.orderId)
              if (shiprocketResult.success) {
                order.statusLogs.push({
                  status: 'confirmed',
                  timestamp: new Date(),
                  message: 'Shiprocket order created successfully',
                })
              } else {
                // Don't fail the status update, just log the error
                order.statusLogs.push({
                  status: 'confirmed',
                  timestamp: new Date(),
                  message: `Shiprocket order creation failed: ${shiprocketResult.message}`,
                })
              }
            } catch (shiprocketError: unknown) {
              console.error('Error creating Shiprocket order:', shiprocketError)
              // Don't fail the status update, just log the error
              order.statusLogs.push({
                status: 'confirmed',
                timestamp: new Date(),
                message: `Shiprocket order creation error: ${(shiprocketError instanceof Error ? shiprocketError.message : String(shiprocketError)) || 'Unknown error'}`,
              })
            }
          }
        }

        break
      }

      case 'add_note': {
        // Create a fresh array to avoid Mongoose casting issues with legacy data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentNotes: any[] = []

        if (Array.isArray(order.notes)) {
          // Filter existing notes to remove any non-object values (legacy strings)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentNotes = order.notes.filter((n: any) => n && typeof n === 'object' && !Array.isArray(n))
        }

        currentNotes.push({
          content: data.content,
          author: data.author || 'Admin',
          isInternal: data.isInternal !== false,
          createdAt: new Date(),
        })

        order.notes = currentNotes

        // Ensure timeline is always an array of objects
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'note',
          title: 'Note Added',
          description: data.content,
          user: data.author || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'add_tag': {
        order.tags = order.tags || []
        if (!order.tags.includes(data.tag)) {
          order.tags.push(data.tag)
        }
        break
      }

      case 'remove_tag': {
        order.tags = (order.tags || []).filter((t: string) => t !== data.tag)
        break
      }

      case 'assign': {
        const previousAssignee = order.assignedTo
        order.assignedTo = data.assignedTo
        // Ensure timeline is always an array of objects
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'status',
          title: 'Order Reassigned',
          description: `Order reassigned from ${previousAssignee || 'Unassigned'} to ${data.assignedTo}`,
          user: data.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'cancel': {
        if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
          return { success: false, error: 'Cannot cancel order in current status' }
        }
        order.status = 'cancelled'
        // Ensure timeline is always an array of objects
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'status',
          title: 'Order Cancelled',
          description: data.reason || 'Order was cancelled',
          user: data.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'update_shipping_address': {
        order.shippingAddress = {
          ...order.shippingAddress,
          ...data.shippingAddress,
        }
        // Ensure timeline is always an array of objects
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'status',
          title: 'Shipping Address Updated',
          description: 'Shipping address was modified',
          user: data.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }
    }

    await order.save()

    const updatedOrder = toPlain(order.toObject())

    return {
      success: true,
      order: {
        ...updatedOrder,
        id: order._id?.toString(),
      },
    }
  } catch (error: unknown) {
    console.error('Error updating order:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to update order',
    }
  }
}

// Create shipment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createShipmentAction(orderId: string, data: any) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.fulfillment?.shipmentId) {
      return { success: false, error: 'Order already has a shipment' }
    }

    const shipmentId = `SHP-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
    const trackingNumber =
      data.trackingNumber || `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const shipment = new Shipment({
      shipmentId,
      orderId: order.orderId,
      provider: data.provider || 'manual',
      awbNumber: trackingNumber,
      courierName: data.carrier || 'Manual Shipping',
      status: 'processing',
      statusHistory: [
        {
          status: 'processing',
          timestamp: new Date(),
          description: 'Shipment created',
        },
      ],
      shippingMethod: data.shippingMethod || 'standard',
      shippingCost: data.shippingCost || order.shipping || 0,
      estimatedDeliveryDate: data.estimatedDeliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      isCod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod',
      codAmount:
        (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod'
          ? order.totalAmount
          : 0,
      items:
        order.items?.map((item: OrderItem & { sku?: string }) => ({
          productId: item.productId,
          productName: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
        })) || [],
      deliveryAddress: {
        name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
        phone: order.customer?.phone || '',
        email: order.customer?.email || '',
        address: order.shippingAddress?.address || order.shippingAddress?.address1 || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        pincode: order.shippingAddress?.zipcode || '',
        country: order.shippingAddress?.country || 'India',
      },
      trackingUrl: `${process.env.NEXT_PUBLIC_TRACKING_BASE_URL || 'https://shiprocket.co/tracking'}/${trackingNumber}`,
    })

    await shipment.save()

    order.fulfillment = {
      status: 'fulfilled',
      shipmentId: shipment.shipmentId,
      carrier: shipment.courierName,
      trackingNumber: shipment.awbNumber,
      trackingUrl: shipment.trackingUrl,
      shippedAt: new Date(),
      estimatedDelivery: shipment.estimatedDeliveryDate,
    }
    order.status = 'shipped'
    // Ensure timeline is always an array of objects
    ensureTimelineArray(order)
    order.timeline.push({
      eventType: 'shipping',
      title: 'Shipment Created',
      description: `Shipment ${shipmentId} created with ${shipment.courierName}. Tracking: ${trackingNumber}`,
      user: data.user || 'Admin',
      timestamp: new Date(),
    })
    // Also update statusLogs for user-facing timeline
    if (!order.statusLogs) {
      order.statusLogs = []
    }
    order.statusLogs.push({
      status: 'shipped',
      timestamp: new Date(),
      message: `Order has been shipped via ${shipment.courierName}. Tracking: ${trackingNumber}`,
    })

    await order.save()

    const shipmentData = toPlain(shipment.toObject())

    return {
      success: true,
      shipment: {
        ...shipmentData,
        id: shipment._id?.toString(),
      },
    }
  } catch (error: unknown) {
    console.error('Error creating shipment:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to create shipment',
    }
  }
}

// Process refund
export async function processRefundAction(orderId: string, amount: number, reason: string) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.paymentDetails?.paymentStatus !== 'paid') {
      return { success: false, error: 'Order has not been paid' }
    }

    const refundAmount = amount || order.totalAmount
    const refundId = `REF-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`

    order.paymentDetails = {
      ...order.paymentDetails,
      paymentStatus: 'refunded',
      refundId,
      refundedAt: new Date(),
      refundAmount,
    }
    order.status = 'refunded'
    // Ensure timeline is always an array of objects
    ensureTimelineArray(order)
    order.timeline.push({
      eventType: 'refund',
      title: 'Refund Processed',
      description: `Refund of ₹${refundAmount.toLocaleString()} processed. Reason: ${reason || 'Not specified'}`,
      user: 'Admin',
      timestamp: new Date(),
    })

    await order.save()

    // Send refund email
    try {
      await sendRefundInitiatedEmail(order.toObject(), refundAmount)
    } catch (emailError) {
      console.error('Failed to send refund email:', emailError)
    }

    return {
      success: true,
      refund: {
        refundId,
        amount: refundAmount,
        status: 'processed',
      },
    }
  } catch (error: unknown) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to process refund',
    }
  }
}

// Generate invoice
export async function generateInvoiceAction(orderId: string) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const invoiceNumber = order.invoiceNumber || `INV-${new Date().getFullYear()}-${order.orderId.split('-').pop()}`

    order.invoiceNumber = invoiceNumber
    order.invoiceGeneratedAt = new Date()
    // Ensure timeline is always an array of objects
    ensureTimelineArray(order)
    order.timeline.push({
      eventType: 'status',
      title: 'Invoice Generated',
      description: `Invoice ${invoiceNumber} generated`,
      user: 'Admin',
      timestamp: new Date(),
    })

    await order.save()

    if (!process.env.COMPANY_GSTIN)
      console.warn('COMPANY_GSTIN env var is not set; GSTIN will be omitted from invoices')
    const placeOfSupplyState = order.deliveryAddress?.state || order.shippingAddress?.state || ''
    const gst = order.gstDetails || {}
    const gstRateVal = gst.gstRate || 5
    const totalGst = (gst.cgst || 0) + (gst.sgst || 0) + (gst.igst || 0) || order.taxes || 0
    const taxableValueVal = gst.taxableValue ?? Math.round(((order.subtotal || 0) / (1 + gstRateVal / 100)) * 100) / 100
    return {
      success: true,
      invoice: {
        documentTitle: 'Tax Invoice',
        invoiceNumber,
        orderId: order.orderId,
        date: new Date().toISOString(),
        company: {
          name: process.env.COMPANY_NAME || 'CupCake Desires',
          address: process.env.COMPANY_ADDRESS || '',
          city: process.env.COMPANY_CITY || '',
          state: process.env.COMPANY_STATE || '',
          pincode: process.env.COMPANY_PINCODE || '',
          gstin: process.env.COMPANY_GSTIN || '',
          phone: process.env.COMPANY_PHONE || '',
          email: process.env.COMPANY_EMAIL || '',
        },
        companyStateCode: getStateCode(process.env.COMPANY_STATE, process.env.COMPANY_GSTIN),
        placeOfSupply: placeOfSupplyState,
        placeOfSupplyCode: getStateCode(placeOfSupplyState),
        recipientGstin: order.recipientGstin || '',
        customer: {
          name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
          email: order.customer?.email || '',
          phone: order.customer?.phone || '',
          address: order.billingAddress || order.shippingAddress,
        },
        items:
          order.items?.map((item: OrderItem & { sku?: string; hsn?: string; gstRate?: number }) => ({
            name: item.name,
            sku: item.sku || '',
            hsn: item.hsn || '',
            gstRate: item.gstRate || 5,
            quantity: item.quantity,
            price: item.price ?? 0,
            total: (item.price ?? 0) * (item.quantity ?? 0),
            variants: item.variants || [],
          })) || [],
        subtotal: order.subtotal ?? order.totalAmount + (order.discount || 0) - (order.shipping || 0),
        discount: order.discount || 0,
        shipping: order.shipping || 0,
        gstDetails: {
          gstRate: gstRateVal,
          taxableValue: taxableValueVal,
          cgstAmount: gst.cgst || 0,
          sgstAmount: gst.sgst || 0,
          igstAmount: gst.igst || 0,
          isIntraState: !!gst.isIntraState,
          totalGst,
        },
        total: order.totalAmount,
        totalAmountInWords: amountInWords(order.totalAmount || 0),
        reverseCharge: 'No',
        signatureNote: 'This is a computer-generated invoice and does not require a signature.',
        payment: {
          method: order.paymentMethod,
          status: order.paymentDetails?.paymentStatus || 'pending',
          transactionId: order.paymentDetails?.transactionId,
        },
      },
    }
  } catch (error: unknown) {
    console.error('Error generating invoice:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to generate invoice',
    }
  }
}

// Send email
export async function sendOrderEmailAction(
  orderId: string,
  emailType: string,
  customData?: { subject: string; message: string } | string
) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })
    if (!order) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId)
      if (isObjectId) {
        order = await Order.findById(orderId)
      }
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const customerEmail = order.user?.email
    if (!customerEmail) {
      return { success: false, error: 'Customer email not available' }
    }

    const customerName =
      `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || order.user?.name || 'Valued Customer'

    const paymentUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cupcakedesires.com'}/checkout/payment/${order.orderId}`

    let subject = ''
    let htmlContent = ''
    switch (emailType) {
      case 'payment_pending':
        subject = `Payment Pending - Order ${order.orderId} | CupCake Desires`
        htmlContent = createEmailTemplate(
          'Payment Pending',
          customerName,
          `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">We noticed that the payment for your order <strong>${order.orderId}</strong> placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} is still pending.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Product</th>
<th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="50">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="90">Price</th>
</tr>
${(order.items as OrderItem[])
  .map(
    (item) => `
<tr>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${item.name}${
      item.variants && item.variants.length > 0
        ? `<br><span style="font-size:11px;color:#6b7280;">${item.variants
            .filter((v) => v.name === 'Option 1')
            .map((v) => v.option)
            .join('')}</span>`
        : ''
    }</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString('en-IN')}</td>
</tr>`
  )
  .join('')}
<tr style="background-color:#f9fafb;">
<td colspan="2" style="padding:12px;font-size:14px;color:#111827;font-weight:700;text-align:right;">Total</td>
<td style="padding:12px;font-size:14px;color:#2e1f15;font-weight:700;text-align:right;">&#8377;${order.totalAmount.toLocaleString('en-IN')}</td>
</tr>
</table>

<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">Please complete your payment at your earliest convenience so we can process and ship your order.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
<tr><td align="center" style="border-radius:4px;background-color:#2e1f15;">
<a href="${paymentUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Complete Payment</a>
</td></tr>
</table>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have already paid, please disregard this email. If you faced any issues during payment or decided not to proceed, we would love to hear from you so we can help.</p>`,
          order.orderId
        )
        break

      case 'shipping_update':
        subject = `Your Order Has Been Shipped | ${order.orderId} | CupCake Desires`
        htmlContent = createEmailTemplate(
          'Your Order Has Been Shipped',
          customerName,
          `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">Great news! Your order <strong>${order.orderId}</strong> has been shipped and is on its way to you.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<td style="padding:10px 16px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="50%">Detail</td>
<td style="padding:10px 16px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="50%">Info</td>
</tr>
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Order ID</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;">${order.orderId}</td>
</tr>
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Shipped Date</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:13px;color:#6b7280;">Estimated Delivery</td>
<td style="padding:10px 16px;font-size:13px;color:#111827;font-weight:600;">3-5 Business Days</td>
</tr>
</table>

<p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;">Items Shipped</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Product</th>
<th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="50">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="90">Price</th>
</tr>
${(order.items as OrderItem[])
  .map(
    (item) => `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${item.name}${
      item.variants && item.variants.length > 0
        ? `<br><span style="font-size:11px;color:#6b7280;">${item.variants
            .filter((v) => v.name === 'Option 1')
            .map((v) => v.option)
            .join('')}</span>`
        : ''
    }</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString('en-IN')}</td>
</tr>`
  )
  .join('')}
<tr style="background-color:#f9fafb;">
<td colspan="2" style="padding:12px;font-size:14px;color:#111827;font-weight:700;text-align:right;">Total</td>
<td style="padding:12px;font-size:14px;color:#2e1f15;font-weight:700;text-align:right;">&#8377;${order.totalAmount.toLocaleString('en-IN')}</td>
</tr>
</table>

<p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;">Delivering To</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr><td style="padding:12px 16px;font-size:13px;color:#111827;line-height:1.8;">
<strong>${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}</strong><br>
${order.deliveryAddress?.address || ''}<br>
${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.zipcode || ''}<br>
Phone: ${order.deliveryAddress?.phone || 'N/A'}
</td></tr>
</table>

<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">Your package is currently in transit. You will receive another notification once it arrives at your doorstep.</p>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have any questions about your shipment, please reply to this email.</p>`,
          order.orderId
        )
        break

      case 'delivery_confirmation':
        subject = `Order Delivered - ${order.orderId} | CupCake Desires`
        htmlContent = createEmailTemplate(
          'Order Delivered Successfully',
          customerName,
          `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">Your order <strong>${order.orderId}</strong> has been delivered successfully. We hope you love what you ordered!</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #059669;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f0fdf4;">
<td style="padding:14px 16px;text-align:center;">
<p style="margin:0 0 2px;font-size:12px;color:#065f46;font-weight:600;text-transform:uppercase;">Status</p>
<p style="margin:0;font-size:16px;color:#059669;font-weight:700;">DELIVERED</p>
<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
</td>
</tr>
</table>

<p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;">Order Summary</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Product</th>
<th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="50">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="90">Price</th>
</tr>
${(order.items as OrderItem[])
  .map(
    (item) => `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${item.name}${
      item.variants && item.variants.length > 0
        ? `<br><span style="font-size:11px;color:#6b7280;">${item.variants
            .filter((v) => v.name === 'Option 1')
            .map((v) => v.option)
            .join('')}</span>`
        : ''
    }</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString('en-IN')}</td>
</tr>`
  )
  .join('')}
<tr style="background-color:#f9fafb;">
<td colspan="2" style="padding:12px;font-size:14px;color:#111827;font-weight:700;text-align:right;">Total Paid</td>
<td style="padding:12px;font-size:14px;color:#2e1f15;font-weight:700;text-align:right;">&#8377;${order.totalAmount.toLocaleString('en-IN')}</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<td style="padding:12px 16px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;" colspan="2">How Was Your Experience?</td>
</tr>
<tr>
<td style="padding:16px;font-size:14px;color:#374151;line-height:1.7;" colspan="2">
Your feedback helps us serve you better. If you loved your products, consider sharing your experience. If something was not right, please let us know so we can make it right.
</td>
</tr>
</table>

<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">Thank you for choosing CupCake Desires. We are committed to helping you achieve your fitness goals with premium quality products.</p>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have any concerns about your order, please reply to this email and we will be happy to assist.</p>`,
          order.orderId
        )
        break

      case 'invoice':
        subject = `Invoice for Order ${order.orderId} | CupCake Desires`
        htmlContent = createEmailTemplate(
          'Tax Invoice',
          customerName,
          `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">Please find the invoice for your order below.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#2e1f15;">
<td style="padding:14px 16px;" colspan="2">
<p style="margin:0;font-size:16px;color:#ffffff;font-weight:700;">TAX INVOICE</p>
<p style="margin:4px 0 0;font-size:12px;color:#c7d2fe;">CupCake Desires Private Limited</p>
</td>
</tr>
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;" width="40%">Order ID</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;">${order.orderId}</td>
</tr>
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Order Date</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;">${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
</tr>
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Payment Method</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-transform:uppercase;">${order.paymentDetails?.paymentMethod || 'N/A'}</td>
</tr>
<tr>
<td style="padding:10px 16px;font-size:13px;color:#6b7280;">Payment Status</td>
<td style="padding:10px 16px;font-size:13px;font-weight:600;text-transform:uppercase;color:${order.paymentDetails?.paymentStatus === 'paid' || order.paymentDetails?.paymentStatus === 'completed' ? '#059669' : order.paymentDetails?.paymentStatus === 'pending' ? '#d97706' : '#dc2626'};">${order.paymentDetails?.paymentStatus || 'N/A'}</td>
</tr>
</table>

<p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;">Items</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Product</th>
<th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="40">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="80">Rate</th>
<th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;border-bottom:1px solid #e5e7eb;" width="90">Amount</th>
</tr>
${(order.items as OrderItem[])
  .map(
    (item) => `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${item.name}${
      item.variants && item.variants.length > 0
        ? `<br><span style="font-size:11px;color:#6b7280;">${item.variants
            .filter((v) => v.name === 'Option 1')
            .map((v) => v.option)
            .join('')}</span>`
        : ''
    }</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right;">&#8377;${(item.price ?? 0).toLocaleString('en-IN')}</td>
<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString('en-IN')}</td>
</tr>`
  )
  .join('')}
</table>

<p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;">Payment Breakdown</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Subtotal</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;" width="120">&#8377;${(order.subtotal || order.totalAmount).toLocaleString('en-IN')}</td>
</tr>
${
  order.discount > 0
    ? `<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Discount${order.couponCode ? ` (${order.couponCode})` : ''}</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#059669;font-weight:600;text-align:right;">-&#8377;${order.discount.toLocaleString('en-IN')}</td>
</tr>`
    : ''
}
<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Shipping</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${(order.shipping || 0).toLocaleString('en-IN')}</td>
</tr>
${
  order.taxes > 0
    ? `<tr>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">GST / Taxes</td>
<td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;">&#8377;${order.taxes.toLocaleString('en-IN')}</td>
</tr>`
    : ''
}
<tr style="background-color:#2e1f15;">
<td style="padding:14px 16px;font-size:14px;color:#ffffff;font-weight:700;">Total Amount</td>
<td style="padding:14px 16px;font-size:14px;color:#ffffff;font-weight:700;text-align:right;">&#8377;${order.totalAmount.toLocaleString('en-IN')}</td>
</tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
<tr>
<td style="padding:0 4px 0 0;" width="50%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<td style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Billing Address</td>
</tr>
<tr>
<td style="padding:12px;font-size:13px;color:#111827;line-height:1.7;">
<strong>${order.user?.firstName || ''} ${order.user?.lastName || ''}</strong><br>
${order.user?.addresses?.[0]?.address || ''}<br>
${order.user?.addresses?.[0]?.city || ''}, ${order.user?.addresses?.[0]?.state || ''} - ${order.user?.addresses?.[0]?.zipcode || ''}<br>
${order.user?.addresses?.[0]?.country || ''}<br>
<span style="color:#6b7280;">Phone: ${order.user?.addresses?.[0]?.phone || 'N/A'}</span><br>
<span style="color:#6b7280;">Email: ${order.user?.addresses?.[0]?.email || order.user?.email || 'N/A'}</span>
</td>
</tr>
</table>
</td>
<td style="padding:0 0 0 4px;" width="50%" valign="top">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<td style="padding:10px 12px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Delivery Address</td>
</tr>
<tr>
<td style="padding:12px;font-size:13px;color:#111827;line-height:1.7;">
<strong>${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}</strong><br>
${order.deliveryAddress?.address || ''}${order.deliveryAddress?.address1 ? `<br>${order.deliveryAddress.address1}` : ''}<br>
${order.deliveryAddress?.city || ''}, ${order.deliveryAddress?.state || ''} - ${order.deliveryAddress?.zipcode || ''}<br>
${order.deliveryAddress?.country || ''}<br>
<span style="color:#6b7280;">Phone: ${order.deliveryAddress?.phone || 'N/A'}</span><br>
<span style="color:#6b7280;">Email: ${order.deliveryAddress?.email || 'N/A'}</span>
</td>
</tr>
</table>
</td>
</tr>
</table>

<p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;">If you have any questions about this invoice, please reply to this email.</p>
<p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">This is a computer-generated invoice and does not require a signature.</p>`,
          order.orderId
        )
        break

      case 'custom':
        if (typeof customData === 'object' && customData !== null) {
          subject = customData.subject || `Important Update - Order ${order.orderId}`
          htmlContent = createEmailTemplate(
            customData.subject || 'Important Update',
            customerName,
            `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">We have an important message regarding your order.</p>

<div style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">${(customData.message || '').replace(/\n/g, '<br>')}</div>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have any questions, please reply to this email.</p>`,
            order.orderId
          )
        } else if (typeof customData === 'string') {
          subject = `Important Update - Order ${order.orderId}`
          htmlContent = createEmailTemplate(
            'Important Update',
            customerName,
            `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">We have an important message regarding your order.</p>

<div style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px;">${customData.replace(/\n/g, '<br>')}</div>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have any questions, please reply to this email.</p>`,
            order.orderId
          )
        } else {
          return { success: false, error: 'Custom message data is missing or invalid.' }
        }
        break

      default:
        return { success: false, error: 'Invalid email type' }
    }

    await transporter.sendMail({
      from: `"CupCake Desires" <${process.env.SMTP_FROM_EMAIL}>`,
      to: customerEmail,
      subject,
      html: htmlContent,
    })

    // Ensure timeline is always an array of objects
    ensureTimelineArray(order)
    order.timeline.push({
      eventType: 'email',
      title: 'Email Sent',
      description: `${emailType.replace('_', ' ')} email sent to ${customerEmail}`,
      user: 'Admin',
      timestamp: new Date(),
    })

    await order.save()

    return {
      success: true,
      message: `Email sent to ${customerEmail}`,
    }
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    return { success: false, error: (error instanceof Error ? error.message : String(error)) || 'Failed to send email' }
  }
}

// Get payment method statistics
export async function getPaymentMethodStats() {
  try {
    await connectDb()

    // Only get prepaid orders with paid status from ALL orders in DB
    const stats = await Order.aggregate([
      {
        $match: {
          'paymentDetails.paymentStatus': 'paid',
          'paymentDetails.paymentMethod': 'prepaid',
        },
      },
      {
        $group: {
          _id: '$paymentDetails.paymentMethod',
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    return { success: true, stats }
  } catch (error: unknown) {
    console.error('Error fetching payment stats:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Get filtered sales analytics (Paid orders only)
export async function getFilteredSalesAnalytics(period: string, customStart?: string, customEnd?: string) {
  try {
    await connectDb()

    const now = new Date()
    let startDate = startOfDay(subDays(now, 7)) // Default to 7 days
    let endDate = endOfDay(now)

    switch (period) {
      case 'today':
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1))
        endDate = endOfDay(subDays(now, 1))
        break
      case 'last7days':
        startDate = startOfDay(subDays(now, 7))
        endDate = endOfDay(now)
        break
      case 'last30days':
        startDate = startOfDay(subDays(now, 30))
        endDate = endOfDay(now)
        break
      case 'thisMonth':
        startDate = startOfMonth(now)
        endDate = endOfDay(now)
        break
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1))
        endDate = endOfDay(subDays(startOfMonth(now), 1))
        break
      case 'thisYear':
        startDate = startOfYear(now)
        endDate = endOfDay(now)
        break
      case 'custom':
        if (customStart && customEnd) {
          startDate = startOfDay(new Date(customStart))
          endDate = endOfDay(new Date(customEnd))
        }
        break
    }

    // Get all orders (for order count) - not filtered by payment status
    const allOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get paid orders only (for revenue) - exclude refund/return/cancelled statuses
    const paidOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          'paymentDetails.paymentStatus': 'paid',
          status: { $nin: ['cancelled', 'refund_initiated', 'refunded', 'return_initiated', 'return_completed'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const revenueOverTime = days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const paidData = paidOrdersData.find((d) => d._id === dateStr)
      const allData = allOrdersData.find((d) => d._id === dateStr)
      return {
        date: day.toISOString(),
        revenue: paidData ? paidData.revenue : 0,
        orders: allData ? allData.orders : 0,
      }
    })

    const totalRevenue = revenueOverTime.reduce((acc, curr) => acc + curr.revenue, 0)
    const totalOrders = revenueOverTime.reduce((acc, curr) => acc + curr.orders, 0)

    return {
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        revenueOverTime,
      },
    }
  } catch (error: unknown) {
    console.error('Error fetching filtered sales analytics:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Mark order as confirmed and create Shiprocket order
export async function markAsConfirmedAction(orderId: string) {
  try {
    await connectDb()

    // Find order by orderId
    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Check if order can be confirmed
    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot confirm order with status: ${order.status}` }
    }

    // Check if order is already confirmed
    if (order.status === 'confirmed') {
      return { success: false, error: 'Order is already confirmed' }
    }

    // Check if order has required data for shipping
    if (!order.shippingAddress) {
      return { success: false, error: 'Order missing shipping address' }
    }

    if (!order.items || order.items.length === 0) {
      return { success: false, error: 'Order has no items' }
    }

    // Update order status to confirmed first
    order.status = 'confirmed'

    if (!order.statusLogs) {
      order.statusLogs = []
    }

    order.statusLogs.push({
      status: 'confirmed',
      timestamp: new Date(),
      message: 'Order confirmed by admin',
    })

    await order.save()

    // Create Shiprocket order directly (no HTTP call needed)
    const shiprocketResult = await createShiprocketOrderForOrder(order.orderId)

    if (!shiprocketResult.success) {
      console.error('Shiprocket order creation failed:', shiprocketResult)
      // Revert status if Shiprocket order creation failed
      order.status = 'order_created'
      await order.save()

      return {
        success: false,
        error: shiprocketResult.message || 'Failed to create Shiprocket order',
        details: shiprocketResult.details,
      }
    }

    // Add status log for Shiprocket order creation
    order.statusLogs.push({
      status: 'confirmed',
      timestamp: new Date(),
      message: 'Shiprocket order created successfully',
    })

    await order.save()

    // Send confirmation email
    try {
      await sendOrderConfirmedEmail(order.toObject())
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return {
      success: true,
      message: 'Order confirmed and Shiprocket order created successfully',
      data: shiprocketResult.data,
    }
  } catch (error: unknown) {
    console.error('Error marking order as confirmed:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to mark order as confirmed',
    }
  }
}

// Mark order as shipped and create Shiprocket order
export async function markAsShippedAction(orderId: string) {
  try {
    await connectDb()

    // Find order by orderId
    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Check if order is already shipped
    if (order.status === 'shipped') {
      return { success: false, error: 'Order is already shipped' }
    }

    // Check if order has required data for shipping
    if (!order.shippingAddress) {
      return { success: false, error: 'Order missing shipping address' }
    }

    if (!order.items || order.items.length === 0) {
      return { success: false, error: 'Order has no items' }
    }

    // Call the API to create Shiprocket order
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || ''
    const apiUrl = baseUrl ? `${baseUrl}/api/orders/create-shiprocket-order` : '/api/orders/create-shiprocket-order'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order.orderId,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: result.message || 'Failed to create Shiprocket order',
      }
    }

    // Update order status to shipped
    order.status = 'shipped'

    if (!order.statusLogs) {
      order.statusLogs = []
    }

    order.statusLogs.push({
      status: 'shipped',
      timestamp: new Date(),
      message: 'Order marked as shipped and Shiprocket order created',
    })

    await order.save()

    // Send shipment email
    // Note: Shiprocket response might need to be parsed to get actual tracking info
    // For now we assume some defaults or need to fetch shipment details
    // Ideally we should use shipment details returned by create-shiprocket-order
    try {
      // Fetch fresh order with shipment details
      const updatedOrder = await Order.findOne({ orderId }).lean()
      // find shipment if needed, or just send generic shipped email
      // Maybe skipping this one for now to avoid sending incomplete info
      // Or we can rely on Shiprocket webhook to send "Shipped" email later
    } catch (emailError) {
      console.error('Failed to send shipment email:', emailError)
    }

    return {
      success: true,
      message: 'Order marked as shipped and Shiprocket order created successfully',
      data: result.data,
    }
  } catch (error: unknown) {
    console.error('Error marking order as shipped:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to mark order as shipped',
    }
  }
}

// Cancel order and remove from Shiprocket
export async function cancelOrderAction(orderId: string) {
  try {
    await connectDb()

    // Find order by orderId
    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return { success: false, error: 'Order is already cancelled' }
    }

    if (order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot cancel order with status: ${order.status}` }
    }

    // Find Shiprocket shipment if exists
    const shipment = await Shipment.findOne({
      orderId: order.orderId,
      provider: 'shiprocket',
    })

    // Cancel in Shiprocket if shipment exists
    if (shipment && shipment.providerOrderId) {
      try {
        const token = await getShiprocketToken()
        if (token) {
          const apiUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'
          const cancelResponse = await fetch(`${apiUrl}/orders/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ids: [shipment.providerOrderId],
            }),
          })

          if (!cancelResponse.ok) {
            const errorData = await cancelResponse.json()
            console.error('Shiprocket cancel error:', errorData)
            // Continue with local cancellation even if Shiprocket fails
          }
        }
      } catch (shiprocketError: unknown) {
        console.error('Error cancelling Shiprocket order:', shiprocketError)
        // Continue with local cancellation even if Shiprocket fails
      }
    }

    // Check if payment needs refund
    const paymentStatus = order.paymentDetails?.paymentStatus
    const paymentMethod = (order.paymentDetails?.paymentMethod || order.paymentMethod || 'cod').toLowerCase()
    const needsRefund = paymentStatus === 'paid' && paymentMethod !== 'cod'

    // Create refund record if payment was made
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let refundRecord: any = null
    if (needsRefund) {
      // Check if refund already exists for this order
      const existingRefund = await Refund.findOne({ orderId: order.orderId })

      if (!existingRefund) {
        // Generate refund ID
        const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        // Get user info
        const isValidObjectId = order.userId && /^[0-9a-fA-F]{24}$/.test(order.userId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userQuery: Record<string, any> = isValidObjectId
          ? { $or: [{ clerkId: order.userId }, { _id: order.userId }] }
          : { clerkId: order.userId }
        const user = await User.findOne(userQuery)

        const addressData = order.deliveryAddress || order.shippingAddress

        // Create refund record
        refundRecord = await Refund.create({
          refundId,
          orderId: order.orderId,
          orderMongoId: order._id,
          userId: order.userId,
          userEmail: addressData?.email || user?.billing_email || user?.email || '',
          userName:
            `${addressData?.firstName || ''} ${addressData?.lastName || ''}`.trim() ||
            user?.billing_fullname ||
            'Customer',
          userPhone: addressData?.phone || user?.billing_phone || '',
          paymentGateway: 'Stripe',
          transactionId: order.paymentDetails?.transactionId || '',
          stripePaymentIntentId: order.paymentDetails?.transactionId || '',
          refundAmount: order.totalAmount,
          orderAmount: order.totalAmount,
          refundType: 'full',
          status: 'refund_initiated',
          cancelledBy: 'admin',
          cancellationReason: 'Order cancelled by admin',
          cancellationDate: new Date(),
          orderSnapshot: {
            items:
              order.items?.map((item: OrderItem) => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })) || [],
            shippingAddress: order.shippingAddress || order.deliveryAddress,
            paymentMethod: paymentMethod, // Use normalized lowercase paymentMethod
            status: order.status,
          },
          estimatedRefundDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          statusHistory: [
            {
              status: 'refund_initiated',
              timestamp: new Date(),
              note: 'Refund initiated due to order cancellation',
              updatedBy: 'admin',
            },
          ],
        })
      } else {
        refundRecord = existingRefund
      }
    }

    // Normalize paymentMethod to lowercase before saving
    if (order.paymentDetails?.paymentMethod) {
      const normalizedPaymentMethod = order.paymentDetails.paymentMethod.toLowerCase()
      if (normalizedPaymentMethod !== 'cod') {
        order.paymentDetails.paymentMethod = 'prepaid'
      } else {
        order.paymentDetails.paymentMethod = 'cod'
      }
    }

    // Update order status
    if (needsRefund) {
      order.status = 'refund_initiated' // Change to refund_initiated instead of cancelled
    } else {
      order.status = 'cancelled'
    }

    if (!order.statusLogs) {
      order.statusLogs = []
    }

    order.statusLogs.push({
      status: order.status,
      timestamp: new Date(),
      message: needsRefund
        ? 'Order cancelled - Refund initiated. Admin needs to approve refund.'
        : shipment
          ? 'Order cancelled and removed from Shiprocket'
          : 'Order cancelled',
    })

    await order.save()

    // Update shipment status if exists
    if (shipment) {
      shipment.status = 'cancelled'
      if (!shipment.statusHistory) {
        shipment.statusHistory = []
      }
      shipment.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        description: 'Order cancelled by admin',
      })
      await shipment.save()
    }

    // Get user info for email
    // Check if userId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = order.userId && /^[0-9a-fA-F]{24}$/.test(order.userId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userQuery: Record<string, any> = isValidObjectId
      ? {
          $or: [{ clerkId: order.userId }, { _id: order.userId }],
        }
      : { clerkId: order.userId }

    const user = await User.findOne(userQuery)

    const addressData = order.deliveryAddress || order.shippingAddress
    const customerEmail = addressData?.email || user?.billing_email || user?.email || ''
    const customerName =
      addressData?.firstName && addressData?.lastName
        ? `${addressData.firstName} ${addressData.lastName}`.trim()
        : addressData?.firstName || user?.billing_fullname || 'Customer'

    // Send cancellation email
    try {
      await sendOrderCancelledEmail(order.toObject())
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
    }

    return {
      success: true,
      message: needsRefund
        ? 'Order cancelled and refund initiated successfully'
        : shipment
          ? 'Order cancelled and removed from Shiprocket successfully'
          : 'Order cancelled successfully',
      needsRefund,
      refundAmount: needsRefund ? order.totalAmount : 0,
    }
  } catch (error: unknown) {
    console.error('Error cancelling order:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to cancel order',
    }
  }
}

// Bulk sync AWB from Shiprocket
export async function syncAWBAction(limit: number = 100) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || ''
    const apiUrl = baseUrl ? `${baseUrl}/api/orders/sync-awb` : '/api/orders/sync-awb'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit }),
    })

    const result = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: result.message || 'Failed to sync AWB',
      }
    }

    return {
      success: true,
      message: result.message || 'AWB sync completed',
      synced: result.synced || 0,
      failed: result.failed || 0,
      errors: result.errors || [],
    }
  } catch (error: unknown) {
    console.error('Error syncing AWB:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to sync AWB',
    }
  }
}
