'use client'

import { Loader2, Printer } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { getKitchenQueueAction } from '../../order-actions'

interface SlipOrder {
  orderId: string
  totalAmount?: number
  deliveryDate?: string | null
  deliverySlot?: string
  deliveryNote?: string
  notes?: Array<{ content?: string; author?: string; isInternal?: boolean }>
  items?: Array<{
    name?: string
    quantity?: number
    price?: number
    /** Corporate logo artwork the customer uploaded — printed onto the item. */
    logoUrl?: string
    variants?: Array<{ name?: string; option?: string }>
  }>
  customer?: { firstName?: string; lastName?: string; phone?: string; email?: string }
  user?: { firstName?: string; lastName?: string; phoneNumber?: string }
  shippingAddress?: { street?: string; city?: string; state?: string; postalCode?: string }
  deliveryAddress?: {
    firstName?: string
    lastName?: string
    address?: string
    address1?: string
    city?: string
    state?: string
    zipcode?: string
    phone?: string
    email?: string
  }
}

function formatAddress(o: SlipOrder) {
  const d = o.deliveryAddress
  const s = o.shippingAddress
  const lines = [
    [d?.firstName, d?.lastName].filter(Boolean).join(' '),
    d?.address || s?.street,
    d?.address1,
    [d?.city || s?.city, d?.state || s?.state].filter(Boolean).join(', '),
    d?.zipcode || s?.postalCode,
  ].filter(Boolean)
  return lines
}

function customerName(o: SlipOrder) {
  const c = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
  if (c.trim()) return c
  const d = [o.deliveryAddress?.firstName, o.deliveryAddress?.lastName].filter(Boolean).join(' ')
  if (d.trim()) return d
  const u = [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' ')
  return u.trim() || 'Customer'
}

function PrintInner() {
  const params = useSearchParams()
  const ids = (params.get('ids') || '').split(',').filter(Boolean)
  const [orders, setOrders] = useState<SlipOrder[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const result = await getKitchenQueueAction()
    if (result.success) {
      const all = (result.orders ?? []) as unknown as SlipOrder[]
      const wanted = ids.length > 0 ? all.filter((o) => ids.includes(o.orderId)) : all
      setOrders(wanted)
    }
    setLoading(false)
  }, [ids])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!loading && orders.length > 0) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [loading, orders.length])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
      </div>
    )
  }

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-3xl px-6 py-8 print:hidden">
        <div className="flex items-center justify-between">
          <h1 className="font-bake-display text-2xl text-cocoa">Delivery slips</h1>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory hover:bg-cocoa-soft"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
        <p className="mt-2 text-sm text-taupe">
          {orders.length} slip{orders.length === 1 ? '' : 's'} — one per page.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-12 print:max-w-none print:px-0 print:pb-0">
        {orders.map((order) => {
          const addr = formatAddress(order)
          const phone = order.deliveryAddress?.phone || order.customer?.phone || order.user?.phoneNumber
          return (
            <article
              key={order.orderId}
              className="mb-6 break-after-page rounded-2xl border border-line bg-white p-8 shadow-sm print:mb-0 print:rounded-none print:border-0 print:shadow-none"
            >
              <header className="flex items-start justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                    The Cupcake Desire · Narre Warren
                  </p>
                  <p className="font-bake-display text-2xl text-cocoa">Delivery slip</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-cocoa">{order.orderId}</p>
                  {order.deliveryDate && (
                    <p className="text-xs text-taupe">
                      {new Date(order.deliveryDate).toLocaleDateString('en-AU', {
                        timeZone: 'Australia/Melbourne',
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
                    </p>
                  )}
                </div>
              </header>

              <section className="mt-5 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                    Deliver to
                  </p>
                  <p className="mt-1 font-medium text-cocoa">{customerName(order)}</p>
                  {addr.map((line, i) => (
                    <p key={i} className="text-sm text-cocoa-soft">
                      {line}
                    </p>
                  ))}
                  {phone && <p className="mt-1 text-sm text-cocoa-soft">📞 {phone}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                    Delivery window
                  </p>
                  <p className="mt-1 text-sm font-medium text-cocoa">{order.deliverySlot || 'Any time'}</p>

                  {order.notes?.find((n) => n.author === 'customer' && !n.isInternal && n.content) && (
                    <>
                      <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                        Delivery instructions
                      </p>
                      <p className="mt-1 text-sm text-cocoa">
                        {order.notes.find((n) => n.author === 'customer' && !n.isInternal)?.content}
                      </p>
                    </>
                  )}

                  <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                    Kitchen notes
                  </p>
                  <p className="mt-1 text-sm text-cocoa-soft">
                    {order.deliveryNote || 'No special note.'}
                  </p>
                </div>
              </section>

              <section className="mt-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
                  Items
                </p>
                <table className="mt-2 w-full border-collapse text-sm">
                  <tbody>
                    {(order.items || []).map((item, i) => {
                      // Detail lines the kitchen needs on the bench: build-your-own
                      // contents, gift message, size. 'Logo' is rendered as artwork
                      // below rather than as an unreadable URL.
                      const details = (item.variants || []).filter(
                        (v) => v?.name && v?.option && v.name !== 'Logo'
                      )
                      const logo = item.logoUrl || (item.variants || []).find((v) => v?.name === 'Logo')?.option
                      return (
                        <tr key={i} className="border-b border-line-soft last:border-0 align-top">
                          <td className="py-1.5 pr-3 text-cocoa">
                            {item.name}
                            {details.length > 0 && (
                              <span className="mt-0.5 block text-[11px] leading-snug text-cocoa-soft">
                                {details.map((v) => `${v.name}: ${v.option}`).join(' · ')}
                              </span>
                            )}
                            {logo && (
                              <span className="mt-1.5 flex items-center gap-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={logo}
                                  alt="Customer logo"
                                  className="h-12 w-12 border border-cocoa bg-white object-contain p-0.5"
                                />
                                <span className="text-[11px] font-semibold tracking-wide text-cocoa uppercase">
                                  Print this logo
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 text-right text-cocoa-soft">× {item.quantity ?? 1}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>

              <footer className="mt-6 flex items-end justify-between border-t border-line pt-4">
                <div>
                  <p className="text-xs text-taupe">Signature on delivery</p>
                  <div className="mt-6 w-48 border-b border-cocoa" />
                </div>
                <div className="text-right">
                  <p className="text-xs text-taupe">Total paid</p>
                  <p className="font-bake-display text-xl text-cocoa">
                    {(order.totalAmount ?? 0).toLocaleString('en-AU', {
                      style: 'currency',
                      currency: 'AUD',
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </footer>
            </article>
          )
        })}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            background: #fff;
          }
        }
      `}</style>
    </div>
  )
}

export default function PrintSlipsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ivory">
          <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
        </div>
      }
    >
      <PrintInner />
    </Suspense>
  )
}
