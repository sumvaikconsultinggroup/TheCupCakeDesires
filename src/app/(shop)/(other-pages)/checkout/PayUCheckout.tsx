'use client'
import PayUForm from '@/components/PayUForm'
import Prices from '@/components/Prices'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { CartItem, useCart } from '../../../../components/useCartStore'

interface PayUCheckoutData {
  merchantKey: string
  totalAmount: number
  productInfo: string
  firstName: string
  email: string
  txnid: string
  surl: string
  furl: string
  hash: string
}

const PayUCheckout = () => {
  const { user: clerkUser } = useUser()
  const { items: cartItems, userInfo, orderDetails, paymentMethod, orderSummary, appliedPromoCode } = useCart()
  const [checkoutData, setCheckoutData] = useState<PayUCheckoutData | null>(null)
  const [loading, setLoading] = useState(true)

  const subtotal = orderSummary?.subtotal ?? cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discount = orderSummary?.discount ?? 0
  const shipping = orderSummary?.shipping ?? 0
  const taxes = orderSummary?.taxes ?? 0
  const total = orderSummary?.total ?? Math.max(0, subtotal + shipping + taxes - discount)

  useEffect(() => {
    const handleCheckout = async () => {
      const checkoutInfo = {
        cartItems,
        userInfo,
        orderSummary: { subtotal, discount, shipping, taxes, total },
        orderDetails,
        paymentMethod: 'prepaid',
        appliedPromoCode,
        userEmail: clerkUser?.emailAddresses[0]?.emailAddress,
        firstName: clerkUser?.firstName,
        lastName: clerkUser?.lastName,
      }

      if (cartItems && cartItems.length > 0) {
        try {
          const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutInfo),
          })
          const data = await response.json()
          if (data.success) {
            setCheckoutData(data)
          } else {
            console.error('Order creation failed')
            setLoading(false)
          }
        } catch (error) {
          console.error('Checkout error:', error instanceof Error ? error.message : 'Unknown error')
        } finally {
          setLoading(false)
        }
      }
    }

    if (clerkUser && cartItems.length > 0) {
      handleCheckout()
    } else if (cartItems.length === 0) {
      setLoading(false)
    }
  }, [
    cartItems,
    userInfo,
    orderDetails,
    paymentMethod,
    clerkUser,
    orderSummary, // Include orderSummary to react to changes
    appliedPromoCode,
  ])

  const renderProduct = (item: CartItem, index: number) => {
    const { name: title, price, imageUrl, quantity, variant } = item

    return (
      <div key={index} className="flex py-4 last:pb-0">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <Image fill src={imageUrl || ''} alt={title} className="h-full w-full object-contain object-center" />
        </div>

        <div className="ml-4 flex flex-1 flex-col">
          <div>
            <div className="flex justify-between">
              <div>
                <h3 className="text-base font-medium">{title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <span>{variant?.name}</span>
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Qty: {quantity}</p>
              </div>
              <Prices price={price} className="mt-0.5 ml-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderOrderSummary = () => {
    return (
      <div className="rounded-lg bg-slate-50 p-6 dark:bg-slate-800">
        <h2 className="text-xl font-semibold">Order Summary</h2>
        <div className="mt-6 space-y-4">{cartItems.map(renderProduct)}</div>
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Shipping</span>
            <span className="font-medium">${shipping.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Taxes</span>
            <span className="font-medium">${taxes.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="mt-2 flex justify-between">
              <span>Discount</span>
              <span className="font-medium text-green-500">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold dark:border-slate-700">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="py-20 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Your cart is empty</h2>
        <p>Please add items to your cart before proceeding to checkout.</p>
      </div>
    )
  }

  return (
    <main className="container py-16 lg:pt-20 lg:pb-28">
      <div className="mb-12 sm:mb-16">
        <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/2 lg:pr-12">
          <h2 className="mb-6 text-xl font-semibold">Securely Pay with PayU</h2>
          {!checkoutData ? (
            <p>Loading checkout data...</p>
          ) : (
            (() => {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL
              if (checkoutData.txnid) {
                return (
                  <div className="rounded-lg">
                    <PayUForm
                      merchantKey={checkoutData.merchantKey}
                      amount={checkoutData.totalAmount}
                      productInfo={checkoutData.productInfo}
                      firstName={checkoutData.firstName}
                      email={checkoutData.email}
                      txnid={checkoutData.txnid}
                      surl={checkoutData.surl}
                      furl={checkoutData.furl}
                      hash={checkoutData.hash}
                    />
                  </div>
                )
              }
              return (
                <div className="rounded-lg">
                  <PayUForm
                    merchantKey={checkoutData.merchantKey}
                    amount={checkoutData.totalAmount}
                    productInfo={checkoutData.productInfo}
                    firstName={checkoutData.firstName}
                    email={checkoutData.email}
                    txnid={checkoutData.txnid}
                    surl={checkoutData.surl}
                    furl={checkoutData.furl}
                    hash={checkoutData.hash}
                  />
                </div>
              )
            })()
          )}
        </div>
        <div className="mt-10 lg:mt-0 lg:w-1/2">{renderOrderSummary()}</div>
      </div>
    </main>
  )
}

export default PayUCheckout
