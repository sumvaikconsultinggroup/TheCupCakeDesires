import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Shipment from '@/models/Shipment'
import AWBOrder from '@/models/AWBOrder'
import { getShiprocketToken } from '@/lib/shiprocket'

export async function POST(request: Request) {
  try {
    await connectDb()
    
    const { limit = 100 } = await request.json().catch(() => ({ limit: 100 }))
    
    // Find orders that have Shiprocket shipments but no AWB in AWBOrder model
    const shipments = await Shipment.find({
      provider: 'shiprocket',
      providerOrderId: { $exists: true, $ne: null }
    })
      .limit(limit)
      .lean()
    
    if (shipments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No shipments found to sync',
        synced: 0,
        failed: 0,
      })
    }
    
    // Get Shiprocket token
    const token = await getShiprocketToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Shiprocket authentication failed' },
        { status: 500 }
      )
    }
    
    const apiUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'
    let synced = 0
    let failed = 0
    const errors: string[] = []
    
    // Process each shipment
    for (const shipment of shipments) {
      try {
        const orderId = shipment.orderId as string
        const providerOrderId = shipment.providerOrderId as string
        
        // Check if AWB already exists in AWBOrder
        const existingAWB = await AWBOrder.findOne({ orderId })
        if (existingAWB) {
          continue // Skip if already synced
        }
        
        // Fetch order details from Shiprocket
        const orderResponse = await fetch(`${apiUrl}/orders/show/${providerOrderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!orderResponse.ok) {
          failed++
          const errorText = await orderResponse.text().catch(() => orderResponse.statusText)
          errors.push(`Failed to fetch order ${providerOrderId}: ${errorText}`)
          continue
        }
        
        const orderData = await orderResponse.json()
        
        // Extract AWB from Shiprocket order data
        // Shiprocket API returns AWB in different places depending on order status
        let awbCode = orderData.data?.awb_code || 
                     orderData.data?.awbCode || 
                     orderData.data?.shipment_id?.awb_code ||
                     orderData.awb_code ||
                     null
        
        // Try to get from shipment details if not found
        if (!awbCode && orderData.data?.shipments && orderData.data.shipments.length > 0) {
          const firstShipment = orderData.data.shipments[0]
          awbCode = firstShipment.awb_code || firstShipment.awbCode || null
        }
        
        // Try to get from shipments array at root level
        if (!awbCode && orderData.shipments && orderData.shipments.length > 0) {
          const firstShipment = orderData.shipments[0]
          awbCode = firstShipment.awb_code || firstShipment.awbCode || null
        }
        
        if (!awbCode) {
          failed++
          errors.push(`No AWB found for order ${orderId} (Shiprocket ID: ${providerOrderId})`)
          continue
        }
        
        // Save to AWBOrder model
        await AWBOrder.findOneAndUpdate(
          { orderId },
          { awb: awbCode },
          { upsert: true, new: true }
        )
        
        // Update order shippingDetails if needed
        const order = await Order.findOne({ orderId })
        if (order && !order.shippingDetails?.awb_code) {
          const courierName = orderData.data?.courier_name || 
                             orderData.data?.shipments?.[0]?.courier_name ||
                             shipment.courierName || 
                             ''
          const trackingUrl = orderData.data?.tracking_url || 
                            orderData.data?.shipments?.[0]?.tracking_url ||
                            ''
          
          await Order.updateOne(
            { orderId },
            {
              $set: {
                'shippingDetails.awb_code': awbCode,
                'shippingDetails.courier_name': courierName,
                'shippingDetails.tracking_url': trackingUrl,
              }
            }
          )
        }
        
        synced++
      } catch (error: any) {
        failed++
        errors.push(`Error processing shipment ${shipment.orderId}: ${error.message}`)
        console.error(`Error syncing AWB for order ${shipment.orderId}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${synced} orders, ${failed} failed`,
      synced,
      failed,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error: any) {
    console.error('Error syncing AWB:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to sync AWB' },
      { status: 500 }
    )
  }
}
