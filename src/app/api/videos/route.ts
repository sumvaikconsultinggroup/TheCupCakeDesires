import connectDb from '@/lib/mongodb'
import VideoReel from '@/models/VideoReel'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const videos = await VideoReel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      data: videos.map((v: any) => ({
        ...v,
        id: v._id.toString(),
        _id: v._id.toString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
