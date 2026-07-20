import type { MegaMenuConfig } from '@/types/mega-menu'

export const DEFAULT_MEGA_MENUS: MegaMenuConfig[] = [
  {
    slug: 'event',
    label: 'Event',
    href: '/collections/all-items',
    layout: 'columns-featured',
    columnLayout: 3,
    description:
      'Themed boxes of 12 hand-piped cupcakes for every occasion — from baby showers to Australia Day.',
    columns: [
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
    position: 0,
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
          { label: 'Giant Cupcakes', href: '/collections/giant-cupcakes', collectionHandle: 'giant-cupcakes' },
          { label: 'Make Your Own Box', href: '/cupcake-builder' },
          { label: 'Vegan Chocolate Vanilla', href: '/products/vegan-chocolate-vanilla-3-cupcakes' },
          { label: 'Gluten-Free Red Velvet', href: '/products/gluten-free-red-velvet-3-cupcakes' },
          { label: 'Browse all cupcakes →', href: '/collections/standard-cupcakes', collectionHandle: 'standard-cupcakes' },
        ],
      },
    ],
    featured: [],
    isActive: true,
    position: 1,
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
        heading: 'Shop cakes',
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
    position: 2,
  },
  {
    slug: 'macarons',
    label: 'Macarons',
    href: '/collections/macarons',
    layout: 'product-list',
    description:
      'Almond-meal shells with silky ganache centres, sold by the box of 12. Pick a single flavour or order an assorted box — six tastes, twelve perfect bites.',
    heroImage: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=900&q=80',
    heroImageAlt: 'Hand-piped macarons in a gift box',
    columns: [
      {
        heading: 'Shop macarons',
        links: [
          { label: 'Macaron Box (12) — Assorted', href: '/products/macaron-box-12' },
          { label: 'Salted Caramel Macarons', href: '/products/macaron-box-12?flavour=Salted+Caramel' },
          { label: 'Strawberry Macarons', href: '/products/macaron-box-12?flavour=Strawberry' },
          { label: 'Chocolate Macarons', href: '/products/macaron-box-12?flavour=Chocolate' },
          { label: 'Bubblegum Macarons', href: '/products/macaron-box-12?flavour=Bubblegum' },
          { label: 'Browse all macarons →', href: '/collections/macarons', collectionHandle: 'macarons' },
        ],
      },
    ],
    featured: [],
    isActive: true,
    position: 3,
  },
]

export const STATIC_NAV_LINKS = [
  { label: 'Corporate', href: '/corporate' },
  // { label: 'Birthdays', href: '/bday-party' }, // hidden from header per request
  { label: 'Contact', href: '/contact' },
]
