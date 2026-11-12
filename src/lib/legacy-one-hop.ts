import { lookupLegacyPath, lookupLegacyShopQuery } from '@/lib/legacy-redirect-map'

export const APEX_HOST = 'thecupcakedesire.com.au'
export const WWW_HOST = `www.${APEX_HOST}`

const MACARON = /^\/(?:shop\/macarons|product)\/box-of-12-[^/]+-macarons(?:\/feed)?\/?$/i

/**
 * Resolve a legacy request to its final storefront path in one hop.
 * Handles trailing slash, /feed, shop queries, macaron patterns, and map keys.
 * Returns null when the path should continue to a route handler / page.
 */
export function resolveLegacyOneHop(
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  const raw = pathname || '/'

  if (raw === '/shop' || raw === '/shop/') {
    const viaQuery = lookupLegacyShopQuery(searchParams)
    if (viaQuery) return viaQuery
    if (!searchParams.get('filter_flavour') && !searchParams.get('product_cat')) {
      return lookupLegacyPath('/shop') || null
    }
    // Unknown shop filters: let the /shop route handler resolve (DB).
    return null
  }

  if (MACARON.test(raw)) return '/products/macaron-box-12'

  const candidates: string[] = []
  const push = (value: string) => {
    const normalized = value || '/'
    if (!candidates.includes(normalized)) candidates.push(normalized)
  }

  push(raw)
  if (raw !== '/' && raw.endsWith('/')) push(raw.replace(/\/+$/, '') || '/')

  const stripped = raw.replace(/\/+$/, '') || '/'
  if (stripped === '/feed' || stripped.endsWith('/feed')) {
    push(stripped)
    const withoutFeed = stripped === '/feed' ? '/' : stripped.slice(0, -'/feed'.length) || '/'
    push(withoutFeed)
  }

  for (const candidate of candidates) {
    const mapped = lookupLegacyPath(candidate)
    if (mapped) return mapped
  }

  // Pattern aliases kept out of the map / config bulk list.
  if (stripped === '/blog' || stripped === '/blogs/news') return '/blogs'
  if (stripped.startsWith('/blog/')) return `/blogs/${stripped.slice('/blog/'.length)}`
  if (stripped.startsWith('/blogs/news/')) return `/blogs/${stripped.slice('/blogs/news/'.length)}`

  // Unknown /.../feed → the page path (one hop, may 404).
  if (stripped === '/feed') return '/'
  if (stripped.endsWith('/feed')) return stripped.slice(0, -'/feed'.length) || '/'

  // Unknown trailing slash → strip (one hop). skipTrailingSlashRedirect relies on this.
  if (raw !== '/' && raw.endsWith('/')) return stripped

  return null
}

export function apexDestination(path: string): string {
  if (!path || path === '/') return `https://${APEX_HOST}/`
  return `https://${APEX_HOST}${path.startsWith('/') ? path : `/${path}`}`
}
