import { resolveLegacyPath, resolveLegacyShopQuery } from '@/lib/legacy-redirects'
import { NextRequest, NextResponse } from 'next/server'

const TRACKING_PARAM = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid)$/i

/**
 * Destinations that next.config (or the product page) 301s again.
 * Collapse here so /shop|/product|* legacy handlers return the final URL in one hop.
 * Only static, query-independent permanent redirects.
 */
const FINAL_DESTINATION: Record<string, string> = {
  '/products/make-your-own-cupcake-box': '/cupcake-builder',
  '/collections/mother-s-day': '/collections/mothers-day-cupcakes',
  '/collections/father-s-day': '/collections/fathers-day-cupcakes',
  '/collections/gourmet-minis': '/collections/mini-cupcakes',
  '/collections/pink-and-blue-mini': '/collections/mini-cupcakes',
  '/products/box-of-12-chocolate-macarons': '/products/macaron-box-12',
  '/products/chocolate-minis-box-of-12': '/products/mini-cupcake-box-24-chocolate-chocolate',
  '/products/box-of-12-pride-day-cupcakes': '/products/pride-day-cupcakes',
  '/collections/all': '/collections/all-items',
  '/bestsellers': '/collections/bestsellers',
  '/home': '/',
  '/delivery': '/cupcake-delivery',
  '/about': '/about-us',
  '/shipping': '/shipping-policy',
  '/flash-deals': '/collections/flash-deals',
  '/birthday': '/collections/birthday-cupcakes',
  '/birthdays': '/collections/birthday-cupcakes',
  '/collections/birthdays': '/collections/birthday-cupcakes',
  '/cupcakes': '/collections/all-items',
  '/cupcakes/melbourne': '/collections/all-items',
}

function finalizeLegacyTarget(target: string): string {
  const path = (target.split(/[?#]/)[0] || '/').replace(/\/$/, '') || '/'
  const next = FINAL_DESTINATION[path]
  return next || target
}

/** Route handler factory: 301 an old site URL to its closest current page. */
export function legacyRedirect(prefix: string) {
  return async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    let target = '/collections/all-items'
    try {
      target = await resolveLegacyPath(prefix, slug || [])
    } catch (error) {
      console.error(`[legacy-redirect] /${prefix}/${(slug || []).join('/')} failed:`, error)
    }
    return redirectTo(finalizeLegacyTarget(target), request)
  }
}

/** /shop with no path: map the old WooCommerce filter query to a page. */
export async function legacyShopRoot(request: NextRequest) {
  let target = '/collections/all-items'
  try {
    target = await resolveLegacyShopQuery(request.nextUrl.searchParams)
  } catch (error) {
    console.error('[legacy-redirect] /shop query failed:', error)
  }
  return redirectTo(finalizeLegacyTarget(target), request)
}

function redirectTo(target: string, request: NextRequest) {
  const url = new URL(target, request.url)
  // Keep ad/campaign tracking only; drop WooCommerce params like ?product-page=3.
  for (const [key, value] of request.nextUrl.searchParams) {
    if (TRACKING_PARAM.test(key)) url.searchParams.append(key, value)
  }
  return NextResponse.redirect(url, {
    status: 301,
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  })
}
