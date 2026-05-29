'use client'

import { useCart } from '@/components/useCartStore'
import { useUser } from '@clerk/nextjs'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Information from './Information'
import OrderSummary from './OrderSummary'

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

const CheckoutPage = () => {
  const router = useRouter()
  const { user: clerkUser, isSignedIn } = useUser()
  const {
    items: cartItems,
    userInfo,
    orderSummary,
    paymentMethod,
    setUserInfo,
    setOrderSummary,
    setOrderDetails,
    setOrderSuccess,
    setPaymentMethod,
    appliedPromoCode,
    refreshPrices,
  } = useCart()
  const [isFormValid, setIsFormValid] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [checkingPendingOrder, setCheckingPendingOrder] = useState(true)
  const [checkoutData, setCheckoutData] = useState<PayUCheckoutData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const payUFormRef = useRef<HTMLFormElement>(null)

  // Guest checkout states
  const [createAccount, setCreateAccount] = useState(false)
  const [guestPassword, setGuestPassword] = useState('')

  // Reset payment method and refresh cart prices on mount
  useEffect(() => {
    setPaymentMethod(null)
    refreshPrices()
  }, [setPaymentMethod, refreshPrices])

  // Check for pending order when component mounts or user email changes
  useEffect(() => {
    const checkPendingOrder = async () => {
      const userEmail = clerkUser?.emailAddresses[0]?.emailAddress
      if (!userEmail) {
        setCheckingPendingOrder(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/pending?userEmail=${encodeURIComponent(userEmail)}`)
        const data = await response.json()

        if (data.success && data.hasPendingOrder) {
          setPendingOrder(data.order)
        }
      } catch (error) {
        console.error('Error checking pending order:', error)
      } finally {
        setCheckingPendingOrder(false)
      }
    }

    checkPendingOrder()
  }, [clerkUser?.emailAddresses])

  // Process PayU form submission when data is available
  useEffect(() => {
    if (checkoutData && payUFormRef.current) {
      payUFormRef.current.submit()
    }
  }, [checkoutData])

  const handleResumePayment = async () => {
    if (!pendingOrder || !userInfo) return

    try {
      const response = await fetch('/api/orders/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: pendingOrder._id,
          userEmail: clerkUser?.emailAddresses[0]?.emailAddress,
          deliveryAddress: userInfo,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCheckoutData(data)
      } else {
        alert(data.message || 'Failed to resume payment')
      }
    } catch (error) {
      console.error('Error resuming payment:', error)
      alert('Failed to resume payment')
    }
  }

  const handleCancelPendingOrder = async () => {
    if (!pendingOrder) return

    if (
      !confirm('Are you sure you want to cancel this pending order? You can create a new order after cancellation.')
    ) {
      return
    }

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: pendingOrder._id,
          userEmail: clerkUser?.emailAddresses[0]?.emailAddress,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPendingOrder(null)
        alert('Pending order cancelled successfully')
      } else {
        alert(data.message || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Failed to cancel order')
    }
  }

  const handleConfirmOrder = async () => {
    if (isFormValid && paymentMethod && userInfo && orderSummary) {
      setIsProcessing(true)
      const orderId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      const currentOrderDetails = {
        orderId: orderId,
        name: userInfo.name,
        phone: userInfo.phone,
        address: userInfo.address,
        email: userInfo.email,
        cartItems: cartItems,
        price: orderSummary.total,
        discount: orderSummary.discount,
        paymentMethod: 'prepaid',
      }
      setOrderDetails(currentOrderDetails)
      setOrderSuccess(true)

      const subtotal = orderSummary?.subtotal ?? cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
      const discount = orderSummary?.discount ?? 0
      const shipping = orderSummary?.shipping ?? 0
      const taxes = orderSummary?.taxes ?? 0
      const total = orderSummary?.total ?? Math.max(0, subtotal + shipping + taxes - discount)

      const sanitizedUserInfo = {
        name: userInfo.name?.trim() || '',
        phone: userInfo.phone?.replace(/[^\d+]/g, '') || '',
        email: userInfo.email?.toLowerCase().trim() || '',
        address: userInfo.address?.trim() || '',
        city: userInfo.city?.trim() || '',
        state: userInfo.state?.trim() || '',
        country: userInfo.country?.trim() || '',
        zipcode: userInfo.zipcode?.replace(/\D/g, '') || '',
      }

      const checkoutInfo = {
        cartItems,
        userInfo: sanitizedUserInfo,
        orderSummary: {
          subtotal,
          discount,
          shipping,
          taxes,
          total,
          isExpressDelivery: orderSummary?.isExpressDelivery,
        },
        orderDetails: currentOrderDetails,
        paymentMethod: 'prepaid',
        appliedPromoCode,
        userEmail: clerkUser?.emailAddresses[0]?.emailAddress || sanitizedUserInfo.email,
        firstName: clerkUser?.firstName || sanitizedUserInfo.name.split(' ')[0],
        lastName: clerkUser?.lastName || sanitizedUserInfo.name.split(' ').slice(1).join(' '),
        guestAccountData: createAccount
          ? {
              email: sanitizedUserInfo.email,
              password: guestPassword,
              name: sanitizedUserInfo.name,
              phone: sanitizedUserInfo.phone,
              address: {
                addressLine: sanitizedUserInfo.address,
                city: sanitizedUserInfo.city,
                state: sanitizedUserInfo.state,
                zipcode: sanitizedUserInfo.zipcode,
                country: sanitizedUserInfo.country,
              },
              createAccount: true,
            }
          : undefined,
      }

      // [TEST] Log payload going to /api/create-order so we can verify what the frontend sends
      // console.log('[CHECKOUT → /api/create-order]', JSON.stringify({
      //   userInfo: sanitizedUserInfo,
      //   userEmail: checkoutInfo.userEmail,
      //   firstName: checkoutInfo.firstName,
      //   lastName: checkoutInfo.lastName,
      //   paymentMethod: checkoutInfo.paymentMethod,
      //   appliedPromoCode: checkoutInfo.appliedPromoCode?.code || null,
      //   guestAccountData: checkoutInfo.guestAccountData || null,
      //   cartItemCount: cartItems.length,
      //   orderSummary: checkoutInfo.orderSummary,
      // }, null, 2))

      try {
        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkoutInfo),
        })
        const data = await response.json()

        if (data.success) {
          setCheckoutData(data)
        } else {
          alert(data.message || 'Failed to initiate payment. Please try again.')
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('Payment error:', error instanceof Error ? error.message : 'Unknown error')
        alert('An error occurred while initiating payment. Please try again.')
        setIsProcessing(false)
      }
    }
  }

  const isButtonEnabled = isFormValid && paymentMethod && cartItems.length > 0

  const renderPendingOrderBanner = () => {
    if (!pendingOrder || checkingPendingOrder) return null

    return (
      <div
        className="relative mb-10 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50/40 dark:border-amber-800/40 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-orange-950/10"
        style={{ animation: 'fadeSlideIn 0.5s ease-out' }}
      >
        {/* Decorative top accent */}
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-amber-300 via-amber-400 to-orange-300" />

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="hidden shrink-0 sm:block">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <svg
                  className="h-6 w-6 text-amber-600 dark:text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-family-antonio text-lg font-bold tracking-wide text-amber-900 uppercase dark:text-amber-100">
                Unpaid Order Found
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-amber-700 dark:text-amber-300">
                Order <span className="font-semibold">#{pendingOrder.orderId}</span> is awaiting payment
                <span className="mx-1.5 inline-block h-1 w-1 rounded-full bg-amber-400 align-middle" />
                <span className="font-semibold">
                  {'\u20B9'}
                  {pendingOrder.totalAmount.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:ml-16">
            <button
              onClick={handleResumePayment}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-700 hover:shadow-md active:scale-[0.97]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                />
              </svg>
              Continue Payment
            </button>
            <button
              onClick={handleCancelPendingOrder}
              className="inline-flex items-center rounded-xl border border-amber-300 bg-white/60 px-5 py-2.5 text-sm font-medium text-amber-800 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-sm dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="doodle-canvas relative min-h-screen">
      {/* Doodle divider */}
      <div className="doodle-divider w-full" />

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.6s ease-out both;
        }
        .animate-fade-in-delay-1 {
          animation: fadeSlideIn 0.6s ease-out 0.1s both;
        }
        .animate-fade-in-delay-2 {
          animation: fadeSlideIn 0.6s ease-out 0.2s both;
        }
        .btn-shimmer {
          background-size: 200% auto;
          background-image: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%);
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-14">
        {/* Navigation breadcrumb */}
        <nav className="animate-fade-in mb-3 flex items-center gap-2.5 font-doodle-script text-[22px] text-[var(--color-cocoa-soft)]">
          <Link href="/" className="hover:text-[var(--color-berry)] transition-colors">
            Home
          </Link>
          <span className="text-[var(--color-cocoa-soft)]">/</span>
          <Link href="/cart" className="hover:text-[var(--color-berry)] transition-colors">
            Cart
          </Link>
          <span className="text-[var(--color-cocoa-soft)]">/</span>
          <span className="text-[var(--color-cocoa)]">Checkout</span>
        </nav>

        {/* Page heading */}
        <div className="animate-fade-in-delay-1 mb-10 lg:mb-14">
          <h1 className="doodle-display-lg text-[var(--color-cocoa)]">
            Almost yours.
          </h1>
        </div>

        {/* Pending Order Banner */}
        {renderPendingOrderBanner()}

        {/* Main two-column layout */}
        <div className="animate-fade-in-delay-2 flex flex-col gap-10 lg:flex-row lg:gap-14 xl:gap-20">
          {/* Left Column - Information Form */}
          <div className="min-w-0 flex-1">
            <Information
              onUpdateUserInfo={setUserInfo}
              onUpdatePaymentMethod={setPaymentMethod}
              onUpdateValidation={setIsFormValid}
              createAccount={createAccount}
              onCreateAccountChange={setCreateAccount}
              onPasswordChange={setGuestPassword}
            />
          </div>

          {/* Right Column - Order Summary (Sticky) */}
          <div className="w-full shrink-0 lg:w-[420px] xl:w-[460px]">
            <div className="sticky top-24">
              {/* Summary Card */}
              <div className="doodle-sticker doodle-sticker-butter relative -rotate-1">
                <div className="p-4 lg:p-6">
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-doodle-display text-2xl font-bold text-[var(--color-cocoa)]">
                      Your box
                    </h2>
                    <span className="font-doodle-script text-[18px] text-[var(--color-cocoa-soft)]">
                      {cartItems.length} {cartItems.length === 1 ? 'treat' : 'treats'} inside
                    </span>
                  </div>

                  {/* Cart items + summary */}
                  <OrderSummary onSummaryUpdate={setOrderSummary} />

                  {/* CTA Section */}
                  <div className="mt-8 border-t-[2.5px] border-dashed border-[var(--color-cocoa)]/30 pt-6">
                    <button
                      className={clsx(
                        'doodle-btn w-full justify-center text-lg',
                        isButtonEnabled && !isProcessing
                          ? 'doodle-btn-pink'
                          : 'cursor-not-allowed opacity-50 bg-neutral-200 text-neutral-500 border-[var(--color-cocoa)] shadow-none'
                      )}
                      style={{ padding: '16px' }}
                      onClick={handleConfirmOrder}
                      disabled={!isFormValid || !paymentMethod || isProcessing || cartItems.length === 0}
                    >
                      {/* Shimmer effect on enabled button */}
                      {isButtonEnabled && !isProcessing && (
                        <div className="btn-shimmer pointer-events-none absolute inset-0" />
                      )}

                      <span className="relative z-10">
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2.5">
                            <svg
                              className="h-5 w-5 animate-spin"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Processing...
                          </span>
                        ) : cartItems.length === 0 ? (
                          'Your cart is empty'
                        ) : paymentMethod ? (
                          `Pay \u20B9${orderSummary?.total?.toFixed(2) || '0.00'}`
                        ) : (
                          'Select Payment Method'
                        )}
                      </span>
                    </button>

                    {/* Trust Signals */}
                    <div className="mt-5 flex items-center justify-center gap-5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>SSL Encrypted</span>
                      </div>
                      <div className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="h-3.5 w-3.5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                          />
                        </svg>
                        <span>Secure Checkout</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantee strip below card */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.18"
                  />
                </svg>
                Easy returns & exchanges
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Form for PayU Auto-submit */}
      {checkoutData && (
        <form
          ref={payUFormRef}
          action={process.env.NEXT_PUBLIC_PAYU_URL || 'https://secure.payu.in/_payment'}
          method="post"
          className="hidden"
        >
          <input type="hidden" name="key" value={checkoutData.merchantKey} />
          <input type="hidden" name="txnid" value={checkoutData.txnid} />
          <input type="hidden" name="amount" value={checkoutData.totalAmount} />
          <input type="hidden" name="productinfo" value={checkoutData.productInfo} />
          <input type="hidden" name="firstname" value={checkoutData.firstName} />
          <input type="hidden" name="email" value={checkoutData.email} />
          <input type="hidden" name="surl" value={checkoutData.surl} />
          <input type="hidden" name="furl" value={checkoutData.furl} />
          <input type="hidden" name="hash" value={checkoutData.hash} />
        </form>
      )}
    </main>
  )
}

export default CheckoutPage
