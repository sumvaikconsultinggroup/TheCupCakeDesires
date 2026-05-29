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
      isDeleted: false,
    }).lean<{ _id: any; title: string; handle: string } | null>()

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      ''
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
  } catch (error: any) {
    console.error('Review POST failed:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
