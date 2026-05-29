import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ProductRecommendation from '@/models/ProductRecommendation'
import Product from '@/models/product.model'

// GET - List all recommendations with filters
export async function GET(request: NextRequest) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    const query: any = {}
    
    if (type && type !== 'all') {
      query.type = type
    }
    
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false
    
    if (search) {
      query.$or = [
        { productTitle: { $regex: search, $options: 'i' } },
        { productHandle: { $regex: search, $options: 'i' } }
      ]
    }
    
    const skip = (page - 1) * limit
    
    const [recommendations, total] = await Promise.all([
      ProductRecommendation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductRecommendation.countDocuments(query)
    ])
    
    // Get stats
    const stats = await ProductRecommendation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          youMayAlsoLike: { $sum: { $cond: [{ $eq: ['$type', 'you_may_also_like'] }, 1, 0] } },
          boughtTogether: { $sum: { $cond: [{ $eq: ['$type', 'bought_together'] }, 1, 0] } },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      }
    ])
    
    const serialized = recommendations.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      productId: r.productId.toString(),
      recommendations: r.recommendations.map((rec: any) => ({
        ...rec,
        productId: rec.productId.toString()
      })),
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString()
    }))
    
    return NextResponse.json({
      success: true,
      data: serialized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: stats[0] || { total: 0, youMayAlsoLike: 0, boughtTogether: 0, active: 0 }
    })
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create new recommendation
export async function POST(request: NextRequest) {
  try {
    await connectDb()
    
    const body = await request.json()
    const { productHandle, type, recommendedHandles, displayLimit, isActive } = body
    
    if (!productHandle || !type || !recommendedHandles?.length) {
      return NextResponse.json(
        { success: false, error: 'Product handle, type, and recommendations are required' },
        { status: 400 }
      )
    }
    
    // Get source product
    const sourceProduct = await Product.findOne({ handle: productHandle }).lean()
    if (!sourceProduct) {
      return NextResponse.json({ success: false, error: 'Source product not found' }, { status: 404 })
    }
    
    // Get recommended products
    const recommendedProducts = await Product.find(
      { handle: { $in: recommendedHandles } },
      { _id: 1, handle: 1, title: 1, images: 1, price: 1, variants: 1 }
    ).lean()
    
    const recommendations = recommendedHandles.map((handle: string, index: number) => {
      const product = recommendedProducts.find((p: any) => p.handle === handle)
      if (!product) return null
      const p = product as any
      const firstVariant = p.variants?.[0]
      // Handle images stored as objects with src property
      const imageValue = p.images?.[0]
      const imageUrl = typeof imageValue === 'object' ? imageValue?.src : (imageValue || '')
      return {
        productId: p._id,
        productHandle: p.handle,
        productTitle: p.title,
        productImage: imageUrl,
        productPrice: firstVariant?.price || p.price || 0,
        position: index
      }
    }).filter(Boolean)
    
    // Check if recommendation already exists
    const existing = await ProductRecommendation.findOne({ productHandle, type })
    
    if (existing) {
      // Update existing
      existing.recommendations = recommendations
      existing.displayLimit = displayLimit || 4
      existing.isActive = isActive !== false
      await existing.save()
      
      return NextResponse.json({
        success: true,
        data: { ...existing.toObject(), _id: existing._id.toString() },
        message: 'Recommendation updated'
      })
    }
    
    // Create new
    const recommendation = await ProductRecommendation.create({
      productId: (sourceProduct as any)._id,
      productHandle: (sourceProduct as any).handle,
      productTitle: (sourceProduct as any).title,
      type,
      recommendations,
      displayLimit: displayLimit || 4,
      isActive: isActive !== false,
      isAutoGenerated: false
    })
    
    return NextResponse.json({
      success: true,
      data: { ...recommendation.toObject(), _id: recommendation._id.toString() }
    })
  } catch (error: any) {
    console.error('Error creating recommendation:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
