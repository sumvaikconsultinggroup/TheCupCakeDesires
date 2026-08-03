'use client'

import { useUser } from '@clerk/nextjs'
import { parseCupcakeContents } from '@/lib/cupcake-builder-images'
import clsx from 'clsx'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Aside, useAside } from './aside/aside'
import { useWishlist } from './LikeButton'
import { Link } from './Link'
import { CartItem, useCart } from './useCartStore'

/* ─────────── Inline mono payment-method logos (marquee) ─────────── */
const VisaLogo = ({ className = 'h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 22" fill="none" aria-hidden>
    <path
      d="M26.6 21.4 30.1.6h5.6l-3.5 20.8h-5.6Zm26-20.2c-1.1-.4-2.8-.9-5-.9-5.5 0-9.4 2.9-9.5 7.1 0 3.1 2.8 4.8 4.9 5.8 2.2 1 2.9 1.7 2.9 2.6 0 1.4-1.7 2.1-3.3 2.1-2.2 0-3.4-.3-5.2-1.1l-.7-.3-.8 4.8c1.3.6 3.7 1.1 6.2 1.1 5.9 0 9.7-2.9 9.8-7.3 0-2.4-1.5-4.3-4.7-5.8-2-1-3.2-1.6-3.2-2.6 0-.9 1-1.8 3.3-1.8 1.9 0 3.3.4 4.4.8l.5.3.7-4.7ZM61 .6h-4.3c-1.3 0-2.4.4-2.9 1.8L45.7 21.4h5.9l1.2-3.2h7.2l.7 3.2H66L61 .6Zm-6.6 13.4c.5-1.2 2.3-6 2.3-6 0 .1.5-1.3.8-2.1l.4 1.9 1.4 6.2h-4.9ZM21.9.6 16.5 14.8 16 12.2c-1-3-4.2-6.3-7.7-8L13.3 21.4h6l8.9-20.8h-6.3Z"
      fill="currentColor"
    />
  </svg>
)
const MastercardLogo = ({ className = 'h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 22" fill="none" aria-hidden>
    <circle cx="13" cy="11" r="9.5" fill="currentColor" opacity="0.85" />
    <circle cx="23" cy="11" r="9.5" fill="currentColor" opacity="0.5" />
  </svg>
)
const ApplePayLogo = ({ className = 'h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 56 22" fill="none" aria-hidden>
    <path
      d="M10.5 4.9c-.6.7-1.6 1.3-2.6 1.2-.1-1 .4-2 .9-2.6.6-.8 1.7-1.3 2.6-1.4.1 1.1-.3 2.1-.9 2.8Zm.9 1.4c-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.2 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.9-1 2.6-2.1.8-1.2 1.1-2.4 1.1-2.5 0 0-2.2-.8-2.2-3.4 0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.4-1.5-2.8-1.6ZM21 4v14.5h2.3v-5h3.1c2.9 0 4.9-2 4.9-4.8 0-2.9-2-4.8-4.8-4.8H21Zm2.3 1.9h2.6c1.9 0 3 1 3 2.8s-1.1 2.8-3 2.8h-2.6V5.9Zm12 12.7c1.4 0 2.7-.7 3.4-1.9h0v1.8h2.1V9.9c0-2.1-1.7-3.5-4.2-3.5-2.4 0-4.1 1.4-4.2 3.3h2.1c.2-.9 1-1.5 2-1.5 1.4 0 2.1.7 2.1 1.9v.8l-2.8.2c-2.6.1-4 1.2-4 3 0 1.8 1.4 3.1 3.5 3.1Zm.6-1.7c-1.2 0-2-.6-2-1.5 0-1 .8-1.5 2.2-1.6l2.5-.2v.8c0 1.4-1.2 2.5-2.7 2.5Zm8.2 6c2.3 0 3.3-.9 4.2-3.4l4-11.2h-2.4l-2.7 8.6h0L44.6 7.3h-2.4l3.9 10.6-.2.7c-.3 1.1-.9 1.6-2 1.6h-.6V22Z"
      fill="currentColor"
    />
  </svg>
)
const GooglePayLogo = ({ className = 'h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 56 22" fill="none" aria-hidden>
    <path
      d="M26.4 10.7v6.5h-2V1.3h5.5c1.4 0 2.6.5 3.6 1.4s1.5 2.1 1.5 3.4-.5 2.5-1.5 3.4-2.2 1.3-3.6 1.3h-3.5Zm0-7.4v5.5h3.6c.8 0 1.5-.3 2.1-.8.5-.6.8-1.2.8-2 0-.7-.3-1.4-.8-1.9-.5-.6-1.2-.8-2.1-.8h-3.6Zm12.4 2.5c1.5 0 2.7.4 3.6 1.2.9.8 1.3 1.9 1.3 3.3v6.8h-2v-1.5h-.1c-.8 1.2-1.9 1.9-3.3 1.9-1.2 0-2.2-.4-3-1.1s-1.2-1.6-1.2-2.6c0-1.2.4-2.1 1.3-2.8.9-.7 2.1-1.1 3.6-1.1 1.3 0 2.3.2 3.2.7v-.5c0-.8-.3-1.4-.9-1.9s-1.4-.8-2.2-.8c-1.3 0-2.3.5-3.1 1.6l-1.8-1.2c1.1-1.6 2.7-2.4 4.8-2.4Zm-2.6 7.8c0 .6.2 1 .7 1.4.5.4 1 .6 1.7.6.9 0 1.8-.4 2.5-1.1s1.1-1.5 1.1-2.5c-.7-.6-1.7-.9-3-.9-.9 0-1.7.2-2.3.7-.4.4-.7.9-.7 1.4-.1 0-.1.2 0 .4ZM55.8 6.2 49 21.6h-2.1l2.5-5.4-4.4-10h2.2l3.2 7.7h0l3.1-7.7h2.3Z"
      fill="currentColor"
    />
    <path d="M17.7 9.4c0-.7-.1-1.3-.2-1.9H9v3.6h4.9c-.2 1.1-.8 2.1-1.8 2.7v2.2h2.9c1.7-1.5 2.7-3.8 2.7-6.6Z" fill="currentColor" opacity="0.85" />
    <path d="M9 18c2.4 0 4.5-.8 6-2.1l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.8v2.3C2.3 16 5.4 18 9 18Z" fill="currentColor" opacity="0.7" />
    <path d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6 0 7.1 0 8.2s.3 2.2.8 3.2l3.1-2.4Z" fill="currentColor" opacity="0.55" />
    <path d="M9 3.5c1.3 0 2.5.5 3.5 1.4l2.6-2.6C13.5 1 11.4 0 9 0 5.4 0 2.3 2 .8 5l3.1 2.4C4.6 5 6.6 3.5 9 3.5Z" fill="currentColor" opacity="0.45" />
  </svg>
)
const EftposLogo = ({ className = 'h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 22" fill="none" aria-hidden>
    <rect x="0.5" y="0.5" width="63" height="21" rx="4" stroke="currentColor" fill="none" />
    <path
      d="M7 7h6v1.6H8.7v2.2H12v1.6H8.7v2.2H13V16H7V7Zm8 0h6v1.6h-2.2V16h-1.6V8.6H15V7Zm8 0h2.6c1.8 0 2.9.9 2.9 2.5 0 1.6-1.1 2.6-2.9 2.6h-1V16h-1.6V7Zm1.6 1.6v2h.9c.9 0 1.4-.4 1.4-1s-.5-1-1.4-1h-.9ZM30 11.5c0-2.7 1.7-4.7 4.2-4.7s4.2 2 4.2 4.7-1.7 4.7-4.2 4.7-4.2-2-4.2-4.7Zm6.7 0c0-1.8-1-3.1-2.5-3.1s-2.5 1.3-2.5 3.1 1 3.1 2.5 3.1 2.5-1.3 2.5-3.1Zm3.7 4.5V7h2.6c1.8 0 2.9.9 2.9 2.5 0 1.6-1.1 2.6-2.9 2.6h-1V16h-1.6Zm1.6-7.4v2h.9c.9 0 1.4-.4 1.4-1s-.5-1-1.4-1h-.9Zm6 4.9c.1.6.7 1.1 1.7 1.1.8 0 1.4-.3 1.4-.9s-.5-.8-1.4-1l-.7-.2c-1.5-.3-2.4-1-2.4-2.4 0-1.6 1.3-2.5 3-2.5 1.9 0 3 1 3.1 2.4h-1.6c-.1-.6-.6-1-1.5-1-.8 0-1.3.3-1.3.9 0 .5.4.7 1.3 1l.7.1c1.6.4 2.5 1 2.5 2.5 0 1.7-1.4 2.6-3.2 2.6-2 0-3.2-1-3.3-2.6h1.7Z"
      fill="currentColor"
    />
  </svg>
)

const PAYMENT_LOGOS = [
  { name: 'Visa', Logo: VisaLogo },
  { name: 'Mastercard', Logo: MastercardLogo },
  { name: 'EFTPOS', Logo: EftposLogo },
  { name: 'Apple Pay', Logo: ApplePayLogo },
  { name: 'Google Pay', Logo: GooglePayLogo },
]

/* ─────────── Continuous marquee of payment logos ─────────── */
function PaymentMarquee() {
  // Duplicated 3x for seamless wrap-around at any viewport
  const loop = [...PAYMENT_LOGOS, ...PAYMENT_LOGOS, ...PAYMENT_LOGOS]
  return (
    <div className="mt-2">
      <p className="bake-caption mb-2 text-center text-taupe">Pay securely with</p>
      <div className="relative h-9 overflow-hidden">
        <div className="cart-pay-track flex h-full items-center gap-3 whitespace-nowrap will-change-transform">
          {loop.map(({ name, Logo }, i) => (
            <span
              key={`${name}-${i}`}
              aria-label={name}
              title={name}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-line bg-ivory px-3 text-cocoa transition-colors hover:border-cocoa"
            >
              <Logo className="h-3.5" />
            </span>
          ))}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-cream/95 to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-cream/95 to-transparent"
        />
      </div>
      <style jsx>{`
        @keyframes cartPayScroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-33.333%, 0, 0); }
        }
        .cart-pay-track {
          animation: cartPayScroll 22s linear infinite;
          width: max-content;
        }
        .cart-pay-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .cart-pay-track { animation: none; }
        }
      `}</style>
    </div>
  )
}

/* ─────────── Swipe-to-checkout slider ─────────── */
function SwipeToCheckout({
  total,
  onConfirm,
}: {
  total: number
  onConfirm: () => void
}) {
  const x = useMotionValue(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const [maxDrag, setMaxDrag] = useState(220)
  const [confirmed, setConfirmed] = useState(false)

  // Knob travel = (track width) - (knob width 48) - (knob left padding 4) - (track right padding 4)
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        const w = trackRef.current.clientWidth
        setMaxDrag(Math.max(120, w - 48 - 8))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Track fill opacity follows progress
  const progress = useTransform(x, [0, maxDrag], [0, 1])
  const fillWidth = useTransform(progress, (p) => `${Math.round(p * 100)}%`)
  const labelOpacity = useTransform(progress, [0, 0.55], [1, 0])
  const checkOpacity = useTransform(progress, [0.6, 1], [0, 1])

  const handleEnd = () => {
    if (confirmed) return
    if (x.get() >= maxDrag * 0.85) {
      setConfirmed(true)
      // Snap to full then fire confirm
      x.set(maxDrag)
      setTimeout(onConfirm, 280)
    } else {
      // Spring back
      const reset = () => x.set(0)
      requestAnimationFrame(reset)
    }
  }

  return (
    <div
      ref={trackRef}
      className="relative h-14 w-full overflow-hidden rounded-full border border-cocoa bg-cocoa shadow-[0_18px_40px_-18px_rgba(46,31,21,0.45)]"
      role="button"
      aria-label={`Swipe to check out — total $${total.toFixed(2)}`}
    >
      {/* Fill — rose-accent stripe revealed under the knob as it travels */}
      <motion.div
        className="absolute inset-y-0 left-0 bg-rose-accent"
        style={{ width: fillWidth }}
        aria-hidden
      />

      {/* Label */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3"
        style={{ opacity: labelOpacity }}
      >
        <span className="font-bake-body text-[14px] font-medium tracking-[0.04em] text-ivory">
          Swipe to check out
        </span>
        <span className="font-bake-display text-[15px] font-semibold text-ivory">
          ${total.toFixed(2)}
        </span>
        {/* Subtle chevron hint */}
        <motion.span
          className="text-ivory/70"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      </motion.div>

      {/* Confirm icon — surfaces as the knob nears the end */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2"
        style={{ opacity: checkOpacity }}
      >
        <CheckCircle2 className="h-5 w-5 text-ivory" strokeWidth={1.8} />
        <span className="font-bake-body text-[14px] font-medium tracking-[0.04em] text-ivory">
          {confirmed ? 'Off to checkout…' : 'Release to confirm'}
        </span>
      </motion.div>

      {/* Knob */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.02}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={handleEnd}
        whileTap={{ scale: 0.96 }}
        className="absolute left-1 top-1 z-10 flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-ivory text-cocoa shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45)] active:cursor-grabbing"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
      </motion.div>
    </div>
  )
}

interface Props {
  className?: string
}

/* ─────────── Single free-shipping progress (not a 3-tier loyalty ladder) ─────────── */
const FREE_SHIPPING_THRESHOLD = 100
const FLAT_SHIPPING_FEE = 9.95

const FreeShippingProgress = ({ subtotal }: { subtotal: number }) => {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const achieved = remaining <= 0
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)

  return (
    <div
      className={clsx(
        'relative overflow-hidden border-b border-line px-6 py-5 transition-colors duration-500',
        achieved ? 'bg-rose/45' : 'bg-cream'
      )}
    >
      {/* Celebratory bloom — visible only when achieved */}
      <AnimatePresence>
        {achieved && (
          <motion.span
            key="bloom"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-rose-accent/25 blur-2xl"
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-start gap-3">
        {/* Icon with pulse halo on unlock */}
        <span
          className={clsx(
            'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
            achieved
              ? 'border-rose-accent bg-rose-accent text-white shadow-[0_8px_20px_-6px_rgba(217,113,133,0.6)]'
              : 'border-line bg-ivory text-cocoa'
          )}
        >
          <AnimatePresence>
            {achieved && (
              <motion.span
                key="halo"
                aria-hidden
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.6, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-rose-accent/60"
              />
            )}
          </AnimatePresence>

          <motion.span
            animate={
              achieved
                ? { rotate: [0, -8, 8, -4, 0], scale: [1, 1.15, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative flex"
          >
            {achieved ? (
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <Truck className="h-4 w-4" strokeWidth={1.8} />
            )}
          </motion.span>
        </span>

        <div className="flex-1">
          {achieved ? (
            <>
              <p className="bake-caption text-rose-accent">Complimentary delivery unlocked</p>
              <h3
                className="font-bake-display mt-1 text-[19px] font-medium leading-tight text-cocoa"
                style={{ letterSpacing: '-0.005em' }}
              >
                It&rsquo;s on the house{' '}
                <span className="bake-display-italic text-rose-accent">— enjoy.</span>
              </h3>
            </>
          ) : (
            <>
              <p className="bake-caption text-taupe">Free delivery on $100 or above</p>
              <p className="font-bake-body mt-1 text-[14px] leading-snug text-cocoa">
                Add{' '}
                <span className="font-bake-display text-[16px] font-semibold text-rose-accent">
                  ${remaining.toFixed(2)}
                </span>{' '}
                more and we&rsquo;ll cover the courier.
              </p>
            </>
          )}
        </div>

        {/* Achievement badge */}
        {achieved && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="font-bake-body shrink-0 rounded-full border border-rose-accent/50 bg-ivory px-2.5 py-1 text-[11px] font-medium tracking-[0.04em] text-rose-accent"
          >
            FREE
          </motion.span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-line/80">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={clsx(
            'h-full rounded-full transition-colors',
            achieved ? 'bg-rose-accent' : 'bg-rose-accent/70'
          )}
        />
        {achieved && (
          <motion.div
            aria-hidden
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', repeatDelay: 0.6 }}
            className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/55 to-transparent"
          />
        )}
      </div>
    </div>
  )
}

const AsideSidebarCart = ({ className = '' }: Props) => {
  const {
    items,
    removeItem,
    updateItemQuantity,
    appliedPromoCode,
    applyPromoCode,
    removePromoCode,
    userInfo,
  } = useCart()
  const { close } = useAside()
  const router = useRouter()
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  const { isSignedIn } = useUser()

  const [showCouponInput, setShowCouponInput] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  /* Promo discount math */
  let promoDiscountAmount = 0
  if (appliedPromoCode) {
    const applicableItems =
      !appliedPromoCode.appliesTo || appliedPromoCode.appliesTo === 'all'
        ? items
        : items.filter((item) => {
            if (appliedPromoCode.appliesTo === 'products' && appliedPromoCode.productIds) {
              return appliedPromoCode.productIds.includes(item.productId)
            }
            if (
              appliedPromoCode.appliesTo === 'categories' &&
              appliedPromoCode.categoryNames &&
              item.category
            ) {
              return appliedPromoCode.categoryNames.includes(item.category)
            }
            return false
          })

    const applicableSubtotal = applicableItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    )

    promoDiscountAmount =
      appliedPromoCode.discountType === 'percentage'
        ? Math.round(applicableSubtotal * (appliedPromoCode.discountValue / 100) * 100) / 100
        : appliedPromoCode.discountValue
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : items.length > 0 ? FLAT_SHIPPING_FEE : 0
  const total = Math.max(0, subtotal + shippingFee - promoDiscountAmount)

  const handleApplyPromoCode = async (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code')
      return
    }
    setIsApplyingCoupon(true)
    try {
      const response = await fetch('/api/promoCode/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          cartItems: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          userEmail: userInfo?.email,
        }),
      })
      const result = await response.json()
      if (result.success) {
        applyPromoCode(result.promoCode, result.applicableProductIds || [])
        toast.success('Promo code applied')
        setShowCouponInput(false)
        setCouponCode('')
      } else {
        toast.error(result.message || 'Could not apply that code.')
      }
    } catch (error) {
      console.error('Promo code fetch error:', error)
      toast.error('Something went wrong applying the promo code.')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemovePromoCode = () => {
    removePromoCode()
    toast.success('Promo code removed')
  }

  return (
    <Aside
      openFrom="right"
      type="cart"
      showHeading={false}
      noPadding
      className="z-2147483638"
      contentMaxWidthClassName="max-w-none !w-[460px] !max-w-full !h-full"
    >
      <div className={clsx('font-bake-body flex h-full flex-col bg-ivory', className)}>
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-ivory px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-cream text-cocoa">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div>
              <p className="bake-eyebrow text-taupe">Your box</p>
              <h2 className="font-bake-display text-[20px] font-medium leading-tight text-cocoa">
                {totalItems === 0
                  ? 'Empty for now'
                  : `${totalItems} ${totalItems === 1 ? 'treat' : 'treats'} inside`}
              </h2>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-cream-deep/40 text-cocoa-soft">
              <ShoppingBag className="h-8 w-8" strokeWidth={1.4} />
            </span>
            <h3 className="font-bake-display mt-6 text-[22px] font-medium text-cocoa">
              Nothing in the box yet.
            </h3>
            <p className="bake-body-sm mt-2 max-w-[32ch] text-cocoa-soft">
              Browse today&rsquo;s menu and add a treat — we&rsquo;ll keep it warm.
            </p>
            <Link href="/collections/all" onClick={close} className="bake-btn mt-7">
              Shop the bakery
              <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
            </Link>
            {!isSignedIn && (
              <p className="bake-caption mt-6 max-w-[32ch] text-taupe">
                Tip — sign in before you fill your box and we&rsquo;ll save it across devices.
              </p>
            )}
          </motion.div>
        ) : (
          <>
            <FreeShippingProgress subtotal={subtotal} />

            {/* ─── Items ─── */}
            <div className="hidden-scrollbar flex-1 overflow-y-auto px-6">
              <ul className="divide-y divide-line">
                {items.map((product) => (
                  <CartProduct
                    key={product.id}
                    product={product}
                    removeItem={removeItem}
                    updateItemQuantity={updateItemQuantity}
                  />
                ))}
              </ul>
            </div>

            {/* ─── Footer ─── */}
            <div className="border-t border-line bg-cream/60 px-6 py-5">
              {/* Coupon */}
              <AnimatePresence initial={false} mode="wait">
                {showCouponInput ? (
                  <motion.div
                    key="coupon-input"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        disabled={isApplyingCoupon}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && !isApplyingCoupon && handleApplyPromoCode(couponCode)
                        }
                        className="font-bake-body flex-1 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] text-cocoa placeholder:text-taupe focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                      />
                      <button
                        onClick={() => handleApplyPromoCode(couponCode)}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="font-bake-body rounded-full bg-cocoa px-4 text-[13px] font-medium text-ivory transition-colors hover:bg-rose-accent disabled:opacity-50"
                      >
                        {isApplyingCoupon ? 'Applying…' : 'Apply'}
                      </button>
                      <button
                        onClick={() => setShowCouponInput(false)}
                        aria-label="Cancel"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-cocoa-soft transition-all hover:border-cocoa hover:text-cocoa"
                      >
                        <X className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  </motion.div>
                ) : !appliedPromoCode ? (
                  <button
                    key="coupon-trigger"
                    onClick={() => setShowCouponInput(true)}
                    className="font-bake-body mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-line bg-ivory py-2 text-[13px] font-medium text-cocoa-soft transition-colors hover:border-rose-accent hover:text-rose-accent"
                  >
                    <Tag className="h-4 w-4" strokeWidth={1.8} />
                    Have a coupon code?
                  </button>
                ) : (
                  <motion.div
                    key="coupon-applied"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center justify-between rounded-full border border-rose-accent/40 bg-rose/40 px-4 py-2"
                  >
                    <span className="bake-body-sm flex items-center gap-2 font-medium text-cocoa">
                      <CheckCircle2 className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
                      {appliedPromoCode.code} applied
                    </span>
                    <button
                      onClick={handleRemovePromoCode}
                      className="bake-caption text-cocoa-soft transition-colors hover:text-rose-accent"
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Order summary */}
              <dl className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <dt className="bake-body-sm text-cocoa-soft">Subtotal</dt>
                  <dd className="font-bake-display text-[15px] font-medium text-cocoa">
                    ${subtotal.toFixed(2)}
                  </dd>
                </div>
                {appliedPromoCode && promoDiscountAmount > 0 && (
                  <div className="flex items-baseline justify-between">
                    <dt className="bake-body-sm flex items-center gap-1 text-rose-accent">
                      <Tag className="h-3 w-3" strokeWidth={1.8} />
                      Discount
                    </dt>
                    <dd className="font-bake-display text-[15px] font-medium text-rose-accent">
                      −${promoDiscountAmount.toFixed(2)}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <dt className="bake-body-sm flex items-center gap-1 text-cocoa-soft">
                    <Truck className="h-3 w-3" strokeWidth={1.8} />
                    Delivery
                  </dt>
                  <dd
                    className={clsx(
                      'font-bake-display text-[15px] font-medium',
                      shippingFee === 0 ? 'text-rose-accent' : 'text-cocoa'
                    )}
                  >
                    {shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                <span className="bake-caption text-taupe">Total</span>
                <span
                  className="font-bake-display text-[28px] font-semibold leading-none text-cocoa"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Sign-in nudge (only when logged out) */}
              {!isSignedIn && (
                <p className="bake-caption mt-4 text-taupe">
                  Saving to this browser only.{' '}
                  <Link
                    href={`/sign-in?redirect_url=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : '/'}`}
                    onClick={close}
                    className="font-medium text-cocoa underline underline-offset-2 decoration-rose-accent transition-colors hover:text-rose-accent"
                  >
                    Sign in
                  </Link>{' '}
                  to keep your box across devices.
                </p>
              )}

              {/* Swipe to checkout */}
              <div className="mt-5">
                <SwipeToCheckout
                  total={total}
                  onConfirm={() => {
                    close()
                    router.push('/checkout')
                  }}
                />
              </div>

              <button
                onClick={close}
                className="font-bake-body mt-3 flex w-full items-center justify-center gap-1 text-[13px] text-cocoa-soft transition-colors hover:text-rose-accent"
              >
                Add more treats
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>

              {/* Continuous payment-logos marquee */}
              <PaymentMarquee />
            </div>
          </>
        )}
      </div>
    </Aside>
  )
}

interface CartProductProps {
  product: CartItem
  removeItem: (id: string) => void
  updateItemQuantity: (id: string, quantity: number) => void
}

const CartProduct = ({ product, removeItem, updateItemQuantity }: CartProductProps) => {
  const { id, name, price, imageUrl, variant, variants, quantity, productId, handle, logoUrl, minOrderQty } = product
  const minQty = Math.max(1, minOrderQty || 1)
  // Build-your-own boxes carry descriptive lines (Contents / Message) in the
  // plural `variants` array — surface them so the customer sees the exact mix.
  const boxContents = (variants || []).find((v) => v.name === 'Contents')?.option
  const boxMessage = (variants || []).find((v) => v.name === 'Message')?.option
  const boxFlavours = parseCupcakeContents(boxContents)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const { isSignedIn } = useUser()
  const { handleLike } = useWishlist({
    productId,
    productName: name,
    variant,
    itemType: 'product',
  })

  const handleMoveToWishlist = async () => {
    if (!isSignedIn) {
      toast.error('Sign in to use your wishlist')
      return
    }
    await handleLike()
    removeItem(id)
  }

  return (
    <li className="relative flex gap-4 py-5">
      <Link
        href={`/products/${handle}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-cocoa-soft">
            <ShoppingBag className="h-4 w-4" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/products/${handle}`} className="block">
              <h3 className="font-bake-display line-clamp-2 text-[15px] font-medium leading-snug text-cocoa transition-colors hover:text-rose-accent">
                {name}
              </h3>
            </Link>
            {variant && (variant.option1Value || variant.option2Value) && (
              <p className="bake-caption mt-1 text-taupe">
                {[variant.option1Value, variant.option2Value].filter(Boolean).join(' · ')}
              </p>
            )}
            {boxContents && (
              <p className="mt-1 text-[12px] leading-snug text-cocoa-soft">{boxContents}</p>
            )}
            {boxFlavours.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {boxFlavours.map((flavour) => (
                  <span
                    key={flavour.name}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-cream/60 py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-cocoa"
                  >
                    {flavour.image && (
                      <span className="relative h-5 w-5 overflow-hidden rounded-full bg-ivory">
                        <Image src={flavour.image} alt={flavour.name} fill sizes="20px" className="object-cover" />
                      </span>
                    )}
                    {flavour.quantity}x {flavour.name}
                  </span>
                ))}
              </div>
            )}
            {boxMessage && (
              <p className="mt-0.5 text-[12px] italic text-taupe">“{boxMessage}”</p>
            )}
            {minQty > 1 && (
              <p className="mt-1 text-[11px] font-medium text-rose-accent">
                Min qty {minQty} · ${(price || 0).toLocaleString()} each
              </p>
            )}
            {logoUrl && (
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-cream/60 py-0.5 pl-0.5 pr-2">
                <span className="relative h-5 w-5 overflow-hidden rounded-full bg-white">
                  <Image src={logoUrl} alt="Your logo" fill sizes="20px" className="object-contain p-px" unoptimized />
                </span>
                <span className="text-[11px] font-medium text-cocoa">Logo added</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(true)}
            aria-label="Remove item"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-rose-accent"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="inline-flex items-center rounded-full border border-line bg-ivory">
            <button
              type="button"
              onClick={() => quantity > minQty && updateItemQuantity(id, quantity - 1)}
              disabled={quantity <= minQty}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center text-cocoa transition-colors hover:text-rose-accent disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
            <span className="font-bake-display w-7 text-center text-[14px] font-medium text-cocoa">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => quantity < 99 && updateItemQuantity(id, quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center text-cocoa transition-colors hover:text-rose-accent"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </div>
          <span
            className="font-bake-display text-[16px] font-semibold text-cocoa"
            style={{ letterSpacing: '-0.005em' }}
          >
            ${((price || 0) * quantity).toFixed(2)}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showRemoveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-ivory/95 p-4 text-center backdrop-blur-sm"
          >
            <p className="font-bake-display text-[14px] font-medium text-cocoa">Remove from box?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={handleMoveToWishlist}
                className="font-bake-body rounded-full border border-line bg-ivory px-3 py-1.5 text-[12px] font-medium text-cocoa transition-all hover:border-rose-accent hover:text-rose-accent"
              >
                Save for later
              </button>
              <button
                onClick={() => removeItem(id)}
                className="font-bake-body rounded-full bg-rose-accent px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-rose-deep"
              >
                Remove
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="font-bake-body rounded-full border border-line bg-ivory px-3 py-1.5 text-[12px] font-medium text-cocoa-soft transition-colors hover:text-cocoa"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export default AsideSidebarCart
