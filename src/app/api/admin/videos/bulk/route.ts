import connectDb from '@/lib/mongodb'
import VideoReel from '@/models/VideoReel'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret'

async function verifyAdmin() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDb()
    const { action, videoIds, data } = await request.json()

    if (!action || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let modifiedCount = 0
    let deletedCount = 0

    switch (action) {
      case 'activate': {
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { isActive: true } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'deactivate': {
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { isActive: false } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'feature': {
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { isFeatured: true } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'unfeature': {
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { isFeatured: false } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'setCategory': {
        if (!data?.category) {
          return NextResponse.json({ error: 'Category required' }, { status: 400 })
        }
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { category: data.category } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'showOnHomepage': {
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { showOnHomepage: true } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'hideFromHomepage': {
        const r = await VideoReel.updateMany({ _id: { $in: videoIds } }, { $set: { showOnHomepage: false } })
        modifiedCount = r.modifiedCount
        break
      }
      case 'delete': {
        const r = await VideoReel.deleteMany({ _id: { $in: videoIds } })
        deletedCount = r.deletedCount ?? 0
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed`,
      affectedCount: action === 'delete' ? deletedCount : modifiedCount,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
