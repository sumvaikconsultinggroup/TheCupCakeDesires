import connectDb from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import ProductCombo from '@/models/ProductCombo'
import { MetadataRoute } from 'next'

const SITE_URL = 'https://cupcakedesires.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDb()

  // Fetch all published products
  const products = await Product.find({ isDeleted: false, published: true, status: 'active' })
    .select('handle updatedAt')
    .lean()

  // Fetch all active collections
  const collections = await Collection.find({ isDeleted: false })
    .select('handle updatedAt')
    .lean()

  // Fetch all published blog posts
  const blogPosts = await BlogPost.find({ status: 'published' })
    .select('slug updatedAt publishedAt')
    .lean()

  // Fetch all active combos
  const combos = await ProductCombo.find({ isDeleted: false, status: 'active' })
    .select('handle updatedAt')
    .lean()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/deals`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/cupcake-builder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/allergen-info`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/branded-cupcakes-melbourne`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/nut-free-cakes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/vegan-cakes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/gluten-free-cupcakes`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/corporate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${SITE_URL}/products/${product.handle}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Collection pages
  const collectionPages: MetadataRoute.Sitemap = collections.map((collection: any) => ({
    url: `${SITE_URL}/collections/${collection.handle}`,
    lastModified: collection.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post: any) => ({
    url: `${SITE_URL}/blogs/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Combo pages
  const comboPages: MetadataRoute.Sitemap = combos.map((combo: any) => ({
    url: `${SITE_URL}/combos/${combo.handle}`,
    lastModified: combo.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...collectionPages, ...blogPages, ...comboPages]
}
