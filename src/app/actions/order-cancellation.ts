'use server'

import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Refund from '@/models/Refund'
import User from '@/models/User'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

/**
 * Cancel user order - Server Action with proper authentication
 * Handles both COD and paid orders with refund creation
 */
export async function cancelUserOrder(orderMongoId: string, reason: string) {
    try {
        // Get current user
        const user = await currentUser()
        if (!user) {
            console.error('❌ No user authenticated')
            return { success: false, error: 'Unauthorized - Please login' }
        }

        await connectDb()

        // Find order by MongoDB _id
        const order = await Order.findById(orderMongoId)
        if (!order) {
            console.error('❌ Order not found:', orderMongoId)
            return { success: false, error: 'Order not found' }
        }

        // Verify order belongs to user
        if (order.userId !== user.id) {
            console.error('❌ Order does not belong to user:', { orderUserId: order.userId, currentUserId: user.id })
            return { success: false, error: 'Unauthorized to cancel this order' }
        }

        // Check if order can be cancelled
        if (order.status === 'cancelled' || order.status === 'refund_initiated' || order.status === 'refunded') {
            console.error('❌ Order already cancelled/refunded:', order.status)
            return { success: false, error: 'Order is already cancelled or refunded' }
        }

        // Cannot cancel if shipped or delivered
        if (order.status === 'shipped' || order.status === 'delivered') {
            console.error('❌ Cannot cancel shipped/delivered order:', order.status)
            return { success: false, error: `Cannot cancel order that is ${order.status}` }
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
                return { success: false, error: 'Refund request already exists for this order' }
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
                return { success: false, error: `Failed to create refund: ${refundError.message}` }
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

        // Revalidate paths
        revalidatePath('/orders')
        revalidatePath(`/orders/${order._id}`)
        revalidatePath(`/orders/${order.orderId}`)

        const message = needsRefund 
            ? 'Order cancelled successfully. Refund will be processed after admin approval within 3-7 business days.'
            : 'Order cancelled successfully.'

        return {
            success: true,
            message,
            refundId: refundRecord?.refundId,
            needsRefund,
        }

    } catch (error: any) {
        console.error('❌ Error in cancelUserOrder:', error)
        return { success: false, error: error.message || 'Failed to cancel order. Please try again.' }
    }
}
