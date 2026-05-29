import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import HomeSection from '@/models/HomeSection'
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
    
    const sections = await HomeSection.find()
      .sort({ order: 1 })
      .populate('products', 'title handle images variants')
      .lean()
    
    return NextResponse.json({
      success: true,
      data: sections.map((s: any) => ({
        ...s,
        _id: s._id.toString(),
        products: s.products?.map((p: any) => ({
          ...p,
          _id: p._id.toString()
        }))
      }))
    })
  } catch (error: any) {
    console.error('Error fetching sections:', error)
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
    const maxOrder = await HomeSection.findOne().sort({ order: -1 }).select('order')
    const order = body.order ?? (maxOrder?.order || 0) + 1
    
    const section = await HomeSection.create({
      ...body,
      order
    })
    
    return NextResponse.json({
      success: true,
      data: { ...section.toObject(), _id: section._id.toString() }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating section:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
