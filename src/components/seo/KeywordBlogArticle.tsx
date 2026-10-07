import { getKeywordBlog } from '@/data/keyword-blogs'
import Link from 'next/link'

export default function KeywordBlogArticle({ slug }: { slug: string }) {
  const post = getKeywordBlog(slug)
  if (!post) return null
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
        <div className="mt-10 space-y-8">
          {post.sections.map((section) => (
            <section key={section.heading || section.paragraphs[0].slice(0, 24)}>
              {section.heading && (
                <h2 className="font-bake-display text-[26px] font-medium text-cocoa">{section.heading}</h2>
              )}
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="bake-body mt-3 text-cocoa-soft">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/collections/all-cupcakes" className="bake-btn bake-btn-rose">
            Shop cupcakes
          </Link>
          <Link href="/melbourne" className="bake-btn bake-btn-ghost">
            Melbourne guides
          </Link>
        </div>
      </div>
    </article>
  )
}
