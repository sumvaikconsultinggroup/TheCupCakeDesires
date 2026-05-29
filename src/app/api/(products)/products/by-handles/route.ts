import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const handlesParam = searchParams.get('handles')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    if (!handlesParam) {
      return NextResponse.json(
        { success: false, message: 'Product handles parameter is required' },
        { status: 400 }
      )
    }

    // Parse handles from comma-separated string
    const handles = handlesParam.split(',').filter(Boolean)

    if (handles.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one product handle is required' },
        { status: 400 }
      )
    }

    // Build filter - Only show active, published, non-deleted products
    const filter: any = {
      handle: { $in: handles },
      isDeleted: false,
      published: true, // Only show published products
      status: 'active', // Only show active products
    }

    // Category filter
    if (category) {
      filter.productCategory = { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter['variants.0.price'] = {}
      if (minPrice) {
        filter['variants.0.price'].$gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        filter['variants.0.price'].$lte = parseFloat(maxPrice)
      }
    }

    // Build sort
    let sortOption: any = {}
    switch (sort) {
      case 'newest':
        sortOption.createdAt = -1
        break
      case 'price-asc':
        sortOption['variants.0.price'] = 1
        break
      case 'price-desc':
        sortOption['variants.0.price'] = -1
        break
      case 'rating':
        sortOption.createdAt = -1
        break
      case 'bestselling':
        sortOption.createdAt = -1
        break
      default:
        sortOption.createdAt = -1
    }

    const products = await Product.find(filter).sort(sortOption).lean()

    return NextResponse.json(
      {
        success: true,
        products: products.map((p) => ({ ...p, _id: p._id?.toString() })),
        count: products.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error fetching products by handles:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}