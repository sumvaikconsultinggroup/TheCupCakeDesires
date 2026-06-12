import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import Review from '@/models/Review'
import { verifyAdminRequest } from '@/lib/auth'

function serializeReview(review: Record<string, unknown>, productImage?: string) {
  return {
    ...review,
    _id: String(review._id),
    productId: String(review.productId),
    productImage: productImage || '',
  }
}

// GET - List reviews from Review collection
export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status') || 'all'
    const rating = searchParams.get('rating') || 'all'
    const productHandle = searchParams.get('product') || 'all'

    const query: Record<string, unknown> = {}

    if (status !== 'all') {
      query.status = status
    }

    if (rating !== 'all') {
      const ratingNum = parseInt(rating)
      if (!Number.isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum
      }
    }

    if (productHandle !== 'all') {
      query.productHandle = productHandle
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { productTitle: { $regex: search, $options: 'i' } },
        { productHandle: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [reviews, total, statsAggregation] = await Promise.all([
      Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(query),
      Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          },
        },
      ]),
    ])

    const handles = [
      ...new Set(
        reviews.map((r: Record<string, unknown>) => String(r.productHandle ?? '')).filter(Boolean)
      ),
    ]
    const products = await Product.find(
      { handle: { $in: handles } },
      { handle: 1, images: 1 }
    ).lean()
    const imageMap = new Map(
      products.map((p: Record<string, unknown>) => {
        const images = p.images as { src?: string }[] | undefined
        return [String(p.handle ?? ''), images?.[0]?.src || ''] as const
      })
    )

    const stats = statsAggregation[0] || {
      totalReviews: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    }

    return NextResponse.json({
      success: true,
      data: reviews.map((r: Record<string, unknown>) =>
        serializeReview(r, imageMap.get(r.productHandle as string))
      ),
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PATCH - Bulk global actions on pending reviews
export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const body = await request.json()
    const { action } = body

    if (action === 'approve_all_pending') {
      const res = await Review.updateMany(
        { status: 'pending' },
        {
          $set: {
            status: 'approved',
            reviewedBy: auth.user.email || 'Admin',
            reviewedAt: new Date(),
          },
        }
      )
      return NextResponse.json({
        success: true,
        message: `Approved ${res.modifiedCount} pending reviews`,
      })
    }

    if (action === 'reject_all_pending') {
      const res = await Review.updateMany(
        { status: 'pending' },
        {
          $set: {
            status: 'rejected',
            reviewedBy: auth.user.email || 'Admin',
            reviewedAt: new Date(),
          },
        }
      )
      return NextResponse.json({
        success: true,
        message: `Rejected ${res.modifiedCount} pending reviews`,
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in bulk action:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST - Admin manual review creation
export async function POST(request: NextRequest) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

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
      status,
      adminNotes,
    } = body

    if (!productHandle || !customerName || !customerEmail || !rating || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const product = await Product.findOne({ handle: productHandle, isDeleted: { $ne: true } })
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const reviewStatus =
      status === 'pending' || status === 'rejected' || status === 'approved'
        ? status
        : 'approved'

    const created = await Review.create({
      productId: product._id,
      productHandle: product.handle,
      productTitle: product.title,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      rating,
      title,
      content,
      images: images || [],
      status: reviewStatus,
      isVerifiedPurchase: false,
      source: 'manual',
      adminNotes: adminNotes || undefined,
      reviewedBy: reviewStatus !== 'pending' ? auth.user.email || 'Admin' : undefined,
      reviewedAt: reviewStatus !== 'pending' ? new Date() : undefined,
    })

    return NextResponse.json({
      success: true,
      data: serializeReview(created.toObject()),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating review:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
