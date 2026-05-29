import { NextRequest, NextResponse } from 'next/server'
import { getShiprocketToken } from '@/lib/shiprocket'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Shipment from '@/models/Shipment'

export async function POST(request: NextRequest) {
  try {
    await connectDb()
    
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Find order by orderId
    const order = await Order.findOne({ orderId }).lean()

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order is confirmed (has Shiprocket shipment)
    const shipment = await Shipment.findOne({
      orderId: (order as any).orderId,
      provider: 'shiprocket'
    }).lean()

    if (!shipment || !(shipment as any).providerOrderId) {
      return NextResponse.json(
        { success: false, message: 'No Shiprocket order found for this order. Please confirm the order first.' },
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

    const shiprocketOrderId = (shipment as any).providerOrderId

    // Fetch invoice from Shiprocket
    // Shiprocket API endpoint to generate/download invoice
    const apiUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'
    const invoiceUrl = `${apiUrl}/orders/print/invoice`
    
    const response = await fetch(invoiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ids: [shiprocketOrderId]
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Shiprocket invoice fetch failed:', result)
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to fetch invoice from Shiprocket' },
        { status: response.status }
      )
    }

    // Shiprocket returns an invoice_url or PDF base64
    // The response format is typically: { invoice_url: "https://..." } or { is_invoice_created: true, invoice_url: "..." }
    return NextResponse.json({
      success: true,
      message: 'Invoice fetched successfully from Shiprocket',
      data: {
        invoiceUrl: result.invoice_url || result.data?.invoice_url,
        shiprocketOrderId,
        orderId: (order as any).orderId,
        ...result
      },
    })
  } catch (error: any) {
    console.error('Error fetching Shiprocket invoice:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch invoice from Shiprocket' },
      { status: 500 }
    )
  }
}
