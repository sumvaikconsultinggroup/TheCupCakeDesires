// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { v4 as uuidv4 } from 'uuid'

// POST /api/admin/orders/[orderId]/refund - Process refund for order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
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

    // Validate refund
    if (order.paymentDetails?.status !== 'paid') {
      return NextResponse.json({ error: 'Order has not been paid' }, { status: 400 })
    }

    if (order.paymentDetails?.status === 'refunded') {
      return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
    }

    const refundAmount = body.amount || order.totalAmount
    if (refundAmount > order.totalAmount) {
      return NextResponse.json({ error: 'Refund amount exceeds order total' }, { status: 400 })
    }

    // Generate refund ID
    const refundId = `REF-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`

    // Update order with refund info
    order.paymentDetails = {
      ...order.paymentDetails,
      status: 'refunded',
      refundId,
      refundedAt: new Date(),
      refundAmount,
    }
    order.status = 'refunded'
    
    // Add timeline event - ensure timeline is always an array
    if (!Array.isArray(order.timeline)) {
      order.timeline = []
    }
    order.timeline.push({
      type: 'refund',
      title: 'Refund Processed',
      description: `Refund of ₹${refundAmount.toLocaleString()} processed. Refund ID: ${refundId}. Reason: ${body.reason || 'Not specified'}`,
      timestamp: new Date(),
      user: body.user || 'Admin',
      metadata: {
        refundId,
        amount: refundAmount,
        reason: body.reason,
      },
    })

    await order.save()

    return NextResponse.json({
      success: true,
      refund: {
        refundId,
        amount: refundAmount,
        status: 'processed',
        processedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
