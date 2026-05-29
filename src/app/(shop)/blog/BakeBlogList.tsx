'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: { url: string; alt?: string }
  author?: { name: string; avatar?: string }
  category?: string
  publishedAt?: string
  readingTime?: number
}

interface BlogCategory {
  _id: string
  name: string
  slug?: string
}

interface Props {
  initialPosts: BlogPost[]
  categories?: BlogCategory[]
  featuredPosts?: BlogPost[]
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-cream-deep">
          {post.featuredImage?.url ? (
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt || post.title}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : null}
          {post.category && (
            <span className="bake-badge absolute left-4 top-4 bg-ivory text-cocoa">
              {post.category}
            </span>
          )}
        </div>
        <div className="mt-5">
          <p className="bake-caption text-taupe">
            {formatDate(post.publishedAt)}
            {post.readingTime ? ` · ${post.readingTime} min read` : ''}
          </p>
          <h3 className="font-bake-display mt-2 line-clamp-2 text-[20px] font-medium leading-tight text-cocoa transition-colors group-hover:text-rose-accent">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="bake-body-sm mt-2 line-clamp-2 text-cocoa-soft">{post.excerpt}</p>
          )}
        </div>
      </Link>
    </motion.article>
  )
}

export default function BakeBlogList({
  initialPosts,
  categories = [],
  featuredPosts = [],
}: Props) {
  const [activeCat, setActiveCat] = useState<string>('All')

  const allCategories = useMemo(() => {
    const names = new Set<string>()
    initialPosts.forEach((p) => p.category && names.add(p.category))
    categories.forEach((c) => names.add(c.name))
    return ['All', ...Array.from(names)]
  }, [initialPosts, categories])

  const filtered =
    activeCat === 'All'
      ? initialPosts
      : initialPosts.filter((p) => p.category === activeCat)

  const lead = featuredPosts[0] || initialPosts[0]
  const rest = lead ? filtered.filter((p) => p._id !== lead._id) : filtered

  return (
    <main className="font-bake-body bg-ivory text-cocoa">
      {/* ─── Hero ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16 md:items-end">
            <div className="md:col-span-8">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bake-eyebrow"
              >
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Stories from the kitchen
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.06 }}
                className="bake-display-xl mt-6 max-w-[20ch]"
              >
                Notes, recipes,{' '}
                <span className="bake-display-italic text-rose-accent">small joys.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="bake-body-lg mt-6 max-w-[58ch]"
              >
                Behind every box of cupcakes is a recipe we tested twelve times, a Tuesday morning
                we wouldn&rsquo;t trade, or a customer letter that made us cry. This is where we
                write it down.
              </motion.p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <p className="bake-caption text-taupe">
                {initialPosts.length} {initialPosts.length === 1 ? 'post' : 'posts'} ·
                {' '}updated weekly
              </p>
            </div>
          </div>

          {/* Category chips */}
          {allCategories.length > 2 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {allCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    activeCat === c
                      ? 'bg-cocoa text-ivory'
                      : 'border border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Featured (when no filter) ─── */}
      {activeCat === 'All' && lead && (
        <section className="bg-ivory py-16 md:py-20">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16"
            >
              <Link
                href={`/blog/${lead.slug}`}
                className="block md:col-span-7"
              >
                <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-cream-deep md:aspect-video">
                  {lead.featuredImage?.url ? (
                    <Image
                      src={lead.featuredImage.url}
                      alt={lead.featuredImage.alt || lead.title}
                      fill
                      sizes="(max-width:768px) 100vw, 60vw"
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                  <span className="bake-badge absolute left-5 top-5 bg-ivory text-cocoa">
                    Featured · {lead.category || 'Story'}
                  </span>
                </div>
              </Link>
              <div className="md:col-span-5">
                <p className="bake-caption text-taupe">
                  {formatDate(lead.publishedAt)}
                  {lead.readingTime ? ` · ${lead.readingTime} min read` : ''}
                </p>
                <Link href={`/blog/${lead.slug}`}>
                  <h2 className="bake-display-lg mt-4 line-clamp-3 transition-colors group-hover:text-rose-accent">
                    {lead.title}
                  </h2>
                </Link>
                {lead.excerpt && (
                  <p className="bake-body mt-5 max-w-[55ch] text-cocoa-soft">
                    {lead.excerpt}
                  </p>
                )}
                <div className="mt-7 flex items-center gap-3">
                  {lead.author?.avatar && (
                    <Image
                      src={lead.author.avatar}
                      alt={lead.author.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-line object-cover"
                    />
                  )}
                  <p className="bake-body-sm text-cocoa-soft">
                    By <span className="font-medium text-cocoa">{lead.author?.name || 'CupCake Desires'}</span>
                  </p>
                </div>
                <Link
                  href={`/blog/${lead.slug}`}
                  className="bake-btn bake-btn-ghost bake-btn-sm mt-8"
                >
                  Read the story <span aria-hidden>→</span>
                </Link>
              </div>
            </motion.article>
          </div>
        </section>
      )}

      {/* ─── Grid ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-14 md:flex-row md:items-end">
            <div>
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                The full bench
              </p>
              <h2 className="bake-display-lg mt-5">
                {activeCat === 'All' ? 'Everything we’ve written.' : activeCat}
              </h2>
            </div>
            <p className="bake-caption text-taupe">
              Showing {rest.length} {rest.length === 1 ? 'post' : 'posts'}
            </p>
          </div>

          {rest.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-ivory p-12 text-center">
              <p className="font-bake-display text-[20px] text-cocoa">Nothing under this tag yet.</p>
              <p className="bake-body-sm mt-2 text-cocoa-soft">
                Try a different category, or browse everything.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {rest.map((p, i) => (
                <PostCard key={p._id} post={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Inline newsletter cue ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="rounded-3xl border border-line bg-cocoa px-8 py-14 text-center text-ivory md:px-16 md:py-20">
            <p className="bake-eyebrow text-rose-deep">
              <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
              New post every Friday
            </p>
            <h2 className="bake-display-lg mt-6 max-w-[22ch] mx-auto text-ivory">
              The bakery letter — one short note,{' '}
              <span className="bake-display-italic text-rose-deep">no spam.</span>
            </h2>
            <p className="bake-body mt-5 max-w-[52ch] mx-auto text-cream-deep/85">
              Once a week, a single email: the new flavour, a recipe, an honest behind-the-counter
              moment. No sales push, no auto-funnel.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/#newsletter" className="bake-btn bake-btn-rose">
                Sign me up <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
