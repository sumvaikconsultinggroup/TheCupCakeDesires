import { getKeywordBlog } from '@/data/keyword-blogs'
import { RUPAL_MAHAJAN_AUTHOR } from '@/data/blog-author-rupal'
import RichParagraph from '@/components/seo/RichParagraph'
import Image from 'next/image'
import Link from 'next/link'

export default function KeywordBlogArticle({ slug }: { slug: string }) {
  const post = getKeywordBlog(slug)
  if (!post) return null

  const authorName = post.author?.name || 'The Cupcake Desire'
  const authorAvatar =
    post.author?.avatar ||
    (authorName === RUPAL_MAHAJAN_AUTHOR.name ? RUPAL_MAHAJAN_AUTHOR.avatar : undefined)

  return (
    <article className="bg-ivory py-14 md:py-20">
      <div className="mx-auto max-w-[760px] px-6 md:px-10">
        <p className="bake-eyebrow">
          <Link href="/blogs" className="hover:text-rose-accent">
            Stories
          </Link>
          <span className="mx-2 text-taupe">/</span>
          {post.category}
        </p>
        <h1 className="bake-display-lg mt-4">{post.title}</h1>
        <p className="bake-body-lg mt-5 text-cocoa-soft">{post.excerpt}</p>
        <p className="bake-caption mt-4 text-taupe">
          By <span className="font-medium text-cocoa">{authorName}</span>
        </p>
        {post.featuredImage?.url && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt || post.title}
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
              style={post.featuredImage.focalPoint ? { objectPosition: post.featuredImage.focalPoint } : undefined}
              priority
            />
          </div>
        )}
        <div className="mt-10 space-y-8">
          {post.sections.map((section) => (
            <section key={section.heading || section.paragraphs[0].slice(0, 24)}>
              {section.heading && (
                <h2 className="font-bake-display text-[26px] font-medium text-cocoa">{section.heading}</h2>
              )}
              {section.paragraphs.map((paragraph) => (
                <RichParagraph
                  key={paragraph.slice(0, 40)}
                  text={paragraph}
                  className="bake-body mt-3 text-cocoa-soft"
                />
              ))}
            </section>
          ))}
        </div>
        {authorAvatar && (
          <div className="mt-12 flex items-center gap-4 border-t border-line pt-8">
            <Image
              src={authorAvatar}
              alt={authorName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover"
              unoptimized={authorAvatar.startsWith('/')}
            />
            <div>
              <p className="bake-caption text-taupe">About the author</p>
              <p className="font-medium text-cocoa">{authorName}</p>
            </div>
          </div>
        )}
        <div className="mt-12 flex flex-wrap gap-3">
          {slug === 'halloween-cupcake-ideas-melbourne' ? (
            <>
              <Link href="/collections/halloween-cupcakes" className="bake-btn bake-btn-rose">
                Shop Halloween cupcakes
              </Link>
              <Link href="/halloween-party-treats-melbourne" className="bake-btn bake-btn-ghost">
                Party treats guide
              </Link>
            </>
          ) : (
            <>
              <Link href="/collections/all-cupcakes" className="bake-btn bake-btn-rose">
                Shop cupcakes
              </Link>
              <Link href="/melbourne" className="bake-btn bake-btn-ghost">
                Melbourne guides
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
