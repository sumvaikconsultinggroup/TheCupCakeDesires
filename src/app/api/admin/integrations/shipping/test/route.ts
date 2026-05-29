import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import PaymentSettings from '@/models/PaymentSettings'

export const dynamic = 'force-dynamic'

const STORE_ID = 'default'

// POST /api/admin/integrations/shipping/test - Test Shiprocket connection
export async function POST(request: NextRequest) {
  try {
    await connectDb()
    
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get existing settings to get password if masked
    let actualPassword = password
    if (password === '********') {
      const settings = await PaymentSettings.findOne({ storeId: STORE_ID })
      if (!settings?.shiprocket?.password) {
        return NextResponse.json(
          { success: false, message: 'No password saved. Please enter your Shiprocket password.' },
          { status: 400 }
        )
      }
      actualPassword = settings.shiprocket.password
    }

    // Test Shiprocket authentication
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: actualPassword,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.token) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Authentication failed. Please check your credentials.',
      })
    }

    // Try to fetch user info to verify token works
    const userResponse = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company', {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    })

    const userData = await userResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Connection successful!',
      company: userData.data?.company_name || 'Unknown',
    })

  } catch (error: any) {
    console.error('Test Shiprocket connection error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}
