'use client'

import { useCart } from '@/components/useCartStore'
import { CalendarCheck, CheckCircle2, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

interface OrderItem {
  productId?: string
  name: string
  quantity: number
  price: number
  imageUrl?: string
  variants?: Array<{ name: string; option: string }>
}

interface Order {
  id: string
  orderId: string
  totalAmount: number
  subtotal?: number
  taxableValue?: number
  taxes?: number
  shipping?: number
  discount?: number
  items: OrderItem[]
  createdAt: string
  status: string
  deliveryDate?: string
  deliverySlot?: string
  paymentDetails?: {
    paymentMethod?: string
    transactionId?: string
    paymentStatus?: string
  }
}

const money = (n?: number) => `$${Number(n || 0).toFixed(2)}`

function Loader() {
  return (
    <main className="font-bake-body flex min-h-[70vh] flex-col items-center justify-center bg-ivory text-cocoa">
      <div className="size-10 animate-spin rounded-full border-[3px] border-line border-t-cocoa" />
      <p className="mt-4 text-sm font-medium text-taupe">Fetching your order details…</p>
    </main>
  )
}

function OrderSuccessfulContent() {
  const searchParams = useSearchParams()
  const txnid = searchParams.get('txnid')
  const orderId = searchParams.get('orderId')
  const sessionId = searchParams.get('session_id')
  const { removeAll } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    removeAll()
  }, [removeAll])

  useEffect(() => {
    const fetchOrder = async () => {
      if (!txnid && !orderId && !sessionId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)

        // Verify the Stripe session server-side first. This reconciles the order
        // to "paid" even if the async webhook hasn't landed yet (e.g. local dev
        // without `stripe listen`), so the admin/backend never shows a stale
        // "Awaiting payment" for an order the customer actually paid.
        if (sessionId) {
          try {
            await fetch('/api/stripe/verify-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            })
          } catch {
            /* non-fatal — the order fetch below still shows details */
          }
        }

        const response = txnid
          ? await fetch(`/api/orders/by-transaction?txnid=${txnid}`)
          : await fetch(`/api/orders/${orderId}`)

        const data = await response.json()
        if (!response.ok || !data.success) {
          setError(data.error || 'Order not found')
          setOrder(null)
        } else {
          setOrder(data.order)
          setError(null)
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to fetch order details')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [txnid, orderId, sessionId])

  if (loading) return <Loader />

  const idToShow = txnid || orderId
  const subtotalExclGst =
    order?.taxableValue ??
    (order?.subtotal ? Math.round((order.subtotal / 1.1) * 100) / 100 : order?.totalAmount)

  return (
    <main className="font-bake-body min-h-screen bg-ivory text-cocoa">
      {/* Soft celebratory top wash */}
      <div className="relative overflow-hidden bg-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-rose-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-cocoa/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-[720px] px-6 py-14 text-center md:py-20">
          {error ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-accent/12 text-rose-accent">
                <Package className="h-8 w-8" strokeWidth={1.6} />
              </div>
              <h1 className="bake-display-xl mt-6 text-cocoa">Order not found</h1>
              <p className="bake-body mt-3 text-cocoa-soft">
                We couldn&rsquo;t find that order. If you were charged, please reach out and we&rsquo;ll sort it
                out right away.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-9 w-9" strokeWidth={1.7} />
              </div>
              <p className="bake-eyebrow mt-6">
                <span className="mr-2 inline-block h-px w-6 align-middle bg-rose-accent" />
                Thank you for your order
              </p>
              <h1 className="bake-display-xl mt-3 text-cocoa">
                Order <span className="bake-display-italic text-rose-accent">confirmed.</span>
              </h1>
              <p className="bake-body mt-3 text-cocoa-soft">
                We&rsquo;re on it — your box will be baked fresh and hand-delivered on your chosen day.
              </p>

              {idToShow && (
                <div className="mt-7 inline-flex flex-col items-center">
                  <span className="bake-caption text-taupe">Your order ID</span>
                  <span className="mt-1.5 rounded-full border border-line bg-ivory px-5 py-2 font-mono text-[15px] font-medium text-cocoa">
                    {idToShow}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Order details */}
      {order && order.items && order.items.length > 0 && (
        <section className="mx-auto max-w-[720px] px-6 pb-24 pt-10">
          <div className="overflow-hidden rounded-3xl border border-line bg-cream/50">
            {/* Summary header */}
            <div className="flex items-start justify-between gap-4 border-b border-line bg-ivory px-6 py-5">
              <div>
                <p className="bake-caption text-taupe">Order</p>
                <p className="font-bake-display mt-0.5 text-[18px] font-medium text-cocoa">
                  {order.orderId || order.id}
                </p>
              </div>
              <div className="text-right">
                <p className="bake-caption text-taupe">Total paid</p>
                <p className="font-bake-display mt-0.5 text-[22px] font-semibold text-cocoa">
                  {money(order.totalAmount)}
                </p>
                <p className="text-[11px] text-taupe">Inclusive of GST</p>
              </div>
            </div>

            {/* Delivery */}
            {(order.deliveryDate || order.deliverySlot) && (
              <div className="flex items-center gap-3 border-b border-line bg-rose/40 px-6 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-ivory">
                  <CalendarCheck className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="bake-caption text-taupe">Delivering</p>
                  <p className="text-sm font-medium text-cocoa">
                    {order.deliveryDate
                      ? new Date(order.deliveryDate).toLocaleDateString('en-AU', {
                          timeZone: 'Australia/Melbourne',
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })
                      : 'On your chosen date'}
                    {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-2.5 px-6 py-5 text-sm">
              <div className="flex justify-between">
                <span className="text-cocoa-soft">Subtotal (excl GST)</span>
                <span className="tabular-nums text-cocoa">{money(subtotalExclGst)}</span>
              </div>
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-cocoa-soft">Discount</span>
                  <span className="tabular-nums font-medium text-green-600">
                    -{money(order.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-cocoa-soft">GST (incl.)</span>
                <span className="tabular-nums text-cocoa">{money(order.taxes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cocoa-soft">Delivery</span>
                <span className="tabular-nums text-cocoa">
                  {(order.shipping ?? 0) === 0 ? (
                    <span className="font-medium text-green-600">Free</span>
                  ) : (
                    money(order.shipping)
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <span className="font-semibold text-cocoa">Total</span>
                <span className="font-bake-display text-[17px] font-semibold tabular-nums text-cocoa">
                  {money(order.totalAmount)}
                </span>
              </div>
              {order.paymentDetails?.paymentMethod && (
                <p className="pt-1 text-xs text-taupe">
                  Paid via <span className="capitalize">{order.paymentDetails.paymentMethod}</span> · Secured by
                  Stripe
                </p>
              )}
            </div>

            {/* Items */}
            <div className="border-t border-line px-6 py-5">
              <p className="bake-caption mb-4 text-taupe">Your box</p>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-line bg-ivory">
                      <Image
                        alt={item.name || 'Product'}
                        src={item.imageUrl || '/placeholder-images.webp'}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[15px] font-medium text-cocoa">
                        {item.productId ? (
                          <Link href={`/products/${item.productId}`} className="hover:text-rose-accent">
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}
                      </h4>
                      {item.variants && item.variants.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-taupe">
                          {item.variants.map((v) => v.option).filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-cocoa-soft">Qty {item.quantity}</p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums text-cocoa">
                      {money(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/collections/all"
              className="inline-flex items-center justify-center rounded-full bg-cocoa px-7 py-3.5 text-[15px] font-medium text-ivory transition-colors hover:bg-rose-accent"
            >
              Keep shopping
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full border border-line bg-ivory px-7 py-3.5 text-[15px] font-medium text-cocoa-soft transition-colors hover:border-rose-accent hover:text-cocoa"
            >
              View my orders
            </Link>
          </div>
        </section>
      )}

      {/* No-items / error fallback action */}
      {(!order || !order.items?.length) && (
        <section className="mx-auto max-w-[720px] px-6 pb-24 pt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-cocoa px-7 py-3.5 text-[15px] font-medium text-ivory transition-colors hover:bg-rose-accent"
          >
            Back to home
          </Link>
        </section>
      )}
    </main>
  )
}

export default function OrderSuccessfulPage() {
  return (
    <Suspense fallback={<Loader />}>
      <OrderSuccessfulContent />
    </Suspense>
  )
}
