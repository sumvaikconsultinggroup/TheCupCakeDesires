import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

type SeoEntityType = 'product' | 'collection' | 'blog'

interface ISEOItem {
  _id: unknown
  title: string
  handle?: string
  slug?: string
  status?: string
  seo?: {
    title?: string
    description?: string
    metaTitle?: string
    metaDescription?: string
    robots?: {
      index: boolean
      follow: boolean
      noarchive?: boolean
      nosnippet?: boolean
      noimageindex?: boolean
    }
    canonical?: string
    canonicalUrl?: string
  }
}

const VALID_TYPES: SeoEntityType[] = ['product', 'collection', 'blog']

async function assertSeoAccess() {
  const user = await getCurrentUser()
  if (!user) return { ok: false as const, status: 401, message: 'Unauthorized' }
  if (user.role !== 'owner' && !user.permissions?.includes('/admin/seo')) {
    return { ok: false as const, status: 403, message: "You don't have access to SEO settings." }
  }
  return { ok: true as const }
}

export async function GET(request: NextRequest) {
  try {
    const access = await assertSeoAccess()
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status })
    }

    await connectDb()
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') || 'product') as SeoEntityType
    const query = searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid SEO type' }, { status: 400 })
    }

    let items: ISEOItem[] = []
    let total = 0

    const filter: Record<string, unknown> = {}

    if (type === 'blog') {
      filter.status = { $in: ['published', 'draft', 'scheduled'] }
    } else {
      filter.isDeleted = false
    }

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { handle: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } },
      ]
    }

    if (type === 'product') {
      const [productItems, productTotal] = await Promise.all([
        Product.find(filter).select('title handle seo').sort({ title: 1 }).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ])
      items = productItems as unknown as ISEOItem[]
      total = productTotal
    } else if (type === 'collection') {
      const [collectionItems, collectionTotal] = await Promise.all([
        Collection.find(filter)
          .select('title handle seo published')
          .sort({ title: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Collection.countDocuments(filter),
      ])
      items = collectionItems as unknown as ISEOItem[]
      total = collectionTotal
    } else {
      const [blogItems, blogTotal] = await Promise.all([
        BlogPost.find(filter)
          .select('title slug seo status')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        BlogPost.countDocuments(filter),
      ])
      items = blogItems as unknown as ISEOItem[]
      total = blogTotal
    }

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        _id: String(item._id),
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch SEO items'
    console.error('SEO API Error:', error)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await assertSeoAccess()
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status })
    }

    await connectDb()
    const body = await request.json()
    const {
      type,
      id,
      robots,
      canonical,
      title,
      description,
      metaTitle,
      metaDescription,
    } = body as {
      type?: SeoEntityType
      id?: string
      robots?: ISEOItem['seo'] extends { robots?: infer R } ? R : never
      canonical?: string
      title?: string
      description?: string
      metaTitle?: string
      metaDescription?: string
    }

    if (!type || !id || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ success: false, message: 'Valid type and id are required' }, { status: 400 })
    }

    const hasUpdate =
      robots !== undefined ||
      canonical !== undefined ||
      title !== undefined ||
      description !== undefined ||
      metaTitle !== undefined ||
      metaDescription !== undefined

    if (!hasUpdate) {
      return NextResponse.json({ success: false, message: 'No SEO fields to update' }, { status: 400 })
    }

    const update: { $set: Record<string, unknown> } = { $set: {} }

    if (robots) update.$set['seo.robots'] = robots

    if (type === 'blog') {
      if (metaTitle !== undefined) update.$set['seo.metaTitle'] = metaTitle
      if (metaDescription !== undefined) update.$set['seo.metaDescription'] = metaDescription
      if (canonical !== undefined) update.$set['seo.canonicalUrl'] = canonical
    } else {
      if (title !== undefined) update.$set['seo.title'] = title
      if (description !== undefined) update.$set['seo.description'] = description
      if (canonical !== undefined) update.$set['seo.canonical'] = canonical
    }

    let result
    if (type === 'product') {
      result = await Product.findByIdAndUpdate(id, update, { new: true })
    } else if (type === 'collection') {
      result = await Collection.findByIdAndUpdate(id, update, { new: true })
    } else {
      result = await BlogPost.findByIdAndUpdate(id, update, { new: true })
    }

    if (!result) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, item: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update SEO'
    console.error('SEO API Patch Error:', error)
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
