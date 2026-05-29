import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import NavigationItem from '@/models/NavigationItem'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
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

/* ===================== GET ===================== */

export async function GET(
  request: Request,
 {
  params,
}: {
  params: Promise<{ id: string }>
}
) {
  try {
    await connectDb()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 })
    }

    const item = await NavigationItem.findById(id).lean()
    if (!item) {
      return NextResponse.json({ success: false, error: 'Navigation item not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { ...item, _id: item._id.toString() },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch navigation item' },
      { status: 500 }
    )
  }
}

/* ===================== PUT ===================== */

export async function PUT(
  request: Request,
  {
  params,
}: {
  params: Promise<{ id: string }>
}
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDb()
    const { id } = await params
    const body = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 })
    }

    const existingItem = await NavigationItem.findById(id)
    if (!existingItem) {
      return NextResponse.json({ success: false, error: 'Navigation item not found' }, { status: 404 })
    }

    // Only image upload retained
    if (body.image && body.image.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(body.image, {
        folder: 'navigation',
      })
      body.image = uploadResponse.secure_url
    }

    // Prevent duplicate handle
    if (body.handle && body.handle !== existingItem.handle) {
      const duplicate = await NavigationItem.findOne({ handle: body.handle, _id: { $ne: id } })
      if (duplicate) {
        return NextResponse.json({ success: false, error: 'Handle already exists.' }, { status: 400 })
      }
    }

    const updatedItem = await NavigationItem.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean()

    return NextResponse.json({
      success: true,
      data: { ...updatedItem!, _id: updatedItem!._id.toString() },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update navigation item' },
      { status: 500 }
    )
  }
}

/* ===================== DELETE ===================== */

export async function DELETE(
  request: Request,
 {
  params,
}: {
  params: Promise<{ id: string }>
}
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDb()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 })
    }

    const deletedItem = await NavigationItem.findByIdAndDelete(id)
    if (!deletedItem) {
      return NextResponse.json({ success: false, error: 'Navigation item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Navigation item deleted successfully' })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete navigation item' },
      { status: 500 }
    )
  }
}
