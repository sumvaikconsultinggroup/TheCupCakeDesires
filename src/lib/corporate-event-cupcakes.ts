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

/** Standard cupcake count → box price (AUD). */
export const CORPORATE_EVENT_SIZE_TIERS = [
  { qty: 12, label: '12', option1Value: 'Box of 12', price: 66 },
  { qty: 30, label: '30', option1Value: 'Box of 30', price: 150 },
  { qty: 50, label: '50', option1Value: 'Box of 50', price: 240 },
  { qty: 100, label: '100', option1Value: 'Box of 100', price: 450 },
  { qty: 200, label: '200', option1Value: 'Box of 200', price: 840 },
  { qty: 300, label: '300', option1Value: 'Box of 300', price: 1200 },
  { qty: 500, label: '500', option1Value: 'Box of 500', price: 1750 },
] as const

/**
 * Mini corporate-event cupcakes — priced per mini count (not cake-slice logo tiers).
 * option1Value stays distinct from Standard "Box of N" so both matrices can coexist.
 */
export const CORPORATE_EVENT_MINI_SIZE_TIERS = [
  { qty: 24, label: '24 minis', option1Value: '24 minis', price: 84 },
  { qty: 100, label: '100 minis', option1Value: '100 minis', price: 330 },
  { qty: 300, label: '300 minis', option1Value: '300 minis', price: 900 },
  { qty: 500, label: '500 minis', option1Value: '500 minis', price: 1400 },
] as const

export type CorporateEventSizeMode = 'standard' | 'mini'

export function getCorporateEventSizeTiers(mode: CorporateEventSizeMode) {
  return mode === 'mini' ? CORPORATE_EVENT_MINI_SIZE_TIERS : CORPORATE_EVENT_SIZE_TIERS
}

export const CORPORATE_EVENT_FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both'] as const

export const CORPORATE_EVENT_OPTIONS = [
  {
    name: 'Size',
    values: [
      ...CORPORATE_EVENT_SIZE_TIERS.map((t) => t.option1Value),
      ...CORPORATE_EVENT_MINI_SIZE_TIERS.map((t) => t.option1Value),
    ],
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

export const CORPORATE_EVENT_MINI_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Corporate event mini cupcakes — more than 500')

export function isCorporateEventHandle(handle?: string | null): boolean {
  if (!handle) return false
  return (CORPORATE_EVENT_HANDLES as readonly string[]).includes(handle.trim().toLowerCase())
}

export function isCorporateEventProduct(product: {
  handle?: string | null
  tags?: string[] | null
  options?: { name?: string; values?: string[] }[] | null
}): boolean {
  // Strict allow-list only — never infer from option names (that overrode dress/
  // giant/round cake prices with corporate Box of 12 = $66).
  if (isCorporateEventHandle(product.handle)) return true
  const tags = (product.tags || []).map((t) => String(t).toLowerCase())
  return tags.includes('corporate-event')
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

/** Build the full Size × Flavour variant matrix (standard + mini tiers). */
export function buildCorporateEventVariants(handle: string): CorporateEventVariantSeed[] {
  const slug = handle.replace(/^box-of-12-/, '').replace(/-cupcakes$/, '')
  const variants: CorporateEventVariantSeed[] = []
  const allTiers = [...CORPORATE_EVENT_SIZE_TIERS, ...CORPORATE_EVENT_MINI_SIZE_TIERS]
  for (const tier of allTiers) {
    const isMini = isCorporateEventMiniSize(tier.option1Value)
    for (const flavour of CORPORATE_EVENT_FLAVOURS) {
      const flavourKey = flavour
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 18)
      const skuPrefix = isMini ? `${slug}-mini` : slug
      variants.push({
        option1Value: tier.option1Value,
        option2Value: flavour,
        price: tier.price,
        inventoryQty: 200,
        inventoryPolicy: 'continue',
        sku: `${skuPrefix}-${tier.qty}-${flavourKey}`.toUpperCase().slice(0, 40),
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

export function isCorporateEventMiniSize(option1Value?: string | null): boolean {
  if (!option1Value) return false
  if (option1Value.startsWith('Mini ')) return true
  return CORPORATE_EVENT_MINI_SIZE_TIERS.some((t) => t.option1Value === option1Value)
}

/** Cart/checkout display — keep mini labels readable (e.g. "24 minis"). */
export function formatCorporateEventSizeOption(option1Value: string): string {
  if (option1Value.startsWith('Mini ')) {
    return `${option1Value.replace(/^Mini /, '')} (mini)`
  }
  return option1Value
}

export function formatCorporateEventVariantSummary(
  option1Value?: string | null,
  option2Value?: string | null
): string {
  const parts: string[] = []
  if (option1Value) parts.push(formatCorporateEventSizeOption(option1Value))
  if (option2Value) parts.push(option2Value)
  return parts.join(' · ')
}
