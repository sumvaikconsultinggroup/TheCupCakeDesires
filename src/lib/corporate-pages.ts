/**
 * Shared corporate page configs — standard + mini.
 * Products are seeded by scripts/wire-corporate-page-products.mjs
 */

export const CORPORATE_FLAVOURS = ['Vanilla', 'Chocolate'] as const
export type CorporateFlavour = (typeof CORPORATE_FLAVOURS)[number]

export const STANDARD_CORPORATE_HANDLE = 'corporate-cupcakes'
export const MINI_CORPORATE_HANDLE = 'mini-corporate-cupcakes'

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

export const STANDARD_CORPORATE_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Corporate cupcakes — more than 100')

export const MINI_CORPORATE_BULK_ENQUIRY_HREF =
  '/contact?topic=corporate&subject=' +
  encodeURIComponent('Mini corporate cupcakes — more than 500')

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

export function findCorporatePageVariantIndex(
  variants: { option1Value?: string; option2Value?: string }[],
  sizeOption1: string,
  flavour: string
): number {
  return variants.findIndex(
    (v) => v.option1Value === sizeOption1 && (v.option2Value || '') === flavour
  )
}
