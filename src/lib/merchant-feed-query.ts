/**
 * Shared Product.find shape for the Google Merchant feed.
 * Tests and the verify script must use this path, not the public products API mapping.
 */

import { withGiantCupcakeInsideImage } from '@/lib/giant-cupcake-images'
import type { MerchantProductInput } from '@/lib/merchant-catalog'
import { enrichProductSeo } from '@/lib/product-copy'

export const MERCHANT_FEED_PRODUCT_FILTER = {
  isDeleted: { $ne: true },
  published: true,
  status: 'active',
} as const

/** Fields the feed route selects from Mongo. `_id` is included by default. */
export const MERCHANT_FEED_PRODUCT_SELECT =
  'handle title bodyHtml vendor productCategory type tags options variants images seo giftCard minOrderQty'

const SELECTED_FIELDS = MERCHANT_FEED_PRODUCT_SELECT.split(/\s+/).filter(Boolean)

/** Keep only the columns the route .select() would return (plus `_id`). */
export function pickMerchantFeedFields(doc: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!doc) return out
  if (doc._id !== undefined) out._id = doc._id
  for (const field of SELECTED_FIELDS) {
    if (doc[field] !== undefined) out[field] = doc[field]
  }
  return out
}

/**
 * Map lean Mongo docs to feed products.
 * Enriches copy and images, but keeps the raw DB `productCategory` for lead time.
 */
export function mapMerchantFeedDocs(docs: Array<Record<string, any>> | null | undefined): MerchantProductInput[] {
  return (docs || []).map((doc) => {
    const selected = pickMerchantFeedFields(doc)
    const enriched = enrichProductSeo(selected as any)
    return withGiantCupcakeInsideImage({
      ...selected,
      ...enriched,
      productCategory: typeof doc.productCategory === 'string' ? doc.productCategory : selected.productCategory,
      images: enriched.images,
      bodyHtml: enriched.bodyHtml,
    }) as MerchantProductInput
  })
}
