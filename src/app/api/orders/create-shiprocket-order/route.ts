import { NextResponse } from 'next/server'
import { createShiprocketOrderForOrder } from '@/lib/createShiprocketOrder'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'

export async function POST(request: Request) {
  try {
    await connectDb()

    const { orderId } = await request.json()
    
    if (!orderId) {
      console.error('❌ Order ID missing')
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Use the shared function to create Shiprocket order
    const result = await createShiprocketOrderForOrder(orderId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, details: result.details },
        { status: 400 }
      )
    }

    // Update order status to confirmed (since Shiprocket order was created successfully)
    await Order.updateOne(
      { orderId },
      { 
        $set: { 
          status: 'confirmed'
        },
        $push: {
          statusLogs: {
            status: 'confirmed',
            timestamp: new Date(),
            message: 'Order confirmed and Shiprocket order created successfully',
          }
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Shiprocket order created successfully',
      data: result.data,
    })
  } catch (error: any) {
    console.error('Error creating Shiprocket order:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create Shiprocket order' },
      { status: 500 }
    )
  }
}
