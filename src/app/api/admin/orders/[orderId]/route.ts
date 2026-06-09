import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { verifyAdminRequest } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/admin/orders/[orderId] - Get single order with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // Auth guard
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    await connectDb()

    // Find order by orderId or MongoDB _id
    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get customer details from User model if available
    let customerDetails = null
    if (order.userId && order.userId !== 'guest') {
      const user = await User.findOne({ clerkId: order.userId })
      if (user) {
        // Calculate total orders and spent for this customer
        let customerOrders: Array<{ count: number; total: number }> = []
        if (order.customer?.email) {
          customerOrders = await Order.aggregate([
            { $match: { 'customer.email': order.customer.email } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
          ])
        }

        customerDetails = {
          totalOrders: customerOrders[0]?.count || 1,
          totalSpent: customerOrders[0]?.total || order.totalAmount,
          walletPoints: user.wallet?.points || 0,
        }
      }
    }

    const orderObj = order.toObject ? order.toObject() : order

    // Format response
    const formattedOrder = {
      ...orderObj,
      _id: undefined,
      id: order._id?.toString(),
      customer: {
        ...orderObj.customer,
        ...customerDetails,
        name: `${orderObj.customer?.firstName || ''} ${orderObj.customer?.lastName || ''}`.trim() || 'Guest',
      },
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PATCH /api/admin/orders/[orderId] - Update order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // Auth guard
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    const { orderId } = await params
    const body = await request.json()
    await connectDb()

    // Find order
    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { action, ...updateData } = body

    // Handle specific actions
    switch (action) {
      case 'update_status': {
        const previousStatus = order.status
        order.status = updateData.status

        // Add timeline event - ensure timeline is always an array
        if (!Array.isArray(order.timeline)) {
          order.timeline = []
        }
        order.timeline.push({
          eventType: 'status',
          title: 'Status Updated',
          description: `Order status changed from ${previousStatus} to ${updateData.status}`,
          user: updateData.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'add_note': {
        order.notes = order.notes || []
        order.notes.push({
          content: updateData.content,
          author: updateData.author || 'Admin',
          isInternal: updateData.isInternal !== false,
        })

        // Add timeline event - ensure timeline is always an array
        if (!Array.isArray(order.timeline)) {
          order.timeline = []
        }
        order.timeline.push({
          eventType: 'note',
          title: 'Note Added',
          description: updateData.content,
          user: updateData.author || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'add_tag': {
        order.tags = order.tags || []
        if (!order.tags.includes(updateData.tag)) {
          order.tags.push(updateData.tag)
        }
        break
      }

      case 'remove_tag': {
        order.tags = (order.tags || []).filter((t: string) => t !== updateData.tag)
        break
      }

      case 'assign': {
        const previousAssignee = order.assignedTo
        order.assignedTo = updateData.assignedTo

        // Add timeline event - ensure timeline is always an array
        if (!Array.isArray(order.timeline)) {
          order.timeline = []
        }
        order.timeline.push({
          eventType: 'status',
          title: 'Order Reassigned',
          description: `Order reassigned from ${previousAssignee || 'Unassigned'} to ${updateData.assignedTo}`,
          user: updateData.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'cancel': {
        if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
          return NextResponse.json(
            { error: 'Cannot cancel order in current status' },
            { status: 400 }
          )
        }

        order.status = 'cancelled'

        // Add timeline event - ensure timeline is always an array
        if (!Array.isArray(order.timeline)) {
          order.timeline = []
        }
        order.timeline.push({
          eventType: 'status',
          title: 'Order Cancelled',
          description: updateData.reason || 'Order was cancelled',
          user: updateData.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      case 'update_shipping_address': {
        order.shippingAddress = {
          ...order.shippingAddress,
          ...updateData.shippingAddress,
        }

        // Add timeline event - ensure timeline is always an array
        if (!Array.isArray(order.timeline)) {
          order.timeline = []
        }
        order.timeline.push({
          eventType: 'status',
          title: 'Shipping Address Updated',
          description: 'Shipping address was modified',
          user: updateData.user || 'Admin',
          timestamp: new Date(),
        })
        break
      }

      default:
        // Generic update
        Object.assign(order, updateData)
    }

    await order.save()

    return NextResponse.json({
      success: true,
      order: {
        ...order.toObject(),
        _id: undefined,
        id: order._id?.toString(),
      },
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
