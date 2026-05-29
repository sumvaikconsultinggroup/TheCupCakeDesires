// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Shipment from '@/models/Shipment'
import { v4 as uuidv4 } from 'uuid'

// POST /api/admin/orders/[orderId]/shipment - Create shipment for order
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

    // Check if order already has a shipment
    if (order.fulfillment?.shipmentId) {
      const existingShipment = await Shipment.findOne({ shipmentId: order.fulfillment.shipmentId })
      if (existingShipment) {
        return NextResponse.json({ error: 'Order already has a shipment' }, { status: 400 })
      }
    }

    // Generate shipment ID
    const shipmentId = `SHP-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
    const trackingNumber = body.trackingNumber || `TRK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create shipment
    const shipment = new Shipment({
      shipmentId,
      orderId: order.orderId,
      provider: body.provider || 'manual',
      awbNumber: trackingNumber,
      courierName: body.carrier || body.courierName || 'Manual Shipping',
      
      package: body.package || {
        weight: 0.5,
        length: 20,
        width: 15,
        height: 10,
      },
      
      pickupAddress: body.pickupAddress || {
        name: 'Gibbon Nutrition',
        phone: '+91 9876543210',
        address: 'Warehouse Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
      
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
      
      status: 'processing',
      statusHistory: [{
        status: 'processing',
        timestamp: new Date(),
        description: 'Shipment created',
      }],
      
      shippingMethod: body.shippingMethod || 'standard',
      shippingCost: body.shippingCost || order.shipping || 0,
      estimatedDeliveryDate: body.estimatedDeliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      
      isCod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod',
      codAmount: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod' ? order.totalAmount : 0,
      
      items: order.items?.map((item: any) => ({
        productId: item.productId,
        productName: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
      })) || [],
      
      trackingUrl: body.trackingUrl || `https://track.example.com/${trackingNumber}`,
    })

    await shipment.save()

    // Update order with shipment info
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
    
    // Add timeline event - ensure timeline is always an array
    if (!Array.isArray(order.timeline)) {
      order.timeline = []
    }
    order.timeline.push({
      type: 'shipping',
      title: 'Shipment Created',
      description: `Shipment ${shipmentId} created with ${shipment.courierName}. Tracking: ${trackingNumber}`,
      user: body.user || 'Admin',
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

    return NextResponse.json({
      success: true,
      shipment: {
        ...shipment.toObject(),
        _id: undefined,
        id: shipment._id?.toString(),
      },
    })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
  }
}
