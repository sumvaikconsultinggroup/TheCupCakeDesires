'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  CakeProductCard,
  DisplaySettings,
  Product,
  gridColsClass,
  sortProducts,
} from './_shared'

interface Props {
  products: Product[]
  displaySettings?: DisplaySettings | null
  sortOrder?: string
  collectionHandle?: string | null
  eyebrow?: string
  title?: string
  titleAccent?: string
  description?: string
  ctaHref?: string
}

/* Used when the database has no products yet — so the section
   still renders nicely and shows the carousel/grid toggle UX. */
const fallbackProducts: Product[] = [
  {
    _id: 'fb-1',
    handle: 'vanilla-bean',
    title: 'Vanilla Bean',
    productCategory: 'Classic',
    variants: [{ price: 120, inventoryQty: 60 }],
    reviews: [{ star: 5 }, { star: 5 }, { star: 4 }],
  },
  {
    _id: 'fb-2',
    handle: 'belgian-chocolate',
    title: 'Belgian Chocolate',
    productCategory: 'Classic',
    variants: [{ price: 130, compareAtPrice: 150, inventoryQty: 40 }],
    reviews: [{ star: 5 }, { star: 5 }],
  },
  {
    _id: 'fb-3',
    handle: 'red-velvet',
    title: 'Red Velvet',
    productCategory: 'Classic',
    variants: [{ price: 140, inventoryQty: 50 }],
    reviews: [{ star: 5 }, { star: 4 }, { star: 5 }, { star: 5 }],
  },
  {
    _id: 'fb-4',
    handle: 'salted-caramel',
    title: 'Salted Caramel',
    productCategory: 'Signature',
    variants: [{ price: 140, inventoryQty: 30 }],
    reviews: [{ star: 5 }, { star: 5 }, { star: 5 }],
  },
  {
    _id: 'fb-5',
    handle: 'pistachio-rose',
    title: 'Pistachio Rose',
    productCategory: 'Signature',
    variants: [{ price: 150, inventoryQty: 24 }],
    reviews: [{ star: 5 }, { star: 5 }, { star: 5 }, { star: 5 }],
  },
  {
    _id: 'fb-6',
    handle: 'matcha-cloud',
    title: 'Matcha Cloud',
    productCategory: 'Eggless',
    variants: [{ price: 150, inventoryQty: 36 }],
    reviews: [{ star: 5 }, { star: 4 }, { star: 5 }],
  },
  {
    _id: 'fb-7',
    handle: 'lemon-olive-oil',
    title: 'Lemon Olive Oil',
    productCategory: 'Signature',
    variants: [{ price: 130, compareAtPrice: 145, inventoryQty: 28 }],
    reviews: [{ star: 5 }, { star: 5 }],
  },
  {
    _id: 'fb-8',
    handle: 'tiramisu',
    title: 'Tiramisu',
    productCategory: 'Signature',
    variants: [{ price: 150, inventoryQty: 20 }],
    reviews: [{ star: 5 }, { star: 4 }, { star: 5 }, { star: 5 }],
  },
  {
    _id: 'fb-9',
    handle: 'vegan-chocolate',
    title: 'Vegan Chocolate',
    productCategory: 'Vegan',
    variants: [{ price: 145, inventoryQty: 32 }],
    reviews: [{ star: 5 }, { star: 5 }, { star: 4 }],
  },
  {
    _id: 'fb-10',
    handle: 'strawberries-cream',
    title: 'Strawberries & Cream',
    productCategory: 'Seasonal',
    variants: [{ price: 160, inventoryQty: 18 }],
    reviews: [{ star: 5 }, { star: 5 }, { star: 5 }, { star: 5 }, { star: 5 }],
  },
]

export default function ProductShowcase({
  products,
  displaySettings,
  sortOrder,
  collectionHandle,
  eyebrow = 'Featured this week',
  title = 'Hand-picked for',
  titleAccent = 'you.',
  description = 'A rotating selection of our most-loved bakes — switch between carousel and grid to browse the way you like.',
  ctaHref,
}: Props) {
  const settings = { itemsPerRow: 4, maxItems: 12, ...displaySettings }
  const source = (products && products.length > 0) ? products : fallbackProducts
  const sorted = sortProducts(source, sortOrder)
  const list = sorted.slice(0, settings.maxItems)

  const [view, setView] = useState<'carousel' | 'grid'>('carousel')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Duplicated track for seamless infinite loop — silent teleport when crossing the seam
  const looped = list.length > 1 ? [...list, ...list] : list

  // Track scroll position → derive current dot index, teleport silently at the seam
  useEffect(() => {
    if (view !== 'carousel') return
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const child = el.firstElementChild as HTMLElement | null
      if (!child) return
      const stride = child.clientWidth + 24
      const rawIndex = Math.round(el.scrollLeft / stride)
      setCurrentIndex(((rawIndex % list.length) + list.length) % list.length)

      // If we've scrolled into the duplicate half, silently jump back by one list length
      if (list.length > 1 && el.scrollLeft >= list.length * stride - 1) {
        const prevBehavior = el.style.scrollBehavior
        el.style.scrollBehavior = 'auto'
        el.scrollLeft = el.scrollLeft - list.length * stride
        el.style.scrollBehavior = prevBehavior
      }
      // If user scrolled backwards past the start, teleport forward
      else if (list.length > 1 && el.scrollLeft < 0) {
        const prevBehavior = el.style.scrollBehavior
        el.style.scrollBehavior = 'auto'
        el.scrollLeft = el.scrollLeft + list.length * stride
        el.style.scrollBehavior = prevBehavior
      }
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [view, list.length])

  // Autoplay — advance one card every 3.5s, infinite via the duplicated track
  useEffect(() => {
    if (view !== 'carousel' || isPaused || list.length < 2) return
    const interval = setInterval(() => {
      const el = scrollRef.current
      if (!el) return
      const child = el.firstElementChild as HTMLElement | null
      if (!child) return
      const stride = child.clientWidth + 24
      el.scrollBy({ left: stride, behavior: 'smooth' })
    }, 3500)
    return () => clearInterval(interval)
  }, [view, isPaused, list.length])

  // Jump to a specific dot
  const goToIndex = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    const child = el.firstElementChild as HTMLElement | null
    if (!child) return
    const stride = child.clientWidth + 24
    el.scrollTo({ left: i * stride, behavior: 'smooth' })
  }

  if (list.length === 0) return null

  return (
    <section className="bg-cream py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* ─── Header ─── */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:mb-14 md:flex-row md:items-end">
          <div className="max-w-[58ch]">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              {eyebrow}
            </p>
            <h2 className="bake-display-lg mt-5">
              {title}{' '}
              <span className="bake-display-italic text-rose-accent">{titleAccent}</span>
            </h2>
            <p className="bake-body mt-4 max-w-[60ch]">{description}</p>
          </div>

          {/* View toggle + view-all */}
          <div className="flex items-center gap-4">
            <div
              role="tablist"
              aria-label="Layout"
              className="flex items-center gap-1 rounded-full border border-line bg-ivory p-1"
            >
              <button
                role="tab"
                aria-selected={view === 'carousel'}
                onClick={() => setView('carousel')}
                aria-label="Carousel view"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  view === 'carousel'
                    ? 'bg-cocoa text-ivory'
                    : 'text-cocoa-soft hover:text-cocoa'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="3" y="6" width="6" height="12" rx="1" />
                  <rect x="9" y="6" width="6" height="12" rx="1" />
                  <rect x="15" y="6" width="6" height="12" rx="1" />
                </svg>
              </button>
              <button
                role="tab"
                aria-selected={view === 'grid'}
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  view === 'grid'
                    ? 'bg-cocoa text-ivory'
                    : 'text-cocoa-soft hover:text-cocoa'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>

            <Link
              href={`/collections/${collectionHandle || 'all'}`}
              className="bake-btn bake-btn-ghost bake-btn-sm hidden md:inline-flex"
            >
              View all <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* ─── Content (carousel or grid) ─── */}
        <AnimatePresence mode="wait">
          {view === 'carousel' ? (
            <motion.div
              key="carousel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Track — infinite loop via duplicated list + silent teleport on seam */}
              <div
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div
                  ref={scrollRef}
                  className="hidden-scrollbar flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto pb-2"
                >
                  {looped.map((p, i) => (
                    <div
                      key={`${p._id}-${i}`}
                      className="snap-start shrink-0"
                    >
                      <CakeProductCard product={p} index={i} />
                    </div>
                  ))}
                </div>

                {/* Match grid sizing across breakpoints */}
                <style jsx>{`
                  .hidden-scrollbar > div {
                    width: calc(70% - 12px);
                  }
                  @media (min-width: 640px) {
                    .hidden-scrollbar > div {
                      width: calc(50% - 12px);
                    }
                  }
                  @media (min-width: 768px) {
                    .hidden-scrollbar > div {
                      width: calc(33.333% - 16px);
                    }
                  }
                  @media (min-width: 1024px) {
                    .hidden-scrollbar > div {
                      width: calc(25% - 18px);
                    }
                  }
                `}</style>
              </div>

              {/* Pagination dots — one per original item, active dot is wider rose-accent pill */}
              <div className="mt-10 flex items-center justify-center gap-2">
                {list.map((_, i) => {
                  const active = i === currentIndex
                  return (
                    <button
                      key={i}
                      onClick={() => goToIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        active
                          ? 'w-8 bg-rose-accent'
                          : 'w-1.5 bg-line hover:bg-cocoa-soft'
                      }`}
                    />
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`grid gap-6 md:gap-8 ${gridColsClass(settings.itemsPerRow)}`}
            >
              {list.map((p, i) => (
                <CakeProductCard key={p._id} product={p} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile-only "view all" link */}
        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href={`/collections/${collectionHandle || 'all'}`}
            className="bake-btn bake-btn-ghost bake-btn-sm"
          >
            View all <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
