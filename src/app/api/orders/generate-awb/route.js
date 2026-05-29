import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import AWB from '@/models/AWB'
import { getShiprocketToken } from '@/lib/shiprocket'
import axios from 'axios'

export async function POST(request) {
  try {
    await connectDb()
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 })
    }

    // Find order by MongoDB _id or orderId
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    })

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
    }

    // Check if AWB already exists
    const existingAWB = await AWB.findOne({ orderId: order._id.toString() })
    if (existingAWB) {
      return NextResponse.json({ 
        success: false, 
        message: 'AWB already generated for this order',
        awb: existingAWB 
      }, { status: 400 })
    }

    // Check if order has Shiprocket shipment ID
    if (!order.shippingDetails?.shiprocket_shipment_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order does not have a Shiprocket shipment. Please create shipment first.' 
      }, { status: 400 })
    }

    const shiprocketToken = await getShiprocketToken()
    const shipmentId = order.shippingDetails.shiprocket_shipment_id

    // Get courier serviceability
    const isCOD = (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod'
    const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE || '110001'
    const deliveryPostcode = order.shippingAddress?.postalCode || '110001'
    
    // Calculate total weight from items (default 0.5kg per item if not specified)
    const totalWeight = order.items?.reduce((sum, item) => sum + (item.weight || 0.5), 0) || 0.5

    const courierResponse = await axios.get(`${process.env.SHIPROCKET_API_URL}/courier/serviceability`, {
      headers: { Authorization: `Bearer ${shiprocketToken}` },
      params: {
        shipment_id: shipmentId,
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        cod: isCOD ? 1 : 0,
        weight: totalWeight,
        declared_value: order.totalAmount || 1000
      }
    })

    if (courierResponse.data.status !== 200 || !courierResponse.data.data?.available_courier_companies?.length) {
      return NextResponse.json({ 
        success: false, 
        message: 'No couriers available for this shipment' 
      }, { status: 400 })
    }

    // Pick the first available courier (you can add logic to choose best/cheapest)
    const courier = courierResponse.data.data.available_courier_companies[0]
    const courierId = courier.courier_company_id

    // Assign AWB
    const awbResponse = await axios.post(
      `${process.env.SHIPROCKET_API_URL}/courier/assign/awb`,
      {
        shipment_id: shipmentId,
        courier_id: courierId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${shiprocketToken}`,
        },
      }
    )

    if (!awbResponse.data.data?.awb_code) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to generate AWB from Shiprocket' 
      }, { status: 500 })
    }

    const { awb_code, courier_name, tracking_url } = awbResponse.data.data

    // Create AWB record
    const awb = new AWB({
      orderId: order._id.toString(),
      orderOrderId: order.orderId,
      awbCode: awb_code,
      courierName: courier_name,
      courierId: courierId,
      trackingUrl: tracking_url,
      shiprocketOrderId: order.shippingDetails.shiprocket_order_id,
      shiprocketShipmentId: shipmentId,
      status: 'generated',
    })

    await awb.save()

    // Update order with AWB details
    order.shippingDetails = {
      ...order.shippingDetails,
      awb_code: awb_code,
      courier_name: courier_name,
      tracking_url: tracking_url,
    }

    // Update order status to shipped if not already
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      order.status = 'shipped'
      order.orderStatus = 'shipped'
    }

    // Add status log
    if (!order.statusLogs) {
      order.statusLogs = []
    }
    order.statusLogs.push({
      status: 'shipped',
      timestamp: new Date(),
      message: `AWB generated. Shipped with ${courier_name}. AWB: ${awb_code}`,
    })

    await order.save()

    return NextResponse.json({
      success: true,
      message: 'AWB generated successfully',
      awb: {
        awbCode: awb_code,
        courierName: courier_name,
        trackingUrl: tracking_url,
      },
    })
  } catch (error) {
    console.error('Error generating AWB:', error.response?.data || error.message)
    return NextResponse.json(
      { success: false, message: 'Failed to generate AWB', error: error.message },
      { status: 500 }
    )
  }
}
