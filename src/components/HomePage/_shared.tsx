'use client'

import LikeButton from '@/components/LikeButton'
import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import ImagePlaceholder from '../ImagePlaceholder'

export interface Product {
  _id: string
  handle: string
  title: string
  images?: { src: string }[]
  variants?: {
    id?: string
    name?: string
    price: number
    compareAtPrice?: number
    option1Value?: string
    sku?: string
    image?: string
    inventoryQty?: number
  }[]
  reviews?: { star: number }[]
  productCategory?: string
  tags?: string[]
}

export interface DisplaySettings {
  locations?: string[]
  priority?: number
  showOnMobile?: boolean
  showOnDesktop?: boolean
  layoutStyle?: 'grid' | 'carousel' | 'list' | 'banner' | 'featured'
  itemsPerRow?: number
  maxItems?: number
  showTitle?: boolean
  showDescription?: boolean
  showProductCount?: boolean
  backgroundColor?: string
  textColor?: string
}

export function discountPct(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function avgRating(reviews?: { star: number }[]) {
  if (!reviews || reviews.length === 0) return 0
  return reviews.reduce((acc, r) => acc + r.star, 0) / reviews.length
}

export function sortProducts<T extends Product>(products: T[], sortOrder?: string): T[] {
  if (!sortOrder) return products
  return [...products].sort((a, b) => {
    switch (sortOrder) {
      case 'title-asc':
        return a.title.localeCompare(b.title)
      case 'title-desc':
        return b.title.localeCompare(a.title)
      case 'price-asc':
        return (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0)
      case 'price-desc':
        return (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0)
      case 'date-asc':
        return a._id.localeCompare(b._id)
      case 'date-desc':
        return b._id.localeCompare(a._id)
      default:
        return 0
    }
  })
}

export function CakeProductCard({
  product,
  index = 0,
  badge,
  badgeTone = 'cream',
}: {
  product: Product
  index?: number
  badge?: string
  badgeTone?: 'cream' | 'rose' | 'mint' | 'gold' | 'dark'
}) {
  const { addItem } = useCart()
  const { open: openAside } = useAside()
  const [hovered, setHovered] = useState(false)
  const variant = product.variants?.[0]
  const price = variant?.price || 0
  const compareAt = variant?.compareAtPrice
  const discount = discountPct(price, compareAt)
  const inStock = (variant?.inventoryQty ?? 0) > 0
  const rating = avgRating(product.reviews)

  const handleAdd = () => {
    if (!variant || !inStock) return
    addItem({
      productId: product._id,
      name: product.title,
      price: variant.price,
      imageUrl: product.images?.[0]?.src || '',
      handle: product.handle,
      variant: variant as any,
      quantity: 1,
    })
    openAside('cart')
  }

  const hasRealImage = !!product.images?.[0]?.src
  const placeholderToneCycle = ['cream', 'rose', 'mint', 'beige', 'gold'] as const
  const placeholderTone = placeholderToneCycle[index % placeholderToneCycle.length]

  const badgeClass: Record<string, string> = {
    cream: 'bake-badge',
    rose: 'bake-badge bake-badge-rose',
    mint: 'bake-badge bake-badge-mint',
    gold: 'bake-badge bake-badge-gold',
    dark: 'bake-badge bake-badge-dark',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.32) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group h-full"
    >
      <div className="bake-card bake-img-zoom relative flex h-full flex-col">
        {/* Image area */}
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden">
          <Link href={`/products/${product.handle}`}>
            {hasRealImage ? (
              <Image
                src={product.images![0].src}
                alt={product.title}
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-cover"
              />
            ) : (
              <ImagePlaceholder
                ratio="absolute inset-0"
                tone={placeholderTone}
                rounded="none"
                label="Product image"
                hint={product.title}
              />
            )}
          </Link>

          {/* Badges */}
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {badge && <span className={badgeClass[badgeTone]}>{badge}</span>}
            {discount > 0 && <span className="bake-badge bake-badge-rose">−{discount}%</span>}
          </div>

          {/* Wishlist */}
          <div
            className={`absolute right-4 top-4 transition-opacity ${hovered ? 'opacity-100' : 'opacity-80'}`}
          >
            <LikeButton productId={product._id} productName={product.title} variant={variant as any} />
          </div>

          {/* Quick-add */}
          <div
            className={`absolute inset-x-4 bottom-4 transition-all duration-300 ${
              hovered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            {inStock ? (
              <button onClick={handleAdd} className="bake-btn bake-btn-sm w-full">
                Add to bag <span aria-hidden>+</span>
              </button>
            ) : (
              <div className="bake-btn bake-btn-sm bake-btn-ghost w-full">Sold out</div>
            )}
          </div>
        </div>

        {/* Text area — flex column so price row always pins to bottom */}
        <div className="flex flex-1 flex-col px-5 py-5">
          <p className="bake-caption text-taupe min-h-[1.1em]">
            {product.productCategory || ' '}
          </p>
          <Link href={`/products/${product.handle}`} className="block flex-1">
            <h3 className="font-bake-display mt-2 line-clamp-2 min-h-[2.6em] text-[18px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
              {product.title}
            </h3>
          </Link>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-bake-display text-[18px] font-semibold text-cocoa">
                ${price.toLocaleString()}
              </span>
              {compareAt && compareAt > price && (
                <span className="bake-body-sm text-taupe line-through">
                  ${compareAt.toLocaleString()}
                </span>
              )}
            </div>
            {rating > 0 && (
              <p className="bake-body-sm text-taupe">
                ★ {rating.toFixed(1)}{' '}
                <span className="opacity-60">({product.reviews?.length})</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  titleAccent,
  description,
  ctaLabel,
  ctaHref,
}: {
  eyebrow?: string
  title: string
  titleAccent?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
      <div className="max-w-[58ch]">
        {eyebrow && (
          <p className="bake-eyebrow">
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            {eyebrow}
          </p>
        )}
        <h2 className="bake-display-lg mt-5">
          {title}
          {titleAccent && (
            <>
              {' '}
              <span className="bake-display-italic text-rose-accent">{titleAccent}</span>
            </>
          )}
        </h2>
        {description && <p className="bake-body mt-4 max-w-[60ch]">{description}</p>}
      </div>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="bake-btn bake-btn-ghost bake-btn-sm">
          {ctaLabel} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}

export function gridColsClass(itemsPerRow = 4) {
  return (
    (
      {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
        6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      } as Record<number, string>
    )[itemsPerRow] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  )
}

export function CakeSection({
  background = 'ivory',
  children,
}: {
  background?: 'ivory' | 'cream' | 'rose' | 'mint' | 'beige' | 'cocoa'
  children: ReactNode
}) {
  const map: Record<string, string> = {
    ivory: 'bg-ivory text-cocoa',
    cream: 'bg-cream text-cocoa',
    rose: 'bg-rose text-cocoa',
    mint: 'bg-mint text-cocoa',
    beige: 'bg-beige text-cocoa',
    cocoa: 'bg-cocoa text-ivory',
  }
  return (
    <section className={`relative py-16 md:py-24 ${map[background]}`}>
      <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">{children}</div>
    </section>
  )
}

export function ScatteredDoodles() {
  return null
}
