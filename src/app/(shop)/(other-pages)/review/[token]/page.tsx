import connectDb from '@/lib/mongodb'
import { verifyOrderAccessToken } from '@/lib/order-access-token'
import { resolveReviewableItems, REVIEWABLE_ORDER_STATUSES } from '@/lib/reviews/order-review'
import Order from '@/models/Order'
import Review from '@/models/Review'
import { Metadata } from 'next'
import Link from 'next/link'
import OrderReviewClient from './OrderReviewClient'

// Personal page reached from an email link — never cached or indexed.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Review your order | The Cupcake Desire',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ token: string }> }

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="bake-canvas">
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <h1 className="bake-display-lg max-w-[20ch]">{title}</h1>
          <p className="bake-body-lg mt-6 max-w-[54ch]">{body}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/collections/all-items" className="bake-btn bake-btn-rose">
              Back to the shop
            </Link>
            <Link href="/contact" className="bake-btn bake-btn-ghost">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default async function OrderReviewPage({ params }: Props) {
  const { token: rawToken } = await params
  const token = decodeURIComponent(rawToken || '')
  const verified = verifyOrderAccessToken(token)
  if (!verified) {
    return (
      <Message
        title="This link doesn’t look right."
        body="It may have been cut short by your email app. Open the delivery email and tap the review button again."
      />
    )
  }

  await connectDb()
  const order: any = await Order.findOne({ orderId: verified.orderId }).lean()
  if (!order || !REVIEWABLE_ORDER_STATUSES.includes(order.status)) {
    return (
      <Message
        title="Reviews aren’t open for this order."
        body="Reviews open once an order has been paid for. If something went wrong with your order, please get in touch."
      />
    )
  }

  const items = await resolveReviewableItems(order)
  const reviewed = new Set(
    (await Review.find({ orderId: order.orderId }).select('productId').lean()).map((r: any) =>
      String(r.productId)
    )
  )

  return (
    <OrderReviewClient
      token={token}
      orderId={order.orderId}
      items={items.map((i) => ({ ...i, alreadyReviewed: reviewed.has(i.productId) }))}
    />
  )
}
