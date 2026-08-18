'use client'

import { useAside } from '@/components/aside/aside'
import { CakeProductCard, Product as CardProduct } from '@/components/HomePage/_shared'
import { useCart } from '@/components/useCartStore'
import { withGiantCupcakeInsideImages } from '@/lib/giant-cupcake-images'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageSearch,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePageFaqs } from '@/hooks/usePageFaqs'
import CollectionFAQ from './CollectionFAQ'

interface Product extends CardProduct {
  productCategory?: string
  tags?: string[]
}

interface Collection {
  _id: string
  handle: string
  title: string
  description?: string
  contentDescription?: string
  productHandles?: string[]
  collectionType?: 'manual' | 'automated'
  seo?: { title?: string; description?: string }
  faq?: { question: string; answer: string }[]
}

interface CollectionPageClientProps {
  collection: string
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price · low to high' },
  { value: 'price-desc', label: 'Price · high to low' },
  { value: 'alpha-asc', label: 'A — Z' },
  { value: 'alpha-desc', label: 'Z — A' },
]

// AUD price brackets that actually match the cupcake catalogue
const PRICE_RANGES = [
  { min: 0, max: 20, label: 'Under $20' },
  { min: 20, max: 50, label: '$20 — $50' },
  { min: 50, max: 80, label: '$50 — $80' },
  { min: 80, max: 999, label: '$80+' },
]

const ITEMS_PER_PAGE = 24

function titleise(handle: string) {
  return handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function CollectionPageClient({ collection }: CollectionPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [collectionData, setCollectionData] = useState<Collection | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { addItem: _addItem } = useCart()
  const { open: _open } = useAside()
  const { faqs: collectionFaqs, loading: collectionFaqsLoading } = usePageFaqs('collection', collection)
  void _addItem
  void _open

  const [filters, setFilters] = useState({
    priceRange: searchParams.get('price') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
  })

  // Derive available categories from loaded products
  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(allProducts.map((p) => p.productCategory).filter((c): c is string => !!c))
      ).sort(),
    [allProducts]
  )

  /* ─── Fetch collection + products ─── */
  useEffect(() => {
    const run = async () => {
      setIsLoading(true)
      try {
        if (collection === 'all-items') {
          setCollectionData(null)
          const res = await fetch(`/api/products?limit=1000`)
          if (!res.ok) {
            setIsLoading(false)
            return
          }
          const result = await res.json()
          const list = result.data || []
          const inStock = list.filter((p: any) =>
            p.variants?.some((v: any) => (v.inventoryQty || 0) > 0)
          )
          setAllProducts(withGiantCupcakeInsideImages(inStock))
          setIsLoading(false)
          return
        }

        const collectionRes = await fetch(`/api/collections?handle=${collection}`)
        if (!collectionRes.ok) {
          setIsLoading(false)
          return
        }
        const collectionResult = await collectionRes.json()
        if (!collectionResult.success || !collectionResult.collection) {
          setIsLoading(false)
          return
        }
        const info = collectionResult.collection
        setCollectionData(info)

        if (info.productHandles?.length > 0) {
          const params = new URLSearchParams({ handles: info.productHandles.join(',') })
          const productsRes = await fetch(`/api/products/by-handles?${params}`)
          if (!productsRes.ok) {
            setIsLoading(false)
            return
          }
          const productsResult = await productsRes.json()
          const list = productsResult.products || []
          const inStock = list.filter((p: any) =>
            p.variants?.some((v: any) => (v.inventoryQty || 0) > 0)
          )
          setAllProducts(
            withGiantCupcakeInsideImages(inStock, {
              force: collection === 'giant-cupcakes',
            })
          )
        } else {
          setAllProducts([])
        }
      } catch (err) {
        console.error('Collection fetch failed:', err)
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [collection])

  /* ─── Filter + sort ─── */
  useEffect(() => {
    let result = [...allProducts]

    if (filters.category) {
      result = result.filter(
        (p) =>
          p.productCategory?.toLowerCase() === filters.category.toLowerCase() ||
          p.tags?.some((t) => t.toLowerCase() === filters.category.toLowerCase())
      )
    }

    if (filters.priceRange) {
      const range = PRICE_RANGES.find((r) => `${r.min}-${r.max}` === filters.priceRange)
      if (range) {
        result = result.filter((p) => {
          const price = p.variants?.[0]?.price || 0
          return price >= range.min && price <= range.max
        })
      }
    }

    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0))
        break
      case 'price-desc':
        result.sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0))
        break
      case 'rating':
        result.sort((a, b) => {
          const avg = (r?: { star: number }[]) =>
            r && r.length ? r.reduce((acc, x) => acc + x.star, 0) / r.length : 0
          return avg(b.reviews) - avg(a.reviews)
        })
        break
      case 'bestselling':
        result.sort((a, b) => {
          const aBest = a.tags?.includes('bestseller') ? 1 : 0
          const bBest = b.tags?.includes('bestseller') ? 1 : 0
          return bBest - aBest
        })
        break
      case 'alpha-asc':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'alpha-desc':
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'newest':
      default:
        if (collectionData?.productHandles?.length) {
          const order = new Map(collectionData.productHandles.map((h, i) => [h, i]))
          result.sort((a, b) => (order.get(a.handle) ?? 999) - (order.get(b.handle) ?? 999))
        } else {
          result.sort((a, b) => (a._id > b._id ? -1 : 1))
        }
    }
    setProducts(result)
    setCurrentPage(1)
  }, [allProducts, filters, collectionData])

  /* ─── URL sync ─── */
  const updateURL = useCallback(
    (next: typeof filters) => {
      const p = new URLSearchParams()
      if (next.priceRange) p.set('price', next.priceRange)
      if (next.category) p.set('category', next.category)
      if (next.sort && next.sort !== 'newest') p.set('sort', next.sort)
      const qs = p.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router]
  )

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    updateURL(next)
  }

  const clearFilters = () => {
    const next = { priceRange: '', category: '', sort: 'newest' }
    setFilters(next)
    router.push(pathname)
  }

  const activeFiltersCount = [filters.priceRange, filters.category].filter(Boolean).length

  // Hide filters on collections where browsing-by-price / category adds no value:
  // gift vouchers (3 items, one category) or any very small collection.
  const isGiftVoucherCollection =
    collection === 'gift-voucher' ||
    allProducts.length > 0 &&
      allProducts.every((p) => (p.productCategory || '').toLowerCase() === 'gift voucher')
  const hideFilters = isGiftVoucherCollection || allProducts.length <= 3
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
  const currentProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === filters.sort)?.label || 'Newest first'
  const headingTitle = collectionData?.title || titleise(collection)

  return (
    <main className="font-bake-body bg-ivory text-cocoa">
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
            <Link href="/collections/all-items" className="hover:text-cocoa">
              Shop
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} />
          </li>
          <li className="text-cocoa">{headingTitle}</li>
        </ol>
      </nav>

      {/* ─── Editorial hero ─── */}
      <section className="relative overflow-hidden bg-cream py-14 md:py-20">
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
          >
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Shop the collection
            </p>
            <h1 className="bake-display-xl mt-5 max-w-[20ch]">
              {headingTitle}
              {!headingTitle.endsWith('.') && (
                <span className="bake-display-italic text-rose-accent">.</span>
              )}
            </h1>
            {collectionData?.description && (
              <p className="bake-body mt-5 max-w-[58ch] text-cocoa-soft">
                {collectionData.description}
              </p>
            )}
            <p className="bake-caption mt-6 text-taupe">
              {isLoading
                ? 'Loading the bench…'
                : `${products.length} ${products.length === 1 ? 'bake' : 'bakes'} on the bench`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Body ─── */}
      <section className="bg-ivory pb-20 pt-10 md:pb-28 md:pt-14">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          {/* Toolbar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cream/40 px-4 py-3 md:px-5">
            {/* Left — Filter button + active chips (suppressed on uniform/small collections) */}
            {hideFilters ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bake-body text-[13px] text-cocoa-soft">
                  {allProducts.length} {allProducts.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="font-bake-body inline-flex items-center gap-2 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa transition-colors hover:border-rose-accent hover:text-rose-accent"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-accent px-1.5 text-[11px] font-semibold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {filters.priceRange && (
                  <FilterChip
                    label={
                      PRICE_RANGES.find((r) => `${r.min}-${r.max}` === filters.priceRange)?.label ?? ''
                    }
                    onClear={() => handleFilterChange('priceRange', '')}
                  />
                )}
                {filters.category && (
                  <FilterChip
                    label={titleise(filters.category)}
                    onClear={() => handleFilterChange('category', '')}
                  />
                )}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="font-bake-body text-[12px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Right — Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen((v) => !v)}
                onBlur={() => setTimeout(() => setIsSortOpen(false), 120)}
                className="font-bake-body inline-flex items-center gap-2 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa transition-colors hover:border-rose-accent"
              >
                <ArrowUpDown className="h-4 w-4" strokeWidth={1.8} />
                Sort: <span className="text-cocoa-soft">{sortLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    isSortOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={1.8}
                />
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_20px_50px_-18px_rgba(46,31,21,0.3)]"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const isActive = filters.sort === option.value
                      return (
                        <li key={option.value}>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              handleFilterChange('sort', option.value)
                              setIsSortOpen(false)
                            }}
                            className={`font-bake-body block w-full px-4 py-2.5 text-left text-[13px] transition-colors ${
                              isActive
                                ? 'bg-cocoa text-ivory'
                                : 'text-cocoa-soft hover:bg-cream hover:text-cocoa'
                            }`}
                          >
                            {option.label}
                          </button>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Products grid */}
          {collection === 'cake-slices' && (
            <p className="mb-6 text-left font-bake-body text-[13px] font-medium text-taupe">
              $7 each
            </p>
          )}
          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex items-center gap-3 rounded-full border border-line bg-cream px-5 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-rose-accent" strokeWidth={1.8} />
                <p className="bake-body-sm text-cocoa-soft">Pulling the menu off the rack…</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-cream/40 p-12 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent">
                <PackageSearch className="h-6 w-6" strokeWidth={1.6} />
              </span>
              <h3 className="font-bake-display mt-6 text-[22px] font-medium text-cocoa">
                Nothing matches those filters.
              </h3>
              <p className="bake-body mt-3 max-w-[44ch] mx-auto text-cocoa-soft">
                Try clearing a filter or browsing a different collection.
              </p>
              <button onClick={clearFilters} className="bake-btn bake-btn-ghost mt-7">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
              {currentProducts.map((product, i) => (
                <CakeProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex flex-wrap items-center justify-center gap-2"
            >
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="font-bake-body inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-all hover:border-cocoa disabled:opacity-30 disabled:hover:border-line"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                )
                .reduce<(number | 'gap')[]>((acc, p) => {
                  const prev = acc[acc.length - 1]
                  if (prev !== undefined && prev !== 'gap' && p - (prev as number) > 1) {
                    acc.push('gap')
                  }
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === 'gap' ? (
                    <span
                      key={`gap-${i}`}
                      className="font-bake-body px-1 text-[14px] text-taupe"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      aria-current={currentPage === p ? 'page' : undefined}
                      className={`font-bake-body inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-medium transition-colors ${
                        currentPage === p
                          ? 'bg-cocoa text-ivory'
                          : 'border border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="font-bake-body inline-flex h-9 w-9 items-center justify-center rounded-full border border-cocoa bg-cocoa text-ivory transition-all hover:bg-rose-accent hover:border-rose-accent disabled:opacity-30 disabled:hover:bg-cocoa disabled:hover:border-cocoa"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </nav>
          )}
        </div>
      </section>

      {/* ─── Optional collection FAQ (server-stored) ─── */}
      {!collectionFaqsLoading && collectionFaqs.length > 0 && (
        <CollectionFAQ
          items={collectionFaqs.map((f) => ({ question: f.question, answer: f.answer }))}
        />
      )}

      {/* ─── Filter slide-in ─── */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-40 bg-cocoa/55 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Filter products"
              className="font-bake-body fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-ivory shadow-[0_40px_100px_-20px_rgba(46,31,21,0.45)]"
            >
              <header className="flex items-center justify-between border-b border-line px-6 py-5">
                <div>
                  <p className="bake-eyebrow text-taupe">Filters</p>
                  <h2 className="font-bake-display mt-1 text-[20px] font-medium leading-tight text-cocoa">
                    Narrow the bench
                  </h2>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filters"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </header>

              <div className="hidden-scrollbar flex-1 overflow-y-auto px-6 py-6">
                {/* Price */}
                <section className="mb-8">
                  <p className="bake-caption text-rose-accent">Price</p>
                  <ul className="mt-4 space-y-2">
                    {PRICE_RANGES.map((r) => {
                      const value = `${r.min}-${r.max}`
                      const isActive = filters.priceRange === value
                      return (
                        <li key={value}>
                          <button
                            onClick={() =>
                              handleFilterChange('priceRange', isActive ? '' : value)
                            }
                            className={`font-bake-body flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-left text-[13px] transition-all ${
                              isActive
                                ? 'border-cocoa bg-cocoa text-ivory'
                                : 'border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                            }`}
                          >
                            <span>{r.label}</span>
                            {isActive && (
                              <span className="h-2 w-2 rounded-full bg-rose-accent" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>

                {/* Category */}
                {availableCategories.length > 0 && (
                  <section>
                    <p className="bake-caption text-rose-accent">Category</p>
                    <ul className="mt-4 space-y-2">
                      {availableCategories.map((c) => {
                        const isActive = filters.category === c
                        return (
                          <li key={c}>
                            <button
                              onClick={() =>
                                handleFilterChange('category', isActive ? '' : c)
                              }
                              className={`font-bake-body flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-left text-[13px] transition-all ${
                                isActive
                                  ? 'border-cocoa bg-cocoa text-ivory'
                                  : 'border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                              }`}
                            >
                              <span>{titleise(c)}</span>
                              {isActive && (
                                <span className="h-2 w-2 rounded-full bg-rose-accent" />
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )}
              </div>

              <footer className="flex gap-2 border-t border-line bg-cream/60 px-6 py-4">
                <button
                  onClick={clearFilters}
                  className="font-bake-body flex-1 rounded-full border border-line bg-ivory px-4 py-2.5 text-[13px] font-medium text-cocoa-soft transition-colors hover:text-cocoa"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="bake-btn flex-1 justify-center"
                >
                  Show {products.length} {products.length === 1 ? 'bake' : 'bakes'}
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}

/* ─── Sub-components ─── */

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="font-bake-body inline-flex items-center gap-1.5 rounded-full border border-rose-accent/40 bg-rose/40 px-3 py-1 text-[12px] font-medium text-cocoa">
      {label}
      <button
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
        className="text-cocoa-soft transition-colors hover:text-rose-accent"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  )
}
