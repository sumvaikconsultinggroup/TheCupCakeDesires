'use client'

import { getCartSessionId, useCart } from '@/components/useCartStore'
import { useUser } from '@clerk/nextjs'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Package,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type DeliveryDetailsValue } from './DeliveryDetails'
import Information from './Information'
import OrderSummary from './OrderSummary'

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
    captureCheckoutContact,
  } = useCart()
  const [isFormValid, setIsFormValid] = useState(false)
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetailsValue | null>(null)
  const [pendingOrder, setPendingOrder] = useState<any>(null)
  const [checkingPendingOrder, setCheckingPendingOrder] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Guest checkout states
  const [createAccount, setCreateAccount] = useState(false)
  const [guestPassword, setGuestPassword] = useState('')

  // Default to Stripe (the only provider) and refresh cart prices on mount
  useEffect(() => {
    setPaymentMethod('stripe' as any)
    refreshPrices()
  }, [setPaymentMethod, refreshPrices])

  // Cart-recovery contact capture: the moment we know the shopper's email
  // (guest or account), attach it to the tracked cart so an abandoned checkout
  // can still be emailed a resume link.
  useEffect(() => {
    const email = userInfo?.email?.trim()
    if (email && /^\S+@\S+\.\S+$/.test(email)) {
      captureCheckoutContact(email.toLowerCase(), userInfo?.name || undefined)
    }
  }, [userInfo?.email, userInfo?.name, captureCheckoutContact])

  // Redirect to Stripe Checkout once we have an orderId
  // The Stripe amount is derived entirely server-side from the persisted order,
  // so we only need to hand the checkout route the order id (never client prices).
  const startStripeCheckout = async (orderId: string, customerName: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        metadata: { customerName, orderId },
      }),
    })
    const data = await res.json()
    if (data.success && data.url) {
      window.location.href = data.url
    } else {
      throw new Error(data.message || 'Could not start Stripe Checkout')
    }
  }

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

  const handleResumePayment = async () => {
    if (!pendingOrder || !userInfo) return

    try {
      const response = await fetch('/api/orders/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pendingOrder._id,
          userEmail: clerkUser?.emailAddresses[0]?.emailAddress,
          deliveryAddress: userInfo,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        alert(data.message || 'Failed to resume payment')
        return
      }
      await startStripeCheckout(String(data.orderId), data.customerName || userInfo.name)
    } catch (error: any) {
      console.error('Error resuming payment:', error)
      alert(error?.message || 'Failed to resume payment')
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
        // Identity comes from the session server-side — sending an email address
        // here would be decorative, and trusting one was the old security hole.
        body: JSON.stringify({ orderId: pendingOrder._id }),
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
    if (isFormValid && deliveryDetails && paymentMethod && userInfo && orderSummary) {
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
        // Delivery instructions ride along as the customer note (create-order
        // reads orderDetails.notes and stores it on Order.notes).
        notes: deliveryDetails.deliveryInstructions,
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
        // Self-delivery scheduling collected in the Delivery details section.
        deliveryDate: deliveryDetails.deliveryDate,
        deliverySlot: deliveryDetails.deliverySlot,
        deliveryInstructions: deliveryDetails.deliveryInstructions,
        deliveryPostcode: deliveryDetails.postcode,
        // Recovery-cart identity — lets the server mark this browser's tracked
        // cart as converted so no recovery emails fire after purchase.
        cartSessionId: getCartSessionId(),
        appliedPromoCode,
        userEmail: clerkUser?.emailAddresses[0]?.emailAddress || sanitizedUserInfo.email,
        firstName: clerkUser?.firstName || sanitizedUserInfo.name.split(' ')[0],
        lastName: clerkUser?.lastName || sanitizedUserInfo.name.split(' ').slice(1).join(' '),
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

        if (!data.success) {
          alert(data.message || 'Failed to initiate payment. Please try again.')
          setIsProcessing(false)
          return
        }

        // Hand off to Stripe Checkout — the redirect happens inside the helper.
        // Amount is computed server-side from the order we just created.
        await startStripeCheckout(String(data.orderId), data.customerName || sanitizedUserInfo.name)
      } catch (error: any) {
        console.error('Payment error:', error?.message ?? 'Unknown error')
        alert(error?.message || 'An error occurred while initiating payment. Please try again.')
        setIsProcessing(false)
      }
    }
  }

  const isButtonEnabled = Boolean(isFormValid && paymentMethod && cartItems.length > 0)

  const renderPendingOrderBanner = () => {
    if (!pendingOrder || checkingPendingOrder) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="font-bake-body mb-10 overflow-hidden rounded-3xl border border-rose-accent/40 bg-rose/40"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-accent/40 bg-ivory text-rose-accent sm:flex">
              <Clock className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <div className="flex-1">
              <p className="bake-eyebrow text-rose-accent">
                <span className="inline-block h-px w-6 align-middle bg-rose-accent mr-2" />
                Unpaid order
              </p>
              <h3 className="font-bake-display mt-1 text-[20px] font-medium leading-tight text-cocoa">
                We held onto a previous box for you.
              </h3>
              <p className="bake-body-sm mt-2 text-cocoa-soft">
                Order <span className="font-medium text-cocoa">#{pendingOrder.orderId}</span> is
                still waiting on payment ·{' '}
                <span className="font-bake-display text-cocoa">
                  ${pendingOrder.totalAmount.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:ml-16">
            <button onClick={handleResumePayment} className="bake-btn">
              <Play className="mr-1.5 h-4 w-4" strokeWidth={1.8} />
              Continue payment
            </button>
            <button
              onClick={handleCancelPendingOrder}
              className="font-bake-body inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa-soft transition-colors hover:border-rose-accent hover:text-rose-accent"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
              Cancel order
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <main className="font-bake-body relative min-h-screen bg-ivory text-cocoa">
      {/* ─── Breadcrumb ─── */}
      <nav aria-label="Breadcrumb" className="border-b border-line bg-cream/60">
        <ol className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-1.5 px-6 py-4 text-[12px] tracking-[0.04em] text-taupe md:px-10">
          <li>
            <Link href="/" className="hover:text-cocoa">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </li>
          <li>
            <Link href="/cart" className="hover:text-cocoa">
              Cart
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </li>
          <li className="text-cocoa">Checkout</li>
        </ol>
      </nav>

      {/* ─── Editorial hero ─── */}
      <section className="relative overflow-hidden bg-cream py-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-rose-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-32 h-72 w-72 rounded-full bg-cocoa/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[55ch]"
          >
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Almost there
            </p>
            <h1 className="bake-display-xl mt-5">
              Sweet — let&rsquo;s get this{' '}
              <span className="bake-display-italic text-rose-accent">on the tray.</span>
            </h1>
            <p className="bake-body mt-5 max-w-[58ch] text-cocoa-soft">
              Fill in where the box should go, give it a final review, then we&rsquo;ll hand you
              over to Stripe to pay securely. Every order is baked the morning of delivery —
              a single box can arrive as soon as tomorrow, and cakes need 3 days&rsquo; notice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Body: form + sticky summary ─── */}
      <section className="bg-ivory pb-24 pt-12 md:pb-32 md:pt-16">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          {renderPendingOrderBanner()}

          <div className="flex flex-col gap-10 lg:flex-row lg:gap-14 xl:gap-16">
            {/* Left — guided checkout wizard: Delivery → Contact → Shipping */}
            <div className="min-w-0 flex-1">
              <Information
                onUpdateUserInfo={setUserInfo}
                onUpdatePaymentMethod={setPaymentMethod}
                onUpdateValidation={setIsFormValid}
                onDeliveryChange={setDeliveryDetails}
                createAccount={createAccount}
                onCreateAccountChange={setCreateAccount}
                onPasswordChange={setGuestPassword}
                onConfirmOrder={handleConfirmOrder}
                isConfirming={isProcessing}
                canConfirmOrder={Boolean(isButtonEnabled && !isProcessing)}
              />
            </div>

            {/* Right — sticky order summary */}
            <aside className="w-full shrink-0 lg:w-[400px] xl:w-[440px]">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="overflow-hidden rounded-3xl border border-line bg-cream/60"
                >
                  <header className="flex items-center justify-between border-b border-line bg-ivory px-6 py-5">
                    <div>
                      <p className="bake-caption text-taupe">Your box</p>
                      <h2 className="font-bake-display mt-1 text-[20px] font-medium leading-tight text-cocoa">
                        {cartItems.length === 0
                          ? 'Empty for now'
                          : `${cartItems.length} ${
                              cartItems.length === 1 ? 'treat' : 'treats'
                            } inside`}
                      </h2>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-cream text-cocoa-soft">
                      <Package className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </header>

                  <div className="px-6 py-5">
                    <OrderSummary
                      onSummaryUpdate={setOrderSummary}
                      deliveryPostcode={
                        deliveryDetails?.postcodeServiceable ? deliveryDetails.postcode : undefined
                      }
                      deliveryFeeHint={deliveryDetails?.deliveryFee ?? null}
                    />
                  </div>

                  <div className="border-t border-line bg-cream/60 p-6">
                    <button
                      className={clsx(
                        'group relative w-full overflow-hidden rounded-full px-6 py-3.5 text-[15px] font-medium tracking-[0.01em] transition-all',
                        isButtonEnabled && !isProcessing
                          ? 'bg-cocoa text-ivory hover:bg-rose-accent'
                          : 'cursor-not-allowed bg-cream-deep/60 text-cocoa-soft'
                      )}
                      onClick={handleConfirmOrder}
                      disabled={
                        !isFormValid || !paymentMethod || isProcessing || cartItems.length === 0
                      }
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                            Processing&hellip;
                          </>
                        ) : cartItems.length === 0 ? (
                          'Your box is empty'
                        ) : paymentMethod ? (
                          <>
                            <Lock className="h-4 w-4" strokeWidth={1.8} />
                            Pay ${orderSummary?.total?.toFixed(2) || '0.00'}
                          </>
                        ) : (
                          'Continue to payment'
                        )}
                      </span>
                    </button>

                    <div className="mt-5 flex items-center justify-center gap-5 text-[11px] tracking-[0.04em] text-taupe">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-rose-accent" strokeWidth={1.8} />
                        Secured by Stripe
                      </span>
                      <span aria-hidden className="h-3 w-px bg-line" />
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-rose-accent" strokeWidth={1.8} />
                        SSL encrypted
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Footnote chip */}
                <p className="bake-caption mt-4 text-center text-taupe">
                  Bake-to-order kitchen · next-day on a single box, 3 days for cakes
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default CheckoutPage
