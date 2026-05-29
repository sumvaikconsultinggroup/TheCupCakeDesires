'use client'

import { cancelUserOrder } from '@/app/actions/order-cancellation'
import { Link } from '@/components/Link'
import CancelOrderModal from '@/components/order/CancelOrderModal'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  Truck,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface IOrderItemVariant {
  name: string
  option: string
}

interface IOrderItem {
  productId: string
  name: string
  productName?: string
  quantity: number
  price: number
  imageUrl?: string
  variants?: IOrderItemVariant[]
}

interface IOrder {
  _id: string
  orderId?: string
  createdAt: string
  status: string
  totalAmount: number
  items: IOrderItem[]
  paymentDetails?: {
    paymentMethod?: string
    paymentStatus?: string
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_META: Record<
  string,
  { label: string; tone: 'baking' | 'on-the-way' | 'delivered' | 'cancelled' | 'refund'; Icon: any }
> = {
  pending: { label: 'On the bench', tone: 'baking', Icon: Clock },
  confirmed: { label: 'Confirmed · baking', tone: 'baking', Icon: Clock },
  processing: { label: 'In the oven', tone: 'baking', Icon: Clock },
  packed: { label: 'Hand-boxed', tone: 'on-the-way', Icon: Package },
  shipped: { label: 'On the way', tone: 'on-the-way', Icon: Truck },
  out_for_delivery: { label: 'Out for delivery', tone: 'on-the-way', Icon: Truck },
  delivered: { label: 'Delivered', tone: 'delivered', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', tone: 'cancelled', Icon: XCircle },
  refund_initiated: { label: 'Refund in progress', tone: 'refund', Icon: Clock },
  refunded: { label: 'Refunded', tone: 'delivered', Icon: CheckCircle2 },
}

function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, tone: 'baking' as const, Icon: Clock }
  const { Icon } = meta
  const toneClasses = {
    baking: 'border-line bg-cream text-cocoa',
    'on-the-way': 'border-rose-accent/40 bg-rose/40 text-rose-accent',
    delivered: 'border-rose-accent/40 bg-rose-accent/15 text-rose-accent',
    cancelled: 'border-line bg-ivory text-cocoa-soft',
    refund: 'border-line bg-cream-deep/40 text-cocoa',
  }[meta.tone]
  return (
    <span
      className={`font-bake-body inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium tracking-[0.04em] ${toneClasses}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      {meta.label}
    </span>
  )
}

const OrderCard = ({
  order,
  index,
  onCancelClick,
}: {
  order: IOrder
  index: number
  onCancelClick: (o: IOrder) => void
}) => {
  const canCancel = ![
    'shipped',
    'delivered',
    'cancelled',
    'refund_initiated',
    'refunded',
  ].includes(order.status)
  const isCancelled = ['cancelled', 'refund_initiated', 'refunded'].includes(order.status)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
      className="overflow-hidden rounded-3xl border border-line bg-ivory"
    >
      {/* Order header */}
      <header className="flex flex-col gap-4 border-b border-line bg-cream/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/orders/${order._id}`}
              className="font-bake-display text-[17px] font-medium text-cocoa transition-colors hover:text-rose-accent"
            >
              #{order.orderId || order._id.slice(-6).toUpperCase()}
            </Link>
            <StatusChip status={order.status} />
          </div>
          <p className="bake-caption mt-2 text-taupe">Ordered {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/orders/${order._id}`}
            className="bake-btn bake-btn-ghost bake-btn-sm"
          >
            View order
            <ChevronRight className="ml-1 h-4 w-4" strokeWidth={1.8} />
          </Link>
          {canCancel && !isCancelled && (
            <button
              onClick={() => onCancelClick(order)}
              className="font-bake-body inline-flex items-center justify-center rounded-full border border-line bg-ivory px-4 py-1.5 text-[13px] font-medium text-cocoa-soft transition-all hover:border-rose-accent hover:text-rose-accent"
            >
              Cancel order
            </button>
          )}
        </div>
      </header>

      {/* Items */}
      <ul className="divide-y divide-line px-6 md:px-8">
        {order.items.map((item, i) => {
          const handle =
            (item.name || item.productName || '').toLowerCase().replace(/\s+/g, '-')
          return (
            <li key={i} className="flex gap-5 py-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name || 'Item'}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cocoa-soft">
                    <Package className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bake-display line-clamp-1 text-[16px] font-medium text-cocoa">
                      {item.name || item.productName}
                    </h3>
                    {item.variants && item.variants.length > 0 && (
                      <p className="bake-caption mt-1 text-taupe">
                        {item.variants
                          .filter((v) => v.option)
                          .map((v) => v.option)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bake-display shrink-0 text-[15px] font-semibold text-cocoa">
                    ${(item.price || 0).toLocaleString()}
                  </span>
                </div>
                <div className="mt-auto flex items-baseline justify-between pt-3">
                  <p className="bake-caption text-taupe">Qty {item.quantity}</p>
                  {order.status === 'delivered' && (
                    <Link
                      href={`/products/${handle}#reviews`}
                      className="bake-caption font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                    >
                      Leave a review
                    </Link>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Footer total */}
      <footer className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line bg-cream/30 px-6 py-5 md:px-8">
        <span className="bake-caption text-taupe">
          {order.paymentDetails?.paymentMethod
            ? `Paid via ${order.paymentDetails.paymentMethod}`
            : 'Order total'}
        </span>
        <span
          className="font-bake-display text-[22px] font-semibold text-cocoa"
          style={{ letterSpacing: '-0.01em' }}
        >
          ${(order.totalAmount || 0).toLocaleString()}
        </span>
      </footer>
    </motion.article>
  )
}

const Page = () => {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orderHistory')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleCancelClick = (order: IOrder) => {
    setSelectedOrder(order)
    setShowCancelModal(true)
    setCancelError(null)
  }

  const handleCancelConfirm = async () => {
    if (!selectedOrder || !cancelReason) return
    setCancelling(true)
    setCancelError(null)
    try {
      const result = await cancelUserOrder(selectedOrder._id, cancelReason)
      if (result.success) {
        toast.success(result.message || 'Order cancelled', {
          description: 'We&rsquo;ve passed it on to the kitchen.',
        })
        setShowCancelModal(false)
        setCancelReason('')
        setSelectedOrder(null)
        fetchOrders()
      } else {
        setCancelError(result.error || 'Failed to cancel order')
        toast.error(result.error || 'Failed to cancel order')
      }
    } catch (error: any) {
      const msg = error.message || 'Could not cancel — please try again.'
      setCancelError(msg)
      toast.error(msg)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-cream px-5 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-rose-accent" strokeWidth={1.8} />
          <p className="bake-body-sm text-cocoa-soft">Looking up your orders…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setCancelError(null)
          setCancelReason('')
          setSelectedOrder(null)
        }}
        onConfirm={handleCancelConfirm}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        cancelling={cancelling}
        cancelError={cancelError}
        orderStatus={selectedOrder?.status}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="bake-eyebrow text-taupe">Order history</p>
          <h2 className="font-bake-display mt-1 text-[26px] font-medium text-cocoa">
            Your kitchen{' '}
            <span className="bake-display-italic text-rose-accent">orders.</span>
          </h2>
        </div>
        <p className="bake-caption text-taupe">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </header>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order, i) => (
            <OrderCard
              key={order._id}
              order={order}
              index={i}
              onCancelClick={handleCancelClick}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-cream/40 p-12 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent">
            <Package className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h3 className="font-bake-display mt-6 text-[24px] font-medium text-cocoa">
            No orders yet.
          </h3>
          <p className="bake-body mt-3 max-w-[44ch] mx-auto text-cocoa-soft">
            Once you&rsquo;ve placed your first order with us, it&rsquo;ll show up here with all
            the kitchen updates.
          </p>
          <Link href="/collections/all" className="bake-btn mt-7">
            Shop today&rsquo;s menu
          </Link>
        </div>
      )}
    </div>
  )
}

export default Page
