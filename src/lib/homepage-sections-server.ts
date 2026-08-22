import connectDb from '@/lib/mongodb'
import {
  getDefaultHomepageSectionsConfig,
  LEGACY_LOCATION_BY_SECTION,
  mergeHomepageSectionsConfig,
  type HomepageProductSectionConfig,
  type HomepageProductSectionKey,
  type HomepageSectionsConfig,
  type HomepageShowcaseSectionConfig,
  type ResolvedShowcaseSection,
  type ResolvedShowcaseTile,
} from '@/lib/homepage-sections-defaults'
import Collection from '@/models/collection.model'
import HomepageSectionsSettings from '@/models/HomepageSectionsSettings'
import Product from '@/models/product.model'

const STORE_ID = 'default'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1200&q=80'

export type { ResolvedShowcaseSection, ResolvedShowcaseTile }

export interface ResolvedProductSection {
  enabled: boolean
  products: Record<string, unknown>[]
  displaySettings: {
    layoutStyle: 'grid' | 'carousel'
    itemsPerRow: number
    maxItems: number
  }
  sortOrder?: string
  collectionHandle: string | null
  copy: Pick<
    HomepageProductSectionConfig,
    'eyebrow' | 'title' | 'titleAccent' | 'description' | 'ctaLabel' | 'ctaHref'
  >
}

export async function getHomepageSectionsConfig(): Promise<HomepageSectionsConfig> {
  await connectDb()
  const doc = (await HomepageSectionsSettings.findOne({ storeId: STORE_ID }).lean()) as {
    sections?: Partial<HomepageSectionsConfig>
  } | null
  if (!doc?.sections) {
    return mergeHomepageSectionsConfig(null)
  }
  return mergeHomepageSectionsConfig(doc.sections)
}

async function getProductsByHandles(handles: string[]) {
  if (!handles.length) return []
  const products = await Product.find({
    handle: { $in: handles },
    isDeleted: false,
    published: true,
    status: 'active',
  })
    .sort({ createdAt: -1 })
    .lean()
  return JSON.parse(JSON.stringify(products)) as Record<string, unknown>[]
}

type LeanCollection = {
  handle: string
  title?: string
  image?: string
  bannerImage?: string
  sortOrder?: string
  productHandles?: string[]
  displaySettings?: { locations?: string[] }
}

function findCollectionByHandle(
  collections: LeanCollection[],
  handle: string | undefined | null
): LeanCollection | undefined {
  if (!handle) return undefined
  return collections.find((c) => c.handle === handle)
}

function findCollectionByLegacyLocation(
  collections: LeanCollection[],
  location: string
): LeanCollection | undefined {
  return collections.find((c) => c.displaySettings?.locations?.includes(location))
}

export async function resolveProductSection(
  sectionKey: HomepageProductSectionKey,
  config: HomepageProductSectionConfig,
  collections: LeanCollection[]
): Promise<ResolvedProductSection> {
  const empty: ResolvedProductSection = {
    enabled: config.enabled,
    products: [],
    displaySettings: {
      layoutStyle: config.layoutStyle,
      itemsPerRow: config.itemsPerRow,
      maxItems: config.maxItems,
    },
    sortOrder: undefined,
    collectionHandle: null,
    copy: {
      eyebrow: config.eyebrow,
      title: config.title,
      titleAccent: config.titleAccent,
      description: config.description,
      ctaLabel: config.ctaLabel,
      ctaHref: config.ctaHref,
    },
  }

  if (!config.enabled) return empty

  const collection =
    findCollectionByHandle(collections, config.collectionHandle) ||
    findCollectionByLegacyLocation(collections, LEGACY_LOCATION_BY_SECTION[sectionKey])

  if (!collection) return empty

  const products = await getProductsByHandles(collection.productHandles || [])

  return {
    enabled: true,
    products,
    displaySettings: {
      layoutStyle: config.layoutStyle,
      itemsPerRow: config.itemsPerRow,
      maxItems: config.maxItems,
    },
    sortOrder: collection.sortOrder,
    collectionHandle: collection.handle,
    copy: {
      eyebrow: config.eyebrow,
      title: config.title,
      titleAccent: config.titleAccent,
      description: config.description,
      ctaLabel: config.ctaLabel,
      ctaHref: config.ctaHref || `/collections/${collection.handle}`,
    },
  }
}

export async function resolveShowcaseSection(
  config: HomepageShowcaseSectionConfig
): Promise<ResolvedShowcaseSection> {
  const handles = config.tiles.map((t) => t.collectionHandle).filter(Boolean)
  await connectDb()

  const collectionDocs = handles.length
    ? ((await Collection.find({ handle: { $in: handles } })
        .select('handle title image bannerImage')
        .lean()) as unknown as LeanCollection[])
    : []

  const byHandle = new Map(collectionDocs.map((c) => [c.handle, c]))

  const tiles: ResolvedShowcaseTile[] = config.tiles.map((tile) => {
    const col = byHandle.get(tile.collectionHandle)
    const image =
      tile.imageOverride || col?.image || col?.bannerImage || FALLBACK_IMAGE

    return {
      handle: tile.collectionHandle,
      name: col?.title || tile.tagline || tile.collectionHandle,
      tagline: tile.tagline,
      blurb: tile.blurb,
      badge: tile.badge,
      alt: col?.title || tile.tagline || 'Collection',
      span: tile.span,
      image,
    }
  })

  return {
    enabled: config.enabled,
    eyebrow: config.eyebrow,
    title: config.title,
    titleAccent: config.titleAccent,
    description: config.description,
    ctaLabel: config.ctaLabel,
    ctaHref: config.ctaHref,
    tiles,
  }
}

export type ResolvedHomepageSections = Awaited<ReturnType<typeof loadResolvedHomepageSections>>

function buildEmptyProductSection(config: HomepageProductSectionConfig): ResolvedProductSection {
  return {
    enabled: config.enabled,
    products: [],
    displaySettings: {
      layoutStyle: config.layoutStyle,
      itemsPerRow: config.itemsPerRow,
      maxItems: config.maxItems,
    },
    sortOrder: undefined,
    collectionHandle: null,
    copy: {
      eyebrow: config.eyebrow,
      title: config.title,
      titleAccent: config.titleAccent,
      description: config.description,
      ctaLabel: config.ctaLabel,
      ctaHref: config.ctaHref,
    },
  }
}

function buildStaticShowcaseSection(config: HomepageShowcaseSectionConfig): ResolvedShowcaseSection {
  const tiles: ResolvedShowcaseTile[] = config.tiles.map((tile) => ({
    handle: tile.collectionHandle,
    name: tile.tagline || tile.collectionHandle,
    tagline: tile.tagline,
    blurb: tile.blurb,
    badge: tile.badge,
    alt: tile.tagline || 'Collection',
    span: tile.span,
    image: tile.imageOverride || FALLBACK_IMAGE,
  }))

  return {
    enabled: config.enabled,
    eyebrow: config.eyebrow,
    title: config.title,
    titleAccent: config.titleAccent,
    description: config.description,
    ctaLabel: config.ctaLabel,
    ctaHref: config.ctaHref,
    tiles,
  }
}

function buildFallbackResolvedSections(): ResolvedHomepageSections {
  const config = getDefaultHomepageSectionsConfig()
  const bestSellers = buildEmptyProductSection(config.best_sellers)
  const flashDeals = buildEmptyProductSection(config.flash_deals)
  const newArrivals = buildEmptyProductSection(config.new_arrivals)
  const trending = buildEmptyProductSection(config.trending)
  const featured = buildEmptyProductSection(config.featured)

  return {
    bestSellers,
    flashDeals,
    newArrivals,
    trending,
    featured:
      featured.products.length > 0
        ? featured
        : {
            ...bestSellers,
            collectionHandle: bestSellers.collectionHandle || 'all',
          },
    occasionShowcase: buildStaticShowcaseSection(config.occasion_showcase),
    categoryShowcase: buildStaticShowcaseSection(config.category_showcase),
  }
}

export async function loadResolvedHomepageSections() {
  const config = await getHomepageSectionsConfig()
  await connectDb()
  const collections = (await Collection.find({ published: true, isDeleted: { $ne: true } })
    .select('handle title image bannerImage sortOrder productHandles displaySettings')
    .lean()) as unknown as LeanCollection[]

  const [bestSellers, flashDeals, newArrivals, featured, trending, occasionShowcase, categoryShowcase] =
    await Promise.all([
      resolveProductSection('best_sellers', config.best_sellers, collections),
      resolveProductSection('flash_deals', config.flash_deals, collections),
      resolveProductSection('new_arrivals', config.new_arrivals, collections),
      resolveProductSection('featured', config.featured, collections),
      resolveProductSection('trending', config.trending, collections),
      resolveShowcaseSection(config.occasion_showcase),
      resolveShowcaseSection(config.category_showcase),
    ])

  const showcase =
    featured.products.length > 0
      ? featured
      : {
          ...bestSellers,
          collectionHandle: bestSellers.collectionHandle || 'all',
        }

  return {
    bestSellers,
    flashDeals,
    newArrivals,
    trending,
    featured: showcase,
    occasionShowcase,
    categoryShowcase,
  }
}

/** Storefront-safe loader — never throws when MongoDB is unreachable. */
export async function loadResolvedHomepageSectionsSafe(): Promise<ResolvedHomepageSections> {
  try {
    return await loadResolvedHomepageSections()
  } catch (error) {
    console.error('[homepage] Database unavailable, using static fallbacks:', error)
    return buildFallbackResolvedSections()
  }
}
