/**
 * Shared storefront DB reads. Errors throw so ISR keeps the last good copy
 * instead of caching a title-only head or a 404.
 */
import { cache } from 'react'
import connectDb from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import Product from '@/models/product.model'
import ProductCombo from '@/models/ProductCombo'

export async function loadProductByHandle(handle: string) {
  await connectDb()
  return Product.findOne({ handle, isDeleted: { $ne: true } }).lean()
}

export const getProductByHandle = cache(loadProductByHandle)

export async function loadComboByHandle(handle: string) {
  await connectDb()
  return ProductCombo.findOne({ handle, isDeleted: false, status: 'active' }).lean()
}

export const getComboByHandle = cache(loadComboByHandle)

export async function loadComboPageByHandle(handle: string) {
  await connectDb()
  return ProductCombo.findOne({ handle, isDeleted: false, status: 'active' })
    .populate({
      path: 'items.productId',
      select: 'title handle images variants bodyHtml reviews ingredients howToUse faq',
      populate: {
        path: 'reviews',
        match: { isApproved: true },
      },
    })
    .lean()
}

export const getComboPageByHandle = cache(loadComboPageByHandle)

export async function loadPublishedBlogBySlug(slug: string) {
  await connectDb()
  return BlogPost.findOne({ slug, status: 'published' }).lean()
}

export const getPublishedBlogBySlug = cache(loadPublishedBlogBySlug)

export async function loadBlogPostPage(slug: string) {
  await connectDb()
  const post = (await BlogPost.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { viewCount: 1 } },
    { new: true, timestamps: false }
  ).lean()) as any

  if (!post) return null

  const relatedPosts = await BlogPost.find({
    _id: { $ne: post._id },
    status: 'published',
    $or: [{ category: post.category }, { tags: { $in: post.tags || [] } }],
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select('title slug excerpt featuredImage readingTime publishedAt author')
    .lean()

  return {
    post: JSON.parse(JSON.stringify({ ...post, _id: post._id.toString() })),
    related: JSON.parse(
      JSON.stringify(relatedPosts.map((r: any) => ({ ...r, _id: r._id.toString() })))
    ),
  }
}

export const getBlogPostPage = cache(loadBlogPostPage)

export async function loadCupcakeBuilderProduct() {
  await connectDb()
  return Product.findOne({
    handle: 'make-your-own-cupcake-box',
    isDeleted: { $ne: true },
    published: true,
    status: 'active',
  }).lean()
}

export const getCupcakeBuilderProduct = cache(loadCupcakeBuilderProduct)
