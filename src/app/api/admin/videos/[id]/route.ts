import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import VideoReel from '@/models/VideoReel'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { unlink } from 'fs/promises'
import path from 'path'

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

// GET /api/admin/videos/[id] - Get single video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    const { id } = await params

    const video = await VideoReel.findById(id).lean()
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      video: { ...video, id: (video as any)._id?.toString() },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/videos/[id] - Update video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    const { id } = await params
    const body = await request.json()

    // Remove fields that shouldn't be updated directly
    delete body._id
    delete body.id
    delete body.createdAt

    const video = await VideoReel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean()

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      video: { ...video, id: (video as any)._id?.toString() },
      message: 'Video updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/videos/[id] - Delete video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    const { id } = await params

    const video = await VideoReel.findById(id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Delete files if they are local uploads
    const filesToDelete = [video.videoUrl, video.thumbnailUrl]
    for (const url of filesToDelete) {
      if (url && url.startsWith('/uploads/')) {
        try {
          const filePath = path.join(process.cwd(), 'public', url)
          await unlink(filePath)
        } catch (error) {
          console.error(`Failed to delete file: ${url}`, error)
        }
      }
    }

    await VideoReel.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
