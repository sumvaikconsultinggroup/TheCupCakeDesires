/**
 * Product page title/meta overrides (GSC content 12 Nov 2026 §4.1).
 * Titles include '| The Cupcake Desire' exactly as approved.
 * Where meta is omitted, keep the live CMS meta.
 */

export type ProductSeoOverride = {
  title: string
  description?: string
}

export const PRODUCT_SEO_OVERRIDES: Record<string, ProductSeoOverride> = {
  'corporate-round-cake': {
    title: 'Corporate Round Cake With Logo | The Cupcake Desire',
    description:
      "One round cake with your logo on top: 6 inch $70, 8 inch $90 or 10 inch $110, in vanilla or chocolate. Cakes need 3 days' notice. Order online.",
  },
  'corporate-cupcakes': {
    title: 'Corporate Cupcakes Box With Your Logo | The Cupcake Desire',
  },
  'mini-corporate-cupcakes': {
    title: 'Mini Corporate Cupcakes Box of 24 | The Cupcake Desire',
    description:
      '24 bite-size cupcakes with up to 4 logos on edible discs, in vanilla, chocolate or a mix. Order by 12 noon for next-weekday delivery.',
  },
  'corporate-cake-slices': {
    title: 'Corporate Cake Slices Box With Logo | The Cupcake Desire',
    description:
      'Cake slices with up to 4 logos on edible discs, in boxes of 12, 36, 50 or 100, one flavour or a mix. Order by 12 noon for next-weekday delivery.',
  },
}
