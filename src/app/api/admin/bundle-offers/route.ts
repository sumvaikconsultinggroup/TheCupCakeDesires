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
  return {
    ...offer,
    _id: offer._id.toString(),

    products: offer.products?.map((p: any) => ({
      ...p,
      productId: p.productId?.toString()
    })),

    targetProductIds: offer.targetProductIds?.map((id: any) =>
      id.toString()
    )
  };
}


export async function GET(request: Request) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    
    const query: any = {}
    
    if (status === 'active') {
      query.isActive = true
    } else if (status === 'inactive') {
      query.isActive = false
    }
    
    if (type) {
      query.bundleType = type
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { internalName: { $regex: search, $options: 'i' } }
      ]
    }
    
    const offers = await BundleOffer.find(query)
      .populate('products.productId', 'title handle images variants')
      .populate('targetProductIds', 'title handle')
      .sort({ priority: -1, createdAt: -1 })
      .lean()
    
    return NextResponse.json({
      success: true,
      data: offers
    })
  } catch (error: any) {
    console.error('Error fetching bundle offers:', error)
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
    
    // Generate internal name if not provided
    if (!body.internalName) {
      body.internalName = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now()
    }
    
    // Calculate savings if prices provided
    if (body.originalPrice && body.bundlePrice) {
      body.savingsAmount = body.originalPrice - body.bundlePrice
      body.savingsPercentage = Math.round((body.savingsAmount / body.originalPrice) * 100)
    }
    
    // Get max priority
    const maxPriority = await BundleOffer.findOne().sort({ priority: -1 }).select('priority')
    body.priority = (maxPriority?.priority || 0) + 1
    
    const offer = await BundleOffer.create(body)
    
    // Populate and return
    const populated = await BundleOffer.findById(offer._id)
      .populate('products.productId', 'title handle images variants')
      .populate('targetProductIds', 'title handle')
      .lean()
    
    return NextResponse.json({
      success: true,
      data: populated
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bundle offer:', error)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Internal name already exists' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
