import { lookupLegacyPath, lookupLegacyShopQuery } from '@/lib/legacy-redirect-map'
import { NextRequest, NextResponse } from 'next/server'

const TRACKING_PARAM = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid)$/i

export function serviceUnavailableResponse() {
  return new NextResponse(null, {
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
      'Retry-After': '120',
    },
  })
}

function notFoundResponse() {
  return new NextResponse(null, {
    status: 404,
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  })
}

function normalizeLegacySlug(prefix: string, slug: string[]): string {
  const parts = (slug || []).map((s) => decodeURIComponent(s).toLowerCase().trim()).filter(Boolean)
  if (parts[parts.length - 1] === 'feed') parts.pop()
  if (parts.length === 0) return `/${prefix}`
  return `/${prefix}/${parts.join('/')}`
}

/** Route handler factory: 301 mapped legacy URLs; 404 when unmapped. */
export function legacyRedirect(prefix: string) {
  return async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    const pathname = normalizeLegacySlug(prefix, slug || [])
    const mapped =
      lookupLegacyPath(pathname) ||
      lookupLegacyPath(request.nextUrl.pathname) ||
      lookupLegacyPath(request.nextUrl.pathname.replace(/\/feed\/?$/, '') || '/')

    if (mapped) return redirectTo(mapped, request)
    return notFoundResponse()
  }
}

/** /shop with no path: map the old WooCommerce filter query to a page. */
export async function legacyShopRoot(request: NextRequest) {
  const mappedQuery = lookupLegacyShopQuery(request.nextUrl.searchParams)
  if (mappedQuery) return redirectTo(mappedQuery, request)

  const mappedPath = lookupLegacyPath('/shop')
  if (
    mappedPath &&
    !request.nextUrl.searchParams.get('filter_flavour') &&
    !request.nextUrl.searchParams.get('product_cat')
  ) {
    return redirectTo(mappedPath, request)
  }

  // Unmapped shop filters: 404 (Option B). Known filters live in the map.
  if (request.nextUrl.searchParams.get('filter_flavour') || request.nextUrl.searchParams.get('product_cat')) {
    return notFoundResponse()
  }

  if (mappedPath) return redirectTo(mappedPath, request)
  return notFoundResponse()
}

function redirectTo(target: string, request: NextRequest) {
  const url = new URL(target, request.url)
  for (const [key, value] of request.nextUrl.searchParams) {
    if (TRACKING_PARAM.test(key)) url.searchParams.append(key, value)
  }
  return NextResponse.redirect(url, {
    status: 301,
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
