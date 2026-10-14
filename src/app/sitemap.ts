import connectDb from '@/lib/mongodb'
import { KEYWORD_BLOGS } from '@/data/keyword-blogs'
import { MELBOURNE_PAGES, melbournePath } from '@/data/melbourne-pages'
import { STOREFRONT_PAGE_DEFINITIONS } from '@/lib/storefront-pages'
import { absoluteUrl } from '@/lib/site-url'
import BlogPost from '@/models/BlogPost'
import Collection from '@/models/collection.model'
import PageSEO from '@/models/PageSEO'
import Product from '@/models/product.model'
import ProductCombo from '@/models/ProductCombo'
import { MetadataRoute } from 'next'

export const revalidate = 3600

// Stable lastModified for static pages (evaluated once per deploy, not per request)
const STATIC_PAGE_LASTMOD = new Date()

function isIndexableRobots(robots?: { index?: boolean } | null): boolean {
  return robots?.index !== false
}

function guidePages(): MetadataRoute.Sitemap {
  const guides: MetadataRoute.Sitemap = [
    ...MELBOURNE_PAGES.map((page) => ({
      url: absoluteUrl(melbournePath(page.slug)),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...KEYWORD_BLOGS.map((post) => ({
      url: absoluteUrl(`/blogs/${post.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
  return guides
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDb()
  } catch (error) {
    console.error('[sitemap] Database unavailable, serving static URLs only:', error)
    return [
      ...STOREFRONT_PAGE_DEFINITIONS.map((page) => ({
        url: absoluteUrl(page.path),
        lastModified: STATIC_PAGE_LASTMOD,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })),
      ...guidePages(),
    ]
  }

  const pageSeoDocs = (await PageSEO.find({}).select('path robots.index').lean()) as Array<{
    path?: string
    robots?: { index?: boolean }
  }>

  const noindexPaths = new Set(
    pageSeoDocs
      .filter((doc) => doc.path && !isIndexableRobots(doc.robots))
      .map((doc) => doc.path as string)
  )

  const staticPages: MetadataRoute.Sitemap = STOREFRONT_PAGE_DEFINITIONS.filter(
    (page) => !noindexPaths.has(page.path)
  ).map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: STATIC_PAGE_LASTMOD,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const [products, collections, blogPosts, combos] = await Promise.all([
    Product.find({ isDeleted: false, published: true, status: 'active' })
      .select('handle updatedAt seo.robots.index')
      .lean(),
    Collection.find({ isDeleted: false })
      .select('handle updatedAt seo.robots.index')
      .lean(),
    BlogPost.find({
      status: 'published',
      $or: [{ publishedAt: { $lte: new Date() } }, { publishedAt: { $exists: false } }],
    })
      .select('slug updatedAt publishedAt seo.robots.index')
      .lean(),
    ProductCombo.find({ isDeleted: false, status: 'active' })
      .select('handle updatedAt seo.robots.index')
      .lean(),
  ])

  const productPages: MetadataRoute.Sitemap = products
    .filter((product: any) => isIndexableRobots(product.seo?.robots))
    // Redirects to /cupcake-builder (next.config.mjs), so it is not a landing page.
    .filter((product: any) => product.handle !== 'make-your-own-cupcake-box')
    // Canonicalised to /gift-voucher (see products/[handle]/page.tsx).
    .filter((product: any) => !product.handle.startsWith('gift-voucher'))
    .map((product: any) => ({
      url: absoluteUrl(`/products/${product.handle}`),
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const collectionPages: MetadataRoute.Sitemap = collections
    .filter((collection: any) => isIndexableRobots(collection.seo?.robots))
    .filter((collection: any) => !noindexPaths.has(`/collections/${collection.handle}`))
    .filter(
      (collection: any) =>
        !STOREFRONT_PAGE_DEFINITIONS.some((page) => page.path === `/collections/${collection.handle}`)
    )
    .map((collection: any) => ({
      url: absoluteUrl(`/collections/${collection.handle}`),
      lastModified: collection.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter((post: any) => isIndexableRobots(post.seo?.robots))
    .map((post: any) => ({
      url: absoluteUrl(`/blogs/${post.slug}`),
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  const comboPages: MetadataRoute.Sitemap = combos
    .filter((combo: any) => isIndexableRobots(combo.seo?.robots))
    .map((combo: any) => ({
      url: absoluteUrl(`/combos/${combo.handle}`),
      lastModified: combo.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  // Suburb pages are excluded from sitemap (noindex, doorway risk).
  // The hub /cupcake-delivery is in STOREFRONT_PAGE_DEFINITIONS and remains indexable.
  // Suburb pages can be re-added individually via INDEXABLE_SUBURBS in [suburb]/page.tsx
  // once they have genuinely unique local content.

  // Deduplicate blogs that also appear in guidePages() (KEYWORD_BLOGS)
  const guideUrls = new Set(guidePages().map((page) => page.url))
  const blogsWithoutDuplicates = blogPages.filter((page) => !guideUrls.has(page.url))

  return [
    ...staticPages,
    ...productPages,
    ...collectionPages,
    ...blogsWithoutDuplicates,
    ...comboPages,
    ...guidePages(),
  ]
}
