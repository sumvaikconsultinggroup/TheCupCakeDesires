import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'

export const dynamic = 'force-dynamic'

/** Everything the navigation editor can link to, with enough detail to preview and warn. */
export async function GET() {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()
    const [collections, products] = await Promise.all([
      Collection.find({ isDeleted: { $ne: true } })
        .select('handle title description image thumbnailImage published productHandles')
        .sort({ title: 1 })
        .lean(),
      Product.find({ isDeleted: { $ne: true } })
        .select('handle title images variants.image published status productCategory')
        .sort({ title: 1 })
        .lean(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        collections: (collections as any[]).map((c) => ({
          handle: c.handle,
          title: c.title,
          description: c.description || '',
          image: c.image || c.thumbnailImage || '',
          visible: c.published !== false,
          productCount: c.productHandles?.length || 0,
        })),
        products: (products as any[]).map((p) => ({
          handle: p.handle,
          title: p.title,
          description: p.productCategory || '',
          image: p.images?.find((i: any) => i?.src)?.src || p.variants?.find((v: any) => v?.image)?.image || '',
          visible: p.published === true && p.status === 'active',
          category: p.productCategory || '',
        })),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
