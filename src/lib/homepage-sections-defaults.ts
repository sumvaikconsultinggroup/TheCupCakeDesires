/** Shared defaults + types for homepage section configuration (admin + storefront). */

export type HomepageProductSectionKey =
  | 'best_sellers'
  | 'flash_deals'
  | 'new_arrivals'
  | 'featured'
  | 'trending'

export type HomepageShowcaseSectionKey = 'occasion_showcase' | 'category_showcase'

export type HomepageSectionKey = HomepageProductSectionKey | HomepageShowcaseSectionKey

export interface HomepageProductSectionConfig {
  enabled: boolean
  collectionHandle: string
  layoutStyle: 'grid' | 'carousel'
  itemsPerRow: number
  maxItems: number
  eyebrow: string
  title: string
  titleAccent: string
  description: string
  ctaLabel: string
  ctaHref: string
}

export interface HomepageShowcaseTile {
  collectionHandle: string
  imageOverride: string
  tagline: string
  blurb: string
  badge: string
  span: 'short' | 'wide'
}

export interface HomepageShowcaseSectionConfig {
  enabled: boolean
  eyebrow: string
  title: string
  titleAccent: string
  description: string
  ctaLabel: string
  ctaHref: string
  tiles: HomepageShowcaseTile[]
}

export interface HomepageSectionsConfig {
  best_sellers: HomepageProductSectionConfig
  flash_deals: HomepageProductSectionConfig
  new_arrivals: HomepageProductSectionConfig
  featured: HomepageProductSectionConfig
  trending: HomepageProductSectionConfig
  occasion_showcase: HomepageShowcaseSectionConfig
  category_showcase: HomepageShowcaseSectionConfig
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1200&q=80'

export const HOMEPAGE_PRODUCT_SECTION_META: Record<
  HomepageProductSectionKey,
  { label: string; description: string }
> = {
  best_sellers: {
    label: 'Best Sellers',
    description: 'Product grid below the hero — pick one collection and layout.',
  },
  flash_deals: {
    label: 'Flash Deals',
    description: 'Limited-time offers row on the homepage.',
  },
  new_arrivals: {
    label: 'New Arrivals',
    description: 'Latest products section.',
  },
  featured: {
    label: 'Featured / Product Showcase',
    description: 'Toggleable carousel or grid showcase.',
  },
  trending: {
    label: 'Trending Products',
    description: 'Popular picks near the bottom of the page.',
  },
}

export const HOMEPAGE_SHOWCASE_SECTION_META: Record<
  HomepageShowcaseSectionKey,
  { label: string; description: string }
> = {
  occasion_showcase: {
    label: 'Shop by Occasion',
    description: '"Curated for the days that matter" — multiple collection tiles.',
  },
  category_showcase: {
    label: 'Browse Categories',
    description: '"Browse our favourite places to begin" — category entry tiles.',
  },
}

export function getDefaultHomepageSectionsConfig(): HomepageSectionsConfig {
  return {
    best_sellers: {
      enabled: true,
      collectionHandle: 'bestsellers',
      layoutStyle: 'grid',
      itemsPerRow: 4,
      maxItems: 8,
      eyebrow: 'Customer favourites',
      title: 'The boxes',
      titleAccent: 'everyone reorders.',
      description:
        'The classics our regulars come back for — vanilla bean, red velvet, salted caramel, and a few more we’ve fought to keep on the menu.',
      ctaLabel: 'See all bestsellers',
      ctaHref: '/collections/bestsellers',
    },
    flash_deals: {
      enabled: true,
      collectionHandle: 'flash-deals',
      layoutStyle: 'grid',
      itemsPerRow: 4,
      maxItems: 4,
      eyebrow: 'Limited time',
      title: 'Flash',
      titleAccent: 'deals.',
      description:
        'Same morning butter, same vanilla bean — at a friendlier price. Only a handful of boxes per flavour while they last.',
      ctaLabel: 'All deals',
      ctaHref: '/collections/flash-deals',
    },
    new_arrivals: {
      enabled: true,
      collectionHandle: 'new-arrivals',
      layoutStyle: 'grid',
      itemsPerRow: 4,
      maxItems: 8,
      eyebrow: 'Fresh from the kitchen',
      title: 'New',
      titleAccent: 'arrivals.',
      description:
        'Seasonal experiments we’re testing — pistachio rose, salted miso caramel, lemon olive oil, and a couple of recipes we’re still perfecting.',
      ctaLabel: 'See all new arrivals',
      ctaHref: '/collections/new-arrivals',
    },
    featured: {
      enabled: true,
      collectionHandle: 'featured',
      layoutStyle: 'carousel',
      itemsPerRow: 4,
      maxItems: 12,
      eyebrow: 'Featured this week',
      title: 'Hand-picked for',
      titleAccent: 'you.',
      description: 'Editorial picks from our kitchen this week.',
      ctaLabel: 'View full edit',
      ctaHref: '/collections/featured',
    },
    trending: {
      enabled: true,
      collectionHandle: 'trending',
      layoutStyle: 'grid',
      itemsPerRow: 4,
      maxItems: 4,
      eyebrow: 'Trending in the city',
      title: 'What everyone is',
      titleAccent: 'ordering.',
      description:
        'The flavours your neighbours have been picking up on their way home this week.',
      ctaLabel: 'Browse the menu',
      ctaHref: '/collections/trending',
    },
    occasion_showcase: {
      enabled: true,
      eyebrow: 'Shop by occasion',
      title: 'Curated for the days',
      titleAccent: 'that matter.',
      description:
        'Birthdays, weddings, office gifts, or a Tuesday-afternoon pick-me-up — we’ve curated edits for every moment worth marking.',
      ctaLabel: 'View every edit',
      ctaHref: '/collections/all-items',
      tiles: [
        {
          collectionHandle: 'christmas-cupcakes',
          imageOverride: '',
          tagline: 'December, hand-piped.',
          blurb:
            'Gingerbread, peppermint chocolate and snowy vanilla — boxes designed to land under the tree.',
          badge: '4 boxes',
          span: 'short',
        },
        {
          collectionHandle: 'mothers-day-cupcakes',
          imageOverride: '',
          tagline: 'Make her Sunday.',
          blurb:
            'Floral piped buttercream in soft pinks and creams — gift-boxed and ready for brunch.',
          badge: '4 boxes',
          span: 'short',
        },
        {
          collectionHandle: 'fathers-day-cupcakes',
          imageOverride: '',
          tagline: 'Better than a tie.',
          blurb:
            'Whisky caramel, salted chocolate and coffee-finished cupcakes for the dad who deserves more.',
          badge: '4 boxes',
          span: 'short',
        },
        {
          collectionHandle: 'anniversary-cupcakes',
          imageOverride: '',
          tagline: 'For the quiet milestones.',
          blurb:
            'Champagne buttercream, rose gold accents — a celebration when flowers feel too obvious.',
          badge: '4 boxes',
          span: 'short',
        },
        {
          collectionHandle: 'valentines-day-cupcakes',
          imageOverride: '',
          tagline: 'Say it in cupcake form.',
          blurb:
            'Rose petal, raspberry and dark chocolate cupcakes wrapped in a love-letter box. Delivered on the day, never before.',
          badge: '5 boxes',
          span: 'wide',
        },
      ],
    },
    category_showcase: {
      enabled: true,
      eyebrow: 'Shop the collection',
      title: 'Browse our',
      titleAccent: 'favourite places to begin.',
      description: '',
      ctaLabel: 'View entire menu',
      ctaHref: '/collections/all-items',
      tiles: [
        {
          collectionHandle: 'bestsellers',
          imageOverride: FALLBACK_IMAGE,
          tagline: 'Bestsellers',
          blurb: 'The boxes Melbourne keeps coming back for — hand-frosted, gift-ready.',
          badge: 'Most loved · 8 boxes',
          span: 'short',
        },
        {
          collectionHandle: 'cakes',
          imageOverride:
            'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1000&q=80',
          tagline: 'Round Cakes',
          blurb: 'Six-inch and eight-inch layered cakes — baked fresh to order and iced with soft buttercream.',
          badge: 'Eight flavours',
          span: 'short',
        },
        {
          collectionHandle: 'birthday-cupcakes',
          imageOverride:
            'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1000&q=80',
          tagline: 'Birthday Boxes',
          blurb: 'Bright sprinkles, candy toppers and birthday-sized smiles — our most-ordered themed box.',
          badge: 'For the big day',
          span: 'short',
        },
        {
          collectionHandle: 'wedding-cupcakes',
          imageOverride:
            'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1000&q=80',
          tagline: 'Wedding Cupcakes',
          blurb: 'Tiered towers and bridal-shower boxes — custom colours, your flavour combo.',
          badge: 'Custom & elegant',
          span: 'short',
        },
        {
          collectionHandle: 'deluxe-cupcakes',
          imageOverride:
            'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1000&q=80',
          tagline: 'Deluxe Cupcakes',
          blurb: 'Premium flavours, bigger swirls, finished with ganache, brittle and gold leaf.',
          badge: 'Signature range',
          span: 'short',
        },
        {
          collectionHandle: 'macarons',
          imageOverride:
            'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=1000&q=80',
          tagline: 'Macarons',
          blurb: 'Almond-meal shells with silky ganache centres — sold by the box of 12.',
          badge: 'Box of 12',
          span: 'short',
        },
      ],
    },
  }
}

function mergeProductSection(
  defaults: HomepageProductSectionConfig,
  incoming?: Partial<HomepageProductSectionConfig> | null
): HomepageProductSectionConfig {
  if (!incoming) return defaults
  return {
    enabled: incoming.enabled ?? defaults.enabled,
    collectionHandle: incoming.collectionHandle ?? defaults.collectionHandle,
    layoutStyle: incoming.layoutStyle ?? defaults.layoutStyle,
    itemsPerRow: incoming.itemsPerRow ?? defaults.itemsPerRow,
    maxItems: incoming.maxItems ?? defaults.maxItems,
    eyebrow: incoming.eyebrow ?? defaults.eyebrow,
    title: incoming.title ?? defaults.title,
    titleAccent: incoming.titleAccent ?? defaults.titleAccent,
    description: incoming.description ?? defaults.description,
    ctaLabel: incoming.ctaLabel ?? defaults.ctaLabel,
    ctaHref: incoming.ctaHref ?? defaults.ctaHref,
  }
}

function mergeShowcaseSection(
  defaults: HomepageShowcaseSectionConfig,
  incoming?: Partial<HomepageShowcaseSectionConfig> | null
): HomepageShowcaseSectionConfig {
  if (!incoming) return defaults
  const tiles =
    Array.isArray(incoming.tiles) && incoming.tiles.length > 0
      ? incoming.tiles.map((tile, i) => ({
          collectionHandle: tile.collectionHandle ?? defaults.tiles[i]?.collectionHandle ?? '',
          imageOverride: tile.imageOverride ?? defaults.tiles[i]?.imageOverride ?? '',
          tagline: tile.tagline ?? defaults.tiles[i]?.tagline ?? '',
          blurb: tile.blurb ?? defaults.tiles[i]?.blurb ?? '',
          badge: tile.badge ?? defaults.tiles[i]?.badge ?? '',
          span: tile.span ?? defaults.tiles[i]?.span ?? 'short',
        }))
      : defaults.tiles

  return {
    enabled: incoming.enabled ?? defaults.enabled,
    eyebrow: incoming.eyebrow ?? defaults.eyebrow,
    title: incoming.title ?? defaults.title,
    titleAccent: incoming.titleAccent ?? defaults.titleAccent,
    description: incoming.description ?? defaults.description,
    ctaLabel: incoming.ctaLabel ?? defaults.ctaLabel,
    ctaHref: incoming.ctaHref ?? defaults.ctaHref,
    tiles,
  }
}

export function mergeHomepageSectionsConfig(
  incoming?: Partial<HomepageSectionsConfig> | null
): HomepageSectionsConfig {
  const defaults = getDefaultHomepageSectionsConfig()
  if (!incoming) return defaults

  return {
    best_sellers: mergeProductSection(defaults.best_sellers, incoming.best_sellers),
    flash_deals: mergeProductSection(defaults.flash_deals, incoming.flash_deals),
    new_arrivals: mergeProductSection(defaults.new_arrivals, incoming.new_arrivals),
    featured: mergeProductSection(defaults.featured, incoming.featured),
    trending: mergeProductSection(defaults.trending, incoming.trending),
    occasion_showcase: mergeShowcaseSection(
      defaults.occasion_showcase,
      incoming.occasion_showcase
    ),
    category_showcase: mergeShowcaseSection(
      defaults.category_showcase,
      incoming.category_showcase
    ),
  }
}

/** Legacy displaySettings.locations → homepage section keys (migration fallback). */
export const LEGACY_LOCATION_BY_SECTION: Record<HomepageProductSectionKey, string> = {
  best_sellers: 'best_seller',
  flash_deals: 'flash_deals',
  new_arrivals: 'new_arrival',
  featured: 'featured',
  trending: 'trending',
}

/** Resolved showcase data passed from server → client homepage components. */
export interface ResolvedShowcaseTile {
  handle: string
  name: string
  tagline: string
  blurb: string
  badge: string
  alt: string
  span: 'short' | 'wide'
  image: string
}

export interface ResolvedShowcaseSection {
  enabled: boolean
  eyebrow: string
  title: string
  titleAccent: string
  description: string
  ctaLabel: string
  ctaHref: string
  tiles: ResolvedShowcaseTile[]
}
