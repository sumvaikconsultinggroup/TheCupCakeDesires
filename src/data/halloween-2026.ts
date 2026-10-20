/**
 * Halloween 2026 seasonal copy and FAQ. Shared kitchen allergy line is verbatim.
 * No invented products or prices — collections ship empty until real handles are tagged.
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

export const HALLOWEEN_EMPTY_FALLBACK_LINKS = [
  { href: '/collections/all-cupcakes', label: 'Browse all cupcakes' },
  { href: '/collections/cakes', label: 'Browse cakes' },
] as const

/** Preferred HomeBanner payload (images arrive later — leave paths as TODO placeholders in seed only). */
export const HALLOWEEN_HOME_BANNER = {
  title: 'Halloween Cupcakes, Delivered in Melbourne',
  buttonText: 'Shop Halloween',
  buttonLink: '/collections/halloween-cupcakes',
  image: {
    desktop: '/images/halloween/halloween-hero-desktop.webp',
    mobile: '/images/halloween/halloween-hero-mobile.webp',
    alt: 'Box of Halloween cupcakes with pumpkin and ghost toppers, delivered in Melbourne',
  },
  order: 0,
  isActive: true,
  endDate: '2026-11-01T13:00:00.000Z',
} as const

export const HALLOWEEN_CUPCAKE_FAQS = [
  {
    question: 'Do you deliver Halloween cupcakes in Melbourne?',
    answer:
      'Yes. We deliver across Melbourne Metro on weekdays between 9am and 3pm. Order by noon for next-weekday delivery.',
  },
  {
    question: 'How much is delivery?',
    answer:
      'Delivery fees are typically $0 to $20, depending on your suburb. The exact fee shows at checkout.',
  },
  {
    question: 'Can I get Halloween cupcakes delivered on Saturday 31 October?',
    answer: 'We deliver on weekdays only, so for a weekend party choose Friday 30 October.',
  },
  {
    question: 'Do you have vegan or gluten free Halloween cupcakes?',
    answer: `Vegan, eggless and gluten free options are available and are made in a shared kitchen. ${HALLOWEEN_ALLERGY_LINE}`,
  },
  {
    question: 'Can I pick up my order?',
    answer:
      'We are an online bakery and orders are delivered across Melbourne Metro. For help, call 03 9705 0051.',
  },
] as const

export const HALLOWEEN_CAKE_FAQS = [
  {
    question: 'Do you deliver Halloween cakes in Melbourne?',
    answer:
      'Yes. We deliver across Melbourne Metro on weekdays between 9am and 3pm. Order by noon for next-weekday delivery.',
  },
  {
    question: 'How much is delivery?',
    answer:
      'Delivery fees are typically $0 to $20, depending on your suburb. The exact fee shows at checkout.',
  },
  {
    question: 'Can I get a Halloween cake delivered on Saturday 31 October?',
    answer: 'We deliver on weekdays only, so for a weekend party choose Friday 30 October.',
  },
  {
    question: 'Do you have vegan or gluten free Halloween cakes?',
    answer: `Vegan, eggless and gluten free options are available and are made in a shared kitchen. ${HALLOWEEN_ALLERGY_LINE}`,
  },
  {
    question: 'Can I pick up my order?',
    answer:
      'We are an online bakery and orders are delivered across Melbourne Metro. For help, call 03 9705 0051.',
  },
] as const

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
