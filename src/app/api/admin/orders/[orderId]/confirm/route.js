import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import AWB from '@/models/AWB'

export async function POST(request, { params }) {
  try {
    await connectDb()
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Find order by MongoDB _id or orderId
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order can be confirmed
    if (order.status === 'cancelled' || order.status === 'delivered' || order.status === 'refunded') {
      return NextResponse.json({ 
        error: `Cannot confirm order with status: ${order.status}` 
      }, { status: 400 })
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

    // If order is COD and has Shiprocket shipment, generate AWB
    const isCOD = (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod'
    if (isCOD && order.shippingDetails?.shiprocket_shipment_id) {
      try {
        // Check if AWB already exists
        const existingAWB = await AWB.findOne({ orderId: order._id.toString() })
        if (!existingAWB) {
          // Generate AWB for COD order
          const awbResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/generate-awb`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order._id.toString(),
            }),
          })

          if (!awbResponse.ok) {
            console.error('Failed to generate AWB for COD order:', await awbResponse.text())
            // Don't fail the confirmation if AWB generation fails
          }
        }
      } catch (awbError) {
        console.error('Error generating AWB for COD order:', awbError)
        // Don't fail the confirmation if AWB generation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order confirmed successfully',
      order: {
        ...order.toObject(),
        _id: order._id.toString(),
        id: order._id.toString(),
      }
    })
  } catch (error) {
    console.error('Error confirming order:', error)
    return NextResponse.json({ 
      error: 'Failed to confirm order',
      details: error.message 
    }, { status: 500 })
  }
}
