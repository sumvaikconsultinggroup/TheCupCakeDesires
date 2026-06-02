'use server'

import connectDb from '@/lib/mongodb'
import Refund from '@/models/Refund'
import Order from '@/models/Order'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import mongoose from 'mongoose'

// Type for lean() refund result
interface LeanRefund {
  _id?: unknown
  refundId: string
  orderId: string
  orderMongoId: string | mongoose.Types.ObjectId
  userId: string
  [key: string]: any
}

/**
 * Update refund status with proper timeline tracking
 */
export async function updateRefundStatusAction(
  refundId: string,
  newStatus: string,
  adminId: string,
  note?: string,
  metadata?: {
    rejectionCategory?: string
    refundReferenceNumber?: string
    refundMethod?: string
  }
) {
  try {
    await connectDb()

    const refund = await Refund.findOne({ refundId })
    if (!refund) {
      return { success: false, error: 'Refund not found' }
    }

    const validStatuses = [
      'refund_initiated',
      'pending_approval',
      'approved',
      'processing',
      'refunded',
      'failed',
      'rejected',
    ]

    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Invalid status' }
    }

    const previousStatus = refund.status

    // Handle special status transitions
    if (newStatus === 'processing') {
      // When marking as processing, ensure approved is in timeline if not already
      const hasApproved = refund.statusHistory.some((h: any) => h.status === 'approved')
      if (!hasApproved) {
        refund.statusHistory.push({
          status: 'approved',
          timestamp: new Date(),
          note: 'Auto-approved when processing started',
          updatedBy: adminId,
        })
        refund.approvedBy = adminId
        refund.approvedAt = new Date()
      }
      refund.refundInitiatedAt = new Date()
    }

    if (newStatus === 'refunded') {
      refund.refundCompletedAt = new Date()
      if (metadata?.refundReferenceNumber) {
        refund.refundReferenceNumber = metadata.refundReferenceNumber
      }
      if (metadata?.refundMethod) {
        refund.refundMethod = metadata.refundMethod
      }
    }

    if (newStatus === 'rejected') {
      refund.rejectedBy = adminId
      refund.rejectedAt = new Date()
      refund.rejectionReason = note || 'Rejected by admin'
      if (metadata?.rejectionCategory) {
        refund.rejectionCategory = metadata.rejectionCategory
      }
    }

    if (newStatus === 'approved') {
      refund.approvedBy = adminId
      refund.approvedAt = new Date()
      // Calculate estimated refund date (7 business days)
      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + 7)
      refund.estimatedRefundDate = estimatedDate
    }

    // Update status
    refund.status = newStatus

    // Add to status history
    refund.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status changed from ${previousStatus} to ${newStatus}`,
      updatedBy: adminId,
    })

    await refund.save()

    // Update order status
    const orderStatusMap: Record<string, string> = {
      approved: 'refund_approved',
      processing: 'refund_processing',
      refunded: 'refunded',
      rejected: 'refund_rejected',
      failed: 'refund_failed',
    }

    if (orderStatusMap[newStatus]) {
      await Order.findByIdAndUpdate(refund.orderMongoId, {
        $set: { status: orderStatusMap[newStatus] },
        $push: {
          statusLogs: {
            status: orderStatusMap[newStatus],
            timestamp: new Date(),
            message: note || `Refund ${newStatus}`,
          },
        },
      })
    }

    revalidatePath('/admin/refunds')
    revalidatePath(`/admin/refunds/${refundId}`)
    return { success: true, message: 'Refund status updated successfully' }
  } catch (error: any) {
    console.error('Error updating refund status:', error)
    return { success: false, error: error.message || 'Failed to update refund status' }
  }
}

/**
 * Get all refunds with filtering and pagination
 */
export async function getRefundsAction(filters?: {
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  try {
    await connectDb()

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    if (filters?.status && filters.status !== 'all') {
      query.status = filters.status
    }

    if (filters?.search) {
      query.$or = [
        { refundId: { $regex: filters.search, $options: 'i' } },
        { orderId: { $regex: filters.search, $options: 'i' } },
        { userEmail: { $regex: filters.search, $options: 'i' } },
        { userName: { $regex: filters.search, $options: 'i' } },
      ]
    }

    // Get refunds
    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalRefunds = await Refund.countDocuments(query)

    // Get refund statistics
    const stats = await Refund.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' },
        },
      },
    ])

    return {
      success: true,
      refunds: JSON.parse(JSON.stringify(refunds)),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalRefunds / limit),
        totalRefunds,
      },
      stats: stats,
    }
  } catch (error: any) {
    console.error('Error fetching refunds:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch refunds',
    }
  }
}

/**
 * Get single refund details
 */
export async function getRefundDetailsAction(refundId: string) {
  try {
    await connectDb()

    const refund = await Refund.findOne({ refundId }).lean()
    if (!refund) {
      return { success: false, error: 'Refund not found' }
    }

    // Access orderMongoId directly with type checking
    // lean() returns a plain object, so we need to handle it carefully
    const refundData = refund as any
    const orderMongoId = refundData?.orderMongoId
    
    if (!orderMongoId) {
      return { success: false, error: 'Order reference not found in refund' }
    }

    // Convert ObjectId to string if needed
    const orderIdString = typeof orderMongoId === 'string' 
      ? orderMongoId 
      : orderMongoId.toString()
    const order = await Order.findById(orderIdString).lean()

    return {
      success: true,
      refund: JSON.parse(JSON.stringify(refund)),
      order: order ? JSON.parse(JSON.stringify(order)) : null,
    }
  } catch (error: any) {
    console.error('Error fetching refund details:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch refund details',
    }
  }
}

/**
 * Approve refund (admin action)
 */
export async function approveRefundAction(refundId: string, adminId: string) {
  try {
    await connectDb()

    const refund = await Refund.findOne({ refundId })
    if (!refund) {
      return { success: false, error: 'Refund not found' }
    }

    if (refund.status !== 'refund_initiated' && refund.status !== 'pending_approval') {
      return { success: false, error: `Cannot approve refund with status: ${refund.status}` }
    }

    // Update refund status to approved
    refund.status = 'approved'
    refund.approvedBy = adminId
    refund.approvedAt = new Date()
    refund.statusHistory.push({
      status: 'approved',
      timestamp: new Date(),
      note: 'Refund approved by admin. Ready for payment gateway processing.',
      updatedBy: adminId,
    })

    await refund.save()

    // Update order
    await Order.findByIdAndUpdate(refund.orderMongoId, {
      $push: {
        statusLogs: {
          status: 'refund_approved',
          timestamp: new Date(),
          message: 'Refund approved by admin. Payment gateway processing pending.',
        },
      },
    })

    revalidatePath('/admin/refunds')

    return {
      success: true,
      message: 'Refund approved. You can now initiate the Stripe refund.',
      refund: JSON.parse(JSON.stringify(refund)),
    }
  } catch (error: any) {
    console.error('Error approving refund:', error)
    return {
      success: false,
      error: error.message || 'Failed to approve refund',
    }
  }
}

/**
 * Reject refund (admin action)
 */
export async function rejectRefundAction(
  refundId: string,
  adminId: string,
  reason: string
) {
  try {
    await connectDb()

    const refund = await Refund.findOne({ refundId })
    if (!refund) {
      return { success: false, error: 'Refund not found' }
    }

    if (refund.status === 'refunded' || refund.status === 'processing') {
      return { success: false, error: `Cannot reject refund with status: ${refund.status}` }
    }

    // Update refund status to rejected
    refund.status = 'rejected'
    refund.rejectedBy = adminId
    refund.rejectedAt = new Date()
    refund.rejectionReason = reason
    refund.statusHistory.push({
      status: 'rejected',
      timestamp: new Date(),
      note: `Refund rejected: ${reason}`,
      updatedBy: adminId,
    })

    await refund.save()

    // Update order - revert to original status
    const order = await Order.findById(refund.orderMongoId)
    if (order) {
      // Revert order status based on payment method
      if (order.paymentDetails?.paymentStatus === 'paid') {
        order.status = 'paid'
      } else if (order.paymentDetails?.paymentMethod === 'cod') {
        order.status = 'cod'
      }

      if (!order.statusLogs) {
        order.statusLogs = []
      }

      order.statusLogs.push({
        status: order.status,
        timestamp: new Date(),
        message: `Refund rejected by admin: ${reason}`,
      })

      await order.save()
    }

    revalidatePath('/admin/refunds')

    return {
      success: true,
      message: 'Refund rejected successfully.',
      refund: JSON.parse(JSON.stringify(refund)),
    }
  } catch (error: any) {
    console.error('Error rejecting refund:', error)
    return {
      success: false,
      error: error.message || 'Failed to reject refund',
    }
  }
}

/**
 * Initiate a Stripe refund (admin action - after approval).
 * Calls Stripe's Refund API against the PaymentIntent stored on the refund.
 */
export async function initiateStripeRefundAction(refundId: string, adminId: string) {
  try {
    await connectDb()

    const refund = await Refund.findOne({ refundId })
    if (!refund) {
      return { success: false, error: 'Refund not found' }
    }

    if (refund.status !== 'approved') {
      return {
        success: false,
        error: `Refund must be approved before initiating. Current status: ${refund.status}`,
      }
    }
    if (refund.status === 'processing' || refund.status === 'refunded') {
      return { success: false, error: `Refund is already ${refund.status}` }
    }

    const { isStripeConfigured, requireStripe, toStripeAmount } = await import('@/lib/stripe')
    if (!isStripeConfigured()) {
      return {
        success: false,
        error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local.',
      }
    }
    const stripe = requireStripe()

    const paymentIntentId = refund.stripePaymentIntentId || refund.transactionId
    if (!paymentIntentId) {
      refund.status = 'failed'
      refund.errors.push({
        message: 'Stripe PaymentIntent id missing on refund record',
        timestamp: new Date(),
        details: { refundId },
      })
      await refund.save()
      return { success: false, error: 'No Stripe payment id available for this order' }
    }

    refund.status = 'processing'
    refund.refundInitiatedAt = new Date()
    refund.statusHistory.push({
      status: 'processing',
      timestamp: new Date(),
      note: 'Stripe refund API call initiated',
      updatedBy: adminId,
    })
    await refund.save()

    try {
      const stripeRefund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: toStripeAmount(refund.refundAmount),
        reason: 'requested_by_customer',
        metadata: {
          refundId,
          adminId,
        },
      })

      refund.stripeRefundId = stripeRefund.id
      refund.stripeRefundStatus = stripeRefund.status ?? 'pending'
      refund.statusHistory.push({
        status: 'processing',
        timestamp: new Date(),
        note: `Stripe refund created (${stripeRefund.id}) — status: ${stripeRefund.status}`,
        updatedBy: adminId,
      })

      // Stripe sometimes succeeds synchronously for some card networks
      if (stripeRefund.status === 'succeeded') {
        refund.status = 'refunded'
        refund.refundCompletedAt = new Date()
      }
      await refund.save()

      await Order.findByIdAndUpdate(refund.orderMongoId, {
        $set: {
          'paymentDetails.paymentStatus':
            stripeRefund.status === 'succeeded' ? 'refunded' : 'pending_refund',
        },
        $push: {
          statusLogs: {
            status:
              stripeRefund.status === 'succeeded' ? 'refunded' : 'refund_processing',
            timestamp: new Date(),
            message: `Refund ${stripeRefund.status} via Stripe`,
          },
        },
      })

      revalidatePath('/admin/refunds')

      return {
        success: true,
        message:
          stripeRefund.status === 'succeeded'
            ? 'Refund completed via Stripe.'
            : 'Refund submitted to Stripe — final status will arrive via webhook.',
        refundId: refund.refundId,
        stripeRefundId: stripeRefund.id,
        stripeRefundStatus: stripeRefund.status,
        estimatedDate: refund.estimatedRefundDate,
      }
    } catch (stripeError: any) {
      console.error('❌ Stripe refund failed:', stripeError)

      refund.status = 'failed'
      refund.stripeRefundStatus = 'failed'
      refund.errors.push({
        message: stripeError?.message || 'Stripe refund request failed',
        timestamp: new Date(),
        details: { code: stripeError?.code, type: stripeError?.type },
      })
      refund.statusHistory.push({
        status: 'failed',
        timestamp: new Date(),
        note: `Stripe refund failed: ${stripeError?.message ?? 'unknown error'}`,
        updatedBy: adminId,
      })
      await refund.save()
      revalidatePath('/admin/refunds')

      return {
        success: false,
        error: stripeError?.message || 'Failed to initiate refund with Stripe',
      }
    }
  } catch (error: any) {
    console.error('❌ Error initiating Stripe refund:', error)
    return { success: false, error: error.message || 'Failed to initiate Stripe refund' }
  }
}

// Legacy alias so any older callers still resolve until they're updated.
export const initiatePayURefundAction = initiateStripeRefundAction

/**
 * Manually mark refund as completed (for manual refunds or corrections)
 */
export async function markRefundCompletedAction(
  refundId: string,
  adminId: string,
  note: string
) {
  try {
    await connectDb()

    const refund = await Refund.findOne({ refundId })
    if (!refund) {
      return { success: false, error: 'Refund not found' }
    }

    refund.status = 'refunded'
    refund.refundCompletedAt = new Date()
    refund.stripeRefundStatus = 'manual_completion'
    refund.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `Manually marked as completed: ${note}`,
      updatedBy: adminId,
    })

    await refund.save()

    // Update order
    await Order.findByIdAndUpdate(refund.orderMongoId, {
      $set: {
        status: 'refunded',
        'paymentDetails.paymentStatus': 'refunded',
        'paymentDetails.refundedAt': new Date(),
      },
      $push: {
        statusLogs: {
          status: 'refunded',
          timestamp: new Date(),
          message: `Refund completed manually: ${note}`,
        },
      },
    })

    revalidatePath('/admin/refunds')

    return {
      success: true,
      message: 'Refund marked as completed successfully.',
    }
  } catch (error: any) {
    console.error('Error marking refund as completed:', error)
    return {
      success: false,
      error: error.message || 'Failed to mark refund as completed',
    }
  }
}
