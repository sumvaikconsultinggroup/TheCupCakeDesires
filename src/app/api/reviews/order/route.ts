import connectDb from '@/lib/mongodb'
import { verifyOrderAccessToken } from '@/lib/order-access-token'
import {
  pickOrderCustomer,
  resolveReviewableItems,
  REVIEWABLE_ORDER_STATUSES,
} from '@/lib/reviews/order-review'
import Order from '@/models/Order'
import Review from '@/models/Review'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Verified-buyer reviews from the signed link in the delivery emails. The
 * token is the credential (same HMAC token as the "manage your booking" link),
 * so guests can review without an account. Reviews still go to the admin
 * queue as `pending` — nothing is published without approval.
 */
const bodySchema = z.object({
  token: z.string().min(10),
  reviews: z
    .array(
      z.object({
        productId: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        title: z.string().trim().min(3, 'Title is too short').max(120, 'Title is too long'),
        content: z.string().trim().min(10, 'Tell us a bit more').max(2000, 'Review is too long'),
      })
    )
    .min(1, 'Rate at least one item')
    .max(20),
})

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid review' },
        { status: 400 }
      )
    }

    const verified = verifyOrderAccessToken(parsed.data.token)
    if (!verified) {
      return NextResponse.json({ success: false, message: 'This review link is not valid.' }, { status: 401 })
    }

    await connectDb()
    const order: any = await Order.findOne({ orderId: verified.orderId }).lean()
    if (!order || !REVIEWABLE_ORDER_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { success: false, message: 'Reviews open once your order has been paid for.' },
        { status: 403 }
      )
    }

    const items = await resolveReviewableItems(order)
    const byId = new Map(items.map((i) => [i.productId, i]))
    const already = new Set(
      (await Review.find({ orderId: order.orderId }).select('productId').lean()).map((r: any) =>
        String(r.productId)
      )
    )

    const inOrder = parsed.data.reviews.filter((r) => byId.has(r.productId))
    if (inOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Those items are not part of this order.' },
        { status: 400 }
      )
    }

    const { name, email } = pickOrderCustomer(order)
    const docs = inOrder
      .filter((r) => !already.has(r.productId))
      .map((r) => {
        const item = byId.get(r.productId)!
        return {
          productId: item.productId,
          productHandle: item.handle,
          productTitle: item.title,
          customerName: name,
          customerEmail: email || 'unknown@thecupcakedesire.com.au',
          rating: r.rating,
          title: r.title,
          content: r.content,
          images: [],
          status: 'pending' as const,
          isVerifiedPurchase: true,
          orderId: order.orderId,
          source: 'website' as const,
        }
      })

    if (docs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'You have already reviewed these items — thank you!' },
        { status: 409 }
      )
    }

    await Review.insertMany(docs)
    return NextResponse.json(
      { success: true, message: 'Thank you! Your review is with our team for approval.', count: docs.length },
      { status: 201 }
    )
  } catch (error) {
    console.error('[reviews/order] POST failed:', error)
    return NextResponse.json({ success: false, message: 'Could not save your review.' }, { status: 500 })
  }
}
