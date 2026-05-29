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

function serializeCategory(cat: any) {
  return {
    ...cat,
    _id: cat._id.toString()
  }
}

export async function GET() {
  try {
    await connectDb()
    
    const categories = await BlogCategory.find()
      .sort({ order: 1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      data: categories.map(serializeCategory)
    })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
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
    
    // Generate slug if not provided
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }
    
    // Get max order
    const maxOrder = await BlogCategory.findOne().sort({ order: -1 }).select('order')
    body.order = (maxOrder?.order || 0) + 1
    
    const category = await BlogCategory.create(body)
    
    return NextResponse.json({
      success: true,
      data: serializeCategory(category.toObject())
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating category:', error)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Category slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
