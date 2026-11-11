'use server'

import {
  sendInvoiceEmail,
  sendOperationsNewOrderEmail,
  sendOrderCancelledEmail,
  sendOrderConfirmedEmail,
  sendOrderDeliveredEmail,
  sendOrderPlacedEmail,
  sendOutForDeliveryEmail,
  sendRefundInitiatedEmail,
} from '@/lib/email-service'
import { getCurrentUser } from '@/lib/auth'
import { generateOrderCode, priceManualOrder, validateManualOrderInput } from '@/lib/manual-order'
import {
  isOfflineOrderSource,
  mergeOrderSourceFilter,
  normalizeOrderSource,
  offlinePaymentMethodLabel,
} from '@/lib/order-source'
import { sendEmail } from '@/lib/email/send'
import { buildInvoiceFromOrder } from '@/lib/invoice/build-invoice'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Refund from '@/models/Refund'
import User from '@/models/User'
import Product from '@/models/product.model'
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
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { normalizeShippingState, SHIPPING_STATE_ERROR } from '@/utils/deliveryArea'

const toPlain = <T>(value: T): T => JSON.parse(JSON.stringify(value))

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
  )
}
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
<p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.02em;">The Cupcake Desire</p>
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
<p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;">The Cupcake Desire</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">&copy; ${new Date().getFullYear()} The Cupcake Desire. All rights reserved.</p>
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
  source?: string
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

    const searchOr = params.search
      ? [
          { orderId: { $regex: params.search, $options: 'i' } },
          { 'customer.email': { $regex: params.search, $options: 'i' } },
          { 'customer.firstName': { $regex: params.search, $options: 'i' } },
          { 'customer.lastName': { $regex: params.search, $options: 'i' } },
          { 'customer.phone': { $regex: params.search, $options: 'i' } },
        ]
      : undefined
    if (searchOr) query.$or = searchOr
    mergeOrderSourceFilter(query, params.source)

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

    // Unfiltered total for the "All" tab badge: same date/search scope as the
    // list, but WITHOUT the status/payment-status filter.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allQuery: Record<string, any> = { ...dateQuery }
    if (searchOr) allQuery.$or = searchOr
    // Source chips count every channel in the date/search scope. The list total
    // below is the same scope narrowed to the selected channel.
    const sourceCountQuery: Record<string, any> = { ...allQuery }
    mergeOrderSourceFilter(allQuery, params.source)

    // Execute query with pagination
    const [orders, total, unfilteredTotal, statusCounts, paymentStats, sourceCountRows] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(limit).select('-timeline -notes').lean(),
      Order.countDocuments(query),
      Order.countDocuments(allQuery),
      Order.aggregate([
        ...(Object.keys(dateQuery).length > 0 ? [{ $match: dateQuery }] : []),
        {
          $facet: {
            // Group by order status (for in_kitchen / out_for_delivery / delivered / cancelled tabs)
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
                            ['cancelled', 'refunded'],
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
                            ['cancelled', 'refunded'],
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
            // "Awaiting payment" card: pending-payment orders that are not cancelled
            pendingOrderCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentDetails.paymentStatus', 'pending'] },
                      { $ne: ['$status', 'cancelled'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            pendingRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentDetails.paymentStatus', 'pending'] },
                      { $ne: ['$status', 'cancelled'] },
                    ],
                  },
                  '$totalAmount',
                  0,
                ],
              },
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$paymentDetails.paymentStatus', 'failed'] }, 1, 0] },
            },
          },
        },
      ]),
      Order.aggregate([
        ...(Object.keys(sourceCountQuery).length > 0 ? [{ $match: sourceCountQuery }] : []),
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $eq: ['$source', 'phone'] }, then: 'phone' },
                  { case: { $eq: ['$source', 'email'] }, then: 'email' },
                ],
                default: 'online',
              },
            },
            count: { $sum: 1 },
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

    // Format orders for response with all required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedOrders = (orders as any[]).map((order: any) => {
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
        status: order.status || 'pending_payment',
        source: normalizeOrderSource(order.source),
        paymentStatus,
        paymentMethod: order.paymentDetails?.paymentMethod || order.payment?.method || 'stripe',
        transactionId: order.paymentDetails?.transactionId || '',
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
      }
    })
    const safeOrders = toPlain(formattedOrders)

    // Format status counts: merge byStatus + byPayment so tabs (paid/pending live in paymentStatus,
    // in_kitchen / out_for_delivery / etc. live in status) all get a real count.
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
      pendingOrderCount: 0,
      pendingRevenue: 0,
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
      // Total across ALL statuses (date/search scope only) — for the "All" tab badge
      totalAll: unfilteredTotal,
      statusCounts: statusCountMap,
      sourceCounts: {
        online: sourceCountRows.find((row: { _id?: string }) => row._id === 'online')?.count || 0,
        phone: sourceCountRows.find((row: { _id?: string }) => row._id === 'phone')?.count || 0,
        email: sourceCountRows.find((row: { _id?: string }) => row._id === 'email')?.count || 0,
      },
      paidPaymentCount: stats.paidCount,
      pendingPaymentCount: stats.pendingCount,
      paymentStats: {
        totalPayments: stats.totalPayments,
        totalTransactions: stats.totalTransactions,
        totalOrders: stats.totalOrders,
        pendingOrderCount: stats.pendingOrderCount,
        pendingRevenue: stats.pendingRevenue,
        // Keep one decimal place — the UI renders this with .toFixed(1)
        successRate: stats.totalOrders > 0 ? Math.round((stats.paidCount / stats.totalOrders) * 100 * 10) / 10 : 0,
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

    // Find by human orderId first (same key the eye icon uses), then Mongo _id.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any = await Order.findOne({ orderId }).lean()
    if (!order && /^[0-9a-fA-F]{24}$/.test(orderId)) {
      order = await Order.findById(orderId).lean()
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
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

    // Format order with latest model structure
    const orderResponse = {
      ...order,
      _id: undefined,
      id: order._id?.toString(),
      // Use items from new model, fallback to products for backward compatibility
      items: order.items || order.products || [],
      // Use shippingAddress from new model, fallback to deliveryAddress
      shippingAddress: order.shippingAddress || order.deliveryAddress || {},
      source: normalizeOrderSource(order.source),
      paymentDetails: {
        ...(order.paymentDetails || order.payment || {}),
        paymentMethod: order.paymentDetails?.paymentMethod || order.payment?.method || 'stripe',
        paymentStatus: order.paymentDetails?.paymentStatus || order.payment?.status || 'pending',
      },
      status: order.status || 'pending_payment',
      customer: customerDetails || {
        firstName: order.customer?.firstName || order.deliveryAddress?.firstName || '',
        lastName: order.customer?.lastName || order.deliveryAddress?.lastName || '',
        name:
          [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ').trim() ||
          order.customer?.name ||
          [order.deliveryAddress?.firstName, order.deliveryAddress?.lastName].filter(Boolean).join(' ').trim() ||
          'Guest',
        email: order.customer?.email || order.deliveryAddress?.email || order.user?.email || '',
        phone: order.customer?.phone || order.deliveryAddress?.phone || order.user?.phoneNumber || '',
      },
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

// Move a paid order onto the bake board (self-delivery: there's no separate
// "confirmed" step — admin clicks this to accept the order into production).
export async function confirmOrderAction(orderId: string) {
  try {
    await connectDb()

    let order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot accept order with status: ${order.status}` }
    }

    order.status = 'in_kitchen'

    if (!order.statusLogs) {
      order.statusLogs = []
    }
    order.statusLogs.push({
      status: 'in_kitchen',
      timestamp: new Date(),
      message: 'Order accepted into the kitchen',
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

    void user

    const orderData = toPlain(order.toObject())

    // Send confirmation email
    try {
      await sendOrderConfirmedEmail(order.toObject())
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    return {
      success: true,
      message: 'Order moved to the kitchen',
      order: {
        ...orderData,
        id: order._id?.toString(),
      },
    }
  } catch (error: unknown) {
    console.error('Error accepting order:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to accept order',
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
        // Status labels for the new self-delivery lifecycle.
        const statusLabels: Record<string, string> = {
          pending_payment: 'Awaiting payment',
          paid: 'Payment confirmed — waiting on the kitchen',
          in_kitchen: 'In the kitchen — bake-to-order in progress',
          out_for_delivery: 'On the way',
          delivered: 'Delivered',
          cancelled: 'Order cancelled',
          refunded: 'Refund completed',
        }
        const statusMessage = statusLabels[data.status] || `Order status changed to ${data.status}`
        order.statusLogs.push({
          status: data.status,
          timestamp: new Date(),
          message: statusMessage,
        })

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
        const nextShipping = {
          ...order.shippingAddress,
          ...data.shippingAddress,
        }
        const normalizedState = normalizeShippingState(nextShipping.state)
        if (!normalizedState) {
          return { success: false, error: SHIPPING_STATE_ERROR }
        }
        nextShipping.state = normalizedState
        order.shippingAddress = nextShipping
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
      description: `Refund of $${refundAmount.toLocaleString()} processed. Reason: ${reason || 'Not specified'}`,
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

    const invoice = buildInvoiceFromOrder({
      ...order.toObject(),
      invoiceNumber,
      invoiceGeneratedAt: order.invoiceGeneratedAt || new Date(),
    })
    // Deep-clone to a plain object: the invoice contains Mongoose subdocuments
    // (shippingAddress, item variants) which a Server Action cannot serialize —
    // returning them raw is what threw "Failed to generate invoice".
    return { success: true, invoice: JSON.parse(JSON.stringify(invoice)) }
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

    const customerEmail =
      order.user?.email ||
      order.customer?.email ||
      order.deliveryAddress?.email ||
      order.userEmail ||
      ''
    if (!customerEmail) {
      return { success: false, error: 'Customer email not available' }
    }

    const customerName =
      `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
      order.user?.name ||
      order.customer?.name ||
      `${order.deliveryAddress?.firstName || ''} ${order.deliveryAddress?.lastName || ''}`.trim() ||
      'Valued Customer'

    const paymentUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cupcakedesires.com'}/checkout/payment/${order.orderId}`

    let subject = ''
    let htmlContent = ''
    switch (emailType) {
      case 'payment_pending':
        subject = `Payment Pending - Order ${order.orderId} | The Cupcake Desire`
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

      case 'out_for_delivery':
      case 'shipping_update': {
        // Delegate to the React Email template (AUD, Melbourne-localised) — keeps
        // the legacy 'shipping_update' key working for any caller still using it.
        const result = await sendOutForDeliveryEmail(order, {
          deliveryNote: order.deliveryNote,
        })
        if (!result.success) {
          return { success: false, error: result.error || 'Failed to send out-for-delivery email' }
        }
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'email',
          title: 'Email Sent',
          description: `Out-for-delivery email sent to ${customerEmail}`,
          user: 'Admin',
          timestamp: new Date(),
        })
        await order.save()
        return { success: true, message: `Email sent to ${customerEmail}` }
      }

      case 'delivery_confirmation':
        subject = `Order Delivered - ${order.orderId} | The Cupcake Desire`
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

<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">Thank you for choosing The Cupcake Desire. We are committed to helping you achieve your fitness goals with premium quality products.</p>

<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you have any concerns about your order, please reply to this email and we will be happy to assist.</p>`,
          order.orderId
        )
        break

      case 'invoice': {
        // PDF tax invoice via Resend — same path used after successful payment.
        const invoiceResult = await sendInvoiceEmail(order.toObject(), undefined, {
          // Fresh key so admin can re-send the same day.
          idempotencyKey: `admin-invoice-${order.orderId}-${Date.now()}`,
        })
        if (!invoiceResult.success) {
          return { success: false, error: invoiceResult.error || 'Failed to send invoice' }
        }
        ensureTimelineArray(order)
        order.timeline.push({
          eventType: 'communication',
          title: 'Invoice Email Sent',
          description: `Tax invoice PDF emailed to ${customerEmail}`,
          user: 'Admin',
          timestamp: new Date(),
        })
        await order.save()
        return { success: true, message: 'Invoice sent successfully' }
      }

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

    // Always send via Resend — SMTP/Nodemailer is retired (was failing as
    // ECONNREFUSED 127.0.0.1:587 when SMTP_HOST was unset in production).
    const sendResult = await sendEmail({
      to: customerEmail,
      subject,
      html: htmlContent,
      templateId: `admin-order-${emailType}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
      refId: order.orderId,
      refType: 'order',
      tags: [
        { name: 'category', value: 'admin-order' },
        { name: 'email_type', value: String(emailType).replace(/[^a-zA-Z0-9_-]/g, '-') },
      ],
    })

    if (!sendResult.success) {
      return {
        success: false,
        error: sendResult.error || 'Failed to send email',
      }
    }

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

    // Stripe is the only payment method now — count every paid order.
    const stats = await Order.aggregate([
      {
        $match: {
          'paymentDetails.paymentStatus': 'paid',
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

    // Get all orders (for order count) - not filtered by payment status,
    // excluding cancelled/refunded (same exclusions as the revenue series)
    const allOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Australia/Melbourne' } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get paid orders only (for revenue) - exclude cancelled/refunded
    const paidOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          'paymentDetails.paymentStatus': 'paid',
          status: { $nin: ['cancelled', 'refunded'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Australia/Melbourne' } },
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

// Accept a paid order into the kitchen (alias kept for legacy admin UI callers).
export async function markAsConfirmedAction(orderId: string) {
  return markAsInKitchenAction(orderId)
}

// Move a paid order onto the bake board.
export async function markAsInKitchenAction(orderId: string) {
  try {
    await connectDb()

    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot accept order with status: ${order.status}` }
    }

    if (order.status === 'in_kitchen') {
      return { success: false, error: 'Order is already in the kitchen' }
    }

    if (!order.shippingAddress && !order.deliveryAddress) {
      return { success: false, error: 'Order missing delivery address' }
    }

    if (!order.items || order.items.length === 0) {
      return { success: false, error: 'Order has no items' }
    }

    order.status = 'in_kitchen'

    if (!order.statusLogs) {
      order.statusLogs = []
    }

    order.statusLogs.push({
      status: 'in_kitchen',
      timestamp: new Date(),
      message: 'Order accepted into the kitchen',
    })

    await order.save()

    try {
      await sendOrderConfirmedEmail(order.toObject())
    } catch (emailError) {
      console.error('Failed to send kitchen-accepted email:', emailError)
    }

    return {
      success: true,
      message: 'Order moved to the kitchen',
    }
  } catch (error: unknown) {
    console.error('Error moving order to kitchen:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to move order to kitchen',
    }
  }
}

// Mark order as out for delivery — driver has just left the Narre Warren kitchen.
export async function markAsOutForDeliveryAction(
  orderId: string,
  opts?: { deliveryWindow?: string; deliveryNote?: string }
) {
  try {
    await connectDb()

    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot mark out for delivery from status: ${order.status}` }
    }

    if (order.status === 'out_for_delivery') {
      return { success: false, error: 'Order is already out for delivery' }
    }

    if (opts?.deliveryNote) {
      order.deliveryNote = opts.deliveryNote
    }

    order.status = 'out_for_delivery'

    if (!order.statusLogs) {
      order.statusLogs = []
    }
    order.statusLogs.push({
      status: 'out_for_delivery',
      timestamp: new Date(),
      message: opts?.deliveryWindow
        ? `Driver left the kitchen — ETA ${opts.deliveryWindow}`
        : 'Driver left the kitchen',
    })

    await order.save()

    try {
      await sendOutForDeliveryEmail(order.toObject(), {
        deliveryWindow: opts?.deliveryWindow,
        deliveryNote: opts?.deliveryNote,
      })
    } catch (emailError) {
      console.error('Failed to send out-for-delivery email:', emailError)
    }

    return { success: true, message: 'Order marked as out for delivery' }
  } catch (error: unknown) {
    console.error('Error marking order as out for delivery:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to mark order as out for delivery',
    }
  }
}

// Mark order as delivered.
export async function markAsDeliveredAction(orderId: string, note?: string) {
  try {
    await connectDb()

    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status === 'cancelled' || order.status === 'refunded') {
      return { success: false, error: `Cannot deliver order with status: ${order.status}` }
    }

    if (order.status === 'delivered') {
      return { success: false, error: 'Order is already delivered' }
    }

    order.status = 'delivered'

    if (!order.statusLogs) {
      order.statusLogs = []
    }
    order.statusLogs.push({
      status: 'delivered',
      timestamp: new Date(),
      message: note || 'Box delivered',
    })

    await order.save()

    // Let the customer know their box has landed (best-effort).
    try {
      await sendOrderDeliveredEmail(order.toObject())
    } catch (emailError) {
      console.error('Failed to send delivered email:', emailError)
    }

    return { success: true, message: 'Order marked as delivered' }
  } catch (error: unknown) {
    console.error('Error marking order as delivered:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to mark order as delivered',
    }
  }
}

// Cancel order (in-house delivery — no external courier to notify)
export async function cancelOrderAction(orderId: string) {
  try {
    await connectDb()

    const order = await Order.findOne({ orderId })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status === 'cancelled') {
      return { success: false, error: 'Order is already cancelled' }
    }

    if (order.status === 'delivered' || order.status === 'refunded') {
      return { success: false, error: `Cannot cancel order with status: ${order.status}` }
    }

    // Website card payments go through Stripe. Phone and email payments are cash,
    // bank transfer, or a card taken in the shop, so cancelling one does not open a Stripe refund.
    const paymentStatus = order.paymentDetails?.paymentStatus
    const offline = order.source === 'phone' || order.source === 'email'
    const needsRefund = paymentStatus === 'paid' && !offline

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
            paymentMethod: 'stripe',
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

    // Website orders are paid by card through Stripe. Phone and email orders keep the method recorded at the counter.
    if (order.paymentDetails && !offline) {
      order.paymentDetails.paymentMethod = 'stripe'
    }

    // Cancelling a paid order keeps the order in 'cancelled' state; the Refund
    // record drives its own refunded/initiated lifecycle and the Stripe webhook
    // will flip the order to 'refunded' once the refund settles.
    order.status = 'cancelled'

    if (!order.statusLogs) {
      order.statusLogs = []
    }

    order.statusLogs.push({
      status: order.status,
      timestamp: new Date(),
      message: needsRefund
        ? 'Order cancelled - Refund initiated. Admin needs to approve refund.'
        : offline && paymentStatus === 'paid'
          ? `Order cancelled. This was paid by ${order.paymentDetails?.paymentMethod || 'the recorded method'}. Refund the customer directly.`
          : 'Order cancelled',
    })

    await order.save()

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

// Kitchen queue: every order that the bakery still has to bake or deliver,
// grouped by deliveryDate. Orders without a deliveryDate fall into "Unscheduled".
export async function getKitchenQueueAction() {
  try {
    await connectDb()

    const horizonEnd = endOfDay(subDays(new Date(), -14)) // next two weeks

    // No lower bound on deliveryDate: overdue (past-dated) orders must stay in
    // the queue so they can be flagged as past due and dispatched/rescheduled.
    const orders = await Order.find({
      status: { $in: ['paid', 'in_kitchen', 'out_for_delivery'] },
      $or: [
        { deliveryDate: { $exists: false } },
        { deliveryDate: null },
        { deliveryDate: { $lte: horizonEnd } },
      ],
    })
      .sort({ deliveryDate: 1, createdAt: 1 })
      .select('orderId status source totalAmount deliveryDate deliverySlot deliveryNote notes items shippingAddress deliveryAddress user customer createdAt')
      .lean()

    return { success: true, orders: toPlain(orders) }
  } catch (error: unknown) {
    console.error('Error fetching kitchen queue:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to load kitchen queue',
    }
  }
}

// Bulk: mark several orders as delivered in one shot (used by the kitchen queue
// "End of day" sweep and by the orders list bulk-actions bar).
export async function bulkMarkDeliveredAction(orderIds: string[]) {
  try {
    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: 'No orders selected' }
    }
    await connectDb()

    let updated = 0
    for (const id of orderIds) {
      const order = await Order.findOne({ orderId: id })
      if (!order) continue
      if (['delivered', 'cancelled', 'refunded'].includes(order.status)) continue
      order.status = 'delivered'
      if (!order.statusLogs) order.statusLogs = []
      order.statusLogs.push({
        status: 'delivered',
        timestamp: new Date(),
        message: 'Bulk-marked as delivered from kitchen queue',
      })
      await order.save()
      updated++

      // Customer notification — best-effort, never blocks the sweep.
      try {
        await sendOrderDeliveredEmail(order.toObject())
      } catch (emailError) {
        console.error('Failed to send delivered email:', emailError)
      }
    }

    return { success: true, updated }
  } catch (error: unknown) {
    console.error('Error bulk-marking delivered:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to mark orders as delivered',
    }
  }
}

// Schedule (or reschedule) a delivery for an order.
export async function setDeliveryScheduleAction(
  orderId: string,
  payload: { deliveryDate?: string; deliverySlot?: string; deliveryNote?: string }
) {
  try {
    await connectDb()

    const order = await Order.findOne({ orderId })
    if (!order) return { success: false, error: 'Order not found' }

    if (payload.deliveryDate !== undefined) {
      order.deliveryDate = payload.deliveryDate ? new Date(payload.deliveryDate) : undefined
    }
    if (payload.deliverySlot !== undefined) {
      order.deliverySlot = payload.deliverySlot || undefined
    }
    if (payload.deliveryNote !== undefined) {
      order.deliveryNote = payload.deliveryNote || undefined
    }

    if (!order.statusLogs) order.statusLogs = []
    order.statusLogs.push({
      status: order.status,
      timestamp: new Date(),
      message: order.deliveryDate
        ? `Delivery scheduled for ${new Date(order.deliveryDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' })}${order.deliverySlot ? ` (${order.deliverySlot})` : ''}`
        : 'Delivery schedule cleared',
    })

    await order.save()
    return { success: true }
  } catch (error: unknown) {
    console.error('Error setting delivery schedule:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to update schedule',
    }
  }
}

function escapeProductSearch(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function requireStaff() {
  const admin = await getCurrentUser()
  if (!admin) return null
  return admin
}

/** Catalog search for the phone/email order form. Prices stay on the server when the order is saved. */
export async function searchSellableProductsAction(search: string) {
  try {
    if (!(await requireStaff())) return { success: false, error: 'Please sign in again.', products: [] }
    await connectDb()
    const q = String(search || '').trim()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isDeleted: { $ne: true }, published: true, status: 'active' }
    if (q) filter.title = { $regex: escapeProductSearch(q), $options: 'i' }
    const products = await Product.find(filter)
      .select('title handle variants images minOrderQty')
      .sort({ title: 1 })
      .limit(8)
      .lean()
    return {
      success: true,
      products: toPlain(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (products as any[]).map((product) => ({
          _id: String(product._id),
          title: product.title,
          minOrderQty: Math.max(1, Number(product.minOrderQty) || 1),
          image: product.images?.[0]?.src || product.variants?.[0]?.image || '',
          variants: (product.variants || []).map(
            (variant: {
              option1Value?: string
              option2Value?: string
              option3Value?: string
              price?: number
              image?: string
            }) => ({
              option1Value: variant.option1Value || '',
              option2Value: variant.option2Value || '',
              option3Value: variant.option3Value || '',
              price: Number(variant.price) || 0,
              image: variant.image || '',
            })
          ),
        })).filter((product: { variants: unknown[] }) => product.variants.length > 0)
      ),
    }
  } catch (error: unknown) {
    console.error('Product search failed:', error)
    return { success: false, error: 'Could not search products.', products: [] }
  }
}

async function sendOrderMails(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  kind: 'placed' | 'paid'
): Promise<string | undefined> {
  const plain = typeof order.toObject === 'function' ? order.toObject() : order
  const warnings: string[] = []
  const tasks: Array<[string, () => Promise<{ success: boolean; error?: string }>]> =
    kind === 'paid'
      ? [
          ['Order confirmation', () => sendOrderConfirmedEmail(plain)],
          [
            'Tax invoice',
            () =>
              sendInvoiceEmail(plain, undefined, {
                idempotencyKey: plain.orderId ? `order-invoice-${plain.orderId}` : undefined,
              }),
          ],
          ['Kitchen alert', () => sendOperationsNewOrderEmail(plain, 'confirmed')],
        ]
      : [
          ['Order email', () => sendOrderPlacedEmail(plain)],
          ['Kitchen alert', () => sendOperationsNewOrderEmail(plain, 'placed')],
        ]
  for (const [label, run] of tasks) {
    try {
      const result = await run()
      if (result && result.success === false) warnings.push(`${label} was not emailed${result.error ? `: ${result.error}` : ''}`)
    } catch (error) {
      console.error(`${label} failed:`, error)
      warnings.push(`${label} was not emailed`)
    }
  }
  return warnings.length ? warnings.join(' ') : undefined
}

/**
 * Record a phone or email order on the same Order collection as website checkout.
 * A paid order emails the confirmation and tax invoice immediately, the same path Stripe uses.
 */
export async function createManualOrderAction(raw: unknown) {
  try {
    const admin = await requireStaff()
    if (!admin) return { success: false, error: 'Please sign in again.' }

    const parsed = validateManualOrderInput(raw)
    if (!parsed.ok) return { success: false, error: parsed.message }
    const input = parsed.value
    const staffName = admin.name || admin.email

    await connectDb()

    const lines: Array<{
      productId: string
      name: string
      imageUrl: string
      quantity: number
      price: number
      variants: Array<{ name: string; option: string }>
    }> = []

    for (const item of input.items) {
      const product = await Product.findOne({
        _id: item.productId,
        isDeleted: { $ne: true },
        published: true,
        status: 'active',
      })
      if (!product) {
        return { success: false, error: 'One of the products is no longer available. Refresh and try again.' }
      }
      const minOrderQty = Math.max(1, Number(product.minOrderQty) || 1)
      if (item.quantity < minOrderQty) {
        return { success: false, error: `${product.title} has a minimum order of ${minOrderQty}.` }
      }
      const variants = product.variants || []
      if (variants.length === 0) {
        return { success: false, error: `${product.title} is not configured for sale.` }
      }
      let variant = item.option1Value
        ? variants.find(
            (entry: { option1Value?: string; option2Value?: string }) =>
              entry.option1Value === item.option1Value &&
              String(entry.option2Value || '') === String(item.option2Value || '')
          )
        : undefined
      if (!variant && variants.length === 1) variant = variants[0]
      if (!variant) {
        return { success: false, error: `Choose a size for ${product.title}.` }
      }
      lines.push({
        productId: String(product._id),
        name: product.title,
        imageUrl: variant.image || product.images?.[0]?.src || '',
        quantity: item.quantity,
        price: Number(variant.price) || 0,
        variants: [
          { name: variant.option2Value ? 'Size' : 'Option 1', option: variant.option1Value || '' },
          ...(variant.option2Value ? [{ name: 'Flavour', option: variant.option2Value }] : []),
          ...(variant.option3Value ? [{ name: 'Option 3', option: variant.option3Value }] : []),
        ].filter((entry) => entry.option),
      })
    }

    const priced = priceManualOrder(lines, input.address.postalCode)
    const supplierState = (process.env.COMPANY_STATE || '').trim().toLowerCase()
    const customerState = input.address.state.trim().toLowerCase()
    const isIntraState = Boolean(supplierState && customerState && supplierState === customerState)
    const halfTax = Math.round((priced.taxes / 2) * 100) / 100
    const payLabel = input.paymentCollected ? offlinePaymentMethodLabel(input.paymentMethod) || 'Cash' : 'Unpaid'
    const channel = input.source === 'phone' ? 'phone call' : 'email'

    const user = await User.findOne({
      $or: [{ email: input.customer.email }, { billing_email: input.customer.email }],
    })
    const userId = user?.clerkId || user?._id?.toString() || `manual_${Date.now().toString(36)}`

    let orderId = generateOrderCode()
    let retries = 0
    while ((await Order.findOne({ orderId })) && retries < 5) {
      orderId = generateOrderCode()
      retries += 1
    }

    const addressSnapshot = {
      type: 'home',
      firstName: input.customer.firstName,
      lastName: input.customer.lastName,
      phone: input.customer.phone,
      email: input.customer.email,
      address: input.address.street,
      city: input.address.city,
      state: input.address.state,
      country: 'Australia',
      zipcode: input.address.postalCode,
    }

    const notes = input.note
      ? [{ content: input.note, author: staffName, isInternal: false, createdAt: new Date() }]
      : []

    const order = new Order({
      orderId,
      source: input.source,
      userId: String(userId),
      user: {
        userId: user?._id || undefined,
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        email: input.customer.email,
        phoneNumber: input.customer.phone,
        addresses: [addressSnapshot],
      },
      customer: {
        firstName: input.customer.firstName,
        lastName: input.customer.lastName,
        email: input.customer.email,
        phone: input.customer.phone,
      },
      items: lines,
      subtotal: priced.subtotal,
      totalAmount: priced.totalAmount,
      discount: 0,
      shipping: priced.shipping,
      taxes: priced.taxes,
      gstDetails: {
        gstRate: priced.gstRate,
        taxableValue: priced.taxableValue,
        cgst: isIntraState ? halfTax : 0,
        sgst: isIntraState ? halfTax : 0,
        igst: isIntraState ? 0 : priced.taxes,
        isIntraState,
        placeOfSupply: input.address.state,
      },
      deliveryDate: new Date(`${input.deliveryDate}T12:00:00.000Z`),
      deliverySlot: input.deliverySlot,
      shippingAddress: {
        street: input.address.street,
        city: input.address.city,
        state: input.address.state,
        postalCode: input.address.postalCode,
        country: 'Australia',
      },
      deliveryAddress: addressSnapshot,
      billingAddress: addressSnapshot,
      notes,
      status: input.paymentCollected ? 'paid' : 'pending_payment',
      paymentDetails: {
        paymentMethod: payLabel,
        paymentStatus: input.paymentCollected ? 'paid' : 'pending',
        paidAt: input.paymentCollected ? new Date() : undefined,
        gateway: 'manual',
      },
      payment: {
        status: input.paymentCollected ? 'paid' : 'created',
        method: payLabel,
        amount: priced.totalAmount,
        currency: 'AUD',
      },
      statusLogs: [
        {
          status: input.paymentCollected ? 'paid' : 'pending_payment',
          timestamp: new Date(),
          message: input.paymentCollected
            ? `Payment recorded (${payLabel}) when this ${channel} order was taken`
            : `${channel[0].toUpperCase()}${channel.slice(1)} order recorded. Payment still to come.`,
        },
      ],
      timeline: [
        {
          eventType: 'created',
          title: input.source === 'phone' ? 'Phone order created' : 'Email order created',
          description: `Recorded by ${staffName}`,
          user: staffName,
          timestamp: new Date(),
        },
      ],
    })

    await order.save()

    if (user?._id) {
      await User.updateOne({ _id: user._id }, { $push: { orders: { _id: order._id } } })
    }

    const emailWarning = await sendOrderMails(order, input.paymentCollected ? 'paid' : 'placed')
    const saved = new URLSearchParams({
      saved: '1',
      pay: input.paymentCollected ? 'now' : 'later',
    })
    if (emailWarning) saved.set('mail', '0')
    // Redirect from the action so Next does not send the browser back to the form.
    redirect(`/admin/orders/${order.orderId}?${saved.toString()}`)
  } catch (error: unknown) {
    if (isNextRedirect(error)) throw error
    console.error('Error creating manual order:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to create order',
    }
  }
}

/**
 * Mark a phone or email order paid and send the same confirmation + tax invoice a Stripe payment sends.
 * Website orders stay on Stripe.
 */
export async function markOfflineOrderPaidAction(orderId: string, paymentMethod: string) {
  try {
    const admin = await requireStaff()
    if (!admin) return { success: false, error: 'Please sign in again.' }
    const payLabel = offlinePaymentMethodLabel(paymentMethod)
    if (!payLabel) return { success: false, error: 'Choose cash, bank transfer, or card.' }

    await connectDb()
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let existing: any = await Order.findOne({ orderId })
    if (!existing && isObjectId) existing = await Order.findById(orderId)
    if (!existing) return { success: false, error: 'Order not found' }

    if (!isOfflineOrderSource(existing.source) || !existing.source) {
      return { success: false, error: 'Website orders are paid through Stripe.' }
    }
    if (['cancelled', 'refunded'].includes(existing.status)) {
      return { success: false, error: 'This order can no longer be marked paid.' }
    }

    const nextStatus = ['pending_payment', 'pending', 'order_created'].includes(existing.status)
      ? 'paid'
      : existing.status
    const staffName = admin.name || admin.email

    const updated = await Order.findOneAndUpdate(
      { _id: existing._id, 'paymentDetails.paymentStatus': { $ne: 'paid' } },
      {
        $set: {
          status: nextStatus,
          'paymentDetails.paymentStatus': 'paid',
          'paymentDetails.paymentMethod': payLabel,
          'paymentDetails.paidAt': new Date(),
          'paymentDetails.gateway': 'manual',
          'payment.status': 'paid',
          'payment.method': payLabel,
          'payment.amount': existing.totalAmount,
        },
        $push: {
          statusLogs: {
            status: 'paid',
            timestamp: new Date(),
            message: `Payment recorded (${payLabel}) by ${staffName}`,
          },
          timeline: {
            eventType: 'payment',
            title: 'Marked paid',
            description: `${payLabel} recorded by ${staffName}. Confirmation and tax invoice emailed.`,
            user: staffName,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    )

    if (!updated) return { success: false, error: 'This order is already paid.' }

    const emailWarning = await sendOrderMails(updated, 'paid')
    return { success: true, emailWarning }
  } catch (error: unknown) {
    console.error('Error marking offline order paid:', error)
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)) || 'Failed to mark order paid',
    }
  }
}
