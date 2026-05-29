import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import NavigationItem, { INavigation } from '@/models/NavigationItem'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret-ad5f7eaf7fc29d4d02762686eecdabc3'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

// GET - Fetch all navigation items
export async function GET(request: Request) {
  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query: any = {}
    if (activeOnly) {
      query.isActive = true
    }

    const items = await NavigationItem.find(query)
      .sort({ position: 1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: items.map((item: any) => ({
        ...item,
        _id: item._id.toString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching navigation:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch navigation' },
      { status: 500 }
    )
  }
}

// POST - Create new navigation item
export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    let body: any = await request.json()

    // Handle image upload if it's a base64 string
    if (body.type === 'mega-product' && body.image && body.image.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(body.image, {
        folder: 'navigation',
      })
      body.image = uploadResponse.secure_url
    }

    // Check for duplicate handle within the same type
    const existingHandle = await NavigationItem.findOne({ handle: body.handle, type: body.type })
    if (existingHandle) {
      return NextResponse.json({ success: false, error: 'Handle already exists for this type.' }, { status: 400 })
    }

    const newItem = await NavigationItem.create(body)

    return NextResponse.json({
      success: true,
      data: {
        ...newItem.toObject(),
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating navigation item:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create navigation item' },
      { status: 500 }
    )
  }
}
