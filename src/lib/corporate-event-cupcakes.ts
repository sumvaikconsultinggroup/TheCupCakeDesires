/**
 * Corporate Event themed cupcake boxes — shared Size (qty tiers) + Flavour matrix.
 * Used by storefront pills, admin helpers, and DB seed/migration scripts.
 */

export const CORPORATE_EVENT_HANDLES = [
  'box-of-12-womens-day-cupcakes',
  'box-of-12-ruok-day-cupcakes',
  'box-of-12-pink-ribbon-day-cupcakes',
  'box-of-12-anzac-day-cupcakes',
  'box-of-12-pride-day-cupcakes',
] as const

export type CorporateEventHandle = (typeof CORPORATE_EVENT_HANDLES)[number]

/** Cupcake count → box price (AUD). */
export const CORPORATE_EVENT_SIZE_TIERS = [
  { qty: 12, label: '12', option1Value: 'Box of 12', price: 66 },
  { qty: 30, label: '30', option1Value: 'Box of 30', price: 150 },
  { qty: 50, label: '50', option1Value: 'Box of 50', price: 240 },
  { qty: 100, label: '100', option1Value: 'Box of 100', price: 450 },
  { qty: 200, label: '200', option1Value: 'Box of 200', price: 840 },
  { qty: 300, label: '300', option1Value: 'Box of 300', price: 1200 },
  { qty: 500, label: '500', option1Value: 'Box of 500', price: 1750 },
] as const

export const CORPORATE_EVENT_FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both'] as const

export const CORPORATE_EVENT_OPTIONS = [
  {
    name: 'Size',
    values: CORPORATE_EVENT_SIZE_TIERS.map((t) => t.option1Value),
  },
  {
    name: 'Flavour',
    values: [...CORPORATE_EVENT_FLAVOURS],
  },
] as const

/** Contact enquiry for orders larger than the largest buyable tier. */
export const CORPORATE_EVENT_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Corporate event cupcakes — more than 500')

export function isCorporateEventHandle(handle?: string | null): boolean {
  if (!handle) return false
  return (CORPORATE_EVENT_HANDLES as readonly string[]).includes(handle.trim().toLowerCase())
}

export function isCorporateEventProduct(product: {
  handle?: string | null
  tags?: string[] | null
  options?: { name?: string; values?: string[] }[] | null
}): boolean {
  if (isCorporateEventHandle(product.handle)) return true
  const tags = (product.tags || []).map((t) => String(t).toLowerCase())
  if (tags.includes('corporate-event')) return true
  // Detect Size + Flavour option shape used by these SKUs
  const optNames = (product.options || []).map((o) => (o.name || '').toLowerCase())
  return optNames.includes('size') && optNames.includes('flavour')
}

export type CorporateEventVariantSeed = {
  option1Value: string
  option2Value: string
  price: number
  inventoryQty: number
  inventoryPolicy: 'deny' | 'continue'
  sku: string
  requiresShipping: boolean
  taxable: boolean
}

/** Build the full Size × Flavour variant matrix for a product handle. */
export function buildCorporateEventVariants(handle: string): CorporateEventVariantSeed[] {
  const slug = handle.replace(/^box-of-12-/, '').replace(/-cupcakes$/, '')
  const variants: CorporateEventVariantSeed[] = []
  for (const tier of CORPORATE_EVENT_SIZE_TIERS) {
    for (const flavour of CORPORATE_EVENT_FLAVOURS) {
      const flavourKey = flavour
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 18)
      variants.push({
        option1Value: tier.option1Value,
        option2Value: flavour,
        price: tier.price,
        inventoryQty: 200,
        inventoryPolicy: 'continue',
        sku: `${slug}-${tier.qty}-${flavourKey}`.toUpperCase().slice(0, 40),
        requiresShipping: true,
        taxable: true,
      })
    }
  }
  return variants
}

export function findCorporateEventVariantIndex(
  variants: { option1Value?: string; option2Value?: string }[],
  size: string,
  flavour: string
): number {
  return variants.findIndex(
    (v) => v.option1Value === size && (v.option2Value || '') === flavour
  )
}
