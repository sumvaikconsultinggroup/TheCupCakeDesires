'use client'

import ImagePlaceholder from '@/components/ImagePlaceholder'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: { url: string; alt?: string }
  author: { name: string; avatar?: string }
  category?: string
  tags?: string[]
  publishedAt?: string
  readingTime?: number
  viewCount?: number
}

interface BlogCategory {
  _id: string
  name: string
  slug: string
  color?: string
  postCount: number
}

interface BlogListClientProps {
  initialPosts: BlogPost[]
  categories: BlogCategory[]
  featuredPosts: BlogPost[]
}

function formatDate(d?: string | Date): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const placeholderTones = ['rose', 'cream', 'beige', 'gold'] as const

export default function BlogListClient({ initialPosts, categories, featuredPosts }: BlogListClientProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPosts = async (category?: string, search?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      params.set('limit', '12')

      const res = await fetch(`/api/blog?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setPosts(data.data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug)
    fetchPosts(slug || undefined, searchQuery || undefined)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts(activeCategory || undefined, searchQuery || undefined)
  }

  const hero = featuredPosts[0]
  const subFeatures = featuredPosts.slice(1, 3)

  return (
    <main className="bake-canvas min-h-screen">
      {/* ─── Hero ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="text-center">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              The Wednesday letter
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[20ch] mx-auto">
              Stories from{' '}
              <span className="bake-display-italic text-rose-accent">the kitchen.</span>
            </h1>
            <p className="bake-body-lg mt-6 max-w-[58ch] mx-auto">
              Notes from our bakery — flavour experiments, recipe stories, gift-planning guides,
              and the small things we learn from running a tiny shop in Melbourne.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Featured spotlight ─── */}
      {hero && (
        <section className="bg-ivory py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="mb-10 flex items-end justify-between gap-6">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Editor&rsquo;s pick
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
              {/* Lead featured */}
              <Link
                href={`/blog/${hero.slug}`}
                className="bake-card bake-img-zoom group block md:col-span-7"
              >
                <div className="relative aspect-4/3 overflow-hidden">
                  {hero.featuredImage?.url ? (
                    <Image
                      src={hero.featuredImage.url}
                      alt={hero.featuredImage.alt || hero.title}
                      fill
                      sizes="(max-width:768px) 100vw, 60vw"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder
                      ratio="absolute inset-0"
                      tone="rose"
                      rounded="none"
                      label="Featured story"
                      hint={hero.title}
                    />
                  )}
                  {hero.category && (
                    <span className="bake-badge bake-badge-dark absolute left-5 top-5">
                      {hero.category}
                    </span>
                  )}
                </div>

                <div className="px-7 py-8">
                  <p className="bake-caption text-taupe">
                    {formatDate(hero.publishedAt)}
                    {hero.readingTime && (
                      <>
                        <span aria-hidden className="mx-2 opacity-50">·</span>
                        {hero.readingTime} min read
                      </>
                    )}
                  </p>
                  <h2 className="font-bake-display mt-3 text-[28px] font-medium leading-tight text-cocoa transition-colors group-hover:text-rose-accent md:text-[32px]">
                    {hero.title}
                  </h2>
                  {hero.excerpt && (
                    <p className="bake-body mt-4 line-clamp-3">{hero.excerpt}</p>
                  )}
                  <div className="mt-6 inline-flex items-center gap-2 font-bake-body text-[14px] font-medium text-cocoa transition-all group-hover:gap-3 group-hover:text-rose-accent">
                    <span>Read this story</span>
                    <span aria-hidden>→</span>
                  </div>
                </div>
              </Link>

              {/* Sub-featured stack */}
              <div className="md:col-span-5 flex flex-col gap-6">
                {(subFeatures.length ? subFeatures : []).map((p, i) => (
                  <Link
                    key={p._id}
                    href={`/blog/${p.slug}`}
                    className="bake-card bake-img-zoom group block"
                  >
                    <div className="grid grid-cols-12 gap-0">
                      <div className="relative col-span-5 aspect-square overflow-hidden">
                        {p.featuredImage?.url ? (
                          <Image
                            src={p.featuredImage.url}
                            alt={p.featuredImage.alt || p.title}
                            fill
                            sizes="(max-width:768px) 100vw, 30vw"
                            className="object-cover"
                          />
                        ) : (
                          <ImagePlaceholder
                            ratio="absolute inset-0"
                            tone={placeholderTones[(i + 1) % placeholderTones.length]}
                            rounded="none"
                            label="Story image"
                            hint={p.title}
                          />
                        )}
                      </div>
                      <div className="col-span-7 px-5 py-5">
                        {p.category && (
                          <p className="bake-caption text-rose-accent">{p.category}</p>
                        )}
                        <h3 className="font-bake-display mt-2 line-clamp-2 text-[18px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
                          {p.title}
                        </h3>
                        <p className="bake-caption mt-3 text-taupe">
                          {formatDate(p.publishedAt)}
                          {p.readingTime && (
                            <>
                              <span aria-hidden className="mx-2 opacity-50">·</span>
                              {p.readingTime} min
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Search + category filter ─── */}
      <section className="border-y border-line bg-cream-deep/40 py-8">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Categories */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCategoryClick(null)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  activeCategory === null
                    ? 'bg-cocoa text-ivory'
                    : 'border border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                }`}
              >
                All stories
              </button>
              {categories.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleCategoryClick(c.slug)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    activeCategory === c.slug
                      ? 'bg-cocoa text-ivory'
                      : 'border border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                  }`}
                >
                  {c.name}
                  {c.postCount > 0 && (
                    <span className="ml-2 opacity-60">({c.postCount})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative w-full md:w-auto md:min-w-[300px]">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories…"
                className="font-bake-body w-full rounded-full border border-line bg-ivory pl-12 pr-5 py-3 text-[14px] text-cocoa placeholder-taupe transition-colors focus:border-rose-accent focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe transition-colors hover:text-cocoa"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21 L 16 16" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Posts grid ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-rose-accent" />
            </div>
          ) : posts.length === 0 ? (
            <div className="mx-auto max-w-[40ch] py-16 text-center">
              <p className="font-bake-display text-[28px] font-medium text-cocoa">
                Nothing here yet.
              </p>
              <p className="bake-body mt-4">
                We&rsquo;re writing more stories — try a different category, or check back next
                Wednesday.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  handleCategoryClick(null)
                }}
                className="bake-btn bake-btn-ghost mt-8"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10 flex items-end justify-between">
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  {activeCategory
                    ? categories.find((c) => c.slug === activeCategory)?.name || 'Stories'
                    : 'All stories'}
                </p>
                <p className="bake-caption text-taupe">
                  {posts.length} {posts.length === 1 ? 'story' : 'stories'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                {posts.map((p, i) => (
                  <motion.article
                    key={p._id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.3) }}
                    className="bake-card bake-img-zoom group"
                  >
                    <Link href={`/blog/${p.slug}`}>
                      <div className="relative aspect-4/3 overflow-hidden">
                        {p.featuredImage?.url ? (
                          <Image
                            src={p.featuredImage.url}
                            alt={p.featuredImage.alt || p.title}
                            fill
                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <ImagePlaceholder
                            ratio="absolute inset-0"
                            tone={placeholderTones[i % placeholderTones.length]}
                            rounded="none"
                            label="Story image"
                            hint={p.title}
                          />
                        )}
                        {p.category && (
                          <span className="bake-badge bake-badge-dark absolute left-4 top-4">
                            {p.category}
                          </span>
                        )}
                      </div>

                      <div className="px-6 py-7">
                        <p className="bake-caption text-taupe">
                          {formatDate(p.publishedAt)}
                          {p.readingTime && (
                            <>
                              <span aria-hidden className="mx-2 opacity-50">·</span>
                              {p.readingTime} min read
                            </>
                          )}
                        </p>
                        <h3 className="font-bake-display mt-3 text-[20px] font-medium leading-snug text-cocoa transition-colors group-hover:text-rose-accent md:text-[22px]">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="bake-body-sm mt-3 line-clamp-3">{p.excerpt}</p>
                        )}

                        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-deep text-[12px] font-semibold tracking-[0.08em] uppercase text-cocoa-soft">
                              {(p.author?.name || 'C').slice(0, 2)}
                            </div>
                            <p className="bake-body-sm font-medium text-cocoa">
                              {p.author?.name || 'CupCake Desires'}
                            </p>
                          </div>
                          <span
                            aria-hidden
                            className="font-bake-body inline-flex items-center gap-1 text-[13px] font-medium text-cocoa transition-all group-hover:text-rose-accent group-hover:gap-2"
                          >
                            Read <span>→</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Newsletter CTA strip ─── */}
      <section className="bg-cocoa py-20 text-ivory md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
                Don&rsquo;t miss a story
              </p>
              <h2 className="bake-display-lg mt-5 text-ivory">
                Get the Wednesday letter{' '}
                <span className="bake-display-italic text-rose-deep">in your inbox.</span>
              </h2>
              <p className="bake-body mt-4 max-w-[52ch] text-cream-deep/85">
                One thoughtful note a week — what we&rsquo;re baking, what we&rsquo;re writing,
                plus a fresh discount for subscribers.
              </p>
            </div>
            <div className="md:col-span-5">
              <Link href="/subscription" className="bake-btn bake-btn-rose">
                Subscribe to the letter <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
