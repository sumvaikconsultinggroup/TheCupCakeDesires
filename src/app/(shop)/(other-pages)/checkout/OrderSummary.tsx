'use client'

import { useCart } from '@/components/useCartStore'
import CorporateLogoStrip from '@/components/order/CorporateLogoStrip'
import { parseCupcakeContents } from '@/lib/cupcake-builder-images'
import NcImage from '@/shared/NcImage/NcImage'
import {
  calculateDeliveryCharge,
  EXPRESS_DELIVERY_CHARGE,
} from '@/utils/deliveryCharge'
import {
  FREE_DELIVERY_THRESHOLD,
  getDeliveryZoneInfo,
  PRIORITY_DELIVERY_WINDOW_HINT,
} from '@/utils/deliveryArea'
import confetti from 'canvas-confetti'
import Link from 'next/link'
import { useEffect, useState, useRef, memo, useCallback } from 'react'

interface OrderSummaryProps {
  onSummaryUpdate: (details: {
    subtotal: number
    discount: number
    shipping: number
    taxes: number
    total: number
    isExpressDelivery?: boolean
  }) => void
  /** Checked serviceable postcode from Delivery step — drives zone fee. */
  deliveryPostcode?: string
  deliveryFeeHint?: number | null
}

function firePriorityPoppers() {
  const common = {
    particleCount: 70,
    spread: 70,
    startVelocity: 45,
    gravity: 0.9,
    ticks: 220,
    colors: ['#E8A0BF', '#F5D0C5', '#2E1F15', '#F4C430', '#FFFFFF', '#C45C7A'],
    disableForReducedMotion: true,
  } as confetti.Options

  // Party poppers from bottom-left and bottom-right
  confetti({ ...common, angle: 60, origin: { x: 0, y: 1 } })
  confetti({ ...common, angle: 120, origin: { x: 1, y: 1 } })
  window.setTimeout(() => {
    confetti({ ...common, particleCount: 40, angle: 70, origin: { x: 0.1, y: 1 } })
    confetti({ ...common, particleCount: 40, angle: 110, origin: { x: 0.9, y: 1 } })
  }, 180)
}

interface PromoCodeDetails {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  appliesTo?: 'all' | 'products' | 'categories'
  productIds?: string[]
  categoryNames?: string[]
}

const CupcakeContentsChips = ({ contents }: { contents?: string }) => {
  const flavours = parseCupcakeContents(contents)
  if (flavours.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {flavours.map((flavour) => (
        <span
          key={flavour.name}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 py-0.5 pl-0.5 pr-2 text-[10px] font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          {flavour.image && (
            <span className="relative h-4 w-4 overflow-hidden rounded-full bg-white">
              <NcImage src={flavour.image} alt={flavour.name} fill sizes="16px" className="object-cover" />
            </span>
          )}
          {flavour.quantity}x {flavour.name}
        </span>
      ))}
    </div>
  )
}

const OrderSummary: React.FC<OrderSummaryProps> = memo(
  ({ onSummaryUpdate, deliveryPostcode, deliveryFeeHint }) => {
  const {
    items: cartItems,
    removeItem,
    updateItemQuantity,
    applyPromoCode: applyPromoCodeToStore,
    removePromoCode: removePromoCodeFromStore,
    appliedPromoCode: appliedPromoCodeFromStore,
    setOrderSummary,
    userInfo,
  } = useCart()

  const [isClient, setIsClient] = useState(false)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPriorityBanner, setShowPriorityBanner] = useState(false)

  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCodeDetails | null>(null)
  const [discount, setDiscount] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const [isExpressDelivery, setIsExpressDelivery] = useState(false)

  const zoneInfo = deliveryPostcode ? getDeliveryZoneInfo(deliveryPostcode) : null
  const FREE_SHIPPING_THRESHOLD = FREE_DELIVERY_THRESHOLD

  // Stable refs to avoid re-render loops — these callbacks should not be in the dependency array
  const onSummaryUpdateRef = useRef(onSummaryUpdate)
  onSummaryUpdateRef.current = onSummaryUpdate
  const setOrderSummaryRef = useRef(setOrderSummary)
  setOrderSummaryRef.current = setOrderSummary

  useEffect(() => {
    // subtotal = sum of all product prices (before any discount or shipping)
    // total = final amount customer pays (subtotal + shipping - discount)
    let newDiscount = 0

    if (appliedPromoCode) {
      const applicableItems =
        !appliedPromoCode.appliesTo || appliedPromoCode.appliesTo === 'all'
          ? cartItems
          : cartItems.filter((item) => {
            if (appliedPromoCode.appliesTo === 'products' && appliedPromoCode.productIds) {
              return appliedPromoCode.productIds.includes(item.productId)
            }
            if (appliedPromoCode.appliesTo === 'categories' && appliedPromoCode.categoryNames && item.category) {
              return appliedPromoCode.categoryNames.includes(item.category)
            }
            return false
          })

      const applicableSubtotal = applicableItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

      if (appliedPromoCode.discountType === 'percentage') {
        newDiscount = applicableSubtotal * (appliedPromoCode.discountValue / 100)
      } else {
        newDiscount = appliedPromoCode.discountValue
      }
    }

    const calculatedShipping = calculateDeliveryCharge(
      subtotal,
      isExpressDelivery,
      deliveryPostcode
    ).amount
    const calculatedTotal = Math.max(0, subtotal + calculatedShipping - newDiscount)

    setDiscount(newDiscount)
    setShipping(calculatedShipping)
    setTotal(calculatedTotal)

    const summary = {
      subtotal,                   // product prices total (before discount)
      discount: newDiscount,
      shipping: calculatedShipping,
      taxes: 0,
      total: calculatedTotal,     // final amount (after discount)
      isExpressDelivery,
    }

    onSummaryUpdateRef.current(summary)
    setOrderSummaryRef.current(summary)
  }, [subtotal, appliedPromoCode, cartItems, isExpressDelivery, deliveryPostcode])

  const handlePriorityToggle = (checked: boolean) => {
    setIsExpressDelivery(checked)
    if (checked) {
      firePriorityPoppers()
      setShowPriorityBanner(true)
      window.setTimeout(() => setShowPriorityBanner(false), 4200)
    } else {
      setShowPriorityBanner(false)
    }
  }

  const handleApplyPromoCode = useCallback(async (code: string) => {
    if (!code) return
    setIsLoading(true)
    setPromoMessage('')

    // Always validate promo codes via backend to ensure frontend and backend
    // calculate the same discount (prevents PayU amount mismatch)
    try {
      const response = await fetch('/api/promoCode/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          cartItems: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          userEmail: userInfo?.email,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAppliedPromoCode(result.promoCode)
        const applicableIds = result.applicableProductIds || []
        applyPromoCodeToStore(result.promoCode, applicableIds)
        setPromoMessage('Promo code applied successfully!')
        setPromoCodeInput(result.promoCode.code)
      } else {
        setPromoMessage(result.message || 'Failed to apply promo code.')
        setAppliedPromoCode(null)
      }
    } catch (error) {
      console.error('Promo code fetch error:', error)
      setPromoMessage('An error occurred while applying the promo code.')
      setAppliedPromoCode(null)
    } finally {
      setIsLoading(false)
    }
  }, [subtotal, cartItems, applyPromoCodeToStore, userInfo?.email])

  const handleRemovePromoCode = useCallback(() => {
    setAppliedPromoCode(null)
    setPromoCodeInput('')
    setDiscount(0)
    setPromoMessage('Promo code removed.')
    removePromoCodeFromStore()
  }, [removePromoCodeFromStore])

  const currentShipping = shipping
  const subtotalAfterDiscount = Math.max(0, subtotal - discount)

  useEffect(() => {
    if (appliedPromoCodeFromStore) {
      setAppliedPromoCode(appliedPromoCodeFromStore)
      setPromoCodeInput(appliedPromoCodeFromStore.code)
    }
  }, [appliedPromoCodeFromStore])

  if (!isClient) {
    return null
  }

  return (
    <div>
      {/* Priority customer celebration */}
      {showPriorityBanner && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-8 z-[80] flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="animate-in fade-in slide-in-from-bottom-4 zoom-in-95 rounded-2xl border border-rose-200 bg-ivory/95 px-5 py-3.5 text-center shadow-[0_20px_50px_-20px_rgba(46,31,21,0.45)] backdrop-blur-sm duration-500">
            <p className="font-bake-display text-lg font-medium text-cocoa">
              You are our priority customer
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-taupe">
              Tell us in delivery instructions how soon you want your order on that date
              ({PRIORITY_DELIVERY_WINDOW_HINT}).
            </p>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div key={item.id} className="group flex gap-4 py-4 first:pt-0 last:pb-0">
              {/* Product Image */}
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-neutral-200/60 dark:bg-neutral-800 dark:ring-neutral-700/60">
                {item.imageUrl && (
                  <NcImage
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="72px"
                    className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <Link className="absolute inset-0" href={`/products/${item.handle}`} />
              </div>

              {/* Product Details */}
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium leading-tight text-neutral-900 dark:text-neutral-100">
                      <Link href={`/products/${item.handle}`} className="hover:text-[#2e1f15] dark:hover:text-[#6b69d6]">
                        {item.name}
                      </Link>
                    </h3>
                    {item.variant && (
                      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                        {[item.variant.option1Value, item.variant.option2Value].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    {/* Build-your-own box: show the exact flavour mix + message */}
                    {item.variants?.find((v) => v.name === 'Contents')?.option && (
                      <>
                        <p className="mt-0.5 text-xs leading-snug text-neutral-500 dark:text-neutral-400">
                          {item.variants.find((v) => v.name === 'Contents')?.option}
                        </p>
                        <CupcakeContentsChips contents={item.variants.find((v) => v.name === 'Contents')?.option} />
                      </>
                    )}
                    {item.variants?.find((v) => v.name === 'Message')?.option && (
                      <p className="mt-0.5 text-xs italic text-neutral-400 dark:text-neutral-500">
                        “{item.variants.find((v) => v.name === 'Message')?.option}”
                      </p>
                    )}
                    {Math.max(1, item.minOrderQty || 1) > 1 && (
                      <p className="mt-0.5 text-[11px] font-medium text-[#d97185]">
                        Min qty {Math.max(1, item.minOrderQty || 1)} · ${item.price.toLocaleString()} each
                      </p>
                    )}
                    {/* Corporate logos attached to this line */}
                    <CorporateLogoStrip logoUrls={item.logoUrls} logoUrl={item.logoUrl} variants={item.variants} variant="thumbnail" className="mt-1" />
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                    {'$'}{(item.price * item.quantity).toLocaleString('en-AU')}
                  </span>
                </div>

                {/* Quantity + Remove */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= Math.max(1, item.minOrderQty || 1)}
                      className="flex h-7 w-7 items-center justify-center text-xs text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-30 dark:text-neutral-400 dark:hover:text-white"
                      aria-label="Decrease quantity"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="flex h-7 min-w-[28px] items-center justify-center border-x border-neutral-200 text-xs font-semibold tabular-nums text-neutral-800 dark:border-neutral-700 dark:text-neutral-200">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= 99}
                      className="flex h-7 w-7 items-center justify-center text-xs text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-30 dark:text-neutral-400 dark:hover:text-white"
                      aria-label="Increase quantity"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase transition-colors hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Your cart is empty</p>
            <Link href="/" className="mt-2 text-xs font-medium text-[#2e1f15] hover:underline dark:text-[#6b69d6]">
              Continue shopping
            </Link>
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <>
          {/* Divider */}
          <div className="my-6 h-px bg-neutral-200/80 dark:bg-neutral-800" />

          {/* Promo Code Suggestion */}
          {!appliedPromoCode && (
            <div className="mb-5 space-y-2">
              {subtotal >= 10000 ? (
                <button
                  onClick={() => handleApplyPromoCode('GIBBON10')}
                  className="group flex w-full items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      GIBBON10 — 10% OFF
                    </span>
                  </div>
                  <span className="text-xs font-medium text-emerald-500 transition-colors group-hover:text-emerald-600 dark:text-emerald-400">
                    Apply
                  </span>
                </button>
              ) : (
                subtotal >= 5000 && (
                  <button
                    onClick={() => handleApplyPromoCode('GIBBON5')}
                    className="group flex w-full items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                        <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        GIBBON5 — 5% OFF
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-500 transition-colors group-hover:text-emerald-600 dark:text-emerald-400">
                      Apply
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          {/* Promo Code Input */}
          <div className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all focus:border-[#2e1f15]/40 focus:bg-white focus:ring-2 focus:ring-[#2e1f15]/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-[#6b69d6]/40 dark:focus:bg-neutral-800 dark:focus:ring-[#6b69d6]/10"
                  placeholder="Discount code"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !appliedPromoCode && !isLoading && promoCodeInput) {
                      e.preventDefault()
                      handleApplyPromoCode(promoCodeInput)
                    }
                  }}
                  disabled={!!appliedPromoCode || isLoading}
                />
              </div>
              <button
                onClick={() => handleApplyPromoCode(promoCodeInput)}
                disabled={!!appliedPromoCode || isLoading || !promoCodeInput}
                className="flex h-10 w-20 items-center justify-center rounded-xl bg-neutral-900 text-sm font-semibold text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600"
              >
                {isLoading ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {promoMessage && (
              <p
                className={`mt-2 text-xs font-medium ${promoMessage.includes('Failed') || promoMessage.includes('error') || promoMessage.includes('invalid') ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}
              >
                {promoMessage}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Subtotal</span>
              <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                {'$'}{subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {discount > 0 && appliedPromoCode && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Discount</span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {appliedPromoCode.code}
                  </span>
                  <button
                    onClick={handleRemovePromoCode}
                    className="text-[10px] font-medium text-red-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
                <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  -{'$'}{discount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>
                Delivery
                {zoneInfo ? (
                  <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                    {zoneInfo.suburb} · {zoneInfo.radiusLabel}
                  </span>
                ) : deliveryFeeHint != null ? (
                  <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                    Confirm postcode on Delivery step
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[10px] font-normal text-neutral-400">
                    Check your postcode for the exact fee
                  </span>
                )}
              </span>
              <span className="font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                {currentShipping === 0 ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
                ) : (
                  `$${currentShipping.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
                )}
              </span>
            </div>

            {/* Priority Delivery Option */}
            <div
              className={`rounded-xl border p-3 transition-colors ${
                isExpressDelivery
                  ? 'border-rose-300/80 bg-gradient-to-br from-rose-50 to-amber-50/50 dark:border-rose-800 dark:from-rose-950/40 dark:to-amber-950/20'
                  : 'border-neutral-150 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-800/40'
              }`}
            >
              <label htmlFor="express-delivery" className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="express-delivery"
                      checked={isExpressDelivery}
                      onChange={(e) => handlePriorityToggle(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-neutral-300 bg-white transition-all peer-checked:border-[#2e1f15] peer-checked:bg-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-800 dark:peer-checked:border-[#6b69d6] dark:peer-checked:bg-[#6b69d6]">
                      <svg className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Priority Delivery</span>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      Prefer a time between {PRIORITY_DELIVERY_WINDOW_HINT}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
                  +${EXPRESS_DELIVERY_CHARGE.toFixed(2)}
                </span>
              </label>
              {isExpressDelivery && (
                <p className="mt-2 text-[11px] leading-relaxed text-cocoa dark:text-neutral-300">
                  Add your preferred arrival time in delivery instructions on that date.
                </p>
              )}
            </div>

            {!isExpressDelivery &&
              currentShipping > 0 &&
              subtotalAfterDiscount < FREE_SHIPPING_THRESHOLD && (
                <p className="text-center text-xs text-rose-accent">
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotalAfterDiscount).toFixed(2)} more for free
                  delivery
                </p>
              )}

            {/* Total */}
            <div className="flex items-baseline justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Total</span>
              <span className="font-bake-display text-xl font-bold tabular-nums tracking-tight text-neutral-900 dark:text-white">
                {'$'}{total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
  }
)

OrderSummary.displayName = 'OrderSummary'

export default OrderSummary
