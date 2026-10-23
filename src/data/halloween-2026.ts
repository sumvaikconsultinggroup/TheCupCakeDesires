/**
 * Halloween 2026 seasonal copy and FAQ. Shared kitchen allergy line is verbatim.
 * No invented products or prices. Grids also match title/tags containing "halloween".
 */

export const HALLOWEEN_ALLERGY_LINE =
  'Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.'

export const HALLOWEEN_COLLECTION_HANDLES = ['halloween-cupcakes', 'halloween-cakes'] as const

export type HalloweenCollectionHandle = (typeof HALLOWEEN_COLLECTION_HANDLES)[number]

/** Soft fallback when Mongo has no published collection yet (before seed). */
export const HALLOWEEN_COLLECTION_FALLBACKS: Record<
  HalloweenCollectionHandle,
  {
    handle: HalloweenCollectionHandle
    title: string
    description: string
    productHandles: string[]
    published: true
    image?: string
    seo: { title: string; description: string; canonical: string; robots: { index: true; follow: true } }
  }
> = {
  'halloween-cupcakes': {
    handle: 'halloween-cupcakes',
    title: 'Halloween Cupcakes, Delivered in Melbourne',
    description:
      'Pumpkins, ghosts and a little spooky fun, piped onto cupcakes we bake to order for Halloween parties, classrooms and office afternoons. Choose a box below and we deliver across Melbourne Metro.',
    productHandles: [],
    published: true,
    image: '/images/halloween/halloween-cupcakes-collection.webp',
    seo: {
      title: 'Halloween Cupcakes Melbourne | Delivered | Cupcake Desire',
      description:
        'Halloween cupcakes baked to order and delivered across Melbourne Metro on weekdays. Boxes and minis, with vegan, eggless and gluten free options.',
      canonical: '/collections/halloween-cupcakes',
      robots: { index: true, follow: true },
    },
  },
  'halloween-cakes': {
    handle: 'halloween-cakes',
    title: 'Halloween Cakes, Delivered in Melbourne',
    description:
      'A Halloween cake gives your party a centrepiece people gather around. We bake each one to order and deliver across Melbourne Metro.',
    productHandles: [],
    published: true,
    image: '/images/halloween/halloween-cakes-collection.webp',
    seo: {
      title: 'Halloween Cakes Melbourne | Delivered | Cupcake Desire',
      description:
        'Halloween cakes baked to order for parties and birthdays, delivered across Melbourne Metro on weekdays. Vegan, eggless and gluten free options.',
      canonical: '/collections/halloween-cakes',
      robots: { index: true, follow: true },
    },
  },
}

export function isHalloweenCollectionHandle(handle: string): handle is HalloweenCollectionHandle {
  return (HALLOWEEN_COLLECTION_HANDLES as readonly string[]).includes(handle)
}

/** Storefront fallbacks when /products/halloween-cupcakes images lack altText. */
export const HALLOWEEN_CUPCAKES_PRODUCT_IMAGE_ALTS = [
  'Box of 12 Halloween cupcakes with ghost, pumpkin and monster designs, Melbourne delivery',
  'Close up of hand-frosted Halloween cupcakes by The Cupcake Desire',
] as const

/** Preferred HomeBanner payload (images under public/images/halloween/). */
export const HALLOWEEN_HOME_BANNER = {
  title: 'Halloween Cupcakes, Delivered in Melbourne',
  buttonText: 'Shop Halloween',
  buttonLink: '/collections/halloween-cupcakes',
  image: {
    desktop: '/images/halloween/halloween-hero-desktop.webp',
    mobile: '/images/halloween/halloween-hero-mobile.webp',
    alt: 'Box of 12 Halloween cupcakes with ghost, pumpkin topper and purple monster designs, delivered in Melbourne',
  },
  order: 0,
  isActive: true,
  endDate: '2026-11-01T13:00:00.000Z',
} as const

/** Party landing FAQs. Collection FAQs live only in COLLECTION_SEO (single source). */
export const HALLOWEEN_PARTY_FAQS = [
  {
    question: 'How many cupcakes do I need for a Halloween party?',
    answer:
      'Plan around one cupcake per guest, or two to three minis per guest when there is other food.',
  },
  {
    question: 'Do you deliver to offices?',
    answer: 'Yes. We deliver across Melbourne Metro on weekdays between 9am and 3pm.',
  },
  {
    question: 'Can I add a logo?',
    answer: 'See our branded cupcakes page for logo options on corporate boxes.',
  },
  {
    question: 'Are your treats nut free?',
    answer: `We do not make nut free claims. ${HALLOWEEN_ALLERGY_LINE}`,
  },
] as const
