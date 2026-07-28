'use client'

import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export interface GuestOrderView {
  orderId: string
  status: string
  placedOn: string | null
  deliveryDate: string | null
  deliverySlot: string | null
  items: {
    name: string
    quantity: number
    price: number
    imageUrl: string | null
    logoUrl: string | null
    variants: { name: string; option: string }[]
  }[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  customerName: string
  address: { line1: string; city: string; state: string; zipcode: string; phone: string }
  paymentMethod: string | null
}

const AUD = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(n) || 0)

const longDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-AU', {
        timeZone: 'Australia/Melbourne',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Confirmed',
  in_kitchen: 'In the kitchen',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

// Mirrors the server-side rules in lib/order-cancellation.ts. This only decides
// whether to SHOW the button — the server decides whether it works.
const CANCELLABLE = new Set(['pending_payment', 'paid', 'in_kitchen'])

export default function GuestOrderClient({
  order,
  token,
}: {
  order: GuestOrderView
  token: string
}) {
  const [status, setStatus] = useState(order.status)
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const canCancel = CANCELLABLE.has(status)
  const isCancelled = status === 'cancelled' || status === 'refunded'

  const cancel = async () => {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/orders/guest/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      })
      const data = await res.json()
      setResult({ ok: !!data.success, message: data.message || 'Something went wrong.' })
      if (data.success) {
        setStatus('cancelled')
        setConfirming(false)
      }
    } catch {
      setResult({ ok: false, message: 'We couldn’t reach the kitchen. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="bake-canvas">
      {/* ─── Header ─── */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Your booking
          </p>
          <h1 className="bake-display-lg mt-6 max-w-[22ch]">
            Hello {order.customerName}, here&rsquo;s your order.
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="bake-badge bake-badge-dark">{order.orderId}</span>
            <span className={`bake-badge ${isCancelled ? '' : 'bake-badge-rose'}`}>
              {STATUS_LABEL[status] || status}
            </span>
            {order.placedOn && (
              <span className="bake-caption text-taupe">Placed {longDate(order.placedOn)}</span>
            )}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-6 md:px-10 lg:grid-cols-3">
          {/* ─── Items + delivery ─── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-line bg-ivory p-6 md:p-8">
              <p className="bake-caption text-taupe">What you ordered</p>

              <ul className="mt-5 divide-y divide-line">
                {order.items.map((item, i) => (
                  <li key={i} className="flex gap-4 py-4 first:pt-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-xl border border-line bg-cream" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bake-display text-[17px] font-medium text-cocoa">
                        {item.name}
                      </p>
                      {item.variants.length > 0 && (
                        <p className="bake-body-sm mt-0.5">
                          {item.variants.map((v) => `${v.name}: ${v.option}`).join(' · ')}
                        </p>
                      )}
                      {item.logoUrl && (
                        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream/70 py-0.5 pl-0.5 pr-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.logoUrl}
                            alt="Your logo"
                            className="h-5 w-5 rounded-full bg-white object-contain p-px"
                          />
                          <span className="text-[11px] font-medium text-cocoa">Logo added</span>
                        </span>
                      )}
                      <p className="bake-caption mt-1.5 text-taupe">Qty {item.quantity}</p>
                    </div>
                    <p className="font-bake-display shrink-0 text-[16px] font-medium text-cocoa">
                      {AUD(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-line pt-5">
                <Row label="Subtotal" value={AUD(order.subtotal)} />
                {order.discount > 0 && <Row label="Discount" value={`− ${AUD(order.discount)}`} />}
                <Row label="Delivery" value={order.shipping > 0 ? AUD(order.shipping) : 'Free'} />
                {order.tax > 0 && <Row label="Tax" value={AUD(order.tax)} />}
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="font-bake-display text-[18px] font-medium text-cocoa">Total</span>
                  <span className="font-bake-display text-[18px] font-medium text-cocoa">
                    {AUD(order.total)}
                  </span>
                </div>
                {order.paymentMethod && (
                  <p className="bake-caption mt-2 text-taupe">Paid by {order.paymentMethod}</p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Delivery + cancel ─── */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-ivory p-6">
              <p className="bake-caption text-taupe">Delivery</p>
              {order.deliveryDate ? (
                <p className="font-bake-display mt-2 text-[19px] font-medium text-cocoa">
                  {longDate(order.deliveryDate)}
                </p>
              ) : (
                <p className="bake-body-sm mt-2">We&rsquo;ll confirm your date shortly.</p>
              )}
              {order.deliverySlot && <p className="bake-body-sm mt-1">{order.deliverySlot}</p>}

              {(order.address.line1 || order.address.city) && (
                <address className="bake-body-sm mt-4 not-italic">
                  {order.address.line1}
                  {order.address.line1 && <br />}
                  {[order.address.city, order.address.state, order.address.zipcode]
                    .filter(Boolean)
                    .join(' ')}
                  {order.address.phone && (
                    <>
                      <br />
                      {order.address.phone}
                    </>
                  )}
                </address>
              )}
            </div>

            {/* Cancellation */}
            <div className="rounded-2xl border border-line bg-ivory p-6">
              <p className="bake-caption text-taupe">Need to cancel?</p>

              {result && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-xl border p-3 ${
                    result.ok
                      ? 'border-mint-accent/30 bg-mint/40'
                      : 'border-rose-accent/30 bg-rose/30'
                  }`}
                >
                  {result.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-accent" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-accent" />
                  )}
                  <p className="bake-body-sm">{result.message}</p>
                </div>
              )}

              {isCancelled ? (
                <p className="bake-body-sm mt-2">
                  This booking is cancelled. If a refund is due it will reach your original payment
                  method within 3&ndash;7 business days.
                </p>
              ) : !canCancel ? (
                <p className="bake-body-sm mt-2">
                  This booking is already {STATUS_LABEL[status]?.toLowerCase() || status} and can no
                  longer be cancelled online.{' '}
                  <Link href="/contact" className="text-rose-accent underline underline-offset-2">
                    Talk to us
                  </Link>{' '}
                  and we&rsquo;ll do what we can.
                </p>
              ) : !confirming ? (
                <>
                  <p className="bake-body-sm mt-2">
                    You can cancel right up until we start baking. We&rsquo;ll email you a
                    confirmation straight away.
                  </p>
                  <button
                    onClick={() => setConfirming(true)}
                    className="bake-btn bake-btn-ghost bake-btn-sm mt-4 w-full"
                  >
                    Cancel this booking
                  </button>
                </>
              ) : (
                <>
                  <p className="bake-body-sm mt-2">
                    Are you sure? This can&rsquo;t be undone.
                  </p>
                  <label className="bake-caption mt-4 block text-taupe" htmlFor="cancel-reason">
                    Reason (optional)
                  </label>
                  <textarea
                    id="cancel-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 300))}
                    rows={3}
                    placeholder="Anything we could have done better?"
                    className="mt-1.5 w-full rounded-xl border border-line bg-white p-3 text-[14px] text-cocoa outline-none focus:border-rose-accent"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={cancel}
                      disabled={busy}
                      className="bake-btn bake-btn-rose bake-btn-sm flex-1 disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Cancelling
                        </>
                      ) : (
                        'Yes, cancel it'
                      )}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={busy}
                      className="bake-btn bake-btn-cream bake-btn-sm flex-1"
                    >
                      Keep it
                    </button>
                  </div>
                </>
              )}
            </div>

            <p className="bake-body-sm text-center">
              Questions?{' '}
              <Link href="/contact" className="text-rose-accent underline underline-offset-2">
                Get in touch
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="bake-body-sm">{label}</span>
      <span className="bake-body-sm text-cocoa">{value}</span>
    </div>
  )
}
