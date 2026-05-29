import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import BlogCategory from '@/models/BlogCategory'
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
    
    const category = await BlogCategory.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean()
    
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: { ...category, _id: (category as any)._id.toString() }
    })
  } catch (error: any) {
    console.error('Error updating category:', error)
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
    
    const category = await BlogCategory.findByIdAndDelete(id)
    
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
