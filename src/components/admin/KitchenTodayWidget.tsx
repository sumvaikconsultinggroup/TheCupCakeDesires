'use client'

import { getKitchenQueueAction } from '@/app/admin/orders/order-actions'
import { AlertTriangle, ChefHat, Truck } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface QueueItem {
  orderId: string
  status: string
  deliveryDate?: string | null
  deliverySlot?: string
  customer?: { firstName?: string; lastName?: string }
  user?: { firstName?: string; lastName?: string }
  shippingAddress?: { city?: string }
  items?: Array<{ name?: string; quantity?: number }>
}

function customerName(o: QueueItem) {
  const c = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ').trim()
  if (c) return c
  const u = [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' ').trim()
  return u || 'Guest'
}

function productSummary(items?: Array<{ name?: string; quantity?: number }>) {
  if (!items?.length) return 'No items listed'
  return items
    .map((it) => `${it.quantity || 1}× ${it.name || 'Product'}`)
    .join(', ')
}

function formatDueDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// Calendar date (YYYY-MM-DD) in Australia/Melbourne, regardless of the
// admin's browser timezone. en-CA yields an ISO-style, lexicographically
// comparable string.
function melbourneDateKey(d: Date | string) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
}

export default function KitchenTodayWidget() {
  const [orders, setOrders] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getKitchenQueueAction()
      if (result.success) setOrders((result.orders ?? []) as unknown as QueueItem[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const todayKey = useMemo(() => melbourneDateKey(new Date()), [])

  const todaysOrders = orders.filter(
    (o) => o.deliveryDate && melbourneDateKey(o.deliveryDate) === todayKey
  )
  const pastDue = orders.filter(
    (o) =>
      o.deliveryDate &&
      melbourneDateKey(o.deliveryDate) < todayKey &&
      o.status !== 'delivered'
  )

  return (
    <div className="rounded-2xl border border-line bg-ivory p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
            Bake board
          </p>
          <h3 className="font-bake-display text-xl text-cocoa">Today&rsquo;s deliveries</h3>
        </div>
        <Link
          href="/admin/orders/kitchen"
          className="rounded-lg border border-line bg-cream px-3 py-1.5 text-xs font-medium text-cocoa transition hover:bg-cream-deep"
        >
          Open queue
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-cream p-3 text-center">
          <p className="text-xs text-taupe">Scheduled</p>
          <p className="mt-1 font-bake-display text-2xl text-cocoa">
            {loading ? '—' : todaysOrders.length}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-cream p-3 text-center">
          <p className="text-xs text-taupe">In kitchen</p>
          <p className="mt-1 font-bake-display text-2xl text-cocoa">
            {loading ? '—' : todaysOrders.filter((o) => o.status === 'in_kitchen').length}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-rose p-3 text-center">
          <p className="text-xs text-taupe">Out for delivery</p>
          <p className="mt-1 font-bake-display text-2xl text-cocoa">
            {loading ? '—' : todaysOrders.filter((o) => o.status === 'out_for_delivery').length}
          </p>
        </div>
      </div>

      {pastDue.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-red-200 bg-red-50">
          <div className="flex items-start gap-3 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-700">
                {pastDue.length} order{pastDue.length === 1 ? '' : 's'} past their delivery date
              </p>
              <p className="text-xs text-red-600">
                Dispatch or reschedule these before today&rsquo;s bakes.
              </p>
            </div>
          </div>
          <ul className="divide-y divide-red-200/70 border-t border-red-200/70">
            {pastDue.map((o) => (
              <li key={o.orderId}>
                <Link
                  href={`/admin/orders/${o.orderId}`}
                  className="block px-4 py-3 transition hover:bg-red-100/70"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-mono text-sm font-semibold text-red-800">{o.orderId}</span>
                    <span className="text-xs font-medium text-red-700">
                      Due {formatDueDate(o.deliveryDate)}
                      {o.deliverySlot ? ` · ${o.deliverySlot}` : ''}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-red-800">{customerName(o)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-red-700">{productSummary(o.items)}</p>
                  <p className="mt-1 text-[11px] capitalize tracking-wide text-red-600">
                    {(o.status || '').replace(/_/g, ' ') || 'unknown status'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-taupe">Loading…</p>
        ) : todaysOrders.length === 0 ? (
          <p className="text-sm text-cocoa-soft">No deliveries scheduled for today.</p>
        ) : (
          todaysOrders.slice(0, 5).map((o) => (
            <Link
              key={o.orderId}
              href={`/admin/orders/${o.orderId}`}
              className="flex items-center justify-between rounded-xl border border-line-soft px-3 py-2 text-sm transition hover:bg-cream"
            >
              <div className="flex items-center gap-2">
                {o.status === 'out_for_delivery' ? (
                  <Truck className="h-4 w-4 text-rose-accent" />
                ) : (
                  <ChefHat className="h-4 w-4 text-cocoa-soft" />
                )}
                <span className="font-mono text-cocoa">{o.orderId}</span>
                <span className="text-cocoa-soft">· {customerName(o)}</span>
              </div>
              <span className="text-xs text-taupe capitalize">{o.deliverySlot || 'flex'}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
