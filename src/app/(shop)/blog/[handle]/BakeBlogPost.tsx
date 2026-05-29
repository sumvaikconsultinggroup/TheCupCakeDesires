'use client'

import SafeHTML from '@/components/SafeHTML'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: { url: string; alt?: string; caption?: string }
  author?: { name: string; avatar?: string; bio?: string }
  category?: string
  tags?: string[]
  publishedAt?: string
  readingTime?: number
}

interface Props {
  post: BlogPost
  related?: BlogPost[]
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BakeBlogPost({ post, related = [] }: Props) {
  return (
    <main className="font-bake-body bg-ivory text-cocoa">
      {/* ─── Breadcrumb ─── */}
      <nav aria-label="Breadcrumb" className="border-b border-line bg-cream/60">
        <ol className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-1.5 px-6 py-4 text-[12px] tracking-[0.04em] text-taupe md:px-10">
          <li><Link href="/" className="hover:text-cocoa">Home</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} /></li>
          <li><Link href="/blog" className="hover:text-cocoa">Stories</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} /></li>
          <li className="line-clamp-1 text-cocoa">{post.title}</li>
        </ol>
      </nav>

      {/* ─── Article header ─── */}
      <article>
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[920px] px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {post.category && (
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  {post.category}
                </p>
              )}
              <h1 className="bake-display-xl mt-6 max-w-[22ch] mx-auto leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="bake-body-lg mt-6 max-w-[55ch] mx-auto text-cocoa-soft">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-8 flex items-center justify-center gap-4">
                <span className="font-bake-display flex h-10 w-10 items-center justify-center rounded-full bg-cocoa text-[15px] font-medium text-ivory">
                  {(post.author?.name || 'C')[0]}
                </span>
                <div className="text-left">
                  <p className="font-bake-display text-[15px] font-medium text-cocoa">
                    {post.author?.name || 'CupCake Desires'}
                  </p>
                  <p className="bake-caption text-taupe">
                    {formatDate(post.publishedAt)}
                    {post.readingTime ? ` · ${post.readingTime} min read` : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Hero image */}
        {post.featuredImage?.url && (
          <section className="bg-ivory">
            <div className="mx-auto max-w-[1320px] px-6 md:px-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative -mt-12 aspect-video w-full overflow-hidden rounded-3xl border border-line bg-cream-deep md:-mt-20"
              >
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt || post.title}
                  fill
                  sizes="(max-width: 1320px) 100vw, 1320px"
                  priority
                  className="object-cover"
                />
              </motion.div>
              {post.featuredImage.caption && (
                <p className="bake-caption mt-3 text-center text-taupe">
                  {post.featuredImage.caption}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Body */}
        <section className="bg-ivory py-16 md:py-20">
          <div className="mx-auto max-w-[760px] px-6 md:px-0">
            <div className="bake-prose">
              <SafeHTML html={post.content} />
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 border-t border-line pt-8">
                <p className="bake-caption text-taupe">Tagged</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line bg-cream px-3 py-1 text-[12px] font-medium text-cocoa-soft"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="bg-ivory py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-14 md:flex-row md:items-end">
              <div>
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  Keep reading
                </p>
                <h2 className="bake-display-lg mt-5">
                  More from{' '}
                  <span className="bake-display-italic text-rose-accent">the kitchen.</span>
                </h2>
              </div>
              <Link href="/blog" className="bake-btn bake-btn-ghost bake-btn-sm">
                All stories <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
              {related.slice(0, 3).map((r, i) => (
                <motion.article
                  key={r._id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="group"
                >
                  <Link href={`/blog/${r.slug}`}>
                    <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-cream-deep">
                      {r.featuredImage?.url && (
                        <Image
                          src={r.featuredImage.url}
                          alt={r.featuredImage.alt || r.title}
                          fill
                          sizes="(max-width:768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="mt-5">
                      <p className="bake-caption text-taupe">
                        {r.category || 'Story'} · {formatDate(r.publishedAt)}
                      </p>
                      <h3 className="font-bake-display mt-2 line-clamp-2 text-[18px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
