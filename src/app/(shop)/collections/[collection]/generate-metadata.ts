import { COLLECTION_SEO } from '@/data/collection-seo'
import {
  HALLOWEEN_COLLECTION_FALLBACKS,
  isHalloweenCollectionHandle,
} from '@/data/halloween-2026'
import { ALL_CUPCAKES_HANDLE } from '@/lib/cupcake-catalog'
import { assertCompleteStorefrontMetadata, pickMetaDescription } from '@/lib/isr-metadata'
import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { siteConfig } from '@/lib/seo'
import { withBrand } from '@/lib/seo-title'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { getCollectionByHandle } from '@/lib/storefront-catalog'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { collectionMeta } from './collection-meta'

interface Props {
  params: Promise<{ collection: string }>
}

export type CollectionMetadataReader = (handle: string) => Promise<unknown>

/**
 * Testable collection metadata builder. Pass `readCollection` in tests to
 * simulate null (404) or rejecting (DB failure) catalogue reads.
 */
export async function buildCollectionMetadata(
  handle: string,
  readCollection: CollectionMetadataReader = getCollectionByHandle
): Promise<Metadata> {
  let collection = (await readCollection(handle)) as any
  if (!collection && isHalloweenCollectionHandle(handle)) {
    collection = HALLOWEEN_COLLECTION_FALLBACKS[handle]
  }

  if (handle !== 'all-items' && handle !== ALL_CUPCAKES_HANDLE && !collection) {
    notFound()
  }

  const hardcodedMeta = collectionMeta[handle] || {
    title: handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Shop hand-frosted ${handle.replace(/-/g, ' ')} at The Cupcake Desire Melbourne.`,
    keywords: ['cupcakes', handle.replace(/-/g, ' ')],
  }

  const curated = COLLECTION_SEO[handle]
  const rawTitle = curated?.title || collection?.seo?.title || collection?.title || hardcodedMeta.title
  // CMS may save a short description; fall back to curated/hardcoded so a short
  // admin blurb never 500s a cold ISR regeneration.
  const rawDescription = pickMetaDescription(
    collection?.seo?.description,
    collection?.description,
    curated?.description,
    hardcodedMeta.description
  )
  const keywords = collection?.tags || hardcodedMeta.keywords
  const pageTitle = withBrand(rawTitle)
  // Prefer /deals as the absolute canonical for the flash-deals collection alias
  // (same host-absolute pattern as src/app/(shop)/deals/layout.tsx).
  const FLASH_DEALS_CANONICAL = 'https://thecupcakedesire.com.au/deals'
  const canonical =
    handle === 'flash-deals'
      ? FLASH_DEALS_CANONICAL
      : (typeof collection?.seo?.canonical === 'string' && collection.seo.canonical.trim()) ||
        `/collections/${handle}`

  const { title, description, canonical: safeCanonical } = assertCompleteStorefrontMetadata(
    { title: pageTitle, description: rawDescription, canonical },
    `collections/${handle}`
  )

  const baseMetadata: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: safeCanonical,
    },
    openGraph: {
      images: [curated?.image || collection?.image || DEFAULT_OG_IMAGE],
      type: 'website',
      title,
      description,
      url: `${siteConfig.url}/collections/${handle}`,
      siteName: 'The Cupcake Desire',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [curated?.image || collection?.image || DEFAULT_OG_IMAGE],
    },
    robots: collection?.seo?.robots
      ? {
          index: collection.seo.robots.index,
          follow: collection.seo.robots.follow,
          noarchive: collection.seo.robots.noarchive,
          nosnippet: collection.seo.robots.nosnippet,
          noimageindex: collection.seo.robots.noimageindex,
        }
      : {
          index: true,
          follow: true,
        },
  }

  if (handle === 'all-items') {
    const withPageSeo = await applyPageSEOMetadata('collections-all', baseMetadata)
    assertCompleteStorefrontMetadata(
      {
        title: typeof withPageSeo.title === 'string' ? withPageSeo.title : title,
        description: typeof withPageSeo.description === 'string' ? withPageSeo.description : description,
        canonical:
          typeof withPageSeo.alternates?.canonical === 'string'
            ? withPageSeo.alternates.canonical
            : safeCanonical,
      },
      `collections/${handle}/page-seo`
    )
    return withPageSeo
  }

  return baseMetadata
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection: handle } = await params
  return buildCollectionMetadata(handle)
}
