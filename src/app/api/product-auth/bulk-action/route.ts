// src/app/api/product-auth/bulk-action/route.ts

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ProductAuthentication from '@/models/ProductAuthentication'

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const { action, codes } = await req.json()

    if (!action || !['delete', 'restore'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Must be "delete" or "restore"',
        },
        { status: 400 }
      )
    }

    let result

    if (codes && Array.isArray(codes) && codes.length > 0) {
      // Bulk action on specific codes
      result = await ProductAuthentication.updateMany(
        { authCode: { $in: codes } },
        { $set: { isDeleted: action === 'delete' } }
      )
    } else {
      // Bulk action on all codes
      const query = action === 'delete' ? { isDeleted: false } : { isDeleted: true }
      result = await ProductAuthentication.updateMany(query, {
        $set: { isDeleted: action === 'delete' },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'delete' ? 'deleted' : 'restored'} ${result.modifiedCount} codes`,
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to perform bulk action',
      },
      { status: 500 }
    )
  }
}