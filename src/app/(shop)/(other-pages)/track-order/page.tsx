'use client'

import clsx from 'clsx'
import {
  CalendarCheck,
  Car,
  Check,
  ChefHat,
  CircleAlert,
  Loader2,
  PackageSearch,
  PartyPopper,
  Search,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

interface TrackedOrder {
  orderId: string
  status: string
  placedAt: string | null
  deliveryDate: string | null
  deliverySlot: string | null
  suburb: string | null
  itemCount: number
  items: Array<{ name: string; quantity: number }>
  timestamps: {
    paid: string | null
    inKitchen: string | null
    outForDelivery: string | null
    delivered: string | null
  }
}

const STEPS = [
  {
    key: 'paid',
    label: 'Order confirmed',
    caption: 'Payment received — your box is on the bake board.',
    icon: Check,
  },
  {
    key: 'inKitchen',
    label: 'In the kitchen',
    caption: 'Being baked and hand-frosted in Narre Warren.',
    icon: ChefHat,
  },
  {
    key: 'outForDelivery',
    label: 'Out for delivery',
    caption: 'Our driver has left the kitchen with your box.',
    icon: Car,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    caption: 'Enjoy every bite!',
    icon: PartyPopper,
  },
] as const

const STATUS_STEP: Record<string, number> = {
  paid: 0,
  in_kitchen: 1,
  out_for_delivery: 2,
  delivered: 3,
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<TrackedOrder | null>(null)

  const lookup = useCallback(async (id: string, mail: string) => {
    if (!id.trim() || !mail.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id.trim(), email: mail.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setOrder(data.order)
      } else {
        setOrder(null)
        setError(data.message || 'Order not found.')
      }
    } catch {
      setOrder(null)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Deep link from emails: /track-order?orderId=…&email=… → auto-lookup.
  useEffect(() => {
    const qId = searchParams.get('orderId')
    const qEmail = searchParams.get('email')
    if (qId && qEmail) lookup(qId, qEmail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeStep = order ? (STATUS_STEP[order.status] ?? -1) : -1
  const isCancelled = order?.status === 'cancelled' || order?.status === 'refunded'
  const isAwaitingPayment = order?.status === 'pending_payment'

  return (
    <main className="font-bake-body min-h-screen bg-ivory text-cocoa">
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream py-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-28 -top-28 h-64 w-64 rounded-full bg-rose-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-28 h-64 w-64 rounded-full bg-cocoa/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-[720px] px-6 text-center">
          <p className="bake-eyebrow">
            <span className="mr-2 inline-block h-px w-6 align-middle bg-rose-accent" />
            Fresh from the kitchen to your door
          </p>
          <h1 className="bake-display-xl mt-4">
            Track your <span className="bake-display-italic text-rose-accent">order.</span>
          </h1>
          <p className="bake-body mt-4 text-cocoa-soft">
            Pop in your order ID and the email you used at checkout — both are in your
            confirmation email.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-6 pb-24 pt-10">
        {/* Lookup form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            lookup(orderId, email)
          }}
          className="overflow-hidden rounded-3xl border border-line bg-cream/50"
        >
          <div className="flex items-center gap-3.5 border-b border-line bg-ivory px-6 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-ivory">
              <PackageSearch className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <div>
              <h2 className="font-bake-display text-[16px] font-medium text-cocoa">Find your box</h2>
              <p className="bake-caption mt-0.5 text-taupe">Works for guest and account orders</p>
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-cocoa-soft">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ORD-mr8t6la3-3I4ZAL"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-cocoa placeholder:italic placeholder:text-taupe focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-cocoa-soft">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-cocoa placeholder:italic placeholder:text-taupe focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading || !orderId.trim() || !email.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cocoa px-7 py-3.5 text-[15px] font-medium text-ivory transition-colors hover:bg-rose-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Finding your order&hellip;
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" strokeWidth={1.9} />
                    Track order
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-accent/40 bg-rose/40 px-5 py-4">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-accent" strokeWidth={1.8} />
            <p className="text-sm text-cocoa">{error}</p>
          </div>
        )}

        {/* Result */}
        {order && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-cream/50">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-ivory px-6 py-5">
              <div>
                <p className="bake-caption text-taupe">Order</p>
                <p className="font-bake-display mt-0.5 text-[18px] font-medium text-cocoa">
                  {order.orderId}
                </p>
                <p className="mt-0.5 text-xs text-taupe">
                  {order.itemCount} treat{order.itemCount === 1 ? '' : 's'}
                  {order.suburb ? ` · to ${order.suburb}` : ''}
                  {order.placedAt ? ` · placed ${fmt(order.placedAt)}` : ''}
                </p>
              </div>
              {order.deliveryDate && !isCancelled && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-rose/40 px-4 py-2.5">
                  <CalendarCheck className="h-4 w-4 shrink-0 text-rose-accent" strokeWidth={1.8} />
                  <div>
                    <p className="bake-caption text-taupe">Delivering</p>
                    <p className="text-sm font-medium text-cocoa">
                      {new Date(order.deliveryDate).toLocaleDateString('en-AU', {
                        timeZone: 'Australia/Melbourne',
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                      {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-6">
              {isCancelled ? (
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-ivory px-5 py-4">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-accent" strokeWidth={1.8} />
                  <div>
                    <p className="font-medium text-cocoa">
                      This order was {order.status === 'refunded' ? 'refunded' : 'cancelled'}.
                    </p>
                    <p className="mt-1 text-sm text-cocoa-soft">
                      If that doesn&rsquo;t look right, reply to your order email and we&rsquo;ll sort it out.
                    </p>
                  </div>
                </div>
              ) : isAwaitingPayment ? (
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-ivory px-5 py-4">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-accent" strokeWidth={1.8} />
                  <div>
                    <p className="font-medium text-cocoa">This order is awaiting payment.</p>
                    <p className="mt-1 text-sm text-cocoa-soft">
                      Once payment is complete, your box goes straight onto the bake board.
                    </p>
                  </div>
                </div>
              ) : (
                <ol className="relative space-y-0">
                  {STEPS.map((step, i) => {
                    const done = i < activeStep
                    const current = i === activeStep
                    const stamp = fmt(order.timestamps[step.key])
                    const Icon = step.icon
                    return (
                      <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* connector */}
                        {i < STEPS.length - 1 && (
                          <span
                            aria-hidden
                            className={clsx(
                              'absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px',
                              done ? 'bg-rose-accent' : 'bg-line'
                            )}
                          />
                        )}
                        <span
                          className={clsx(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors',
                            done && 'border-rose-accent bg-rose-accent text-white',
                            current && 'border-cocoa bg-cocoa text-ivory shadow-[0_10px_24px_-12px_rgba(46,31,21,0.5)]',
                            !done && !current && 'border-line bg-ivory text-taupe'
                          )}
                        >
                          {done ? (
                            <Check className="h-4.5 w-4.5" strokeWidth={2.2} />
                          ) : (
                            <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                          )}
                        </span>
                        <div className="min-w-0 pt-1.5">
                          <p
                            className={clsx(
                              'font-bake-display text-[16px] font-medium',
                              done || current ? 'text-cocoa' : 'text-taupe'
                            )}
                          >
                            {step.label}
                            {current && (
                              <span className="ml-2 rounded-full bg-rose-accent/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-rose-accent">
                                NOW
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-sm text-cocoa-soft">{step.caption}</p>
                          {stamp && <p className="mt-0.5 text-xs text-taupe">{stamp}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            {order.items.length > 0 && (
              <div className="border-t border-line px-6 py-5">
                <p className="bake-caption mb-3 text-taupe">In this box</p>
                <ul className="space-y-1.5">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-cocoa">{it.name}</span>
                      <span className="tabular-nums text-cocoa-soft">×{it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="bake-caption mt-8 text-center text-taupe">
          Can&rsquo;t find your order? Reply to your confirmation email and a human will help.
        </p>
      </section>
    </main>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="font-bake-body flex min-h-[60vh] items-center justify-center bg-ivory">
          <Loader2 className="h-8 w-8 animate-spin text-cocoa" strokeWidth={1.6} />
        </main>
      }
    >
      <TrackOrderContent />
    </Suspense>
  )
}
