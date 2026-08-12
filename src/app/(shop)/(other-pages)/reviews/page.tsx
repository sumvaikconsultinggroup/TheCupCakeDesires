'use client'

import JsonLd from '@/components/SE0/JsonLd'
import { motion } from 'framer-motion'
import { Loader2, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ReviewItem = {
  id: string
  customerName: string
  rating: number
  title: string
  content: string
  productTitle: string
  productHandle: string
  isVerifiedPurchase?: boolean
  createdAt: string
}

type ProductSummary = {
  handle: string
  title: string
  count: number
  avgRating: number
  image?: string
}

type Stats = {
  count: number
  avgRating: number
  distribution: Record<number, number>
}

function decodeEntities(text: string) {
  return text
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
}

function Stars({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <div className="flex items-center gap-1 text-gold">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={i < count ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden
        >
          <path d="M10 1 L 12.5 7 L 19 7.7 L 14 12.2 L 15.5 19 L 10 15.5 L 4.5 19 L 6 12.2 L 1 7.7 L 7.5 7 Z" />
        </svg>
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function ReviewCard({ r, delay = 0 }: { r: ReviewItem; delay?: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="bake-card flex flex-col gap-4 p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <Stars count={r.rating} />
        <time className="bake-caption shrink-0 text-taupe">{formatDate(r.createdAt)}</time>
      </div>

      <blockquote className="flex-1">
        <p className="font-bake-display text-[17px] font-medium leading-snug text-cocoa">
          {decodeEntities(r.title)}
        </p>
        <p className="bake-body mt-3 text-cocoa-soft leading-relaxed">
          <span className="font-bake-display text-[28px] leading-none text-rose-accent">&ldquo;</span>
          {decodeEntities(r.content)}
        </p>
      </blockquote>

      <figcaption className="mt-auto border-t border-line pt-4">
        <p className="font-bake-display text-[16px] font-medium text-cocoa">
          {r.customerName}
          {r.isVerifiedPurchase && (
            <span className="bake-caption ml-2 font-normal text-rose-accent">Verified</span>
          )}
        </p>
      </figcaption>
    </motion.figure>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [productFilter, setProductFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (nextPage: number, rating: number, product: string, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const qs = new URLSearchParams({
          page: String(nextPage),
          limit: '24',
        })
        if (rating >= 1 && rating <= 5) qs.set('rating', String(rating))
        if (product) qs.set('product', product)
        const res = await fetch(`/api/reviews?${qs}`)
        const data = await res.json()
        if (!res.ok || !data.success) {
          setError(data.message || 'Could not load reviews.')
          return
        }
        setReviews((prev) => (append ? [...prev, ...data.data] : data.data))
        setProducts(data.products || [])
        setStats(data.stats)
        setPage(data.pagination.page)
        setTotalPages(data.pagination.totalPages)
      } catch {
        setError('Something went wrong loading reviews.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    void load(1, ratingFilter, productFilter, false)
  }, [load, ratingFilter, productFilter])

  const productMeta = useMemo(() => {
    const map = new Map(products.map((p) => [p.handle, p]))
    return map
  }, [products])

  const grouped = useMemo(() => {
    const order: string[] = []
    const byHandle = new Map<string, ReviewItem[]>()
    for (const r of reviews) {
      const key = r.productHandle || '_other'
      if (!byHandle.has(key)) {
        byHandle.set(key, [])
        order.push(key)
      }
      byHandle.get(key)!.push(r)
    }
    // Prefer API product order (most reviewed first) when showing all
    if (!productFilter && products.length) {
      const preferred = products.map((p) => p.handle).filter((h) => byHandle.has(h))
      const rest = order.filter((h) => !preferred.includes(h))
      return [...preferred, ...rest].map((handle) => ({
        handle,
        reviews: byHandle.get(handle) || [],
        meta: productMeta.get(handle),
        title: productMeta.get(handle)?.title || byHandle.get(handle)?.[0]?.productTitle || handle,
      }))
    }
    return order.map((handle) => ({
      handle,
      reviews: byHandle.get(handle) || [],
      meta: productMeta.get(handle),
      title: productMeta.get(handle)?.title || byHandle.get(handle)?.[0]?.productTitle || handle,
    }))
  }, [reviews, products, productFilter, productMeta])

  return (
    <>
      <JsonLd />
      <main className="bake-canvas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line bg-linear-to-br from-cream via-ivory to-rose/20">
          <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-rose-accent/10 blur-3xl" />
          <div className="mx-auto max-w-[1320px] px-6 py-14 md:px-10 md:py-20">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="bake-eyebrow inline-flex items-center">
                <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
                Customer notes
                <span className="ml-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              </p>
              <h1 className="bake-display-lg mt-5 text-cocoa">
                Real cupcakes,{' '}
                <span className="bake-display-italic text-rose-accent">real reactions.</span>
              </h1>
              <p className="bake-body mx-auto mt-4 max-w-[48ch] text-cocoa-soft">
                Notes from Melbourne customers, organised by the bake they ordered.
              </p>

              {stats && stats.count > 0 && (
                <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 rounded-full border border-line bg-ivory/90 px-5 py-3">
                  <Stars count={Math.round(stats.avgRating)} size={16} />
                  <p className="font-bake-display text-[18px] font-medium text-cocoa">
                    {stats.avgRating.toFixed(1)}
                    <span className="bake-caption ml-2 font-normal text-taupe">
                      from {stats.count} {stats.count === 1 ? 'note' : 'notes'}
                      {products.length > 0 &&
                        ` · ${products.length} ${products.length === 1 ? 'product' : 'products'}`}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filters + product groups */}
        <section className="bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="mb-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="bake-caption text-taupe">Browse by product</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProductFilter('')}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                      productFilter === ''
                        ? 'border-cocoa bg-cocoa text-ivory'
                        : 'border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                    }`}
                  >
                    All products
                  </button>
                  {products.map((p) => (
                    <button
                      key={p.handle}
                      type="button"
                      onClick={() => setProductFilter(p.handle)}
                      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                        productFilter === p.handle
                          ? 'border-cocoa bg-cocoa text-ivory'
                          : 'border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                      }`}
                    >
                      {p.title}
                      <span className="ml-1.5 opacity-70">({p.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                <p className="bake-caption text-taupe">Filter by rating</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setRatingFilter(0)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                      ratingFilter === 0
                        ? 'border-cocoa bg-cocoa text-ivory'
                        : 'border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                    }`}
                  >
                    All
                  </button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRatingFilter(r)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                        ratingFilter === r
                          ? 'border-cocoa bg-cocoa text-ivory'
                          : 'border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                      }`}
                    >
                      {r}
                      <Star className="h-3 w-3 fill-current" strokeWidth={0} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-cocoa" strokeWidth={1.6} />
                <p className="bake-caption text-taupe">Loading customer notes…</p>
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center">
                <p className="font-medium text-rose-accent">{error}</p>
                <button
                  type="button"
                  onClick={() => void load(1, ratingFilter, productFilter, false)}
                  className="bake-btn mt-5"
                >
                  Try again
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-3xl border border-line bg-cream/50 px-6 py-16 text-center">
                <h2 className="font-bake-display text-[22px] font-medium text-cocoa">No notes yet</h2>
                <p className="bake-body-sm mx-auto mt-2 max-w-[40ch] text-cocoa-soft">
                  Approved customer notes will appear here. In the meantime, browse the bakery.
                </p>
                <Link href="/collections/all-items" className="bake-btn mt-6 inline-flex">
                  Shop the bakery
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-14">
                  {grouped.map((group) => (
                    <section key={group.handle} className="scroll-mt-24">
                      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
                        <div className="flex items-center gap-4">
                          {group.meta?.image ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-line bg-cream">
                              <Image
                                src={group.meta.image}
                                alt={group.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-cream text-rose-accent">
                              <Stars count={Math.round(group.meta?.avgRating || 5)} size={12} />
                            </div>
                          )}
                          <div>
                            <p className="bake-eyebrow mb-1">Product notes</p>
                            {group.handle && group.handle !== '_other' ? (
                              <Link
                                href={`/products/${group.handle}`}
                                className="font-bake-display text-[24px] font-medium text-cocoa transition-colors hover:text-rose-accent md:text-[28px]"
                              >
                                {group.title}
                              </Link>
                            ) : (
                              <h2 className="font-bake-display text-[24px] font-medium text-cocoa md:text-[28px]">
                                {group.title}
                              </h2>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-3">
                              <Stars count={Math.round(group.meta?.avgRating || 0)} size={13} />
                              <p className="bake-caption text-taupe">
                                {(group.meta?.avgRating ?? 0).toFixed(1)} ·{' '}
                                {group.meta?.count ?? group.reviews.length}{' '}
                                {(group.meta?.count ?? group.reviews.length) === 1 ? 'note' : 'notes'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {group.handle && group.handle !== '_other' && (
                          <Link
                            href={`/products/${group.handle}`}
                            className="bake-btn bake-btn-ghost text-[13px]"
                          >
                            View product
                          </Link>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                        {group.reviews.map((r, i) => (
                          <ReviewCard key={r.id} r={r} delay={Math.min(i, 8) * 0.04} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                {page < totalPages && (
                  <div className="mt-12 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => void load(page + 1, ratingFilter, productFilter, true)}
                      className="bake-btn bake-btn-ghost disabled:opacity-60"
                    >
                      {loadingMore ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                        </span>
                      ) : (
                        'Load more notes'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
