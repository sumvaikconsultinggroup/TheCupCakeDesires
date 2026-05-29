import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'

// GET - List products with reviews
export async function GET(request: NextRequest) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    
    // Build query
    const query: any = {
      'reviews.0': { $exists: true } // Only products with reviews
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }
    
    const skip = (page - 1) * limit
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .select('title handle images reviews') // We need reviews to filter/show
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ])

    // Calculate global stats
    const statsAggregation = await Product.aggregate([
      { $unwind: '$reviews' },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$reviews.isApproved', true] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $ne: ['$reviews.isApproved', true] }, 1, 0] } }
        }
      }
    ])

    const stats = statsAggregation[0] || { totalReviews: 0, approved: 0, pending: 0 }
    
    return NextResponse.json({
      success: true,
      data: products,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching products with reviews:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update review status
export async function PUT(request: NextRequest) {
  try {
    await connectDb()
    const body = await request.json()
    const { productId, reviewId, isApproved } = body

    if (!productId || !reviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, 'reviews._id': reviewId },
      { 
        $set: { 
          'reviews.$.isApproved': isApproved 
        } 
      },
      { new: true }
    )

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product or review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Review updated' })
  } catch (error: any) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Bulk global actions
export async function PATCH(request: NextRequest) {
  try {
    await connectDb()
    const body = await request.json()
    const { action } = body

    if (action === 'approve_all_pending') {
      await Product.updateMany(
        { 'reviews.isApproved': false },
        { $set: { 'reviews.$[elem].isApproved': true } },
        { arrayFilters: [{ 'elem.isApproved': false }] }
      )
      return NextResponse.json({ success: true, message: 'All pending reviews approved' })
    }

    if (action === 'reject_all_pending') {
      // "Reject All" in this context will delete all pending reviews
      await Product.updateMany(
        {},
        { $pull: { reviews: { isApproved: false } } }
      )
      return NextResponse.json({ success: true, message: 'All pending reviews rejected (deleted)' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in bulk action:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create a new review (Admin manual creation) - Kept for compatibility if needed, but simplified
export async function POST(request: NextRequest) {
  try {
    await connectDb()
    
    const body = await request.json()
    const {
      productHandle,
      customerName,
      customerEmail,
      rating,
      title,
      content,
      images,
      isApproved
    } = body
    
    const product = await Product.findOne({ handle: productHandle })
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const newReview = {
      star: rating,
      reviewerName: customerName,
      reviewDescription: content,
      image: images?.[0], // Assuming single image for now based on schema
      isApproved: isApproved ?? true,
      userId: null,
      helpfulCount: 0,
      helpfulVotes: []
    }

    product.reviews.push(newReview)
    await product.save()

    return NextResponse.json({
      success: true,
      data: product.reviews[product.reviews.length - 1]
    })
  } catch (error: any) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
