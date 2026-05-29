import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import VideoReel from '@/models/VideoReel'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret'

async function verifyAdmin(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

// POST /api/admin/videos/reorder - Reorder videos
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    const { videoIds } = await request.json()

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'Invalid video IDs array' }, { status: 400 })
    }

    // Update display order for each video
    const updates = videoIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder: index } },
      },
    }))

    await VideoReel.bulkWrite(updates)

    return NextResponse.json({
      success: true,
      message: 'Videos reordered successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
