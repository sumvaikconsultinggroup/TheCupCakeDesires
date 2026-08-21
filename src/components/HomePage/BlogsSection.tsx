import Image from 'next/image'
import Link from 'next/link'
import connectDb from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import ImagePlaceholder from '../ImagePlaceholder'

type Post = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  featuredImage?: { url?: string; alt?: string }
  category?: string
  author?: { name?: string; avatar?: string }
  publishedAt?: Date | string
  readingTime?: number
}

async function getLatestPosts(): Promise<Post[]> {
  try {
    await connectDb()
    const now = new Date()
    const docs = await BlogPost.find({
      status: 'published',
      $or: [{ publishedAt: { $lte: now } }, { publishedAt: { $exists: false } }],
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .select('title slug excerpt featuredImage author category publishedAt readingTime')
      .lean()

    return (docs as any[]).map((p) => ({
      _id: p._id?.toString(),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      category: p.category,
      author: p.author,
      publishedAt: p.publishedAt,
      readingTime: p.readingTime,
    }))
  } catch (e) {
    console.error('BlogsSection fetch failed:', e)
    return []
  }
}

function formatDate(d?: Date | string): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const tones = ['rose', 'cream', 'beige', 'gold'] as const

export default async function BlogsSection() {
  const posts = await getLatestPosts()
  if (!posts.length) return null

  return (
    <section className="bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Heading */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div className="max-w-[58ch]">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Stories from the kitchen
            </p>
            <h2 className="bake-display-lg mt-5">
              Notes, recipes &amp;{' '}
              <span className="bake-display-italic text-rose-accent">behind-the-scenes.</span>
            </h2>
            <p className="bake-body mt-4 max-w-[52ch]">
              Recipe stories, flavour experiments, gift-planning guides, and the small things we
              learn from running a tiny bakery in Melbourne.
            </p>
          </div>
          <Link href="/blogs" className="bake-btn bake-btn-ghost bake-btn-sm">
            Read all stories <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {posts.slice(0, 3).map((p, i) => {
            const tone = tones[i % tones.length]
            const date = formatDate(p.publishedAt)
            const hasRealImage = !!p.featuredImage?.url
            return (
              <article key={p._id} className="bake-card bake-img-zoom group">
                <Link href={`/blogs/${p.slug}`} className="block">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {hasRealImage ? (
                      <Image
                        src={p.featuredImage!.url!}
                        alt={p.featuredImage?.alt || p.title}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                        unoptimized={p.featuredImage!.url!.startsWith('/')}
                        className="object-cover"
                      />
                    ) : (
                      <ImagePlaceholder
                        ratio="absolute inset-0"
                        tone={tone}
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

                  {/* Text */}
                  <div className="px-6 py-7">
                    <p className="bake-caption text-taupe">
                      {date}
                      {p.readingTime ? (
                        <>
                          <span aria-hidden className="mx-2 opacity-50">
                            ·
                          </span>
                          {p.readingTime} min read
                        </>
                      ) : null}
                    </p>
                    <h3 className="font-bake-display mt-3 text-[22px] font-medium leading-snug text-cocoa transition-colors group-hover:text-rose-accent md:text-[24px]">
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
                          {p.author?.name || 'The Cupcake Desire'}
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
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
