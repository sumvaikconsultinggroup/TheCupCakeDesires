// src/app/api/product-auth/verify/route.ts - Update POST method

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ProductAuthentication from '@/models/ProductAuthentication'

export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const { searchParams } = new URL(req.url)
    const authCode = searchParams.get('authCode')

    if (!authCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication code is required',
        },
        { status: 400 }
      )
    }

    const cleanCode = authCode.trim()

    const authRecord = await ProductAuthentication.findOne({ authCode: cleanCode })

    if (!authRecord) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: '❌ Invalid authentication code.',
      })
    }

    return NextResponse.json({
      success: true,
      verified: true,
      data: authRecord,
    })
  } catch (error) {
    console.error('Error fetching product verification:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch verification details.',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const { authCode } = await req.json()

    if (!authCode || typeof authCode !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication code is required',
        },
        { status: 400 }
      )
    }

    const cleanCode = authCode.trim()

    const authRecord = await ProductAuthentication.findOne({ authCode: cleanCode })

    if (!authRecord) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: '❌ Invalid authentication code. This product may not be genuine.',
      })
    }

    // Check if code is deleted
    if (authRecord.isDeleted) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: '❌ This authentication code has been deactivated.',
      })
    }

    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Update verification history
    authRecord.verificationCount += 1
    authRecord.verificationHistory.push({
      verifiedAt: new Date(),
      ip,
    })

    await authRecord.save()

    return NextResponse.json({
      success: true,
      verified: true,
      message: '✅ This product is 100% authentic and verified by CupCake Desires.',
      verificationCount: authRecord.verificationCount,
    })
  } catch (error) {
    console.error('Error verifying product:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify product. Please try again.',
      },
      { status: 500 }
    )
  }
}