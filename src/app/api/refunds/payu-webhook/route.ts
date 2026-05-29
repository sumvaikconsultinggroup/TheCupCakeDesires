import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Refund from '@/models/Refund'
import Order from '@/models/Order'

/**
 * PayU Refund Status Webhook
 * Receives async updates from PayU about refund status
 */
export async function POST(request: Request) {
  try {
    await connectDb()

    const data = await request.json()

    // Extract refund details from PayU webhook
    const {
      mihpayid,
      request_id,
      bank_ref_num,
      refund_status,
      refund_amount,
      error_Message,
    } = data

    if (!mihpayid && !request_id) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    // Find refund by mihpayid or payuRefundId
    const refund = await Refund.findOne({
      $or: [
        { mihpayid: mihpayid },
        { payuRefundId: request_id },
      ],
    })

    if (!refund) {
      console.error('Refund not found for PayU webhook:', { mihpayid, request_id })
      return NextResponse.json(
        { success: false, message: 'Refund not found' },
        { status: 404 }
      )
    }

    // Update refund based on PayU status
    const oldStatus = refund.status
    let newStatus = refund.status
    let orderPaymentStatus = 'pending_refund'

    switch (refund_status?.toLowerCase()) {
      case 'success':
      case 'refunded':
      case 'completed':
        newStatus = 'refunded'
        orderPaymentStatus = 'refunded'
        refund.refundCompletedAt = new Date()
        refund.payuRefundStatus = 'refunded'
        refund.bankRrn = bank_ref_num || refund.bankRrn
        break

      case 'pending':
      case 'initiated':
      case 'processing':
        newStatus = 'processing'
        orderPaymentStatus = 'pending_refund'
        refund.payuRefundStatus = 'pending'
        break

      case 'failed':
      case 'error':
        newStatus = 'failed'
        orderPaymentStatus = 'paid' // Revert to paid if refund failed
        refund.payuRefundStatus = 'failed'
        refund.errors.push({
          message: error_Message || 'Refund failed at PayU',
          timestamp: new Date(),
          details: data,
        })
        break

      default:
        console.warn('Unknown PayU refund status:', refund_status)
        refund.payuRefundStatus = refund_status
    }

    // Only update if status changed
    if (newStatus !== oldStatus) {
      refund.status = newStatus
      refund.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: `PayU webhook: ${refund_status} - ${error_Message || 'Status updated'}`,
        updatedBy: 'payu_webhook',
      })
    }

    await refund.save()

    // Update order status
    const order = await Order.findById(refund.orderMongoId)
    if (order) {
      order.paymentDetails.paymentStatus = orderPaymentStatus

      if (newStatus === 'refunded') {
        order.status = 'refunded'
        order.paymentDetails.refundedAt = new Date()
      }

      if (!order.statusLogs) {
        order.statusLogs = []
      }

      order.statusLogs.push({
        status: order.status,
        timestamp: new Date(),
        message: `Refund ${newStatus}: ${error_Message || 'Updated by PayU'}`,
      })

      await order.save()
    }

    // TODO: Send email notification to user about refund status
    if (newStatus === 'refunded') {
      // Implement email service here
    } else if (newStatus === 'failed') {
      // Implement email service here
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      refundId: refund.refundId,
      status: newStatus,
    })
  } catch (error: any) {
    console.error('Error processing PayU refund webhook:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
