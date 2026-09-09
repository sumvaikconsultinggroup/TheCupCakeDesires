'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

type Stage = 'cart' | 'checkout' | 'ready_to_pay' | 'payment_started'

interface CartItem {
  productId: string
  productName: string
  handle?: string
  category?: string
  imageUrl?: string
  price: number
  quantity: number
  sku?: string
  logoUrls?: string[]
  variant?: {
    name?: string
    option1Value?: string
    option2Value?: string
    option3Value?: string
    sku?: string
  }
  variants?: { name: string; option: string }[]
}

interface AbandonedCart {
  _id: string
  source?: string
  userId?: string
  guestId?: string
  email?: string
  userName?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  isGuest?: boolean
  cartItems: CartItem[]
  totalValue: number
  subtotal?: number
  discount?: number
  shipping?: number
  taxes?: number
  promoCode?: string
  paymentMethod?: string
  shippingAddress?: {
    line1?: string
    city?: string
    state?: string
    country?: string
    zipcode?: string
    addressType?: string
  }
  delivery?: {
    date?: string
    slot?: string
    instructions?: string
    postcode?: string
  }
  checkoutStage?: Stage
  pendingOrderId?: string
  pendingOrderNumber?: string
  status: 'abandoned' | 'recovered' | 'expired'
  abandonedAt: string
  lastUpdatedAt: string
  checkoutStartedAt?: string
  readyToPayAt?: string
  paymentStartedAt?: string
  recoveryEmailSent?: boolean
  ipAddress?: string
  userAgent?: string
}

const FILTERS = [
  { id: 'unpaid', label: "Didn't pay" },
  { id: 'ready_to_pay', label: 'Ready to pay' },
  { id: 'payment_started', label: 'Left at Stripe' },
  { id: 'checkout', label: 'Checkout started' },
  { id: 'cart', label: 'Cart only' },
  { id: 'recovered', label: 'Recovered' },
  { id: 'all', label: 'All' },
]

function fmtWhen(value?: string | Date | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return format(d, 'd MMM yyyy, h:mm a')
}

function fmtDay(value?: string | null) {
  if (!value) return '—'
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (isoDay) {
    return format(new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3])), 'd MMM yyyy')
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return format(d, 'd MMM yyyy')
}
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(value || 0)
}

function stageLabel(stage?: string) {
  switch (stage) {
    case 'payment_started':
      return 'Clicked Pay · unpaid'
    case 'ready_to_pay':
      return 'Last step · Pay not clicked'
    case 'checkout':
      return 'Checkout started'
    default:
      return 'Added to cart'
  }
}

function variantLines(item: CartItem) {
  const lines: string[] = []
  if (item.variant?.name) lines.push(item.variant.name)
  if (item.variant?.option1Value) lines.push(item.variant.option1Value)
  if (item.variant?.option2Value) lines.push(item.variant.option2Value)
  if (item.variant?.option3Value) lines.push(item.variant.option3Value)
  if (item.variants?.length) {
    for (const v of item.variants) {
      const text = [v.name, v.option].filter(Boolean).join(': ')
      if (text && !lines.includes(text) && !lines.includes(v.option)) lines.push(text)
    }
  }
  return lines.filter(Boolean)
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="bake-caption text-taupe">{label}</p>
      <p className="mt-1 text-[14px] font-medium text-cocoa wrap-break-word">{value || '—'}</p>
    </div>
  )
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [stats, setStats] = useState<{ count: number; unpaidCount: number; totalValue: number; averageValue: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('unpaid')
  const [sendingId, setSendingId] = useState<string | null>(null)

  const fetchCarts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics/abandoned-carts?status=${statusFilter}&limit=80`)
      const result = await res.json()
      if (result.success) {
        setCarts(result.data.carts)
        setStats(result.data.stats)
      } else {
        toast.error('Failed to load abandoned carts')
      }
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCarts()
  }, [fetchCarts])

  const handleMarkAsRecovered = async (cartId: string) => {
    try {
      const res = await fetch('/api/admin/analytics/abandoned-carts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, status: 'recovered' }),
      })
      if (res.ok) {
        toast.success('Marked recovered')
        fetchCarts(true)
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.message || 'Could not update')
      }
    } catch {
      toast.error('Could not update')
    }
  }

  const handleSendEmail = async (cart: AbandonedCart) => {
    if (!cart.email) {
      toast.error('No email on this cart')
      return
    }
    setSendingId(cart._id)
    try {
      const res = await fetch('/api/cart/abandoned/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cart.email,
          type: 'template',
          cartData: {
            email: cart.email,
            userName: cart.userName,
            products: (cart.cartItems || []).map((i) => ({
              name: i.productName,
              price: i.price,
              quantity: i.quantity,
              imageUrl: i.imageUrl,
              variant: i.variant,
            })),
          },
        }),
      })
      if (!res.ok) throw new Error('send failed')
      toast.success('Recovery email sent')
      if (!String(cart._id).startsWith('order-')) {
        await fetch('/api/admin/analytics/abandoned-carts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId: cart._id, recoveryEmailSent: true }),
        })
        fetchCarts(true)
      }
    } catch {
      toast.error('Could not send email')
    } finally {
      setSendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-ivory">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-line border-t-rose-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory p-6 text-cocoa md:p-8">
      <Link href="/admin" className="inline-flex items-center gap-2 text-[13px] text-taupe hover:text-cocoa">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            Recovery
          </p>
          <h1 className="font-bake-display mt-2 text-[32px] font-medium leading-tight md:text-[40px]">
            Abandoned carts
          </h1>
          <p className="bake-body mt-2 max-w-[58ch] text-cocoa-soft">
            Tracks shoppers who added products, completed checkout, and reached the Pay button — then left without paying.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchCarts(true)}
          disabled={refreshing}
          className="bake-btn bake-btn-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="bake-card p-6">
          <p className="bake-caption text-taupe">In this view</p>
          <p className="font-bake-display mt-2 text-[36px] font-medium">{stats?.count || 0}</p>
        </div>
        <div className="bake-card p-6">
          <p className="bake-caption text-taupe">Value at risk</p>
          <p className="font-bake-display mt-2 text-[36px] font-medium text-rose-accent">
            {aud(stats?.totalValue || 0)}
          </p>
        </div>
        <div className="bake-card p-6">
          <p className="bake-caption text-taupe">Average cart</p>
          <p className="font-bake-display mt-2 text-[36px] font-medium">{aud(stats?.averageValue || 0)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              statusFilter === f.id
                ? 'border-cocoa bg-cocoa text-ivory'
                : 'border-line bg-cream text-cocoa-soft hover:border-cocoa hover:text-cocoa'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {carts.length === 0 ? (
          <div className="bake-card px-8 py-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-taupe" />
            <p className="font-bake-display mt-4 text-[22px]">Nothing in this view</p>
            <p className="bake-body mt-2 text-cocoa-soft">Try another filter, or wait for a shopper to reach checkout.</p>
          </div>
        ) : (
          carts.map((cart) => {
            const name =
              cart.userName ||
              [cart.firstName, cart.lastName].filter(Boolean).join(' ').trim() ||
              'Guest shopper'
            const addr = cart.shippingAddress
            const items = cart.cartItems || []
            const lineTotal = (item: CartItem) => item.price * item.quantity
            const itemsTotal = items.reduce((s, i) => s + lineTotal(i), 0)
            const subtotal = cart.subtotal ?? itemsTotal

            return (
              <article key={cart._id} className="overflow-hidden rounded-[14px] border border-line bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-cream/60 px-6 py-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bake-display text-[22px] font-medium">{name}</h2>
                      <span className="bake-badge bake-badge-rose">{stageLabel(cart.checkoutStage)}</span>
                      {cart.isGuest !== false && !cart.userId && (
                        <span className="bake-badge">Guest</span>
                      )}
                      {cart.status === 'recovered' && (
                        <span className="bake-badge bake-badge-mint">Recovered</span>
                      )}
                      {cart.recoveryEmailSent && cart.status !== 'recovered' && (
                        <span className="bake-badge bake-badge-gold">Email sent</span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-taupe">
                      Last activity {fmtWhen(cart.lastUpdatedAt || cart.abandonedAt)}
                      {cart.pendingOrderNumber ? ` · Order #${cart.pendingOrderNumber}` : ''}
                      {cart.recoveryEmailSent ? ' · Recovery email sent' : ''}
                    </p>
                  </div>
                  <p className="font-bake-display text-[28px] font-medium text-cocoa">{aud(cart.totalValue)}</p>
                </div>

                <div className="grid gap-8 px-6 py-6 lg:grid-cols-2 xl:grid-cols-4">
                  <section>
                    <p className="bake-eyebrow mb-4">
                      <User className="mr-2 inline h-3.5 w-3.5" />
                      Customer
                    </p>
                    <div className="space-y-3">
                      <Detail label="First name" value={cart.firstName || name.split(' ')[0]} />
                      <Detail label="Last name" value={cart.lastName || name.split(' ').slice(1).join(' ')} />
                      <Detail label="Email" value={cart.email} />
                      <Detail label="Phone" value={cart.phoneNumber} />
                      <Detail label="Account" value={cart.userId ? 'Signed in' : 'Guest checkout'} />
                    </div>
                  </section>

                  <section>
                    <p className="bake-eyebrow mb-4">
                      <MapPin className="mr-2 inline h-3.5 w-3.5" />
                      Address
                    </p>
                    <div className="space-y-3">
                      <Detail label="Type" value={addr?.addressType} />
                      <Detail label="Street" value={addr?.line1} />
                      <Detail label="City" value={addr?.city} />
                      <Detail label="State" value={addr?.state} />
                      <Detail label="Postcode" value={addr?.zipcode} />
                      <Detail label="Country" value={addr?.country} />
                    </div>
                  </section>

                  <section>
                    <p className="bake-eyebrow mb-4">
                      <Truck className="mr-2 inline h-3.5 w-3.5" />
                      Delivery
                    </p>
                    <div className="space-y-3">
                      <Detail label="Date" value={fmtDay(cart.delivery?.date)} />
                      <Detail label="Window" value={cart.delivery?.slot} />
                      <Detail label="Postcode checked" value={cart.delivery?.postcode} />
                      <Detail label="Instructions" value={cart.delivery?.instructions} />
                      <Detail label="Payment" value={cart.paymentMethod || 'Stripe'} />
                    </div>
                  </section>

                  <section>
                    <p className="bake-eyebrow mb-4">
                      <Activity className="mr-2 inline h-3.5 w-3.5" />
                      Session
                    </p>
                    <div className="space-y-3">
                      <Detail label="Source" value={cart.source === 'pending_order' ? 'Unpaid Stripe order' : 'Checkout snapshot'} />
                      <Detail label="Pending order" value={cart.pendingOrderNumber} />
                      <Detail label="Guest id" value={cart.guestId} />
                      <Detail label="User id" value={cart.userId} />
                      <Detail label="Recovery email" value={cart.recoveryEmailSent ? 'Sent' : 'Not sent'} />
                      <Detail label="IP" value={cart.ipAddress} />
                    </div>
                  </section>
                </div>

                <div className="border-t border-line px-6 py-6">
                  <p className="bake-eyebrow mb-4">
                    <Package className="mr-2 inline h-3.5 w-3.5" />
                    Products · {items.length} line{items.length === 1 ? '' : 's'}
                  </p>
                  <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-cream/40">
                    {items.map((item, idx) => {
                      const variants = variantLines(item)
                      return (
                        <div key={`${item.productId}-${idx}`} className="flex gap-4 p-4">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-ivory">
                            {item.imageUrl ? (
                              <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" unoptimized />
                            ) : (
                              <Package className="m-auto mt-5 h-5 w-5 text-taupe" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-cocoa">{item.productName}</p>
                            <p className="mt-0.5 text-[12px] text-taupe">
                              {[item.handle, item.category, item.sku || item.variant?.sku]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            {variants.length > 0 && (
                              <p className="mt-1 text-[13px] text-cocoa-soft">{variants.join(' · ')}</p>
                            )}
                            {item.logoUrls && item.logoUrls.length > 0 && (
                              <div className="mt-2 flex gap-1.5">
                                {item.logoUrls.map((url) => (
                                  <span key={url} className="relative h-8 w-8 overflow-hidden rounded-md border border-line">
                                    <Image src={url} alt="Logo" fill className="object-cover" unoptimized />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[13px] text-taupe">
                              {item.quantity} × {aud(item.price)}
                            </p>
                            <p className="font-bake-display mt-1 text-[18px]">{aud(lineTotal(item))}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-[14px]">
                    <div className="flex justify-between text-cocoa-soft">
                      <dt>Subtotal</dt>
                      <dd>{aud(subtotal)}</dd>
                    </div>
                    {!!cart.discount && (
                      <div className="flex justify-between text-cocoa-soft">
                        <dt>Discount{cart.promoCode ? ` (${cart.promoCode})` : ''}</dt>
                        <dd>−{aud(cart.discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between text-cocoa-soft">
                      <dt>Delivery</dt>
                      <dd>{aud(cart.shipping || 0)}</dd>
                    </div>
                    {!!cart.taxes && (
                      <div className="flex justify-between text-cocoa-soft">
                        <dt>Tax</dt>
                        <dd>{aud(cart.taxes)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-line pt-2 font-medium text-cocoa">
                      <dt>Total</dt>
                      <dd className="font-bake-display text-[20px]">{aud(cart.totalValue)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="grid gap-3 border-t border-line bg-cream/40 px-6 py-4 sm:grid-cols-4">
                  <div className="flex items-start gap-2 text-[12px] text-taupe">
                    <ShoppingBag className="mt-0.5 h-3.5 w-3.5" />
                    <span>Cart {fmtWhen(cart.abandonedAt)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-taupe">
                    <Clock className="mt-0.5 h-3.5 w-3.5" />
                    <span>Checkout {fmtWhen(cart.checkoutStartedAt)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-taupe">
                    <Package className="mt-0.5 h-3.5 w-3.5" />
                    <span>Ready to pay {fmtWhen(cart.readyToPayAt)}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[12px] text-taupe">
                    <Clock className="mt-0.5 h-3.5 w-3.5" />
                    <span>Pay clicked {cart.paymentStartedAt ? fmtWhen(cart.paymentStartedAt) : 'not clicked'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-4">
                  <button
                    type="button"
                    onClick={() => handleSendEmail(cart)}
                    disabled={!cart.email || sendingId === cart._id}
                    className="bake-btn bake-btn-rose bake-btn-sm disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    {sendingId === cart._id ? 'Sending…' : 'Send recovery email'}
                  </button>
                  {cart.status === 'abandoned' && !String(cart._id).startsWith('order-') && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRecovered(cart._id)}
                      className="bake-btn bake-btn-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark recovered
                    </button>
                  )}
                  {cart.email && (
                    <a href={`mailto:${cart.email}`} className="text-[13px] font-medium text-cocoa underline decoration-rose-accent underline-offset-4">
                      Email customer
                    </a>
                  )}
                  {cart.phoneNumber && (
                    <a href={`tel:${cart.phoneNumber}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-cocoa underline decoration-rose-accent underline-offset-4">
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </a>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
