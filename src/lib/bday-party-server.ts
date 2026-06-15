import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'

export interface BdayPartyCakeProduct {
  _id: string
  handle: string
  title: string
  images?: { src: string; altText?: string }[]
  variants?: { price: number; compareAtPrice?: number; inventoryQty?: number }[]
  bodyHtml?: string
  productCategory?: string
  tags?: string[]
  isEggless?: boolean
  isVegan?: boolean
}

const storefrontFilter = {
  isDeleted: false,
  published: true,
  status: 'active' as const,
}

export async function loadBdayPartyCakes(): Promise<BdayPartyCakeProduct[]> {
  await connectDb()

  const collection = await Collection.findOne({
    handle: 'cakes',
    isDeleted: { $ne: true },
    published: true,
  })
    .select('productHandles')
    .lean()

  const handles = (collection as { productHandles?: string[] } | null)?.productHandles || []

  const filter: Record<string, unknown> = { ...storefrontFilter }
  if (handles.length > 0) {
    filter.handle = { $in: handles }
  } else {
    filter.$or = [
      { productCategory: { $regex: /^cakes?$/i } },
      { productCategory: { $regex: /^custom cakes?$/i } },
    ]
  }

  const products = (await Product.find(filter)
    .select('handle title images variants bodyHtml productCategory tags isEggless isVegan')
    .lean()) as unknown as BdayPartyCakeProduct[]

  if (handles.length > 0) {
    const order = new Map(handles.map((handle, index) => [handle, index]))
    products.sort((a, b) => (order.get(a.handle) ?? 99) - (order.get(b.handle) ?? 99))
  } else {
    products.sort((a, b) => a.title.localeCompare(b.title))
  }

  return JSON.parse(JSON.stringify(products))
}
