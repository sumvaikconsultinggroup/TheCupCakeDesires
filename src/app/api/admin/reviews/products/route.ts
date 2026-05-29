import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'

// GET - Search products for review creation
export async function GET(request: NextRequest) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const query: any = { isDeleted: { $ne: true } }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } }
      ]
    }
    
    const products = await Product.find(query, {
      _id: 1, handle: 1, title: 1, images: 1, variants: 1
    })
      .limit(limit)
      .lean()
    
    const serialized = products.map((p: any) => {
      const firstVariant = p.variants?.[0]
      return {
        _id: p._id.toString(),
        handle: p.handle,
        title: p.title,
        image: typeof p.images?.[0] === 'object' ? p.images[0]?.src : (p.images?.[0] || ''),
        price: firstVariant?.price || p.price || 0
      }
    })
    
    return NextResponse.json({ success: true, data: serialized })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
