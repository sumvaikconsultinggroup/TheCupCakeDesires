import { NextResponse } from 'next/server'
import { getShiprocketToken } from '@/lib/shiprocket'
import connectDb from '@/lib/mongodb'
import Shipment from '@/models/Shipment'

export async function POST(request: Request) {
  try {
    await connectDb()

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Find shipment by order ID
    const shipment = await Shipment.findOne({ orderId, provider: 'shiprocket' })

    if (!shipment || !shipment.providerShipmentId) {
      return NextResponse.json(
        { success: false, message: 'Shipment not found' },
        { status: 404 }
      )
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

    // Fetch tracking details from Shiprocket
    const response = await fetch(
      `${apiUrl}/courier/track/shipment/${shipment.providerShipmentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Shiprocket tracking fetch failed:', errorData)
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch tracking from Shiprocket' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract tracking information
    const trackingData = data.tracking_data

    if (!trackingData) {
      return NextResponse.json(
        { success: false, message: 'No tracking data available' },
        { status: 404 }
      )
    }

    // Get the latest tracking event
    const latestStatus = trackingData.shipment_track?.[0]

    // Update shipment in database with latest status
    if (latestStatus) {
      shipment.status = latestStatus.current_status || shipment.status
      shipment.trackingUpdates = trackingData.shipment_track || []
      
      if (!shipment.statusHistory) {
        shipment.statusHistory = []
      }
      
      // Add to history if status changed
      const lastHistoryStatus = shipment.statusHistory[shipment.statusHistory.length - 1]?.status
      if (lastHistoryStatus !== latestStatus.current_status) {
        shipment.statusHistory.push({
          status: latestStatus.current_status,
          timestamp: new Date(),
          description: latestStatus.status_detail || 'Status updated from Shiprocket',
        })
      }

      await shipment.save()
    }

    return NextResponse.json({
      success: true,
      tracking: {
        awb: trackingData.awb_code,
        courier: trackingData.courier_name,
        currentStatus: latestStatus?.current_status,
        statusDetail: latestStatus?.status_detail,
        shipmentTrack: trackingData.shipment_track || [],
        estimatedDelivery: trackingData.edd,
      },
    })
  } catch (error: any) {
    console.error('Error fetching Shiprocket tracking:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch tracking' },
      { status: 500 }
    )
  }
}
