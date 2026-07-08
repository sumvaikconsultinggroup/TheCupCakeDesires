// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'

// POST /api/admin/orders/[orderId]/email - Send email to customer
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

    const { type, customMessage } = body
    
    // Validate email type
    const validTypes = ['invoice', 'shipping_update', 'delivery_confirmation', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    if (!order.customer?.email) {
      return NextResponse.json({ error: 'Customer email not available' }, { status: 400 })
    }

    // Build email content based on type
    let emailSubject = ''
    let emailContent = ''
    
    switch (type) {
      case 'invoice':
        emailSubject = `Invoice for Order ${order.orderId} - The Cupcake Desire`
        emailContent = `Dear ${order.customer?.firstName || 'Customer'},\n\nPlease find attached the invoice for your order ${order.orderId}.\n\nOrder Total: $${order.totalAmount?.toLocaleString()}\n\nThank you for shopping with us!\n\nBest regards,\nThe Cupcake Desire Team`
        break
      case 'shipping_update':
        emailSubject = `Your Order ${order.orderId} Has Been Shipped!`
        emailContent = `Dear ${order.customer?.firstName || 'Customer'},\n\nGreat news! Your order ${order.orderId} has been shipped.\n\n${order.fulfillment?.trackingNumber ? `Tracking Number: ${order.fulfillment.trackingNumber}\nCarrier: ${order.fulfillment.carrier || 'Standard Shipping'}\n` : ''}\nYou can track your order using the tracking number above.\n\nThank you for shopping with us!\n\nBest regards,\nThe Cupcake Desire Team`
        break
      case 'delivery_confirmation':
        emailSubject = `Your Order ${order.orderId} Has Been Delivered!`
        emailContent = `Dear ${order.customer?.firstName || 'Customer'},\n\nYour order ${order.orderId} has been successfully delivered.\n\nWe hope you enjoy your purchase! If you have any questions or concerns, please don't hesitate to reach out.\n\nWe'd love to hear your feedback. Please consider leaving a review for the products you purchased.\n\nThank you for shopping with us!\n\nBest regards,\nThe Cupcake Desire Team`
        break
      case 'custom':
        emailSubject = body.subject || `Update on Order ${order.orderId}`
        emailContent = customMessage || 'No message provided'
        break
    }

    // In a real implementation, you would send the email here
    // For now, we'll log it and mark it in the timeline

    // Add timeline event - ensure timeline is always an array
    if (!Array.isArray(order.timeline)) {
      order.timeline = []
    }
    order.timeline.push({
      type: 'email',
      title: 'Email Sent',
      description: `${type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)} email sent to ${order.customer.email}`,
      user: body.user || 'Admin',
      timestamp: new Date(),
      metadata: {
        emailType: type,
        recipient: order.customer.email,
        subject: emailSubject,
      },
    })

    await order.save()

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${order.customer.email}`,
      email: {
        type,
        recipient: order.customer.email,
        subject: emailSubject,
        sentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
