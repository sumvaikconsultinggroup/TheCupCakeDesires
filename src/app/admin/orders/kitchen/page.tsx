'use client'

import { CheckCircle2, ChefHat, Loader2, Printer, RefreshCw, Truck } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  bulkMarkDeliveredAction,
  getKitchenQueueAction,
  markAsInKitchenAction,
  markAsOutForDeliveryAction,
} from '../order-actions'

interface KitchenOrder {
  _id?: string
  orderId: string
  status: string
  totalAmount?: number
  deliveryDate?: string | null
  deliverySlot?: string
  deliveryNote?: string
  notes?: Array<{ content?: string; author?: string; isInternal?: boolean }>
  items?: Array<{ name?: string; quantity?: number }>
  customer?: { firstName?: string; lastName?: string; phone?: string }
  user?: { firstName?: string; lastName?: string }
  shippingAddress?: { city?: string; postalCode?: string; street?: string }
  deliveryAddress?: { city?: string; zipcode?: string; address?: string }
}

// Parse the start of a customer-chosen window like "10:00 AM – 12:30 PM" into
// minutes since midnight, so the kitchen board can sort orders by delivery time.
function slotStartMinutes(slot?: string): number {
  if (!slot) return 24 * 60 // unscheduled → sort last
  const m = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return 24 * 60
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return h * 60 + min
}

function formatDateKey(value?: string | null) {
  if (!value) return 'unscheduled'
  return new Date(value).toISOString().slice(0, 10)
}

function humanGroupLabel(key: string) {
  if (key === 'unscheduled') return 'Unscheduled'
  const date = new Date(`${key}T00:00:00`)
  const today = new Date()
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(date, today)) return 'Today'
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (same(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function statusPill(status: string) {
  switch (status) {
    case 'in_kitchen':
      return 'bg-cream-deep text-cocoa'
    case 'out_for_delivery':
      return 'bg-rose-deep text-cocoa'
    case 'paid':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-cream text-cocoa-soft'
  }
}

function customerName(o: KitchenOrder) {
  const c = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ')
  if (c.trim()) return c
  const u = [o.user?.firstName, o.user?.lastName].filter(Boolean).join(' ')
  return u.trim() || 'Guest'
}

function deliverySuburb(o: KitchenOrder) {
  return o.shippingAddress?.city || o.deliveryAddress?.city || ''
}

export default function KitchenQueuePage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [busyOrder, setBusyOrder] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getKitchenQueueAction()
      if (result.success) {
        setOrders((result.orders ?? []) as unknown as KitchenOrder[])
      } else {
        toast.error(result.error || 'Failed to load kitchen queue')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const groups = useMemo(() => {
    const map = new Map<string, KitchenOrder[]>()
    for (const o of orders) {
      const key = formatDateKey(o.deliveryDate)
      const list = map.get(key) ?? []
      list.push(o)
      map.set(key, list)
    }
    // Sort each group by delivery-window start time, then orderId.
    for (const [, list] of map) {
      list.sort((a, b) => {
        const sa = slotStartMinutes(a.deliverySlot)
        const sb = slotStartMinutes(b.deliverySlot)
        if (sa !== sb) return sa - sb
        return a.orderId.localeCompare(b.orderId)
      })
    }
    // Sort group keys with 'unscheduled' at the bottom.
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'unscheduled') return 1
      if (b === 'unscheduled') return -1
      return a.localeCompare(b)
    })
  }, [orders])

  const todaysCount = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    return orders.filter((o) => formatDateKey(o.deliveryDate) === todayKey).length
  }, [orders])

  const onAccept = async (id: string) => {
    setBusyOrder(id)
    try {
      const result = await markAsInKitchenAction(id)
      if (result.success) {
        toast.success(result.message || 'Moved to kitchen')
        fetchQueue()
      } else toast.error(result.error || 'Failed to move to kitchen')
    } finally {
      setBusyOrder(null)
    }
  }

  const onOutForDelivery = async (id: string) => {
    setBusyOrder(id)
    try {
      const result = await markAsOutForDeliveryAction(id)
      if (result.success) {
        toast.success('Marked out for delivery')
        fetchQueue()
      } else toast.error(result.error || 'Failed to update')
    } finally {
      setBusyOrder(null)
    }
  }

  const toggleSelect = (orderId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const onBulkDeliver = async () => {
    if (selected.size === 0) return
    if (!confirm(`Mark ${selected.size} order${selected.size === 1 ? '' : 's'} as delivered?`)) return
    const result = await bulkMarkDeliveredAction(Array.from(selected))
    if (result.success) {
      toast.success(`Marked ${result.updated ?? selected.size} as delivered`)
      setSelected(new Set())
      fetchQueue()
    } else {
      toast.error(result.error || 'Failed to mark delivered')
    }
  }

  const printSelected = () => {
    if (selected.size === 0) {
      toast('Pick orders to print delivery slips for', { icon: 'ℹ️' })
      return
    }
    const ids = Array.from(selected).join(',')
    window.open(`/admin/orders/kitchen/print?ids=${encodeURIComponent(ids)}`, '_blank')
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-taupe uppercase">
            Narre Warren bake board
          </p>
          <h1 className="font-bake-display text-3xl text-cocoa">Kitchen queue</h1>
          <p className="mt-1 text-sm text-cocoa-soft">
            {todaysCount} box{todaysCount === 1 ? '' : 'es'} scheduled for today.{' '}
            {orders.length === 0 ? 'No active orders.' : `${orders.length} active in total.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={printSelected}
            className="flex items-center gap-2 rounded-xl border border-line bg-cream px-4 py-2 text-sm font-medium text-cocoa transition-all hover:bg-ivory"
          >
            <Printer className="h-4 w-4" />
            Print {selected.size > 0 ? `(${selected.size})` : 'slips'}
          </button>
          <button
            onClick={onBulkDeliver}
            disabled={selected.size === 0}
            className="flex items-center gap-2 rounded-xl bg-mint-accent px-4 py-2 text-sm font-medium text-ivory transition-all hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark {selected.size > 0 ? `${selected.size} ` : ''}delivered
          </button>
          <button
            onClick={() => fetchQueue()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory transition-all hover:bg-cocoa-soft disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-line bg-ivory p-8">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-cocoa" />
          <p className="mt-3 text-center text-sm text-taupe">Loading the bake board…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-cream p-12 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-cocoa-soft" />
          <p className="mt-3 font-bake-display text-xl text-cocoa">All caught up.</p>
          <p className="mt-1 text-sm text-cocoa-soft">
            No paid orders are waiting in the kitchen — go enjoy a cuppa.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, list]) => (
            <section
              key={key}
              className="overflow-hidden rounded-2xl border border-line bg-ivory shadow-sm"
            >
              <header className="flex items-center justify-between border-b border-line bg-cream px-5 py-3">
                <div>
                  <p className="font-bake-display text-lg text-cocoa">{humanGroupLabel(key)}</p>
                  <p className="text-xs text-taupe">
                    {list.length} order{list.length === 1 ? '' : 's'}
                  </p>
                </div>
                {key !== 'unscheduled' && (
                  <p className="hidden text-xs text-taupe sm:block">
                    {new Date(`${key}T00:00:00`).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Melbourne',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </header>

              <ul className="divide-y divide-line-soft">
                {list.map((order) => {
                  const isSelected = selected.has(order.orderId)
                  const busy = busyOrder === order.orderId
                  return (
                    <li key={order.orderId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                      <label className="flex shrink-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(order.orderId)}
                          className="h-4 w-4 rounded border-line text-cocoa focus:ring-cocoa"
                        />
                      </label>
                      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-5 sm:items-center">
                        <div>
                          <Link
                            href={`/admin/orders/${order.orderId}`}
                            className="font-mono text-sm font-semibold text-cocoa hover:underline"
                          >
                            {order.orderId}
                          </Link>
                          <p className="text-xs text-taupe">{customerName(order)}</p>
                        </div>
                        <div className="text-sm text-cocoa-soft">
                          {(order.items || [])
                            .slice(0, 2)
                            .map((it) => `${it.quantity ?? 1}× ${it.name ?? ''}`)
                            .join(', ')}
                          {(order.items?.length ?? 0) > 2 ? ` +${(order.items?.length ?? 0) - 2} more` : ''}
                        </div>
                        <div className="text-sm text-cocoa-soft">
                          {deliverySuburb(order) || '—'}
                          {order.deliverySlot ? (
                            <p className="text-xs text-taupe">{order.deliverySlot}</p>
                          ) : null}
                          {order.notes?.find((n) => n.author === 'customer' && !n.isInternal && n.content) ? (
                            <p className="mt-0.5 text-xs text-rose-accent" title="Delivery instructions from customer">
                              ✎ {order.notes.find((n) => n.author === 'customer' && !n.isInternal)?.content}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusPill(order.status)}`}
                          >
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'paid' && (
                            <button
                              onClick={() => onAccept(order.orderId)}
                              disabled={busy}
                              className="flex items-center gap-1 rounded-lg bg-cocoa px-3 py-1.5 text-xs font-medium text-ivory transition hover:bg-cocoa-soft disabled:opacity-50"
                            >
                              <ChefHat className="h-3.5 w-3.5" />
                              Accept
                            </button>
                          )}
                          {order.status === 'in_kitchen' && (
                            <button
                              onClick={() => onOutForDelivery(order.orderId)}
                              disabled={busy}
                              className="flex items-center gap-1 rounded-lg bg-rose-accent px-3 py-1.5 text-xs font-medium text-ivory transition hover:opacity-90 disabled:opacity-50"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Out for delivery
                            </button>
                          )}
                          <Link
                            href={`/admin/orders/${order.orderId}`}
                            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-cocoa hover:bg-cream"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                      {order.deliveryNote ? (
                        <p className="ml-7 text-xs text-cocoa-soft italic sm:ml-0 sm:max-w-[200px]">
                          {order.deliveryNote}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
