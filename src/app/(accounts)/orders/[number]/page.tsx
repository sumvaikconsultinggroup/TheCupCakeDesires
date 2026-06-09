'use client'

import { cancelUserOrder } from '@/app/actions/order-cancellation'
import { Divider } from '@/components/Divider'
import Prices from '@/components/Prices'
import CancelOrderModal from '@/components/order/CancelOrderModal'
import OrderTimeline from '@/components/order/OrderTimeline'
import RefundTimeline from '@/components/refund/RefundTimeline'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface OrderItem {
  productId: string
  name: string
  imageUrl?: string
  quantity: number
  price: number
  variants?: Array<{ name: string; option: string }>
}

interface Order {
  _id: string
  id: string
  orderId?: string
  createdAt: string
  updatedAt: string
  status: string
  totalAmount: number
  subtotal?: number
  taxes?: number
  shipping?: number
  items: OrderItem[]
  shippingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentDetails?: {
    paymentMethod: string
    paymentStatus: string
    transactionId?: string
  }
  statusLogs?: Array<{
    status: string
    timestamp: string
    message?: string
  }>
}

const getStatusStep = (status: string): number => {
  const statusMap: Record<string, number> = {
    pending: 0,
    pending_payment: 0,
    confirmed: 1,
    processing: 1,
    shipped: 2,
    delivered: 3,
    cancelled: -1, // Special case
    refunded: -1,
    return_initiated: -1,
    return_completed: -1,
    expired: -1,
  }
  return statusMap[status] || 0
}

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Order placed',
    pending_payment: 'Payment pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    return_initiated: 'Return initiated',
    return_completed: 'Return completed',
    expired: 'Expired',
  }
  return statusLabels[status] || status
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.number as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [refund, setRefund] = useState<any>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is required')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to fetch order')
          setLoading(false)
          return
        }

        if (data.success && data.order) {
          setOrder(data.order)

          // Fetch refund data if order is cancelled/refunded and paid
          if (
            (data.order.status === 'cancelled' ||
              data.order.status === 'refund_initiated' ||
              data.order.status === 'refunded') &&
            data.order.paymentDetails?.paymentStatus === 'paid'
          ) {
            try {
              const refundResponse = await fetch(`/api/refunds/by-order/${data.order._id}`)
              if (refundResponse.ok) {
                const refundData = await refundResponse.json()
                if (refundData.success && refundData.refund) {
                  setRefund(refundData.refund)
                }
              }
            } catch (refundErr) {
              console.error('Error fetching refund:', refundErr)
            }
          }
        } else {
          setError('Order not found')
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError('Failed to fetch order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const canCancelOrder = () => {
    if (!order) return false
    const nonCancellableStatuses = [
      'delivered',
      'cancelled',
      'refunded',
      'refund_initiated',
      'return_completed',
      'shipped',
    ]
    return !nonCancellableStatuses.includes(order.status)
  }

  const handleCancelOrder = async () => {
    if (!order || !canCancelOrder()) return

    setCancelling(true)
    setCancelError(null)

    try {
      // Call Server Action
      const result = await cancelUserOrder(order._id, cancelReason || 'Changed my mind') // Pass database ID

      if (!result.success) {
        console.error('❌ Cancel failed:', result.error)
        const errorMessage = result.error || 'Failed to cancel order'
        setCancelError(errorMessage)
        setCancelling(false)
        toast.error(errorMessage, {
          duration: 4000,
        })
        return
      }

      // Close modal first
      setShowCancelConfirm(false)
      setCancelReason('')

      // Show success message
      toast.success(result.message || 'Order cancelled successfully', {
        duration: 4000,
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #86efac',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        iconTheme: {
          primary: '#22c55e',
          secondary: '#fff',
        },
      })

      // Force refresh order data
      setLoading(true)
      try {
        const refreshResponse = await fetch(`/api/orders/${orderId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        const refreshData = await refreshResponse.json()

        if (refreshData.success && refreshData.order) {
          setOrder(refreshData.order)
          // Close cancel modal if order is now cancelled
          if (
            refreshData.order.status === 'cancelled' ||
            refreshData.order.status === 'refund_initiated' ||
            refreshData.order.status === 'refunded'
          ) {
            setShowCancelConfirm(false)
            setCancelReason('')
            setCancelling(false)
          }

          // Fetch refund if order is cancelled/refunded and paid
          if (
            (refreshData.order.status === 'cancelled' ||
              refreshData.order.status === 'refund_initiated' ||
              refreshData.order.status === 'refunded') &&
            refreshData.order.paymentDetails?.paymentStatus === 'paid'
          ) {
            try {
              const refundResponse = await fetch(`/api/refunds/by-order/${refreshData.order._id}`)
              if (refundResponse.ok) {
                const refundData = await refundResponse.json()
                if (refundData.success && refundData.refund) {
                  setRefund(refundData.refund)
                }
              }
            } catch (refundErr) {
              console.error('Error fetching refund:', refundErr)
            }
          }
        } else {
          console.error('❌ Failed to refresh order:', refreshData)
        }
      } catch (refreshErr) {
        console.error('❌ Error refreshing order:', refreshErr)
      } finally {
        setLoading(false)
      }
    } catch (err: any) {
      console.error('❌ Error cancelling order:', err)
      const errorMessage = err.message || 'Failed to cancel order. Please try again.'
      setCancelError(errorMessage)
      setCancelling(false)
      toast.error(errorMessage, {
        duration: 4000,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500 dark:border-neutral-700 dark:border-t-primary-500"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
        <h3 className="font-family-antonio text-2xl font-bold text-[#1B198F] uppercase dark:text-[#3086C8]">
          Order not found
        </h3>
        <p className="mt-2 max-w-md px-4 text-neutral-500 dark:text-neutral-400">
          {error || 'The order you are looking for does not exist.'}
        </p>
        <Link
          href="/orders"
          className="mt-8 inline-block rounded-lg bg-[#1B198F] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3086C8]"
        >
          Back to Orders
        </Link>
      </div>
    )
  }

  const orderDate = new Date(order.createdAt)
  const statusStep = getStatusStep(order.status)
  const displayOrderId = order.orderId || order._id.slice(-6).toUpperCase()

  return (
    <div>
      {/* Cancel Confirmation Dialog */}
      <CancelOrderModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false)
          setCancelError(null)
          setCancelReason('')
        }}
        onConfirm={handleCancelOrder}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        cancelling={cancelling}
        cancelError={cancelError}
        orderStatus={order?.status}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-1 text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Order placed</span>
            <time dateTime={orderDate.toISOString()}>
              {' '}
              {orderDate.toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Order #{displayOrderId}</h1>
        </div>

        <div className="ml-auto flex gap-3">
          {/* Show cancelled label if order is cancelled, refund_initiated, or refunded */}
          {order?.status === 'cancelled' || order?.status === 'refund_initiated' || order?.status === 'refunded' ? (
            <div
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium ${
                order.status === 'refunded'
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {order.status === 'refund_initiated' ? (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cancelled - Refund Pending
                </>
              ) : order.status === 'refunded' ? (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cancelled - Refunded
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cancelled
                </>
              )}
            </div>
          ) : canCancelOrder() ? (
            // Only show cancel button if order can be cancelled and is not already cancelled
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-neutral-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Products */}
      <div className="mt-6">
        <h2 className="sr-only">Products purchased</h2>
        <div className="flex flex-col gap-y-10">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="border-t border-b bg-white sm:rounded-lg sm:border dark:bg-neutral-800">
                <div className="py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
                  <div className="sm:flex lg:col-span-7">
                    <div className="relative aspect-square w-full shrink-0 rounded-lg object-cover sm:size-40">
                      <Image
                        alt={item.name || 'Product Image'}
                        src={item.imageUrl || '/placeholder-images.webp'}
                        fill
                        className="rounded-lg object-cover"
                        sizes="(min-width: 640px) 10rem, 100vw"
                      />
                    </div>

                    <div className="mt-6 flex flex-col sm:mt-0 sm:ml-6">
                      <h3 className="text-base font-medium">
                        <Link href={`/products/${item.productId}`} className="hover:text-[#3086C8]">
                          {item.name}
                        </Link>
                      </h3>
                      {item.variants && item.variants.length > 0 && (
                        <p className="my-2 text-sm text-neutral-500 dark:text-neutral-400">
                          {item.variants.map((v) => `${v.name}: ${v.option}`).join(', ')}
                        </p>
                      )}
                      <p className="my-2 text-sm text-neutral-500 dark:text-neutral-400">Qty {item.quantity}</p>
                      <Prices price={item.price} className="mt-auto flex justify-start" />
                    </div>
                  </div>

                  <div className="mt-6 lg:col-span-5 lg:mt-0">
                    <dl className="grid grid-cols-2 gap-x-6 text-sm">
                      {order.shippingAddress && (
                        <div>
                          <dt className="font-medium">Delivery address</dt>
                          <dd className="mt-3 text-neutral-500 dark:text-neutral-400">
                            <span className="block">{order.shippingAddress.street}</span>
                            <span className="block">
                              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                              {order.shippingAddress.postalCode}
                            </span>
                            <span className="block">{order.shippingAddress.country}</span>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                <div className="border-t px-4 py-6 sm:px-6 lg:p-8">
                  <h4 className="sr-only">Status</h4>
                  <p className="text-sm font-medium">
                    {getStatusLabel(order.status)} on{' '}
                    <time dateTime={orderDate.toISOString()}>
                      {orderDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </time>
                  </p>

                  {order.status === 'cancelled' && (
                    <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Order Cancelled</h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>
                              This order has been cancelled.{' '}
                              {order.paymentDetails?.paymentStatus === 'paid' &&
                                'If you paid for this order, a refund has been initiated.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status !== 'cancelled' && (
                    <div aria-hidden="true" className="mt-6">
                      <div className="overflow-hidden rounded-full bg-neutral-200">
                        <div
                          style={{ width: statusStep >= 3 ? '100%' : `calc((${statusStep} * 2 + 1) / 8 * 100%)` }}
                          className="h-2 rounded-full bg-neutral-950 sm:h-1.5"
                        />
                      </div>
                      <div className="mt-6 hidden grid-cols-4 text-sm font-medium text-neutral-500 sm:grid">
                        <div className="text-neutral-950 dark:text-white">Order placed</div>
                        <div className={clsx(statusStep > 0 ? 'text-neutral-950 dark:text-white' : '', 'text-center')}>
                          Processing
                        </div>
                        <div className={clsx(statusStep > 1 ? 'text-neutral-950 dark:text-white' : '', 'text-center')}>
                          Shipped
                        </div>
                        <div className={clsx(statusStep > 2 ? 'text-neutral-950 dark:text-white' : '', 'text-right')}>
                          Delivered
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refund Timeline */}
                  {refund &&
                    (order.status === 'cancelled' ||
                      order.status === 'refund_initiated' ||
                      order.status === 'refunded') && (
                      <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-700">
                        <RefundTimeline
                          statusHistory={refund.statusHistory || []}
                          currentStatus={refund.status}
                          estimatedRefundDate={refund.estimatedRefundDate}
                          isAdmin={false}
                        />
                        {refund.rejectionReason && (
                          <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">Refund Rejected</p>
                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{refund.rejectionReason}</p>
                          </div>
                        )}
                        {refund.refundReferenceNumber && (
                          <div className="mt-4 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Refund Completed</p>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                              Reference Number:{' '}
                              <span className="font-mono font-semibold">{refund.refundReferenceNumber}</span>
                            </p>
                            {refund.refundMethod && (
                              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                Method: {refund.refundMethod.replace(/_/g, ' ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Order Timeline */}
                  <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-700">
                    <OrderTimeline
                      status={order.status}
                      statusLogs={order.statusLogs}
                      createdAt={order.createdAt}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
              <p className="text-neutral-500 dark:text-neutral-400">No items found in this order.</p>
            </div>
          )}
        </div>
      </div>

      {/* Billing Summary */}
      <div className="mt-16">
        <h2 className="sr-only">Billing Summary</h2>

        <div className="bg-neutral-50 px-4 py-6 sm:rounded-lg sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8 lg:py-8 dark:bg-neutral-800">
          <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-7">
            {order.shippingAddress && (
              <div>
                <dt className="font-medium">Shipping address</dt>
                <dd className="mt-3 text-neutral-500 dark:text-neutral-400">
                  <span className="block">{order.shippingAddress.street}</span>
                  <span className="block">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </span>
                  <span className="block">{order.shippingAddress.country}</span>
                </dd>
              </div>
            )}
            {order.paymentDetails && (
              <div>
                <dt className="font-medium">Payment information</dt>
                <dd className="mt-3 text-neutral-500 dark:text-neutral-400">
                  <p className="font-medium capitalize">{order.paymentDetails.paymentMethod}</p>
                  <p className="mt-1 capitalize">{order.paymentDetails.paymentStatus}</p>
                  {order.paymentDetails.transactionId && (
                    <p className="mt-1 text-xs">Transaction: {order.paymentDetails.transactionId.slice(-8)}</p>
                  )}
                </dd>
              </div>
            )}
          </dl>

          <dl className="mt-8 flex flex-col gap-y-5 text-sm lg:col-span-5 lg:mt-0">
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600 dark:text-neutral-300">Subtotal</dt>
              <dd className="font-medium">${(order.subtotal ?? order.totalAmount).toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600 dark:text-neutral-300">GST (Incl.)</dt>
              <dd className="font-medium">${Number(order.taxes ?? 0).toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600 dark:text-neutral-300">Shipping</dt>
              <dd className="font-medium">${Number(order.shipping ?? 0).toFixed(2)}</dd>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <dt className="font-medium">Order total</dt>
              <dd className="font-medium">${order.totalAmount.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
