import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ProductRecommendation from '@/models/ProductRecommendation'
import Product from '@/models/product.model'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single recommendation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await connectDb()
    
    const recommendation = await ProductRecommendation.findById(id).lean()
    
    if (!recommendation) {
      return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...(recommendation as any),
        _id: (recommendation as any)._id.toString(),
        productId: (recommendation as any).productId.toString()
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Update recommendation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await connectDb()
    
    const body = await request.json()
    const { recommendedHandles, displayLimit, isActive } = body
    
    const recommendation = await ProductRecommendation.findById(id)
    if (!recommendation) {
      return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 })
    }
    
    if (recommendedHandles?.length) {
      const recommendedProducts = await Product.find(
        { handle: { $in: recommendedHandles } },
        { _id: 1, handle: 1, title: 1, images: 1, price: 1 }
      ).lean()
      
      recommendation.recommendations = recommendedHandles.map((handle: string, index: number) => {
        const product = recommendedProducts.find((p: any) => p.handle === handle)
        if (!product) return null
        return {
          productId: (product as any)._id,
          productHandle: (product as any).handle,
          productTitle: (product as any).title,
          productImage: (product as any).images?.[0] || '',
          productPrice: (product as any).price || 0,
          position: index
        }
      }).filter(Boolean)
    }
    
    if (displayLimit !== undefined) recommendation.displayLimit = displayLimit
    if (isActive !== undefined) recommendation.isActive = isActive
    
    await recommendation.save()
    
    return NextResponse.json({
      success: true,
      data: { ...recommendation.toObject(), _id: recommendation._id.toString() }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Delete recommendation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await connectDb()
    
    const result = await ProductRecommendation.findByIdAndDelete(id)
    if (!result) {
      return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'Recommendation deleted' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
