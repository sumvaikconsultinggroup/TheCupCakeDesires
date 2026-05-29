import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import BundleOffer from '@/models/BundleOffer'
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

export async function POST(
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
    
    // Find original offer
    const original = await BundleOffer.findById(id).lean()
    
    if (!original) {
      return NextResponse.json({ success: false, error: 'Bundle offer not found' }, { status: 404 })
    }
    
    // Create duplicate
    const { _id, internalName, createdAt, updatedAt, usageCount, viewCount, clickCount, conversionCount, revenue, ...rest } = original as any
    
    const duplicate = await BundleOffer.create({
      ...rest,
      name: `${rest.name} (Copy)`,
      internalName: `${internalName}-copy-${Date.now()}`,
      isActive: false,
      usageCount: 0,
      viewCount: 0,
      clickCount: 0,
      conversionCount: 0,
      revenue: 0
    })
    
    return NextResponse.json({
      success: true,
      data: { ...duplicate.toObject(), _id: duplicate._id.toString() }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error duplicating bundle offer:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
