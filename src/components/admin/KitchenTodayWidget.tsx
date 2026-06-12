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
}

function customerName(o: QueueItem) {
  const c = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ').trim()
  if (c) return c
  const u = [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' ').trim()
  return u || 'Guest'
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
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

  const today = useMemo(() => new Date(), [])
  const startOfToday = useMemo(() => {
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    return d
  }, [today])

  const todaysOrders = orders.filter(
    (o) => o.deliveryDate && sameDay(new Date(o.deliveryDate), today)
  )
  const pastDue = orders.filter(
    (o) =>
      o.deliveryDate &&
      new Date(o.deliveryDate) < startOfToday &&
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
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">
              {pastDue.length} order{pastDue.length === 1 ? '' : 's'} past their delivery date
            </p>
            <p className="text-xs text-red-600">
              Open the kitchen queue and decide whether to dispatch or reschedule.
            </p>
          </div>
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
