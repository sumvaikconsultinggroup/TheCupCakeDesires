import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import Review from '@/models/Review'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reviewSchema = z.object({
  productHandle: z.string().min(1, 'Product handle is required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3, 'Title is too short').max(120, 'Title is too long'),
  content: z.string().trim().min(10, 'Tell us a bit more').max(2000, 'Review is too long'),
})

/** Public list of approved customer notes (optionally filtered by product / rating). */
export async function GET(request: Request) {
  try {
    await connectDb()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') || 24)))
    const skip = (page - 1) * limit
    const rating = Number(searchParams.get('rating') || 0)
    const productHandle = (searchParams.get('product') || '').trim()

    const filter: Record<string, unknown> = { status: 'approved' }
    if (rating >= 1 && rating <= 5) filter.rating = rating
    if (productHandle) filter.productHandle = productHandle

    const [reviews, total, statsAgg, productsAgg] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          'customerName rating title content productTitle productHandle isVerifiedPurchase createdAt images'
        )
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            five: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            four: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            three: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            two: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            one: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      ]),
      Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$productHandle',
            title: { $first: '$productTitle' },
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            latestAt: { $max: '$createdAt' },
          },
        },
        { $sort: { count: -1, latestAt: -1 } },
      ]),
    ])

    const stats = statsAgg[0] || {
      count: 0,
      avgRating: 0,
      five: 0,
      four: 0,
      three: 0,
      two: 0,
      one: 0,
    }

    const handles = productsAgg.map((p) => String(p._id)).filter(Boolean)
    const productDocs = handles.length
      ? await Product.find({ handle: { $in: handles }, isDeleted: { $ne: true } })
          .select('handle title images')
          .lean<{ handle: string; title: string; images?: { src?: string }[] }[]>()
      : []
    const imageByHandle = new Map(
      productDocs.map((p) => [p.handle, p.images?.[0]?.src || ''])
    )

    return NextResponse.json({
      success: true,
      data: reviews.map((r) => ({
        id: String(r._id),
        customerName: r.customerName,
        rating: r.rating,
        title: r.title,
        content: r.content,
        productTitle: r.productTitle,
        productHandle: r.productHandle,
        isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
        images: r.images || [],
        createdAt: r.createdAt,
      })),
      products: productsAgg.map((p) => ({
        handle: String(p._id),
        title: p.title || String(p._id),
        count: p.count,
        avgRating: Math.round((p.avgRating || 0) * 10) / 10,
        image: imageByHandle.get(String(p._id)) || '',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        count: stats.count,
        avgRating: Math.round((stats.avgRating || 0) * 10) / 10,
        distribution: {
          5: stats.five,
          4: stats.four,
          3: stats.three,
          2: stats.two,
          1: stats.one,
        },
      },
    })
  } catch (error: unknown) {
    console.error('Review GET failed:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to write a review.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || 'Invalid review',
          issues: parsed.error.issues,
        },
        { status: 400 }
      )
    }

    await connectDb()

    const product = await Product.findOne({
      handle: parsed.data.productHandle,
      isDeleted: { $ne: true },
    }).lean<{ _id: unknown; title: string; handle: string } | null>()

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    const email =
      user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username ||
      email.split('@')[0] ||
      'Anonymous'

    const created = await Review.create({
      productId: product._id,
      productHandle: product.handle,
      productTitle: product.title,
      customerName: name,
      customerEmail: email,
      rating: parsed.data.rating,
      title: parsed.data.title,
      content: parsed.data.content,
      images: [],
      status: 'pending',
      isVerifiedPurchase: false,
      source: 'website',
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Thanks — your review is in the kitchen for approval.',
        data: { id: String(created._id) },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Review POST failed:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
