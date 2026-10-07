import JsonLd from '@/components/SE0/JsonLd'
import { KEYWORD_BLOGS } from '@/data/keyword-blogs'
import { MELBOURNE_PAGES, melbournePath } from '@/data/melbourne-pages'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Melbourne Cupcake & Cake Guides | The Cupcake Desire',
  description:
    'Birthday cakes, character cakes, dietary cupcakes and delivery rules for Melbourne. Baked to order in Narre Warren. No same-day delivery.',
  alternates: { canonical: '/melbourne' },
  openGraph: {
    title: 'Melbourne Cupcake & Cake Guides | The Cupcake Desire',
    description: 'Guides for the cakes and cupcakes people search for in Melbourne, linked to what we actually bake.',
    url: '/melbourne',
    type: 'website',
  },
}

export default function MelbourneHubPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Melbourne guides', url: `${siteConfig.url}/melbourne` },
        ])}
      />
      <main className="bake-canvas">
        <section className="bg-cream py-14 md:py-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Melbourne
            </p>
            <h1 className="bake-display-lg mt-5 max-w-[18ch]">Cakes and cupcakes people search for in Melbourne</h1>
            <p className="bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft">
              Each guide matches a search to something we bake, or says plainly when we do not. We are The Cupcake
              Desire in Narre Warren. Delivery is weekdays. There is no same-day service and no shopping-centre shop.
            </p>
          </div>
        </section>
        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[28px] font-medium text-cocoa">Guides</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {MELBOURNE_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link href={melbournePath(page.slug)} className="block rounded-2xl border border-line bg-cream px-4 py-4 hover:border-rose-accent">
                    <span className="font-bake-display text-[18px] text-cocoa">{page.breadcrumb}</span>
                    <span className="bake-body-sm mt-1 block text-cocoa-soft">{page.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="border-t border-line bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[28px] font-medium text-cocoa">Recipes and planning</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {KEYWORD_BLOGS.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blogs/${post.slug}`} className="font-bake-body text-[16px] text-cocoa underline decoration-rose-accent/40 underline-offset-4 hover:text-rose-accent">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  )
}
