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

function serializeBundleOffer(offer: any) {
  if (!offer) return null
  return {
    ...offer,
    _id: offer._id.toString(),
    products: offer.products?.map((p: any) => ({
      ...p,
      productId: typeof p.productId === 'object' ? {
        ...p.productId,
        _id: p.productId._id?.toString()
      } : p.productId?.toString()
    })),
    targetProductIds: offer.targetProductIds?.map((p: any) => 
      typeof p === 'object' ? { ...p, _id: p._id?.toString() } : p.toString()
    ),
    excludeProductIds: offer.excludeProductIds?.map((id: any) => id.toString())
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDb()
    
    const offer = await BundleOffer.findById(id)
      .populate('products.productId', 'title handle images variants')
      .populate('targetProductIds', 'title handle images')
      .lean()
    
    if (!offer) {
      return NextResponse.json({ success: false, error: 'Bundle offer not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: serializeBundleOffer(offer)
    })
  } catch (error: any) {
    console.error('Error fetching bundle offer:', error)
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

    // Recalculate savings if prices changed
    if (body.originalPrice !== undefined && body.bundlePrice !== undefined) {
      body.savingsAmount = body.originalPrice - body.bundlePrice
      body.savingsPercentage = body.originalPrice > 0 
        ? Math.round((body.savingsAmount / body.originalPrice) * 100)
        : 0
    }
    
    const offer = await BundleOffer.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate('products.productId', 'title handle images variants')
      .populate('targetProductIds', 'title handle images')
      .lean()
    
    if (!offer) {
      return NextResponse.json({ success: false, error: 'Bundle offer not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: serializeBundleOffer(offer)
    })
  } catch (error: any) {
    console.error('Error updating bundle offer:', error)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Internal name already exists' }, { status: 400 })
    }
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
    
    const offer = await BundleOffer.findByIdAndDelete(id)
    
    if (!offer) {
      return NextResponse.json({ success: false, error: 'Bundle offer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Bundle offer deleted' })
  } catch (error: any) {
    console.error('Error deleting bundle offer:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
