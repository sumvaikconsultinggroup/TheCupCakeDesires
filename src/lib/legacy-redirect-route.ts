import { lookupLegacyPath, lookupLegacyShopQuery } from '@/lib/legacy-redirect-map'
import { resolveLegacyPath, resolveLegacyShopQuery } from '@/lib/legacy-redirects'
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

/** Route handler factory: 301 an old site URL to its closest current page. */
export function legacyRedirect(prefix: string) {
  return async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    const pathname = `/${prefix}/${(slug || []).join('/')}`.replace(/\/+$/, '')
    const mapped = lookupLegacyPath(pathname) || lookupLegacyPath(request.nextUrl.pathname)
    if (mapped) return redirectTo(mapped, request)

    try {
      const target = await resolveLegacyPath(prefix, slug || [])
      return redirectTo(target, request)
    } catch (error) {
      console.error(`[legacy-redirect] /${prefix}/${(slug || []).join('/')} failed:`, error)
      return serviceUnavailableResponse()
    }
  }
}

/** /shop with no path: map the old WooCommerce filter query to a page. */
export async function legacyShopRoot(request: NextRequest) {
  const mappedQuery = lookupLegacyShopQuery(request.nextUrl.searchParams)
  if (mappedQuery) return redirectTo(mappedQuery, request)

  const mappedPath = lookupLegacyPath('/shop')
  if (mappedPath && !request.nextUrl.searchParams.get('filter_flavour') && !request.nextUrl.searchParams.get('product_cat')) {
    return redirectTo(mappedPath, request)
  }

  try {
    const target = await resolveLegacyShopQuery(request.nextUrl.searchParams)
    return redirectTo(target, request)
  } catch (error) {
    console.error('[legacy-redirect] /shop query failed:', error)
    return serviceUnavailableResponse()
  }
}

function collapseMappedTarget(target: string): string {
  let current = target
  const seen = new Set<string>()
  while (current && !seen.has(current)) {
    seen.add(current)
    const next = lookupLegacyPath(current)
    if (!next || next === current) break
    current = next
  }
  return current
}

function redirectTo(target: string, request: NextRequest) {
  const finalTarget = collapseMappedTarget(target)
  const url = new URL(finalTarget, request.url)
  for (const [key, value] of request.nextUrl.searchParams) {
    if (TRACKING_PARAM.test(key)) url.searchParams.append(key, value)
  }
  return NextResponse.redirect(url, {
    status: 301,
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
