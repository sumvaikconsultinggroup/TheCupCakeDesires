import connectDb from '@/lib/mongodb'
import { NOINDEX_SUBURBS, SUBURB_PAGES, suburbPageLastmod } from '@/lib/suburb-pages'
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

const STOREFRONT_COLLECTION_HANDLES = new Set(
  STOREFRONT_PAGE_DEFINITIONS.filter((page) => page.path.startsWith('/collections/')).map((page) =>
    page.path.slice('/collections/'.length)
  )
)

function isIndexableRobots(robots?: { index?: boolean } | null): boolean {
  return robots?.index !== false
}

const lm = (d?: Date | string | null) => (d ? { lastModified: d } : {})

function laterDate(...values: Array<Date | string | null | undefined>): string | undefined {
  const times = values
    .map((value) => {
      if (!value) return NaN
      if (value instanceof Date) return value.getTime()
      const parsed = Date.parse(String(value))
      return parsed
    })
    .filter((n) => Number.isFinite(n)) as number[]
  if (!times.length) return undefined
  return new Date(Math.max(...times)).toISOString().slice(0, 10)
}

function isProductionBuild() {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function staticSitemap(): MetadataRoute.Sitemap {
  return [
    ...STOREFRONT_PAGE_DEFINITIONS.map((page) => ({
      url: absoluteUrl(page.path),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      ...lm(page.lastModified),
    })),
    ...guidePages(),
    ...suburbPages(),
  ]
}

function guidePages(): MetadataRoute.Sitemap {
  return [
    ...MELBOURNE_PAGES.map((page) => ({
      url: absoluteUrl(melbournePath(page.slug)),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      ...lm(page.updatedAt),
    })),
    ...KEYWORD_BLOGS.map((post) => ({
      url: absoluteUrl(`/blogs/${post.slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...lm(post.updatedAt ?? post.publishedAt),
    })),
  ]
}

function suburbPages(): MetadataRoute.Sitemap {
  return SUBURB_PAGES.filter((s) => !NOINDEX_SUBURBS.has(s.slug)).map((s) => ({
    url: absoluteUrl(`/cupcake-delivery/${s.slug}`),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
    ...lm(suburbPageLastmod(s.slug)),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDb()
  } catch (error) {
    if (isProductionBuild()) {
      console.error('[sitemap] Database unavailable at build, serving static URLs only:', error)
      return staticSitemap()
    }
    throw error
  }

  const [pageSeoDocs, products, collections, blogPosts, combos] = await Promise.all([
    PageSEO.find({}).select('path robots.index updatedAt').lean() as Promise<
      Array<{ path?: string; robots?: { index?: boolean }; updatedAt?: Date }>
    >,
    Product.find({ isDeleted: false, published: true, status: 'active' })
      .select('handle updatedAt seo.robots.index')
      .lean() as Promise<any[]>,
    Collection.find({ isDeleted: false })
      .select('handle updatedAt seo.robots.index')
      .lean() as Promise<any[]>,
    BlogPost.find({
      status: 'published',
      $or: [{ publishedAt: { $lte: new Date() } }, { publishedAt: { $exists: false } }],
    })
      .select('slug updatedAt publishedAt seo.robots.index')
      .lean() as Promise<any[]>,
    ProductCombo.find({ isDeleted: false, status: 'active' })
      .select('handle updatedAt seo.robots.index')
      .lean() as Promise<any[]>,
  ])

  const pageSeoByPath = new Map(
    pageSeoDocs.filter((doc) => doc.path).map((doc) => [doc.path as string, doc])
  )
  const collectionByHandle = new Map(collections.map((collection: any) => [collection.handle, collection]))

  const noindexPaths = new Set(
    pageSeoDocs
      .filter((doc) => doc.path && !isIndexableRobots(doc.robots))
      .map((doc) => doc.path as string)
  )

  const staticPages: MetadataRoute.Sitemap = STOREFRONT_PAGE_DEFINITIONS.filter(
    (page) => !noindexPaths.has(page.path)
  ).map((page) => {
    const handle = page.path.startsWith('/collections/') ? page.path.slice('/collections/'.length) : ''
    const collection = handle ? collectionByHandle.get(handle) : undefined
    return {
      url: absoluteUrl(page.path),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      ...lm(laterDate(page.lastModified, pageSeoByPath.get(page.path)?.updatedAt, collection?.updatedAt)),
    }
  })

  const productPages: MetadataRoute.Sitemap = products
    .filter((product: any) => isIndexableRobots(product.seo?.robots))
    .filter((product: any) => product.handle !== 'make-your-own-cupcake-box')
    .filter((product: any) => !product.handle.startsWith('gift-voucher'))
    .map((product: any) => ({
      url: absoluteUrl(`/products/${product.handle}`),
      ...lm(product.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const collectionPages: MetadataRoute.Sitemap = collections
    .filter((collection: any) => isIndexableRobots(collection.seo?.robots))
    .filter((collection: any) => !noindexPaths.has(`/collections/${collection.handle}`))
    .filter((collection: any) => collection.handle !== 'flash-deals')
    .filter((collection: any) => !STOREFRONT_COLLECTION_HANDLES.has(collection.handle))
    .map((collection: any) => ({
      url: absoluteUrl(`/collections/${collection.handle}`),
      ...lm(collection.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const blogPages: MetadataRoute.Sitemap = blogPosts
    .filter((post: any) => isIndexableRobots(post.seo?.robots))
    .map((post: any) => ({
      url: absoluteUrl(`/blogs/${post.slug}`),
      ...lm(post.updatedAt || post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  const comboPages: MetadataRoute.Sitemap = combos
    .filter((combo: any) => isIndexableRobots(combo.seo?.robots))
    .map((combo: any) => ({
      url: absoluteUrl(`/combos/${combo.handle}`),
      ...lm(combo.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  const guideUrls = new Set(guidePages().map((page) => page.url))
  const blogsWithoutDuplicates = blogPages.filter((page) => !guideUrls.has(page.url))

  return [
    ...staticPages,
    ...productPages,
    ...collectionPages,
    ...blogsWithoutDuplicates,
    ...comboPages,
    ...suburbPages(),
    ...guidePages(),
  ]
}
