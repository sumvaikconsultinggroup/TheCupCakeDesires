// src/app/api/promoCode/active/route.ts

import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'

export async function GET() {
  try {
    await connectDb()

    const now = new Date()

    const promoCodes = await PromoCode.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 })

    // Filter out codes that have reached their usage limit
    const availablePromoCodes = promoCodes.filter(promo => {
      if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
        return false
      }
      return true
    })

    return NextResponse.json({
      success: true,
      data: availablePromoCodes,
      count: availablePromoCodes.length,
    })
  } catch (error) {
    console.error('Error fetching active promo codes:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch promo codes',
      },
      { status: 500 }
    )
  }
}