'use client'

import { useAside } from '@/components/aside/aside'
import { useWishlist } from '@/components/LikeButton'
import { CakeProductCard, Product as CardProduct } from '@/components/HomePage/_shared'
import AddToBagButton from '@/components/product/AddToBagButton'
import CorporateLogoUploader from '@/components/product/CorporateLogoUploader'
import ProductEnquiryModal from '@/components/product/ProductEnquiryModal'
import ReviewForm from '@/components/product/ReviewForm'
import SafeHTML from '@/components/SafeHTML'
import { useCart } from '@/components/useCartStore'
import {
  CORPORATE_EVENT_BULK_ENQUIRY_HREF,
  CORPORATE_EVENT_FLAVOURS,
  CORPORATE_EVENT_SIZE_TIERS,
  findCorporateEventVariantIndex,
  isCorporateEventProduct,
} from '@/lib/corporate-event-cupcakes'
import { isEnquiryOnlyProduct } from '@/lib/enquiry-only-products'
import { isCorporateCakeSliceHandle } from '@/lib/corporate-pages'
import { logoVariantsFromUrls } from '@/lib/corporate-logos'
import {
  GIANT_CUPCAKE_INSIDE_CAPTION,
  isGiantCupcakeInsideImage,
} from '@/lib/giant-cupcake-images'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Heart, Mail, Minus, PackageOpen, Plus, ShoppingBag, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface ProductImage {
  src: string
  altText?: string
}

interface ProductVariant {
  _id?: string
  option1Value?: string
  option2Value?: string
  sku?: string
  price: number
  compareAtPrice?: number
  inventoryQty?: number
  inventoryPolicy?: 'deny' | 'continue'
  image?: string
}

interface ReviewDoc {
  _id: string
  customerName: string
  rating: number
  title: string
  content: string
  images?: string[]
  isVerifiedPurchase?: boolean
  createdAt: string
}

interface Product {
  _id: string
  handle: string
  title: string
  description?: string
  bodyHtml?: string
  images?: ProductImage[]
  variants?: ProductVariant[]
  // Dynamic option definition (e.g. { name: 'Flavour' } for boxes,
  // { name: 'Size' } for cakes) — drives the variant-picker label.
  options?: { name: string; values: string[] }[]
  productCategory?: string
  tags?: string[]
  vendor?: string
  isEggless?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
  /** Corporate logo printing — shows the logo uploader on this product. */
  allowLogoUpload?: boolean
  /** Smallest quantity a customer can buy (e.g. 3 for per-cupcake pricing). */
  minOrderQty?: number
  faq?: { question: string; answer: string }[]
  // Structured story content (preferred over bodyHtml when present)
  descriptionIntro?: string
  whatsInside?: string[]
  howToServe?: string
  allergens?: { contains?: string[]; note?: string }
  storage?: { roomTemp?: string; fridge?: string }
}

interface Props {
  product: Product
  reviews?: ReviewDoc[]
  relatedProducts?: CardProduct[]
}

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** Per-slice display price on individual cake-slice product pages (UI only). */
const CAKE_SLICE_EACH_PRICE = 7

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const day = 24 * 60 * 60 * 1000
  if (ms < day) return 'today'
  if (ms < 2 * day) return 'yesterday'
  const days = Math.floor(ms / day)
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i + 1 <= Math.round(value)
        return (
          <Star
            key={i}
            width={size}
            height={size}
            strokeWidth={1.6}
            className={filled ? 'fill-rose-accent text-rose-accent' : 'fill-none text-line'}
          />
        )
      })}
    </div>
  )
}

export default function BakeProductPage({ product, reviews = [], relatedProducts = [] }: Props) {
  const { addItem } = useCart()
  const { open: openAside } = useAside()
  const { isLiked, isLoading: wishLoading, handleLike } = useWishlist({
    productId: product._id,
    productName: product.title,
    variant: product.variants?.[0],
  })

  // Some products (e.g. per-cupcake pricing) enforce a minimum purchase quantity.
  const minQty = Math.max(1, product.minOrderQty || 1)

  const corporateEvent = isCorporateEventProduct(product)
  const [selectedSize, setSelectedSize] = useState<string>(
    CORPORATE_EVENT_SIZE_TIERS[0].option1Value
  )
  const [selectedFlavour, setSelectedFlavour] = useState<string>(CORPORATE_EVENT_FLAVOURS[0])

  const [activeVariantIdx, setActiveVariantIdx] = useState(0)
  const [quantity, setQuantity] = useState(minQty)
  const [logoUrls, setLogoUrls] = useState<string[]>([])
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const REVIEWS_PAGE = 4
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PAGE)

  const enquiryOnly = isEnquiryOnlyProduct(product.handle)

  const variants = product.variants || []

  // Keep corporate Size×Flavour selection in sync with the matching variant row.
  useEffect(() => {
    if (!corporateEvent || variants.length === 0) return
    const idx = findCorporateEventVariantIndex(variants, selectedSize, selectedFlavour)
    if (idx >= 0 && idx !== activeVariantIdx) setActiveVariantIdx(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corporateEvent, selectedSize, selectedFlavour, variants])

  const activeVariant = variants[activeVariantIdx]
  // Variant-picker label follows the product's own option name — "Flavour" for
  // cupcake/macaron boxes, "Size" for cakes — never a hardcoded word.
  const optionName = (product.options?.[0]?.name || 'Option').trim()
  const price = activeVariant?.price ?? 0
  const compareAt = activeVariant?.compareAtPrice
  const inStock =
    !!activeVariant &&
    (activeVariant.inventoryPolicy === 'continue' || (activeVariant.inventoryQty ?? 0) > 0)

  const images = useMemo(() => {
    const list: ProductImage[] = []
    if (activeVariant?.image) list.push({ src: activeVariant.image, altText: product.title })
    if (product.images) {
      for (const img of product.images) {
        if (!list.find((x) => x.src === img.src)) list.push(img)
      }
    }
    return list.length > 0 ? list : [{ src: '/images/placeholder.png', altText: product.title }]
  }, [activeVariant, product.images, product.title])

  useEffect(() => {
    setActiveImageIdx(0)
  }, [activeVariantIdx])

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const ratingDistribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]
    for (const r of reviews) buckets[Math.max(0, Math.min(4, r.rating - 1))]++
    return buckets
  }, [reviews])

  const discount =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0
  const isCakeSliceProduct =
    /slice/i.test(product.productCategory || '') || /slice/i.test(product.handle || '')

  const handleAddToBag = () => {
    if (!activeVariant || !inStock) return

    const sizeName = product.options?.[0]?.name || 'Size'
    const flavourName = product.options?.[1]?.name || 'Flavour'
    const lineVariants: { name: string; option: string }[] = []
    if (activeVariant.option1Value) {
      lineVariants.push({ name: sizeName, option: activeVariant.option1Value })
    }
    if (activeVariant.option2Value) {
      lineVariants.push({ name: flavourName, option: activeVariant.option2Value })
    }
    if (logoUrls.length > 0) {
      lineVariants.push(...logoVariantsFromUrls(logoUrls))
    }

    addItem({
      productId: product._id,
      name: product.title,
      price: activeVariant.price,
      imageUrl: images[0]?.src,
      handle: product.handle,
      // Drives the delivery lead-time tier at checkout (cakes need more notice).
      category: product.productCategory,
      variant: activeVariant as any,
      quantity,
      ...(minQty > 1 ? { minOrderQty: minQty } : {}),
      // Always stamp Size/Flavour (and logo) so distinct matrices stay separate cart lines.
      ...(lineVariants.length > 0 ? { variants: lineVariants } : {}),
      ...(logoUrls.length > 0 ? { logoUrls, logoUrl: logoUrls[0] } : {}),
    } as any)
    openAside('cart')
  }

  const categorySlug =
    product.productCategory?.toLowerCase().replace(/\s+/g, '-') || 'all-items'

  const dietBadges: { label: string; show?: boolean }[] = [
    { label: 'Eggless', show: product.isEggless },
    { label: 'Vegan', show: product.isVegan },
    { label: 'Gluten-free', show: product.isGlutenFree },
  ]

  return (
    <main className="font-bake-body bg-ivory text-cocoa">
      {/* ─── Breadcrumb ─── */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-line bg-cream/60"
      >
        <ol className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-1.5 px-6 py-4 text-[12px] tracking-[0.04em] text-taupe md:px-10">
          <li>
            <Link href="/" className="hover:text-cocoa">Home</Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </li>
          <li>
            <Link
              href={`/collections/${categorySlug}`}
              className="hover:text-cocoa"
            >
              {product.productCategory || 'Shop'}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </li>
          <li className="text-cocoa">{product.title}</li>
        </ol>
      </nav>

      {/* ─── Hero ─── */}
      <section className="bg-ivory py-10 md:py-16">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 md:grid-cols-12 md:gap-14 md:px-10 lg:gap-20">
          {/* Gallery */}
          <div className="md:col-span-7">
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={images[activeImageIdx]?.src || activeImageIdx}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[activeImageIdx]?.src || ''}
                    alt={images[activeImageIdx]?.altText || product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                    className="object-contain p-6"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Floating discount chip */}
              {discount > 0 && (
                <div className="absolute left-5 top-5">
                  <span className="bake-badge bake-badge-rose">−{discount}%</span>
                </div>
              )}

              {/* Visible caption for the giant-cupcake inside shot */}
              {isGiantCupcakeInsideImage(images[activeImageIdx]?.src) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-cocoa/70 via-cocoa/35 to-transparent px-5 pb-5 pt-16">
                  <p className="bake-caption text-ivory/90">Inside view</p>
                  <p className="font-bake-display mt-1 whitespace-pre-line text-[16px] font-medium leading-snug text-ivory md:text-[18px]">
                    {GIANT_CUPCAKE_INSIDE_CAPTION}
                  </p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <button
                    key={img.src + i}
                    onClick={() => setActiveImageIdx(i)}
                    aria-label={
                      isGiantCupcakeInsideImage(img.src)
                        ? GIANT_CUPCAKE_INSIDE_CAPTION
                        : `View image ${i + 1}`
                    }
                    className={classNames(
                      'relative aspect-square overflow-hidden rounded-xl border bg-white transition-all',
                      activeImageIdx === i
                        ? 'border-cocoa ring-2 ring-rose-accent/40'
                        : 'border-line opacity-80 hover:opacity-100'
                    )}
                  >
                    <Image
                      src={img.src}
                      alt={img.altText || product.title}
                      fill
                      sizes="120px"
                      className="object-contain p-1.5"
                    />
                    {isGiantCupcakeInsideImage(img.src) && (
                      <span className="absolute inset-x-0 bottom-0 bg-cocoa/75 px-1 py-1 text-center text-[9px] font-medium uppercase tracking-[0.06em] text-ivory">
                        Inside
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="flex flex-col md:col-span-5">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              {product.productCategory || 'Hand-picked'}
            </p>

            <h1 className="bake-display-lg mt-5 max-w-[20ch]">
              {product.title}
            </h1>

            {/* Rating row */}
            <div className="mt-5 flex items-center gap-3">
              <Stars value={avgRating} size={16} />
              <p className="bake-body-sm text-taupe">
                {reviews.length > 0
                  ? `${avgRating.toFixed(1)} · ${reviews.length} review${reviews.length === 1 ? '' : 's'}`
                  : 'Be the first to review'}
              </p>
            </div>

            {/* Price — or custom-quote cue for enquiry-only wedding tiers */}
            {enquiryOnly ? (
              <div className="mt-6">
                <p
                  className="font-bake-display text-[28px] font-semibold leading-none text-cocoa md:text-[32px]"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  Custom quote
                </p>
                <p className="bake-body-sm mt-2 max-w-[42ch] text-cocoa-soft">
                  Wedding tiers are designed to your colours, flavours and guest count — send an
                  enquiry and we&rsquo;ll reply with a tailored quote.
                </p>
              </div>
            ) : (
              <div className="mt-6 flex items-baseline gap-3">
                <span
                  className="font-bake-display text-[34px] font-semibold leading-none text-cocoa"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  ${price.toLocaleString()}
                </span>
                {typeof compareAt === 'number' && compareAt > price && (
                  <span className="bake-body-sm text-taupe line-through">
                    ${compareAt.toLocaleString()}
                  </span>
                )}
                {minQty > 1 && (
                  <span className="bake-body-sm text-taupe">per cupcake</span>
                )}
              </div>
            )}
            {!enquiryOnly && isCakeSliceProduct && (
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full border border-rose-accent/25 bg-rose-accent/10 px-3 py-1 text-[12px] font-semibold tracking-[0.03em] text-rose-accent">
                  ${CAKE_SLICE_EACH_PRICE} each slice
                </span>
              </div>
            )}

            {/* Minimum order quantity notice */}
            {!enquiryOnly && minQty > 1 && (
              <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-rose-accent/20 bg-linear-to-r from-rose-accent/[0.07] to-transparent px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-accent/12 text-rose-accent">
                  <PackageOpen className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <p className="bake-body-sm leading-snug text-cocoa-soft">
                  <span className="font-bake-display font-semibold text-cocoa">
                    Minimum order {minQty} · ${(price * minQty).toLocaleString()} total
                  </span>
                  {' '}
                  — ${price.toLocaleString()} each, mix & match any flavours.
                </p>
              </div>
            )}

            {/* Diet badges */}
            {dietBadges.some((d) => d.show) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {dietBadges
                  .filter((d) => d.show)
                  .map((d) => (
                    <span
                      key={d.label}
                      className="font-bake-body rounded-full border border-line bg-cream px-3 py-1 text-[12px] font-medium tracking-[0.04em] text-cocoa-soft"
                    >
                      {d.label}
                    </span>
                  ))}
              </div>
            )}

            {/* Short description */}
            {product.description && (
              <p className="bake-body mt-7 max-w-[55ch] text-cocoa-soft">
                {product.description}
              </p>
            )}

            {/* Corporate Event — Size (qty/price) pills + Flavour pills */}
            {corporateEvent && variants.length > 1 ? (
              <div className="mt-8 space-y-6">
                <div>
                  <p className="bake-caption text-taupe">Choose your size</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CORPORATE_EVENT_SIZE_TIERS.map((tier) => {
                      const isActive = selectedSize === tier.option1Value
                      const sample = variants.find((v) => v.option1Value === tier.option1Value)
                      const available = (sample?.inventoryQty ?? 0) > 0
                      return (
                        <button
                          key={tier.option1Value}
                          type="button"
                          onClick={() => {
                            setSelectedSize(tier.option1Value)
                            setQuantity(minQty)
                          }}
                          disabled={!available}
                          className={classNames(
                            'font-bake-body rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                            isActive
                              ? 'border-cocoa bg-cocoa text-ivory'
                              : 'border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa',
                            !available && 'cursor-not-allowed line-through opacity-50'
                          )}
                        >
                          {tier.label}
                          <span className={classNames('ml-1.5', isActive ? 'text-ivory/80' : 'text-taupe')}>
                            ${tier.price}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="bake-caption mt-3 text-taupe">
                    Need more than 500?{' '}
                    <Link
                      href={CORPORATE_EVENT_BULK_ENQUIRY_HREF}
                      className="font-medium text-rose-accent underline underline-offset-2 hover:text-cocoa"
                    >
                      Enquire for a custom quote →
                    </Link>
                  </p>
                </div>

                <div>
                  <p className="bake-caption text-taupe">Choose your flavour</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CORPORATE_EVENT_FLAVOURS.map((flavour) => {
                      const isActive = selectedFlavour === flavour
                      const sample = variants.find(
                        (v) =>
                          v.option1Value === selectedSize && (v.option2Value || '') === flavour
                      )
                      const available = (sample?.inventoryQty ?? 0) > 0
                      return (
                        <button
                          key={flavour}
                          type="button"
                          onClick={() => {
                            setSelectedFlavour(flavour)
                            setQuantity(minQty)
                          }}
                          disabled={!available}
                          className={classNames(
                            'font-bake-body rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                            isActive
                              ? 'border-cocoa bg-cocoa text-ivory'
                              : 'border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa',
                            !available && 'cursor-not-allowed line-through opacity-50'
                          )}
                        >
                          {flavour}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Standard single-axis variant picker */
              variants.length > 1 && (
                <div className="mt-8">
                  <p className="bake-caption text-taupe">Choose your {optionName.toLowerCase()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variants.map((v, i) => {
                      const isActive = i === activeVariantIdx
                      const sizeOk =
                        v.inventoryPolicy === 'continue' || (v.inventoryQty ?? 0) > 0
                      return (
                        <button
                          key={v._id || v.sku || i}
                          onClick={() => {
                            setActiveVariantIdx(i)
                            setQuantity(minQty)
                          }}
                          disabled={!sizeOk}
                          className={classNames(
                            'font-bake-body rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                            isActive
                              ? 'border-cocoa bg-cocoa text-ivory'
                              : 'border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa',
                            !sizeOk && 'cursor-not-allowed line-through opacity-50'
                          )}
                        >
                          {v.option1Value}
                          {v.option2Value ? ` · ${v.option2Value}` : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            )}

            {/* Corporate logo upload — only on products that allow it */}
            {product.allowLogoUpload && (
              <div className="mt-7">
                <CorporateLogoUploader
                  value={logoUrls}
                  onChange={setLogoUrls}
                  itemNoun={isCorporateCakeSliceHandle(product.handle) ? 'slice' : 'cupcake'}
                />
              </div>
            )}

            {/* Quantity + CTA — or enquiry CTA for wedding cupcake tiers */}
            {enquiryOnly ? (
              <div className="mt-8 flex flex-wrap items-stretch gap-3">
                <button
                  type="button"
                  onClick={() => setEnquiryOpen(true)}
                  className="bake-btn flex-1"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" strokeWidth={1.8} />
                    Enquire now
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLike()}
                  disabled={wishLoading}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                  className={classNames(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-all',
                    isLiked
                      ? 'border-rose-accent bg-rose-accent text-white'
                      : 'border-line bg-ivory text-cocoa hover:border-rose-accent hover:text-rose-accent'
                  )}
                >
                  <Heart
                    className="h-5 w-5"
                    strokeWidth={1.8}
                    fill={isLiked ? 'currentColor' : 'none'}
                  />
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8 flex flex-wrap items-stretch gap-3">
                  <div className="inline-flex items-center rounded-full border border-line bg-ivory">
                    <button
                      onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                      disabled={quantity <= minQty}
                      aria-label="Decrease quantity"
                      className="flex h-12 w-12 items-center justify-center text-cocoa transition-colors hover:text-rose-accent disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={minQty}
                      value={quantity}
                      aria-label="Quantity"
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10)
                        if (!isNaN(raw) && raw >= 0) {
                          setQuantity(Math.max(0, Math.min(raw, activeVariant?.inventoryQty ?? 9999)))
                        }
                      }}
                      onBlur={(e) => {
                        const raw = parseInt(e.target.value, 10)
                        if (isNaN(raw) || raw < minQty) setQuantity(minQty)
                      }}
                      className="font-bake-display w-16 bg-transparent text-center text-[15px] font-medium text-cocoa focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(q + 1, activeVariant?.inventoryQty ?? 9999)
                        )
                      }
                      aria-label="Increase quantity"
                      className="flex h-12 w-12 items-center justify-center text-cocoa transition-colors hover:text-rose-accent"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>

                  <AddToBagButton
                    onAdd={handleAddToBag}
                    disabled={!inStock}
                    className="bake-btn flex-1 disabled:opacity-50"
                    label={inStock ? 'Add to bag' : 'Sold out for now'}
                    leadingIcon={inStock ? <ShoppingBag className="h-4 w-4" strokeWidth={1.8} /> : undefined}
                  />

                  <button
                    onClick={() => handleLike()}
                    disabled={wishLoading}
                    aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={classNames(
                      'flex h-12 w-12 items-center justify-center rounded-full border transition-all',
                      isLiked
                        ? 'border-rose-accent bg-rose-accent text-white'
                        : 'border-line bg-ivory text-cocoa hover:border-rose-accent hover:text-rose-accent'
                    )}
                  >
                    <Heart
                      className="h-5 w-5"
                      strokeWidth={1.8}
                      fill={isLiked ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                {minQty > 1 && (
                  <motion.div
                    layout
                    className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream/70 px-5 py-3.5"
                  >
                    <span className="bake-body-sm text-cocoa-soft">
                      {quantity} cupcakes × ${price.toLocaleString()}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="bake-caption text-taupe">Total</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={quantity}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="font-bake-display text-[20px] font-semibold text-cocoa"
                        >
                          ${(price * quantity).toLocaleString()}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {/* Trust strip */}
            <ul className="mt-10 grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3 sm:gap-3">
              {(enquiryOnly
                ? [
                    ['Custom design', 'Colours, flavours and tier height built around your day'],
                    ['Quote in 24h', 'Send an enquiry — a human baker replies within a working day'],
                    ['Delivered fresh', 'Melbourne metro by our own couriers'],
                  ]
                : [
                    ['Baked to order', 'Hand frosted with soft buttercream'],
                    ['Allow 2 days', 'Bake-to-order kitchen — no same-day'],
                    ['Delivered fresh', 'Melbourne metro by our own couriers'],
                  ]
              ).map(([title, body]) => (
                <li key={title} className="flex flex-col">
                  <span className="bake-caption text-rose-accent">{title}</span>
                  <span className="bake-body-sm mt-1 text-cocoa-soft">{body}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── About this bake — editorial intro ─── */}
      {(product.descriptionIntro || product.description || product.bodyHtml) && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5">
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  About this bake
                </p>
                <h2 className="bake-display-lg mt-5 max-w-[16ch]">
                  Made with{' '}
                  <span className="bake-display-italic text-rose-accent">care.</span>
                </h2>
              </div>
              <div className="md:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {product.bodyHtml ? (
                    <div className="bake-prose max-w-[62ch] text-cocoa-soft">
                      <SafeHTML html={product.bodyHtml} />
                    </div>
                  ) : product.descriptionIntro ? (
                    <p className="bake-body-lg max-w-[62ch] text-cocoa-soft">
                      {product.descriptionIntro}
                    </p>
                  ) : (
                    <p className="bake-body-lg max-w-[62ch] text-cocoa-soft">
                      {product.description}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── What's inside ─── */}
      {product.whatsInside && product.whatsInside.length > 0 && (
        <section className="bg-ivory py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-4">
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  Layer by layer
                </p>
                <h2 className="bake-display-lg mt-5 max-w-[14ch]">
                  What&rsquo;s{' '}
                  <span className="bake-display-italic text-rose-accent">inside.</span>
                </h2>
                <p className="bake-body mt-5 max-w-[36ch] text-cocoa-soft">
                  Each component made in the kitchen — never from a
                  tub, never from a shelf.
                </p>
              </div>
              <div className="md:col-span-8">
                <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.whatsInside.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                      className="flex items-start gap-4 rounded-2xl border border-line bg-cream/40 px-5 py-4 transition-colors hover:border-rose-accent/40 hover:bg-cream"
                    >
                      <span
                        className="font-bake-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa text-[14px] font-medium text-ivory"
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="font-bake-body pt-1.5 text-[15px] leading-snug text-cocoa">
                        {item}
                      </p>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── How to serve + Allergens & storage — paired editorial block ─── */}
      {(product.howToServe || product.allergens || product.storage) && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
              {/* How to serve */}
              {product.howToServe && (
                <div className="rounded-3xl border border-line bg-ivory p-8 md:col-span-7 md:p-10">
                  <p className="bake-eyebrow">
                    <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                    From the bakery
                  </p>
                  <h3 className="bake-display-md mt-4 max-w-[18ch]">
                    How to serve{' '}
                    <span className="bake-display-italic text-rose-accent">it.</span>
                  </h3>
                  <p className="bake-body mt-5 max-w-[52ch] text-cocoa-soft">
                    {product.howToServe}
                  </p>
                </div>
              )}

              {/* Allergens & storage */}
              {(product.allergens || product.storage) && (
                <div className="md:col-span-5">
                  <div className="flex h-full flex-col gap-6">
                    {/* Allergens */}
                    {product.allergens && (
                      <div className="rounded-3xl border border-line bg-ivory p-7">
                        <p className="bake-caption text-rose-accent">Allergens</p>
                        {product.allergens.contains && product.allergens.contains.length > 0 && (
                          <>
                            <p className="font-bake-display mt-3 text-[16px] font-medium text-cocoa">
                              Contains
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {product.allergens.contains.map((a) => (
                                <span
                                  key={a}
                                  className="font-bake-body rounded-full border border-line bg-cream-deep/50 px-3 py-1 text-[12px] font-medium tracking-[0.04em] text-cocoa"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                        {product.allergens.note && (
                          <p className="bake-body-sm mt-4 text-cocoa-soft">
                            {product.allergens.note}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Storage */}
                    {product.storage && (product.storage.roomTemp || product.storage.fridge) && (
                      <div className="rounded-3xl border border-line bg-ivory p-7">
                        <p className="bake-caption text-rose-accent">Storage</p>
                        <ul className="mt-3 divide-y divide-line">
                          {product.storage.roomTemp && (
                            <li className="flex items-baseline justify-between gap-4 py-3 first:pt-0">
                              <span className="font-bake-display text-[14px] font-medium text-cocoa">
                                Room temperature
                              </span>
                              <span className="bake-body-sm text-right text-cocoa-soft">
                                {product.storage.roomTemp}
                              </span>
                            </li>
                          )}
                          {product.storage.fridge && (
                            <li className="flex items-baseline justify-between gap-4 py-3 last:pb-0">
                              <span className="font-bake-display text-[14px] font-medium text-cocoa">
                                Refrigerated
                              </span>
                              <span className="bake-body-sm text-right text-cocoa-soft">
                                {product.storage.fridge}
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Reviews ─── */}
      <section id="reviews" className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
            {/* Summary */}
            <div className="md:col-span-4">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                What people say
              </p>
              <h2 className="bake-display-lg mt-5">
                Notes from{' '}
                <span className="bake-display-italic text-rose-accent">the kitchen.</span>
              </h2>

              {reviews.length > 0 ? (
                <div className="mt-8 rounded-3xl border border-line bg-cream p-7">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-bake-display text-[48px] font-semibold leading-none text-cocoa"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="bake-body-sm text-taupe">/ 5</span>
                  </div>
                  <div className="mt-3">
                    <Stars value={avgRating} size={18} />
                  </div>
                  <p className="bake-body-sm mt-2 text-taupe">
                    Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}
                  </p>

                  <ul className="mt-6 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingDistribution[star - 1]
                      const pct = reviews.length ? (count / reviews.length) * 100 : 0
                      return (
                        <li key={star} className="flex items-center gap-3">
                          <span className="bake-body-sm w-6 text-cocoa-soft">{star}★</span>
                          <div className="relative h-1.5 flex-1 rounded-full bg-line">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-rose-accent transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="bake-caption w-7 text-right text-taupe">{count}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <p className="bake-body mt-8 max-w-[40ch] text-cocoa-soft">
                  Nobody&rsquo;s written one yet. If you try this one, drop a note — we read every word.
                </p>
              )}
            </div>

            {/* Reviews list */}
            <div className="md:col-span-8">
              {reviews.length > 0 ? (
                <>
                  <ul className="divide-y divide-line border-y border-line">
                    {reviews.slice(0, visibleReviews).map((r, idx) => (
                      <motion.li
                        key={r._id}
                        initial={idx < REVIEWS_PAGE ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: ((idx - REVIEWS_PAGE) % REVIEWS_PAGE) * 0.05 }}
                        className="py-7"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className="font-bake-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cocoa text-[15px] font-medium text-ivory">
                              {r.customerName?.[0]?.toUpperCase() || 'A'}
                            </span>
                            <div>
                              <p className="font-bake-display text-[15px] font-medium text-cocoa">
                                {r.customerName}
                              </p>
                              <p className="bake-caption mt-0.5 text-taupe">
                                {formatRelative(r.createdAt)}
                                {r.isVerifiedPurchase && (
                                  <>
                                    {' · '}
                                    <span className="text-rose-accent">Verified order</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <Stars value={r.rating} size={14} />
                        </div>
                        <h3 className="font-bake-display mt-4 text-[18px] font-medium text-cocoa">
                          {r.title}
                        </h3>
                        <p className="bake-body mt-2 max-w-[68ch] text-cocoa-soft">{r.content}</p>
                        {r.images && r.images.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {r.images.slice(0, 4).map((src, i) => (
                              <div
                                key={i}
                                className="relative h-20 w-20 overflow-hidden rounded-xl border border-line"
                              >
                                <Image src={src} alt={`Review photo ${i + 1}`} fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.li>
                    ))}
                  </ul>

                  {/* Pagination footer */}
                  <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                    <p className="bake-caption text-taupe">
                      Showing {Math.min(visibleReviews, reviews.length)} of {reviews.length}
                      {reviews.length === 1 ? ' review' : ' reviews'}
                    </p>
                    {visibleReviews < reviews.length ? (
                      <button
                        onClick={() =>
                          setVisibleReviews((v) => Math.min(v + REVIEWS_PAGE, reviews.length))
                        }
                        className="bake-btn bake-btn-ghost"
                      >
                        Show {Math.min(REVIEWS_PAGE, reviews.length - visibleReviews)} more
                        <ChevronDown className="ml-2 h-4 w-4" strokeWidth={1.8} />
                      </button>
                    ) : reviews.length > REVIEWS_PAGE ? (
                      <button
                        onClick={() => setVisibleReviews(REVIEWS_PAGE)}
                        className="font-bake-body text-[14px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                      >
                        Show fewer
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-line bg-cream/40 p-10 text-center">
                  <p className="bake-body text-cocoa-soft">No reviews yet — yours could be the first.</p>
                </div>
              )}

              {/* Review form trigger — auth-gated via Clerk, Zod-validated, modal */}
              <div className="mt-10">
                <ReviewForm productHandle={product.handle} productTitle={product.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Related products ─── */}
      {relatedProducts.length > 0 && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-14 md:flex-row md:items-end">
              <div>
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  You might also love
                </p>
                <h2 className="bake-display-lg mt-5">
                  More from{' '}
                  <span className="bake-display-italic text-rose-accent">our oven.</span>
                </h2>
              </div>
              <Link
                href={`/collections/${categorySlug}`}
                className="bake-btn bake-btn-ghost bake-btn-sm"
              >
                Shop the category <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((rp, i) => (
                <CakeProductCard key={rp._id} product={rp} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {enquiryOnly && (
        <ProductEnquiryModal
          open={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          productTitle={product.title}
          productHandle={product.handle}
        />
      )}
    </main>
  )
}
