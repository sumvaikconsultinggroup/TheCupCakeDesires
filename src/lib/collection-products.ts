import { cupcakeCatalogProductFilter } from '@/lib/cupcake-catalog'
import { withGiantCupcakeInsideImages } from '@/lib/giant-cupcake-images'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'

/** Fields the collection grid (CakeProductCard + filters/sort) actually reads. */
const CARD_FIELDS = '_id handle title images variants reviews productCategory tags minOrderQty'

/**
 * Server-side twin of the fetch in CollectionPageClient, so collection pages
 * ship their product grid in the initial HTML for search and AI crawlers
 * instead of "Loading…". Mirrors /api/products and /api/products/by-handles:
 * active + published + not deleted, in stock only, approved reviews only.
 */
export async function loadCollectionGrid(handle: string) {
  const base = { isDeleted: false, published: true, status: 'active' }
  let collection: any = null
  let filter: Record<string, any>

  if (handle === 'all-items') {
    filter = base
  } else if (handle === 'all-cupcakes') {
    filter = { ...base, ...(await cupcakeCatalogProductFilter()) }
  } else {
    collection = await Collection.findOne({ handle, isDeleted: { $ne: true }, published: true }).lean()
    const handles: string[] = collection?.productHandles || []
    if (!collection || handles.length === 0) {
      return { collection: collection ? serialize(collection) : null, products: [] }
    }
    filter = { ...base, handle: { $in: handles } }
  }

  const docs = (await Product.find(filter).select(CARD_FIELDS).lean()) as any[]
  const inStock = docs
    .filter((p) => p.variants?.some((v: any) => (v.inventoryQty || 0) > 0))
    .map((p) => ({ ...p, reviews: (p.reviews || []).filter((r: any) => r.isApproved) }))

  return {
    collection: collection ? serialize(collection) : null,
    products: serialize(withGiantCupcakeInsideImages(inStock, { force: handle === 'giant-cupcakes' })),
  }
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
