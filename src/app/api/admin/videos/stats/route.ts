import connectDb from '@/lib/mongodb'
import VideoReel from '@/models/VideoReel'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

// GET /api/admin/videos/stats - Get video statistics
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    const [totalVideos, activeVideos, featuredVideos, homepageVideos, totalStats] = await Promise.all([
      VideoReel.countDocuments(),
      VideoReel.countDocuments({ isActive: true }),
      VideoReel.countDocuments({ isFeatured: true }),
      VideoReel.countDocuments({ showOnHomepage: true, isActive: true }),
      VideoReel.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$stats.views' },
            totalLikes: { $sum: '$stats.likes' },
            totalShares: { $sum: '$stats.shares' },
            avgViews: { $avg: '$stats.views' },
          },
        },
      ]),
    ])

    // Get top performing videos
    const topPerforming = await VideoReel.find({ isActive: true })
      .sort({ 'stats.views': -1 })
      .limit(5)
      .select('title stats thumbnailUrl')
      .lean()

    // Get category breakdown
    const categoryBreakdown = await VideoReel.aggregate([
      { $match: { category: { $nin: [null, ''] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ])

    // Videos with products
    const videosWithProducts = await VideoReel.countDocuments({
      'products.0': { $exists: true },
    })

    return NextResponse.json({
      success: true,
      stats: {
        total: totalVideos,
        active: activeVideos,
        inactive: totalVideos - activeVideos,
        featured: featuredVideos,
        onHomepage: homepageVideos,
        withProducts: videosWithProducts,
        engagement: {
          totalViews: totalStats[0]?.totalViews || 0,
          totalLikes: totalStats[0]?.totalLikes || 0,
          totalShares: totalStats[0]?.totalShares || 0,
          avgViews: Math.round(totalStats[0]?.avgViews || 0),
        },
        topPerforming: topPerforming.map((v: any) => ({
          id: v._id?.toString(),
          title: v.title,
          views: v.stats?.views || 0,
          thumbnailUrl: v.thumbnailUrl,
        })),
        categoryBreakdown,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
