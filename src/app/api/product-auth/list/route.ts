// src/app/api/product-auth/list/route.ts

import connectDb from '@/lib/mongodb'
import ProductAuthentication from '@/models/ProductAuthentication'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const showDeleted = searchParams.get('showDeleted') === 'true'

    const query: any = showDeleted ? { isDeleted: true } : { isDeleted: false }

    const skip = (page - 1) * limit

    const [codes, total, totalCodes, activeCodes, totalVerifications] = await Promise.all([
      ProductAuthentication.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProductAuthentication.countDocuments(query),
      ProductAuthentication.countDocuments({}),
      ProductAuthentication.countDocuments({ isDeleted: false }),
      ProductAuthentication.aggregate([{ $group: { _id: null, total: { $sum: '$verificationCount' } } }]),
    ])

    return NextResponse.json({
      success: true,
      data: codes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total: totalCodes,
        active: activeCodes,
        deleted: totalCodes - activeCodes,
        totalVerifications: totalVerifications[0]?.total || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching auth codes:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch authentication codes',
      },
      { status: 500 }
    )
  }
}
