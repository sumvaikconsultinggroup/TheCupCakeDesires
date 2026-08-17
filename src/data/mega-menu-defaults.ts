import type { MegaMenuConfig } from '@/types/mega-menu'

export const DEFAULT_MEGA_MENUS: MegaMenuConfig[] = [
  {
    slug: 'event',
    label: 'Event',
    href: '/collections/all-items',
    layout: 'columns-featured',
    columnLayout: 4,
    description:
      'Themed boxes of 12 hand-piped cupcakes for every occasion — from baby showers to Australia Day.',
    columns: [
      {
        heading: 'Corporate Event',
        links: [
          { label: "Women's Day Cupcakes", href: '/products/box-of-12-womens-day-cupcakes' },
          { label: 'R U OK? Day Cupcakes', href: '/products/box-of-12-ruok-day-cupcakes' },
          { label: 'Pink Ribbon Day Cupcakes', href: '/products/box-of-12-pink-ribbon-day-cupcakes' },
          { label: 'Anzac Day Cupcakes', href: '/products/box-of-12-anzac-day-cupcakes' },
          { label: 'Pride Day Cupcakes', href: '/products/box-of-12-pride-day-cupcakes' },
        ],
      },
      {
        heading: 'Personal moments',
        links: [
          { label: 'Birthday Cupcakes', href: '/collections/birthday-cupcakes', collectionHandle: 'birthday-cupcakes' },
          { label: 'Anniversary Cupcakes', href: '/collections/anniversary-cupcakes', collectionHandle: 'anniversary-cupcakes' },
          { label: 'I Love U Cupcakes', href: '/collections/i-love-u-cupcakes', collectionHandle: 'i-love-u-cupcakes' },
          { label: 'Sorry Cupcakes', href: '/collections/sorry-cupcakes', collectionHandle: 'sorry-cupcakes' },
          { label: 'Thank U Cupcakes', href: '/collections/thank-u-cupcakes', collectionHandle: 'thank-u-cupcakes' },
        ],
      },
      {
        heading: 'Family & milestones',
        links: [
          { label: 'Wedding Cupcakes', href: '/collections/wedding-cupcakes', collectionHandle: 'wedding-cupcakes' },
          { label: 'Baby Girl Cupcakes', href: '/collections/baby-girl-cupcakes', collectionHandle: 'baby-girl-cupcakes' },
          { label: 'Baby Boy Cupcakes', href: '/collections/baby-boy-cupcakes', collectionHandle: 'baby-boy-cupcakes' },
          { label: 'Baby Neutral Cupcakes', href: '/collections/baby-neutral-cupcakes', collectionHandle: 'baby-neutral-cupcakes' },
          { label: 'Gender Reveal Cupcakes', href: '/collections/gender-reveal-cupcakes', collectionHandle: 'gender-reveal-cupcakes' },
        ],
      },
      {
        heading: 'Seasonal & holidays',
        links: [
          { label: 'Christmas Cupcakes', href: '/collections/christmas-cupcakes', collectionHandle: 'christmas-cupcakes' },
          { label: 'Easter Cupcakes', href: '/collections/easter-cupcakes', collectionHandle: 'easter-cupcakes' },
          { label: "Valentine's Day Cupcakes", href: '/collections/valentines-day-cupcakes', collectionHandle: 'valentines-day-cupcakes' },
          { label: "Mother's Day Cupcakes", href: '/collections/mothers-day-cupcakes', collectionHandle: 'mothers-day-cupcakes' },
          { label: "Father's Day Cupcakes", href: '/collections/fathers-day-cupcakes', collectionHandle: 'fathers-day-cupcakes' },
          { label: 'Diwali Cupcakes', href: '/collections/diwali-cupcakes', collectionHandle: 'diwali-cupcakes' },
          { label: 'Australia Day Cupcakes', href: '/collections/australia-day-cupcakes', collectionHandle: 'australia-day-cupcakes' },
        ],
      },
    ],
    featured: [
      {
        title: 'Birthday box',
        subtitle: '12 hand-piped birthday cupcakes',
        href: '/collections/birthday-cupcakes',
        image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80',
        badge: 'Most loved',
        collectionHandle: 'birthday-cupcakes',
      },
      {
        title: 'Wedding box',
        subtitle: 'Custom colours, your flavour combo',
        href: '/collections/wedding-cupcakes',
        image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&q=80',
        collectionHandle: 'wedding-cupcakes',
      },
      {
        title: 'Christmas box',
        subtitle: 'Gingerbread, peppermint, festive piping',
        href: '/collections/christmas-cupcakes',
        image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
        collectionHandle: 'christmas-cupcakes',
      },
    ],
    isActive: true,
    position: 2,
  },
  {
    slug: 'cupcakes',
    label: 'Cupcakes',
    href: '/collections/standard-cupcakes',
    layout: 'product-list',
    description:
      'Hand-frosted to order in our Narre Warren kitchen. Boxes of 3 for two-person treats, boxes of 24 for the whole office, and giant cupcakes that serve 20. Build your own box, or pick eggless, vegan and gluten-free on any flavour.',
    heroImage: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=900&q=80',
    heroImageAlt: 'Hand-frosted cupcakes',
    columns: [
      {
        heading: 'Shop cupcakes',
        links: [
          { label: 'Standard Cupcakes', href: '/collections/standard-cupcakes', collectionHandle: 'standard-cupcakes' },
          { label: 'Deluxe Cupcakes', href: '/collections/deluxe-cupcakes', collectionHandle: 'deluxe-cupcakes' },
          { label: 'Mini Cupcakes', href: '/collections/mini-cupcakes', collectionHandle: 'mini-cupcakes' },
          { label: 'Make Your Own Box', href: '/cupcake-builder' },
          { label: 'Vegan Chocolate Vanilla', href: '/products/vegan-chocolate-vanilla-3-cupcakes' },
          { label: 'Gluten-Free Red Velvet', href: '/products/gluten-free-red-velvet-3-cupcakes' },
          { label: 'Browse all cupcakes →', href: '/collections/standard-cupcakes', collectionHandle: 'standard-cupcakes' },
        ],
      },
    ],
    featured: [],
    isActive: true,
    position: 0,
  },
  {
    slug: 'cakes',
    label: 'Cakes',
    href: '/collections/cakes',
    layout: 'product-list',
    description:
      'Six-inch and eight-inch layered round cakes — baked the morning of delivery, never before. Pick your flavour or ask us to design something custom for your day.',
    heroImage: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=900&q=80',
    heroImageAlt: 'Layered round cake with cocoa nib brittle',
    columns: [
      {
        heading: 'Giant Cupcakes',
        links: [
          { label: 'Green Aqua', href: '/products/giant-cupcake-vanilla-vanilla-aqua' },
          { label: 'Brown Cake', href: '/products/giant-cupcake-chocolate-chocolate' },
          { label: 'Pink Cake', href: '/products/giant-cupcake-vanilla-vanilla-pink' },
          { label: 'Blue', href: '/products/giant-cupcake-chocolate-vanilla-blue' },
          { label: 'Red Velvet', href: '/products/giant-cupcake-red-velvet' },
          { label: 'Deluxe Cookies & Cream', href: '/products/deluxe-giant-cupcake-cookies-and-cream' },
          { label: 'Deluxe Molten Chocolate', href: '/products/deluxe-giant-cupcake-molten-chocolate' },
          { label: 'Deluxe Salted Caramel', href: '/products/deluxe-giant-cupcake-salted-caramel' },
          { label: 'Deluxe Hazelnut Heaven', href: '/products/deluxe-giant-cupcake-hazelnut-heaven' },
          {
            label: 'Browse all giant cupcakes →',
            href: '/collections/giant-cupcakes',
            collectionHandle: 'giant-cupcakes',
          },
        ],
      },
      {
        heading: 'Dress Cakes',
        links: [
          { label: 'Custom Dress Cake →', href: '/custom-dress-cake' },
          { label: 'Ariel Aqua Dress Cake', href: '/products/ariel-aqua-dress-cake' },
          { label: 'Belle Yellow Dress Cake', href: '/products/belle-yellow-dress-cake' },
          { label: 'Elsa Blue Dress Cake', href: '/products/elsa-blue-dress-cake' },
          {
            label: 'Browse all dress cakes →',
            href: '/collections/dress-cakes',
            collectionHandle: 'dress-cakes',
          },
        ],
      },
      {
        heading: 'Round Cake',
        links: [
          { label: 'Red Velvet Round Cake', href: '/products/red-velvet-round-cake' },
          { label: 'Chocolate Chocolate Round Cake', href: '/products/chocolate-chocolate-round-cake' },
          { label: 'Salted Caramel Round Cake', href: '/products/salted-caramel-round-cake' },
          { label: 'Molten Chocolate Round Cake', href: '/products/molten-chocolate-round-cake' },
          { label: 'Cookies & Cream Round Cake', href: '/products/cookies-cream-round-cake' },
          { label: 'Vanilla Vanilla Round Cake', href: '/products/vanilla-vanilla-round-cake' },
          { label: 'Custom Birthday Cake', href: '/products/custom-birthday-cake' },
          { label: 'Browse all cakes →', href: '/collections/cakes', collectionHandle: 'cakes' },
        ],
      },
    ],
    featured: [],
    isActive: true,
    position: 1,
  },
  {
    slug: 'macarons',
    label: 'Other',
    href: '/collections/macarons',
    layout: 'product-list',
    description:
      'Almond-meal macarons and layered cake slices, made in small batches. Pick a flavour, or grab an assorted box of either.',
    heroImage: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=900&q=80',
    heroImageAlt: 'Hand-piped macarons in a gift box',
    columns: [
      {
        heading: 'Macarons',
        links: [
          { label: 'Macaron Box (12) — Assorted', href: '/products/macaron-box-12' },
          { label: 'Salted Caramel Macarons', href: '/products/macaron-box-12?flavour=Salted+Caramel' },
          { label: 'Strawberry Macarons', href: '/products/macaron-box-12?flavour=Strawberry' },
          { label: 'Chocolate Macarons', href: '/products/macaron-box-12?flavour=Chocolate' },
          { label: 'Bubblegum Macarons', href: '/products/macaron-box-12?flavour=Bubblegum' },
          { label: 'Browse all macarons →', href: '/collections/macarons', collectionHandle: 'macarons' },
        ],
      },
      {
        heading: 'Standard size cake slices',
        links: [
          { label: 'White Chocolate Tim Tam Slice', href: '/products/white-chocolate-tim-tam-slice' },
          { label: 'Chocolate Caramel Mars Slice', href: '/products/chocolate-caramel-mars-slice' },
          { label: 'Rocky Road Slice', href: '/products/rocky-road-slice' },
          { label: 'Lemon Slice', href: '/products/lemon-slice' },
          { label: 'Carrot Cake Slice', href: '/products/carrot-cake-slice' },
          { label: 'Mix Slice', href: '/products/mix-slice' },
          { label: 'Browse all slices →', href: '/collections/cake-slices', collectionHandle: 'cake-slices' },
        ],
      },
    ],
    featured: [],
    isActive: true,
    position: 3,
  },
]

/** Static Corporate hover links — never loaded from admin/DB. */
export const CORPORATE_NAV_DROPDOWN = {
  label: 'Corporate',
  href: '/corporate',
  links: [
    {
      label: 'Corporate cupcakes',
      href: '/corporate',
      description: 'Standard branded boxes for offices & events',
    },
    {
      label: 'Mini corporate cupcakes',
      href: '/corporate/mini',
      description: 'Bite-size minis for standing receptions',
    },
    {
      label: 'Corporate cake slices',
      href: '/corporate/cake-slices',
      description: 'Logo-topped slices in catering boxes',
    },
  ],
} as const

/** Final header order: Cupcakes → Cakes → Corporate → Event → Other → Contact */
export const STOREFRONT_NAV_ORDER: Array<
  | { type: 'mega'; slug: MegaMenuConfig['slug'] }
  | { type: 'link'; label: string; href: string }
  | {
      type: 'dropdown'
      label: string
      href: string
      links: { label: string; href: string; description?: string }[]
    }
> = [
  { type: 'mega', slug: 'cupcakes' },
  { type: 'mega', slug: 'cakes' },
  {
    type: 'dropdown',
    label: CORPORATE_NAV_DROPDOWN.label,
    href: CORPORATE_NAV_DROPDOWN.href,
    links: CORPORATE_NAV_DROPDOWN.links.map((l) => ({ ...l })),
  },
  { type: 'mega', slug: 'event' },
  { type: 'mega', slug: 'macarons' },
  { type: 'link', label: 'Contact', href: '/contact' },
]

export const STATIC_NAV_LINKS = [
  { label: 'Corporate', href: '/corporate' },
  { label: 'Mini corporate', href: '/corporate/mini' },
  { label: 'Corporate cake slices', href: '/corporate/cake-slices' },
  // { label: 'Birthdays', href: '/bday-party' }, // hidden from header per request
  { label: 'Contact', href: '/contact' },
]
