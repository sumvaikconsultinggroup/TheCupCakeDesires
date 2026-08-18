/**
 * Shared corporate page configs — standard, mini, and cake slices.
 * Products are seeded by scripts/wire-corporate-page-products.mjs
 */

export const CORPORATE_FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both'] as const
export type CorporateFlavour = (typeof CORPORATE_FLAVOURS)[number]

/** Standard corporate uses the shared cupcake flavours (incl. Mix of Both). */
export const STANDARD_CORPORATE_FLAVOURS = CORPORATE_FLAVOURS
export type StandardCorporateFlavour = CorporateFlavour

/** Mini corporate uses the same Vanilla / Chocolate / Mix of Both set. */
export const MINI_CORPORATE_FLAVOURS = CORPORATE_FLAVOURS
export type MiniCorporateFlavour = CorporateFlavour

export const STANDARD_CORPORATE_HANDLE = 'corporate-cupcakes'
export const MINI_CORPORATE_HANDLE = 'mini-corporate-cupcakes'
export const CORPORATE_CAKE_SLICE_HANDLE = 'corporate-cake-slices'

export const STANDARD_CORPORATE_SIZES = [
  { id: '12', qty: 12, label: 'Box of 12', option1Value: 'Box of 12', price: 66 },
  { id: '30', qty: 30, label: 'Box of 30', option1Value: 'Box of 30', price: 150 },
  { id: '50', qty: 50, label: 'Box of 50', option1Value: 'Box of 50', price: 240 },
  { id: '100', qty: 100, label: 'Box of 100', option1Value: 'Box of 100', price: 450 },
  { id: '200', qty: 200, label: 'Box of 200', option1Value: 'Box of 200', price: 840 },
  { id: '300', qty: 300, label: 'Box of 300', option1Value: 'Box of 300', price: 1200 },
  { id: '500', qty: 500, label: 'Box of 500', option1Value: 'Box of 500', price: 1750 },
] as const

export const STANDARD_CORPORATE_OPTIONS = [
  {
    name: 'Size',
    values: STANDARD_CORPORATE_SIZES.map((t) => t.option1Value),
  },
  {
    name: 'Flavour',
    values: [...STANDARD_CORPORATE_FLAVOURS],
  },
] as const

export function isStandardCorporateHandle(handle?: string | null): boolean {
  if (!handle) return false
  return handle.trim().toLowerCase() === STANDARD_CORPORATE_HANDLE
}

export type StandardCorporateVariantSeed = {
  option1Value: string
  option2Value: string
  price: number
  inventoryQty: number
  inventoryPolicy: 'deny' | 'continue'
  sku: string
  requiresShipping: boolean
  taxable: boolean
}

/** Build Size × Flavour matrix for standard corporate cupcakes (incl. Mix of Both). */
export function buildStandardCorporateVariants(): StandardCorporateVariantSeed[] {
  const variants: StandardCorporateVariantSeed[] = []
  for (const tier of STANDARD_CORPORATE_SIZES) {
    for (const flavour of STANDARD_CORPORATE_FLAVOURS) {
      const flavourSlug = flavour
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
        sku: `corporate-${tier.qty}-${flavourSlug}`.toUpperCase().slice(0, 40),
        requiresShipping: true,
        taxable: true,
      })
    }
  }
  return variants
}

export const MINI_CORPORATE_SIZES = [
  { id: '24', qty: 24, label: '24 minis', option1Value: 'Box of 24', price: 84 },
  { id: '100', qty: 100, label: '100 minis', option1Value: 'Box of 100', price: 330 },
  { id: '300', qty: 300, label: '300 minis', option1Value: 'Box of 300', price: 900 },
  { id: '500', qty: 500, label: '500 minis', option1Value: 'Box of 500', price: 1400 },
] as const

export const MINI_CORPORATE_OPTIONS = [
  {
    name: 'Size',
    values: MINI_CORPORATE_SIZES.map((t) => t.option1Value),
  },
  {
    name: 'Flavour',
    values: [...MINI_CORPORATE_FLAVOURS],
  },
] as const

export function isMiniCorporateHandle(handle?: string | null): boolean {
  if (!handle) return false
  return handle.trim().toLowerCase() === MINI_CORPORATE_HANDLE
}

/** Build Size × Flavour matrix for mini corporate cupcakes (incl. Mix of Both). */
export function buildMiniCorporateVariants(): StandardCorporateVariantSeed[] {
  const variants: StandardCorporateVariantSeed[] = []
  for (const tier of MINI_CORPORATE_SIZES) {
    for (const flavour of MINI_CORPORATE_FLAVOURS) {
      const flavourSlug = flavour
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
        sku: `mini-corporate-${tier.qty}-${flavourSlug}`.toUpperCase().slice(0, 40),
        requiresShipping: true,
        taxable: true,
      })
    }
  }
  return variants
}

/** Same catering prices as standard cake slices, with logo upload enabled. */
export const CORPORATE_CAKE_SLICE_SIZES = [
  { id: '12', qty: 12, label: 'Box of 12', option1Value: 'Box of 12', price: 84 },
  { id: '36', qty: 36, label: 'Box of 36', option1Value: 'Box of 36', price: 234 },
  { id: '50', qty: 50, label: 'Box of 50', option1Value: 'Box of 50', price: 300 },
  { id: '100', qty: 100, label: 'Box of 100', option1Value: 'Box of 100', price: 550 },
] as const

/** Individual slice flavours (gallery thumbs map 1:1 to these). */
export const CORPORATE_CAKE_SLICE_SINGLE_FLAVOURS = [
  'White Chocolate Tim Tam',
  'Chocolate Caramel Mars',
  'Chocolate Caramel Tim Tam',
  'Rocky Road',
  'Lemon',
  'Carrot Cake',
  'Raspberry Jelly Cheesecake',
  'Toffee Honeycomb Golden Gaytime',
] as const

/** Assorted box — every single flavour in one box. */
export const CORPORATE_CAKE_SLICE_MIX_FLAVOUR = 'Mix' as const

/** All buyable slice flavours including Mix. */
export const CORPORATE_CAKE_SLICE_FLAVOURS = [
  ...CORPORATE_CAKE_SLICE_SINGLE_FLAVOURS,
  CORPORATE_CAKE_SLICE_MIX_FLAVOUR,
] as const

export type CorporateCakeSliceFlavour = (typeof CORPORATE_CAKE_SLICE_FLAVOURS)[number]
export type CorporateCakeSliceSingleFlavour =
  (typeof CORPORATE_CAKE_SLICE_SINGLE_FLAVOURS)[number]

/** Flavour → image map for product-page gallery sync (singles only). */
export const CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES: Record<
  CorporateCakeSliceSingleFlavour,
  { src: string; alt: string }
> = {
  'White Chocolate Tim Tam': {
    src: '/images/cake-slice/white-chocolate-with-tim-tam.png',
    alt: 'White chocolate Tim Tam cake slice',
  },
  'Chocolate Caramel Mars': {
    src: '/images/cake-slice/chocolate-caramel-with-mars.png',
    alt: 'Chocolate caramel Mars cake slice',
  },
  'Chocolate Caramel Tim Tam': {
    src: '/images/cake-slice/chocolate-caramel-with-tim-tam.png',
    alt: 'Chocolate caramel Tim Tam cake slice',
  },
  'Rocky Road': {
    src: '/images/cake-slice/rocky-road.png',
    alt: 'Rocky road cake slice',
  },
  Lemon: {
    src: '/images/cake-slice/lemon-slice.png',
    alt: 'Lemon cake slice',
  },
  'Carrot Cake': {
    src: '/images/cake-slice/carrot.png',
    alt: 'Carrot cake slice',
  },
  'Raspberry Jelly Cheesecake': {
    src: '/images/cake-slice/raspberry-jelly-cheesecake.png',
    alt: 'Raspberry jelly cheesecake slice',
  },
  'Toffee Honeycomb Golden Gaytime': {
    src: '/images/cake-slice/toffee-honeycomb-with-golden-gaytime.png',
    alt: 'Toffee honeycomb Golden Gaytime cake slice',
  },
}

export function isCorporateCakeSliceMixFlavour(flavour?: string | null): boolean {
  if (!flavour) return false
  const f = flavour.trim().toLowerCase()
  return f === 'mix' || f === 'mix of both' || f === 'assorted mix'
}

/** Random single-flavour image for Mix cart lines / hero preview. */
export function pickRandomCorporateCakeSliceImage(): { src: string; alt: string } {
  const list = CORPORATE_CAKE_SLICE_SINGLE_FLAVOURS
  const pick = list[Math.floor(Math.random() * list.length)]!
  const img = CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES[pick]
  return {
    src: img.src,
    alt: 'Assorted mix cake slices — all flavours in one box',
  }
}

export function getCorporateCakeSliceImage(flavour: string): { src: string; alt: string } {
  if (isCorporateCakeSliceMixFlavour(flavour)) {
    return pickRandomCorporateCakeSliceImage()
  }
  const key = flavour as CorporateCakeSliceSingleFlavour
  if (key in CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES) {
    return CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES[key]
  }
  return pickRandomCorporateCakeSliceImage()
}

export const CORPORATE_CAKE_SLICE_OPTIONS = [
  {
    name: 'Size',
    values: CORPORATE_CAKE_SLICE_SIZES.map((t) => t.option1Value),
  },
  {
    name: 'Flavour',
    values: [...CORPORATE_CAKE_SLICE_FLAVOURS],
  },
] as const

export function isCorporateCakeSliceHandle(handle?: string | null): boolean {
  if (!handle) return false
  return handle.trim().toLowerCase() === CORPORATE_CAKE_SLICE_HANDLE
}

/** Build Size × Flavour matrix for corporate cake slices (incl. Mix). */
export function buildCorporateCakeSliceVariants(): StandardCorporateVariantSeed[] {
  const variants: StandardCorporateVariantSeed[] = []
  for (const tier of CORPORATE_CAKE_SLICE_SIZES) {
    for (const flavour of CORPORATE_CAKE_SLICE_FLAVOURS) {
      const flavourSlug = flavour
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
        sku: `corp-slices-${tier.qty}-${flavourSlug}`.toUpperCase().slice(0, 40),
        requiresShipping: true,
        taxable: true,
      })
    }
  }
  return variants
}

export const STANDARD_CORPORATE_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Corporate cupcakes — more than 500')

export const MINI_CORPORATE_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Mini corporate cupcakes — more than 500')

export const CORPORATE_CAKE_SLICE_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Corporate cake slices — more than 100')

export const STANDARD_CORPORATE_GALLERY = [
  { src: '/images/corporate-2.png', alt: 'Branded corporate cupcake box arrangement' },
  { src: '/images/corporate-3.png', alt: 'Custom logo cupcakes for a corporate event' },
  { src: '/images/corporate-4.png', alt: 'Hand-frosted corporate cupcakes ready for delivery' },
  { src: '/images/corporate-5.png', alt: 'Assorted corporate cupcakes with branded toppers' },
  { src: '/images/corporate-6.jpg', alt: 'Corporate cupcakes with custom edible branding' },
  { src: '/images/corporate-7.webp', alt: 'Logo-topped cupcakes for a company celebration' },
] as const

/** Folder name matches existing public assets (spelling as on disk). */
export const MINI_CORPORATE_GALLERY = [
  {
    src: '/images/mini-coporate-cakes/1000051692.jpeg',
    alt: 'Corporate mini cupcakes with branded frosting',
  },
  {
    src: '/images/mini-coporate-cakes/branded-minis.jpeg',
    alt: 'Branded mini corporate cupcakes with edible logos',
  },
  {
    src: '/images/mini-coporate-cakes/1000051698.jpeg',
    alt: 'Bite-size mini cupcakes for corporate events',
  },
] as const

/** Gallery thumbs = single flavours only (Mix picks a random image at add-to-cart). */
export const CORPORATE_CAKE_SLICE_GALLERY = CORPORATE_CAKE_SLICE_SINGLE_FLAVOURS.map((flavour) => ({
  src: CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES[flavour].src,
  alt: CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES[flavour].alt,
  flavour,
}))

export function findCorporatePageVariantIndex(
  variants: { option1Value?: string; option2Value?: string }[],
  sizeOption1: string,
  flavour: string
): number {
  const size = (sizeOption1 || '').trim()
  const flavourKey = (flavour || '').trim().toLowerCase()
  return variants.findIndex((v) => {
    const vSize = (v.option1Value || '').trim()
    const vFlavour = (v.option2Value || '').trim().toLowerCase()
    if (vSize !== size) return false
    if (vFlavour === flavourKey) return true
    // Mix aliases
    if (
      (flavourKey === 'mix' || flavourKey === 'mix of both') &&
      (vFlavour === 'mix' || vFlavour === 'mix of both')
    ) {
      return true
    }
    return false
  })
}
