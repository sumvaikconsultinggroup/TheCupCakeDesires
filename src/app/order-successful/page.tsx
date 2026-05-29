'use client'

import Prices from '@/components/Prices'
import { useCart } from '@/components/useCartStore'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  paymentDetails?: {
    paymentMethod?: string
    transactionId?: string
    paymentStatus?: string
  }
}

function OrderSuccessfulContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const txnid = searchParams.get('txnid')
  const orderId = searchParams.get('orderId')
  const { removeAll } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    removeAll()
  }, [removeAll])

  useEffect(() => {
    const fetchOrder = async () => {
      if (!txnid && !orderId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        let response

        if (txnid) {
          response = await fetch(`/api/orders/by-transaction?txnid=${txnid}`)
        } else if (orderId) {
          response = await fetch(`/api/orders/${orderId}`)
        }

        if (!response) throw new Error('No identifier provided')

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
  }, [txnid, orderId])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 30000)

      return () => clearTimeout(timer)
    }
  }, [loading, router])

  if (loading) {
    return (
      <main className="container py-16 lg:pt-20 lg:pb-28">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-green-600">Loading...</h1>
          <p className="mt-4 text-lg">Fetching your order details...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-16 lg:pt-20 lg:pb-28">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-3xl font-semibold text-red-600">Order Not Found</h1>
            <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-lg font-medium text-red-800">Invalid ID</p>
              <p className="mt-1 text-sm text-red-600">Order does not exist</p>
              <p className="mt-2 text-sm text-red-600">Please contact support if you believe this is an error.</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-green-600">Order Successful!</h1>
            <p className="mt-4 text-lg">Thank you for your purchase.</p>

            {txnid && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold">Your Transaction ID is:</h3>
                <p className="mt-2 inline-block rounded-md bg-neutral-100 px-4 py-2 font-mono text-xl dark:bg-neutral-800">
                  {txnid}
                </p>
              </div>
            )}

            {!txnid && orderId && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold">Your Order ID is:</h3>
                <p className="mt-2 inline-block rounded-md bg-neutral-100 px-4 py-2 font-mono text-xl dark:bg-neutral-800">
                  {orderId}
                </p>
              </div>
            )}
          </>
        )}

        {order && order.items && order.items.length > 0 && (
          <div className="mx-auto mt-10 max-w-4xl text-left">
            <h2 className="mb-6 text-2xl font-semibold">Order Details</h2>
            <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="mb-6 border-b border-neutral-200 pb-6 dark:border-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Order ID</p>
                    <p className="text-lg font-semibold">{order.orderId || order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Amount</p>
                    <p className="text-lg font-semibold">${order.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">(Inclusive of all taxes)</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Subtotal (excl GST)</span>
                    <span>
                      $
                      {(
                        order.taxableValue ??
                        (order.subtotal ? Math.round((order.subtotal / 1.05) * 100) / 100 : order.totalAmount)
                      ).toLocaleString()}
                    </span>
                  </div>
                  {(order.discount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">Discount</span>
                      <span className="text-green-600">-${Number(order.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">GST (Incl.)</span>
                    <span>${Number(order.taxes ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Shipping</span>
                    <span>${Number(order.shipping ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold dark:border-neutral-700">
                    <span>Total</span>
                    <span>${order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                {order.paymentDetails?.paymentMethod && (
                  <div className="mt-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Payment Method</p>
                    <p className="text-base font-medium capitalize">{order.paymentDetails.paymentMethod}</p>
                  </div>
                )}
              </div>

              <h3 className="mb-4 text-xl font-semibold">Products Ordered</h3>
              <div className="space-y-6">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 border-b border-neutral-200 pb-6 last:border-0 last:pb-0 dark:border-neutral-700"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-32 sm:w-32 dark:bg-neutral-900">
                      <Image
                        alt={item.name || 'Product Image'}
                        src={item.imageUrl || '/placeholder-images.webp'}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 8rem, 6rem"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-white">
                        {item.productId ? (
                          <Link href={`/products/${item.productId}`} className="hover:text-[#3086C8]">
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}
                      </h4>
                      {item.variants && item.variants.length > 0 && (
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {item.variants.map((v) => `${v.name}: ${v.option}`).join(', ')}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Quantity: {item.quantity}</p>
                        <Prices price={item.price} className="text-base font-semibold" />
                      </div>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        Subtotal: ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link href="/">
            <ButtonPrimary>Continue Shopping</ButtonPrimary>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function OrderSuccessfulPage() {
  return (
    <Suspense
      fallback={
        <main className="container py-16 lg:pt-20 lg:pb-28">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-green-600">Loading...</h1>
          </div>
        </main>
      }
    >
      <OrderSuccessfulContent />
    </Suspense>
  )
}
