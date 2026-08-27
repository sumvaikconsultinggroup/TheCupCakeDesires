import JsonLd from '@/components/SE0/JsonLd'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { STOREFRONT_PAGE_DEFINITIONS } from '@/lib/storefront-pages'
import BlogPost from '@/models/BlogPost'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Site Map | The Cupcake Desire',
  description:
    'Browse every public page on The Cupcake Desire — collections, products, blogs, and bakery info.',
  robots: { index: true, follow: true },
  alternates: { canonical: `${siteConfig.url}/site-map` },
}

type LinkItem = { href: string; label: string }

async function getSiteMapGroups(): Promise<{ title: string; links: LinkItem[] }[]> {
  const pages: LinkItem[] = STOREFRONT_PAGE_DEFINITIONS.filter((p) => p.path !== '/site-map').map(
    (p) => ({ href: p.path, label: p.pageName })
  )

  let collections: LinkItem[] = []
  let products: LinkItem[] = []
  let blogs: LinkItem[] = []

  try {
    await connectDb()
    const [collectionDocs, productDocs, blogDocs] = await Promise.all([
      Collection.find({ isDeleted: false }).select('handle title name').lean(),
      Product.find({ isDeleted: false, published: true, status: 'active' })
        .select('handle title name')
        .sort({ title: 1 })
        .limit(500)
        .lean(),
      BlogPost.find({
        status: 'published',
        $or: [{ publishedAt: { $lte: new Date() } }, { publishedAt: { $exists: false } }],
      })
        .select('slug title')
        .sort({ publishedAt: -1 })
        .lean(),
    ])

    collections = collectionDocs.map((c: any) => ({
      href: `/collections/${c.handle}`,
      label: c.title || c.name || c.handle,
    }))
    products = productDocs.map((p: any) => ({
      href: `/products/${p.handle}`,
      label: p.title || p.name || p.handle,
    }))
    blogs = blogDocs.map((b: any) => ({
      href: `/blogs/${b.slug}`,
      label: b.title || b.slug,
    }))
  } catch {
    /* DB unavailable — still list static pages */
  }

  return [
    { title: 'Main pages', links: pages },
    { title: 'Collections', links: collections },
    { title: 'Products', links: products },
    { title: 'Stories', links: blogs },
  ].filter((g) => g.links.length > 0)
}

export default async function SiteMapPage() {
  const groups = await getSiteMapGroups()
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Site Map', url: `${siteConfig.url}/site-map` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <main className="font-bake-body bg-cream text-cocoa">
        <div className="mx-auto max-w-[960px] px-6 py-16 md:px-10 md:py-20">
          <p className="bake-eyebrow text-taupe">Index</p>
          <h1 className="font-bake-display mt-3 text-[36px] font-medium leading-tight md:text-[44px]">
            Site map
          </h1>
          <p className="bake-body-sm mt-4 max-w-2xl text-cocoa-soft">
            Every public page on The Cupcake Desire, listed for easy browsing and search engines.
            XML sitemap:{' '}
            <a href="/sitemap.xml" className="text-rose-accent underline underline-offset-4">
              /sitemap.xml
            </a>
          </p>

          <div className="mt-12 space-y-12">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className="font-bake-display text-[22px] font-medium text-cocoa">
                  {group.title}
                </h2>
                <ul className="mt-4 columns-1 gap-x-10 sm:columns-2">
                  {group.links.map((link) => (
                    <li key={link.href} className="mb-2 break-inside-avoid">
                      <Link
                        href={link.href}
                        className="bake-body-sm text-cocoa-soft transition-colors hover:text-rose-accent"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
