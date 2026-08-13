/**
 * Shared corporate page configs — standard, mini, and cake slices.
 * Products are seeded by scripts/wire-corporate-page-products.mjs
 */

export const CORPORATE_FLAVOURS = ['Vanilla', 'Chocolate'] as const
export type CorporateFlavour = (typeof CORPORATE_FLAVOURS)[number]

export const STANDARD_CORPORATE_HANDLE = 'corporate-cupcakes'
export const MINI_CORPORATE_HANDLE = 'mini-corporate-cupcakes'
export const CORPORATE_CAKE_SLICE_HANDLE = 'corporate-cake-slices'

export const STANDARD_CORPORATE_SIZES = [
  { id: '12', qty: 12, label: 'Box of 12', option1Value: 'Box of 12', price: 66 },
  { id: '36', qty: 36, label: 'Box of 36', option1Value: 'Box of 36', price: 180 },
  { id: '50', qty: 50, label: 'Box of 50', option1Value: 'Box of 50', price: 225 },
  { id: '100', qty: 100, label: 'Box of 100', option1Value: 'Box of 100', price: 420 },
] as const

export const MINI_CORPORATE_SIZES = [
  { id: '24', qty: 24, label: '24 minis', option1Value: 'Box of 24', price: 84 },
  { id: '100', qty: 100, label: '100 minis', option1Value: 'Box of 100', price: 330 },
  { id: '300', qty: 300, label: '300 minis', option1Value: 'Box of 300', price: 900 },
  { id: '500', qty: 500, label: '500 minis', option1Value: 'Box of 500', price: 1400 },
] as const

/** Same catering prices as standard cake slices, with logo upload enabled. */
export const CORPORATE_CAKE_SLICE_SIZES = [
  { id: '12', qty: 12, label: 'Box of 12', option1Value: 'Box of 12', price: 84 },
  { id: '36', qty: 36, label: 'Box of 36', option1Value: 'Box of 36', price: 234 },
  { id: '50', qty: 50, label: 'Box of 50', option1Value: 'Box of 50', price: 300 },
  { id: '100', qty: 100, label: 'Box of 100', option1Value: 'Box of 100', price: 550 },
] as const

/** Slice flavours shown on the corporate cake-slice buy panel. */
export const CORPORATE_CAKE_SLICE_FLAVOURS = [
  'White Chocolate Tim Tam',
  'Chocolate Caramel Mars',
  'Chocolate Caramel Tim Tam',
  'Rocky Road',
  'Lemon',
  'Carrot Cake',
  'Raspberry Jelly Cheesecake',
  'Toffee Honeycomb Golden Gaytime',
] as const

/** Flavour → image map for product-page gallery sync. */
export const CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES: Record<
  (typeof CORPORATE_CAKE_SLICE_FLAVOURS)[number],
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

export const STANDARD_CORPORATE_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Corporate cupcakes — more than 100')

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
    src: '/images/mini-coporate-cakes/1000051695.jpeg',
    alt: 'Assorted mini corporate cupcakes in a box',
  },
  {
    src: '/images/mini-coporate-cakes/1000051698.jpeg',
    alt: 'Bite-size mini cupcakes for corporate events',
  },
] as const

export const CORPORATE_CAKE_SLICE_GALLERY = CORPORATE_CAKE_SLICE_FLAVOURS.map((flavour) => ({
  src: CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES[flavour].src,
  alt: CORPORATE_CAKE_SLICE_FLAVOUR_IMAGES[flavour].alt,
  flavour,
}))

export function findCorporatePageVariantIndex(
  variants: { option1Value?: string; option2Value?: string }[],
  sizeOption1: string,
  flavour: string
): number {
  return variants.findIndex(
    (v) => v.option1Value === sizeOption1 && (v.option2Value || '') === flavour
  )
}
