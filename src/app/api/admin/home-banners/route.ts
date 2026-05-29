import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import HomeBanner from '@/models/HomeBanner'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret-ad5f7eaf7fc29d4d02762686eecdabc3'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export async function GET() {
  try {
    await connectDb()
    
    const banners = await HomeBanner.find()
      .sort({ order: 1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      data: banners.map((b: any) => ({ ...b, _id: b._id.toString() }))
    })
  } catch (error: any) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    await connectDb()
    const body = await request.json()
    
    // Get max order
    const maxOrder = await HomeBanner.findOne().sort({ order: -1 }).select('order')
    const order = (maxOrder?.order || 0) + 1
    
    const banner = await HomeBanner.create({
      ...body,
      order
    })
    
    return NextResponse.json({
      success: true,
      data: { ...banner.toObject(), _id: banner._id.toString() }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating banner:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
