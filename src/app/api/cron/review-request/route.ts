import { sendReviewRequestEmail } from '@/lib/email-service'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Review from '@/models/Review'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Daily: one review-request email per delivered order, 3–14 days after
 * delivery, skipped when the customer has already reviewed that order.
 * The window's upper bound stops a first run from emailing old customers.
 */
const MIN_DAYS = 3
const MAX_DAYS = 14
const BATCH = 100

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  await connectDb()
  const day = 24 * 60 * 60 * 1000
  const now = Date.now()

  const orders: any[] = await Order.find({
    status: 'delivered',
    reviewRequestSentAt: { $exists: false },
    statusLogs: {
      $elemMatch: {
        status: 'delivered',
        timestamp: { $lte: new Date(now - MIN_DAYS * day), $gte: new Date(now - MAX_DAYS * day) },
      },
    },
  })
    .limit(BATCH)
    .lean()

  const reviewed = new Set(
    (await Review.find({ orderId: { $in: orders.map((o) => o.orderId) } }).distinct('orderId')).map(String)
  )

  let sent = 0
  let skipped = 0
  for (const order of orders) {
    if (reviewed.has(order.orderId)) {
      skipped++
    } else {
      const res = await sendReviewRequestEmail(order)
      if (!res.success) {
        console.error('[cron/review-request] send failed', order.orderId, res.error)
        continue
      }
      sent++
    }
    await Order.updateOne({ _id: order._id }, { $set: { reviewRequestSentAt: new Date() } })
  }

  return NextResponse.json({ success: true, candidates: orders.length, sent, skipped })
}
