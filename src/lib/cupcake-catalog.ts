import Collection from '@/models/collection.model'

/** Dedicated catalogue of every cupcake product — not all-items, cakes, or macarons. */
export const ALL_CUPCAKES_HANDLE = 'all-cupcakes'
export const ALL_CUPCAKES_HREF = `/collections/${ALL_CUPCAKES_HANDLE}`

const NOT_CUPCAKE_CATALOG =
  /giant[\s-]?cupcake|dress[\s-]?cake|round cake|macaron|cake slice|gift voucher|logo cake/i

export function isCupcakeCatalogProduct(p: {
  title?: string
  handle?: string
  productCategory?: string
  type?: string
  tags?: string[]
}): boolean {
  const hay = [p.title, p.handle, p.productCategory, p.type, ...(p.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (NOT_CUPCAKE_CATALOG.test(hay)) return false
  return hay.includes('cupcake')
}

/** Mongo filter: products in any *cupcake* collection, or named/categorised as cupcakes. */
export async function cupcakeCatalogProductFilter(): Promise<Record<string, unknown>> {
  const cols = (await Collection.find({
    isDeleted: { $ne: true },
    published: true,
    handle: { $regex: /cupcake/i, $not: /giant/i },
  })
    .select('productHandles')
    .lean()) as unknown as { productHandles?: string[] }[]

  const handles = [...new Set(cols.flatMap((c) => c.productHandles || []).filter(Boolean))]

  const include: Record<string, unknown>[] = [
    { title: { $regex: /cupcake/i } },
    { handle: { $regex: /cupcake/i } },
    { productCategory: { $regex: /cupcake/i } },
    { type: { $regex: /cupcake/i } },
  ]
  if (handles.length > 0) include.push({ handle: { $in: handles } })

  return {
    $and: [
      { $or: include },
      { title: { $not: NOT_CUPCAKE_CATALOG } },
      { handle: { $not: /giant-cupcake|dress-cake|round-cake|macaron|gift-voucher/i } },
    ],
  }
}
