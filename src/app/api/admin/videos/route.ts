import connectDb from '@/lib/mongodb'
import VideoReel from '@/models/VideoReel'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret'

// Verify admin authentication
async function verifyAdmin(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/admin/videos - Get all videos with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // active, inactive, all
    const featured = searchParams.get('featured') // true, false
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'displayOrder'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'influencer.name': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ]
    }

    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false
    if (featured === 'true') query.isFeatured = true
    if (featured === 'false') query.isFeatured = false
    if (category) query.category = category

    // Build sort
    const sort: any = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    const skip = (page - 1) * limit

    const [videos, total] = await Promise.all([
      VideoReel.find(query).sort(sort).skip(skip).limit(limit).lean(),
      VideoReel.countDocuments(query),
    ])

    // Get unique categories for filter dropdown
    const categories = await VideoReel.distinct('category', {
      category: { $nin: [null, ''] },
    })

    return NextResponse.json({
      success: true,
      videos: videos.map((v: any) => ({ ...v, id: v._id?.toString() })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      filters: {
        categories,
      },
    })
  } catch (error: any) {
    console.error('Admin videos GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch videos' }, { status: 500 })
  }
}

// POST /api/admin/videos - Create new video
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.videoUrl) {
      return NextResponse.json({ error: 'Title and video URL are required' }, { status: 400 })
    }

    // Get max display order for new videos
    const maxOrderVideo = await VideoReel.findOne().sort({ displayOrder: -1 }).lean()
    const nextOrder = maxOrderVideo ? (maxOrderVideo as any).displayOrder + 1 : 0

    const video = new VideoReel({
      ...body,
      displayOrder: body.displayOrder ?? nextOrder,
      createdBy: admin.email,
    })

    await video.save()

    return NextResponse.json({
      success: true,
      video: { ...video.toObject(), id: video._id.toString() },
      message: 'Video created successfully',
    })
  } catch (error: any) {
    console.error('Admin videos POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create video' }, { status: 500 })
  }
}
