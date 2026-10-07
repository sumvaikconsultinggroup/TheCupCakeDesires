import type { Metadata } from 'next'

/**
 * Metadata for utility pages (cart, search, account, order tokens).
 * index:false must also set googleBot, because the root layout allows indexing
 * and a partial robots object can leave Googlebot allowed.
 */
export function privatePageMetadata({
  title,
  description,
  canonical,
  follow = true,
}: {
  title: string
  description: string
  /** Set on single-URL pages. Omit on layouts that cover many private URLs. */
  canonical?: string
  follow?: boolean
}): Metadata {
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: {
      index: false,
      follow,
      googleBot: {
        index: false,
        follow,
      },
    },
  }
}
