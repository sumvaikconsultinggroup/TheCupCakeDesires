import { NextRequest, NextResponse } from 'next/server'
import { getShiprocketToken } from '@/lib/shiprocket'
import connectDb from '@/lib/mongodb'
import PaymentSettings from '@/models/PaymentSettings'

const STORE_ID = 'default'
const DELIVERY_SURCHARGE = 100 // Additional 100 rupees on top of Shiprocket rate

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pincode, weight = 0.5 } = body

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 6-digit pincode' },
        { status: 400 }
      )
    }

    await connectDb()

    const token = await getShiprocketToken()
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Shiprocket authentication failed' },
        { status: 500 }
      )
    }

    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    const pickupPincode = settings?.pickupAddress?.pincode || '110001'

    const response = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&weight=${weight}&cod=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to check delivery' },
        { status: response.status }
      )
    }

    if (result.data?.available_courier_companies?.length > 0) {
      // Get the cheapest courier option
      const cheapestCourier = result.data.available_courier_companies.reduce((prev: any, curr: any) => 
        prev.rate < curr.rate ? prev : curr
      )

      // Calculate delivery date (ETD is in format like "5-7 days")
      const etdMatch = cheapestCourier.etd?.match(/(\d+)/)
      const daysToAdd = etdMatch ? parseInt(etdMatch[1]) : 5
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + daysToAdd)

      // Add 100 rupees surcharge to the delivery cost
      const totalDeliveryCost = cheapestCourier.rate + DELIVERY_SURCHARGE

      return NextResponse.json({
        success: true,
        serviceable: true,
        deliveryCost: totalDeliveryCost,
        baseCost: cheapestCourier.rate,
        surcharge: DELIVERY_SURCHARGE,
        courier: cheapestCourier.courier_name,
        estimatedDelivery: deliveryDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: 'Asia/Kolkata',
        }),
        cod: cheapestCourier.cod === 1,
        etd: cheapestCourier.etd,
      })
    }

    return NextResponse.json({
      success: true,
      serviceable: false,
      message: 'Delivery not available to this pincode',
    })
  } catch (error: any) {
    console.error('Check delivery error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check delivery' },
      { status: 500 }
    )
  }
}
