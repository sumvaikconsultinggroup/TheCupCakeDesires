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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDb()
    
    const banner = await HomeBanner.findById(id).lean()
    
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: { ...(banner as any), _id: (banner as any)._id.toString() }
    })
  } catch (error: any) {
    console.error('Error fetching banner:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    await connectDb()
    const body = await request.json()
    
    const banner = await HomeBanner.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean()
    
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: { ...(banner as any), _id: (banner as any)._id.toString() }
    })
  } catch (error: any) {
    console.error('Error updating banner:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    await connectDb()
    
    const banner = await HomeBanner.findByIdAndDelete(id)
    
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Banner deleted' })
  } catch (error: any) {
    console.error('Error deleting banner:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
