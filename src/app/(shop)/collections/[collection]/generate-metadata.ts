import { COLLECTION_SEO } from '@/data/collection-seo'
import {
  HALLOWEEN_COLLECTION_FALLBACKS,
  isHalloweenCollectionHandle,
} from '@/data/halloween-2026'
import { ALL_CUPCAKES_HANDLE } from '@/lib/cupcake-catalog'
import { assertCompleteStorefrontMetadata } from '@/lib/isr-metadata'
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

/**
 * Collection <head> for ISR. DB errors throw so the last good page stays
 * cached. Never return a title-only or canonical-less head.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection: handle } = await params

  let collection = (await getCollectionByHandle(handle)) as any
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
  const rawDescription =
    curated?.description || collection?.seo?.description || collection?.description || hardcodedMeta.description
  const keywords = collection?.tags || hardcodedMeta.keywords
  const pageTitle = withBrand(rawTitle)
  const canonical =
    (typeof collection?.seo?.canonical === 'string' && collection.seo.canonical.trim()) ||
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
