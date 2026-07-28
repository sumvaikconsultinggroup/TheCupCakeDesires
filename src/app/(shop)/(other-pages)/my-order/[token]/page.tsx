import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyOrderAccessToken } from '@/lib/order-access-token'
import { Metadata } from 'next'
import Link from 'next/link'
import GuestOrderClient, { type GuestOrderView } from './GuestOrderClient'

// This page is reached from a link in an email and shows one person's booking —
// it must never be cached, indexed, or shared between requests.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your booking | The Cupcake Desire',
  robots: { index: false, follow: false },
}

type Props = { params: Promise<{ token: string }> }

const money = (n: unknown) => Number(n ?? 0)

export default async function MyOrderPage({ params }: Props) {
  const { token } = await params
  const verified = verifyOrderAccessToken(decodeURIComponent(token || ''))

  if (!verified) {
    return (
      <main className="bake-canvas">
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Booking link
            </p>
            <h1 className="bake-display-lg mt-6 max-w-[20ch]">
              This link doesn&rsquo;t look right.
            </h1>
            <p className="bake-body-lg mt-6 max-w-[54ch]">
              It may have been mistyped or cut short by your email app. Open the most recent
              confirmation email and click the button again, or look your booking up with your
              order number.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/track-order" className="bake-btn bake-btn-rose">
                Track my order
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

  await connectDb()
  const order: any = await Order.findOne({ orderId: verified.orderId }).lean()

  if (!order) {
    return (
      <main className="bake-canvas">
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <h1 className="bake-display-lg max-w-[20ch]">We couldn&rsquo;t find that booking.</h1>
            <p className="bake-body-lg mt-6 max-w-[54ch]">
              It may have been removed. Please get in touch and we&rsquo;ll track it down for you.
            </p>
            <Link href="/contact" className="bake-btn bake-btn-rose mt-9">
              Contact us
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const addr = order.deliveryAddress || order.shippingAddress || {}

  // Hand the client only what the page renders — no payment identifiers, no
  // internal notes, no other customer's data.
  const view: GuestOrderView = {
    orderId: order.orderId || '',
    status: order.status || 'pending_payment',
    placedOn: order.createdAt ? new Date(order.createdAt).toISOString() : null,
    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString() : null,
    deliverySlot: order.deliverySlot || null,
    items: (order.items || []).map((i: any) => ({
      name: i.name || 'Item',
      quantity: Number(i.quantity || 1),
      price: money(i.price),
      imageUrl: i.imageUrl || null,
      logoUrl: i.logoUrl || null,
      variants: (i.variants || [])
        .filter((v: any) => v?.name && v?.option && v.name !== 'Logo')
        .map((v: any) => ({ name: String(v.name), option: String(v.option) })),
    })),
    subtotal: money(order.subtotal ?? order.totalAmount),
    discount: money(order.discount),
    shipping: money(order.shipping),
    tax: money(order.tax),
    total: money(order.totalAmount),
    customerName: `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'there',
    address: {
      line1: addr.address || addr.address1 || '',
      city: addr.city || '',
      state: addr.state || '',
      zipcode: addr.zipcode || '',
      phone: addr.phone || '',
    },
    paymentMethod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toUpperCase() || null,
  }

  return <GuestOrderClient order={view} token={token} />
}
