import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Review from '@/models/Review'

// Bulk actions for reviews
export async function POST(request: NextRequest) {
  try {
    await connectDb()
    const body = await request.json()
    const { action, reviewIds } = body

    if (!action || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action and review IDs are required' },
        { status: 400 }
      )
    }

    let modifiedCount = 0
    let deletedCount = 0

    switch (action) {
      case 'approve': {
        const res = await Review.updateMany(
          { _id: { $in: reviewIds } },
          {
            $set: {
              status: 'approved',
              reviewedBy: 'Admin',
              reviewedAt: new Date(),
            },
          }
        )
        modifiedCount = res.modifiedCount
        break
      }

      case 'reject': {
        const res = await Review.updateMany(
          { _id: { $in: reviewIds } },
          {
            $set: {
              status: 'rejected',
              reviewedBy: 'Admin',
              reviewedAt: new Date(),
            },
          }
        )
        modifiedCount = res.modifiedCount
        break
      }

      case 'delete': {
        const res = await Review.deleteMany({ _id: { $in: reviewIds } })
        deletedCount = res.deletedCount ?? 0
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'delete'
          ? `Deleted ${deletedCount} reviews`
          : `${action}d ${modifiedCount} reviews`,
    })
  } catch (error: any) {
    console.error('Error in bulk action:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
