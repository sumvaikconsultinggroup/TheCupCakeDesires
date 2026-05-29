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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDb()
    
    const section = await HomeSection.findById(id)
      .populate('products', 'title handle images variants')
      .lean()
    
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...(section as any),
        _id: (section as any)._id.toString(),
        products: (section as any).products?.map((p: any) => ({
          ...p,
          _id: p._id.toString()
        }))
      }
    })
  } catch (error: any) {
    console.error('Error fetching section:', error)
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
    
    const section = await HomeSection.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('products', 'title handle images variants').lean()
    
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...(section as any),
        _id: (section as any)._id.toString(),
        products: (section as any).products?.map((p: any) => ({
          ...p,
          _id: p._id.toString()
        }))
      }
    })
  } catch (error: any) {
    console.error('Error updating section:', error)
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
    
    const section = await HomeSection.findByIdAndDelete(id)
    
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Section deleted' })
  } catch (error: any) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
