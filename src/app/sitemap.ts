import connectDb from '@/lib/mongodb'
import { STOREFRONT_PAGE_DEFINITIONS } from '@/lib/storefront-pages'
import { absoluteUrl } from '@/lib/site-url'
import BlogPost from '@/models/BlogPost'
import Collection from '@/models/collection.model'
import PageSEO from '@/models/PageSEO'
import Product from '@/models/product.model'
import ProductCombo from '@/models/ProductCombo'
import { MetadataRoute } from 'next'

export const revalidate = 3600

function isIndexableRobots(robots?: { index?: boolean } | null): boolean {
  return robots?.index !== false
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDb()
  } catch (error) {
    console.error('[sitemap] Database unavailable, serving static URLs only:', error)
    return STOREFRONT_PAGE_DEFINITIONS.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
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
    lastModified: new Date(),
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

  return [...staticPages, ...productPages, ...collectionPages, ...blogPages, ...comboPages]
}
