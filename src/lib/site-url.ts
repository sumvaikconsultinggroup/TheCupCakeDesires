/** Production storefront origin — used for canonical URLs, sitemap, and JSON-LD. */
const DEFAULT_SITE_URL = 'https://thecupcakedesire.com.au'

/** Resolve the public site origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.STORE_URL ||
    DEFAULT_SITE_URL

  return raw.replace(/\/+$/, '')
}

/** Build an absolute URL from a path or full URL. */
export function absoluteUrl(path: string = '/'): string {
  if (/^https?:\/\//i.test(path)) return path

  const base = getSiteUrl()
  if (!path || path === '/') return `${base}/`

  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

/** Next.js metadataBase helper. */
export function getMetadataBase(): URL {
  return new URL(`${getSiteUrl()}/`)
}
