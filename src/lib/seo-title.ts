const BRAND = 'The Cupcake Desire'

/** Append the brand to a page title unless it already mentions it. */
export function withBrand(title: string) {
  return /cupcake desire/i.test(title) ? title : `${title} | ${BRAND}`
}

/**
 * Product names like "Mocha" or "Thank U" say nothing to a searcher, so the
 * <title> gets the product type spelled out ("Mocha Cupcakes (Box of 3)").
 */
export function descriptiveProductTitle(title: string, handle: string, category?: string) {
  if (/slice/i.test(title) && !/cake/i.test(title)) return title.replace(/slice/i, 'Cake Slice')
  if (/cupcake|cake|macaron|voucher|slice|brownie|cookie/i.test(title)) return title
  const box = handle.match(/-(\d+)-cupcakes$/)
  if (box) return `${title} Cupcakes (Box of ${box[1]})`
  if (/box-of-\d+|-box/.test(handle) || /box/i.test(title)) return `${title} Cupcakes`
  if (/slice/.test(handle)) return `${title} Cake Slices`
  return category && !/^(products?|other)$/i.test(category) ? `${title} – ${category}` : `${title} Cupcakes`
}
