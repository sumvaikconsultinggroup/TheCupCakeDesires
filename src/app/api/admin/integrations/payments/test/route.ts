import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import PaymentSettings from '@/models/PaymentSettings'

export const dynamic = 'force-dynamic'

const STORE_ID = 'default'

// POST /api/admin/integrations/payments/test - Test payment gateway connection
export async function POST(request: NextRequest) {
  try {
    await connectDb()
    
    const body = await request.json()
    const { provider, keyId, keySecret, merchantKey, merchantSalt } = body

    // Get existing settings to get secrets if masked
    const settings = await PaymentSettings.findOne({ storeId: STORE_ID })

    if (provider === 'razorpay') {
      const actualKeyId = keyId || settings?.razorpay?.keyId
      let actualKeySecret = keySecret
      if (keySecret === '********' || !keySecret) {
        actualKeySecret = settings?.razorpay?.keySecret
      }

      if (!actualKeyId || !actualKeySecret) {
        return NextResponse.json(
          { success: false, message: 'Razorpay Key ID and Key Secret are required' },
          { status: 400 }
        )
      }

      // Test Razorpay by making a simple API call
      const auth = Buffer.from(`${actualKeyId}:${actualKeySecret}`).toString('base64')
      
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: 100, // 1 INR
          currency: 'INR',
          receipt: 'test_receipt',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          message: data.error?.description || 'Invalid credentials',
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Razorpay connection successful!',
        orderId: data.id,
      })
    }

    if (provider === 'payu') {
      const actualMerchantKey = merchantKey || settings?.payu?.merchantKey
      let actualMerchantSalt = merchantSalt
      if (merchantSalt === '********' || !merchantSalt) {
        actualMerchantSalt = settings?.payu?.merchantSalt
      }

      if (!actualMerchantKey || !actualMerchantSalt) {
        return NextResponse.json(
          { success: false, message: 'PayU Merchant Key and Salt are required' },
          { status: 400 }
        )
      }

      // For PayU, we just verify the credentials format (no simple test API)
      // PayU doesn't have a simple test endpoint like Razorpay
      // We'll consider valid if both are provided and have reasonable format
      if (actualMerchantKey.length < 4 || actualMerchantSalt.length < 4) {
        return NextResponse.json({
          success: false,
          message: 'Invalid credentials format',
        })
      }

      return NextResponse.json({
        success: true,
        message: 'PayU credentials saved. Test a payment to verify.',
      })
    }

    return NextResponse.json(
      { success: false, message: 'Unknown payment provider' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Test payment connection error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}
