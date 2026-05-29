import { unstable_cache } from 'next/cache'
import PageSEO from '@/models/PageSEO'
import { Metadata } from 'next'
import connectDb from './mongodb'

interface PageSEOData {
  robots?: {
    index?: boolean
    follow?: boolean
    noarchive?: boolean
    nosnippet?: boolean
    noimageindex?: boolean
  }
  canonical?: string
}

// Cache the DB query — revalidates every 60s so admin changes propagate within a minute
const getCachedPageSEO = unstable_cache(
  async (pageId: string): Promise<PageSEOData | null> => {
    try {
      await connectDb()
      const pageSEO = (await PageSEO.findOne({ pageId }).lean()) as any

      if (!pageSEO) {
        return null
      }

      return {
        robots: pageSEO.robots,
        canonical: pageSEO.canonical,
      }
    } catch (error) {
      console.error(`Error fetching SEO for page ${pageId}:`, error)
      return null
    }
  },
  ['page-seo'],
  { revalidate: 60, tags: ['page-seo'] }
)

export async function getPageSEO(pageId: string): Promise<PageSEOData | null> {
  return getCachedPageSEO(pageId)
}

export async function applyPageSEOMetadata(pageId: string, baseMetadata: Metadata): Promise<Metadata> {
  const seoData = await getPageSEO(pageId)

  if (!seoData) {
    return baseMetadata
  }

  const metadata: Metadata = {
    ...baseMetadata,
  }

  // Apply robots from DB if present
  if (seoData.robots) {
    metadata.robots = {
      index: seoData.robots.index !== false,
      follow: seoData.robots.follow !== false,
      noarchive: seoData.robots.noarchive ?? false,
      nosnippet: seoData.robots.nosnippet ?? false,
      noimageindex: seoData.robots.noimageindex ?? false,
    }
  }

  // Apply canonical: DB value takes priority, otherwise keep base canonical
  metadata.alternates = {
    ...baseMetadata.alternates,
    canonical: seoData.canonical ?? baseMetadata.alternates?.canonical,
  }

  return metadata
}
