'use client'

import { DELIVERY_GUIDES, RELATED_GUIDES, type Guide } from '@/data/related-guides'
import Link from 'next/link'

/** "Helpful guides" links for a page (server-rendered, crawlable). */
export default function RelatedGuides({ path }: { path: string }) {
  const melbourneGuides: Guide[] = [
    { href: '/blogs/kids-birthday-cake-ideas-melbourne', title: 'Kids birthday cake ideas in Melbourne' },
    { href: '/blogs/how-to-make-a-smash-cake', title: 'How to make a smash cake' },
    { href: '/blogs/chocolate-cupcake-recipe', title: 'Chocolate cupcake recipe' },
  ]
  const guides =
    RELATED_GUIDES[path] ||
    (path.startsWith('/cupcake-delivery/') ? DELIVERY_GUIDES : undefined) ||
    (path.startsWith('/melbourne/') ? melbourneGuides : undefined)
  if (!guides?.length) return null
  return (
    <section className="border-t border-line bg-ivory py-12">
      <div className="mx-auto max-w-[900px] px-6 md:px-10">
        <p className="font-bake-script text-[18px] text-rose-accent">From the blog</p>
        <h2 className="font-bake-display mt-1 text-[22px] font-medium tracking-tight text-cocoa md:text-[26px]">
          Helpful guides
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.href}>
              <Link href={g.href} className="font-bake-body text-[15px] text-cocoa underline decoration-rose-accent/40 underline-offset-4 hover:text-rose-accent">
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
