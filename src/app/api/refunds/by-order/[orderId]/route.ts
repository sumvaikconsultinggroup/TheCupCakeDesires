import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Refund from '@/models/Refund'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    // Find refund by order MongoDB ID
    const refund = await Refund.findOne({ orderMongoId: orderId })
      .lean()

    if (!refund) {
      return NextResponse.json({ success: false, error: 'Refund not found' }, { status: 404 })
    }

    // Type assertion for lean() result
    const refundData = refund as any

    // Verify refund belongs to user
    if (refundData.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      refund: JSON.parse(JSON.stringify(refundData)),
    })
  } catch (error: any) {
    console.error('Error fetching refund:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch refund' },
      { status: 500 }
    )
  }
}
