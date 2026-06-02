import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Refund from '@/models/Refund'
import User from '@/models/User'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDb()

    // Get current user
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId } = await context.params
    const { reason } = await request.json()

    // Find order
    const order = await Order.findOne({ orderId })
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify order belongs to user
    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to cancel this order' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled' || order.status === 'refund_initiated' || order.status === 'refunded') {
      return NextResponse.json(
        { success: false, message: 'Order is already cancelled or refunded' },
        { status: 400 }
      )
    }

    // Cannot cancel if shipped or delivered
    if (order.status === 'shipped' || order.status === 'delivered') {
      return NextResponse.json(
        { success: false, message: `Cannot cancel order that is ${order.status}` },
        { status: 400 }
      )
    }

    // Check if payment needs refund
    const paymentStatus = order.paymentDetails?.paymentStatus
    const paymentMethod = (order.paymentDetails?.paymentMethod || order.paymentMethod || 'cod').toLowerCase()
    const needsRefund = paymentStatus === 'paid' && paymentMethod !== 'cod'

    // Create refund record if payment was made
    let refundRecord: any = null
    if (needsRefund) {
      // Check for existing refund
      const existingRefund = await Refund.findOne({ orderId: order.orderId })
      
      if (existingRefund) {
        return NextResponse.json(
          { success: false, message: 'Refund request already exists for this order' },
          { status: 400 }
        )
      }

      // Generate refund ID
      const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // Get user info from DB
      const dbUser = await User.findOne({ clerkId: user.id })
      const addressData = order.deliveryAddress || order.shippingAddress
      
      // Prepare refund data
      const refundData = {
        refundId,
        orderId: order.orderId,
        orderMongoId: order._id,
        userId: user.id,
        userEmail: addressData?.email || dbUser?.billing_email || dbUser?.email || user.emailAddresses[0]?.emailAddress || 'no-email@example.com',
        userName: `${addressData?.firstName || ''} ${addressData?.lastName || ''}`.trim() || dbUser?.billing_fullname || user.fullName || 'Customer',
        userPhone: addressData?.phone || dbUser?.billing_phone || '',
        paymentGateway: 'Stripe',
        transactionId: order.paymentDetails?.transactionId || '',
        stripePaymentIntentId: order.paymentDetails?.transactionId || '',
        refundAmount: order.totalAmount,
        orderAmount: order.totalAmount,
        refundType: 'full' as const,
        status: 'refund_initiated' as const,
        cancelledBy: 'user' as const,
        cancellationReason: reason || 'Cancelled by user',
        cancellationDate: new Date(),
        orderSnapshot: {
          items: order.items?.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })) || [],
          shippingAddress: order.shippingAddress || order.deliveryAddress,
          paymentMethod: order.paymentDetails?.paymentMethod,
          status: order.status,
        },
        estimatedRefundDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        statusHistory: [{
          status: 'refund_initiated' as const,
          timestamp: new Date(),
          note: reason || 'Refund initiated due to user cancellation',
          updatedBy: user.id,
        }],
      }
      
      try {
        // Create refund record
        refundRecord = await Refund.create(refundData)
      } catch (refundError: any) {
        console.error('❌ Refund creation error:', refundError)
        console.error('❌ Validation errors:', refundError.errors)
        throw new Error(`Failed to create refund: ${refundError.message}`)
      }
    }

    // Update order status
    if (needsRefund) {
      order.status = 'refund_initiated'
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
        ? 'Order cancelled by user - Refund initiated. Pending admin approval.' 
        : 'Order cancelled by user',
    })

    await order.save()

    return NextResponse.json({
      success: true,
      message: needsRefund 
        ? 'Order cancelled successfully. Refund will be processed after admin approval within 3-7 business days.'
        : 'Order cancelled successfully.',
      refundId: refundRecord?.refundId,
      needsRefund,
    })
  } catch (error: any) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
