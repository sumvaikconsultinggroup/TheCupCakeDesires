import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import Collection from '@/models/collection.model'
import ProductCombo from '@/models/ProductCombo'
import BlogPost from '@/models/BlogPost'
import { NextRequest, NextResponse } from 'next/server'

interface ISEOItem {
  _id: any
  title: string
  handle?: string
  slug?: string
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


export async function GET(request: NextRequest) {
  try {
    await connectDb()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'product' // product, collection, combo, blog
    const query = searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let items: ISEOItem[] = []
    let total = 0

    const filter: any = {}
    
    // For blog posts, don't filter by isDeleted, use status instead
    if (type === 'blog') {
      filter.status = { $in: ['published', 'draft', 'scheduled'] }
    } else {
      filter.isDeleted = false
    }

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { handle: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } }
      ]
    }

    if (type === 'product') {
      [items, total] = await Promise.all([
        Product.find(filter).select('title handle seo').skip(skip).limit(limit).lean() as any,
        Product.countDocuments(filter)
      ])
    } else if (type === 'collection') {
      [items, total] = await Promise.all([
        Collection.find(filter).select('title handle seo').skip(skip).limit(limit).lean() as any,
        Collection.countDocuments(filter)
      ])
    } else if (type === 'combo') {
      [items, total] = await Promise.all([
        ProductCombo.find(filter).select('title handle seo').skip(skip).limit(limit).lean() as any,
        ProductCombo.countDocuments(filter)
      ])
    } else if (type === 'blog') {
      [items, total] = await Promise.all([
        BlogPost.find(filter).select('title slug seo status').skip(skip).limit(limit).lean() as any,
        BlogPost.countDocuments(filter)
      ])
    }

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error: any) {
    console.error('SEO API Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDb()
    const body = await request.json()
    const { type, id, robots, canonical } = body

    if (!type || !id || (!robots && canonical === undefined)) {
      return NextResponse.json({ success: false, message: 'Type, ID, and (Robots or Canonical) are required' }, { status: 400 })
    }

    let result
    const update: any = { $set: {} }
    
    if (robots) update.$set['seo.robots'] = robots
    
    if (canonical !== undefined) {
      // For blog posts, use canonicalUrl field
      if (type === 'blog') {
        update.$set['seo.canonicalUrl'] = canonical
      } else {
        update.$set['seo.canonical'] = canonical
      }
    }

    if (type === 'product') {
      result = await Product.findByIdAndUpdate(id, update, { new: true })
    } else if (type === 'collection') {
      result = await Collection.findByIdAndUpdate(id, update, { new: true })
    } else if (type === 'combo') {
      result = await ProductCombo.findByIdAndUpdate(id, update, { new: true })
    } else if (type === 'blog') {
      result = await BlogPost.findByIdAndUpdate(id, update, { new: true })
    }

    if (!result) {
      return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, item: result })
  } catch (error: any) {
    console.error('SEO API Patch Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
