import { CONTENT_SECURITY_POLICY } from '@/lib/csp.mjs'
import { isCrawlerUserAgent } from '@/lib/crawler-ua'
import { lookupLegacyPath, lookupLegacyShopQuery } from '@/lib/legacy-redirect-map'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/account-billing(.*)'])
const TRACKING_PARAM = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid)$/i

function withCsp(response) {
  response.headers.set('content-security-policy', CONTENT_SECURITY_POLICY)
  return response
}

/**
 * /shop and /shop/ need query-aware one-hop redirects. Config cannot own bare
 * /shop because flavour filters must map to products. Collapse slash here so
 * /shop/ never pays a trailing-slash hop before the handler.
 */
function shopRootOneHop(req) {
  const { pathname, searchParams } = req.nextUrl
  if (pathname !== '/shop' && pathname !== '/shop/') return null

  const mappedQuery = lookupLegacyShopQuery(searchParams)
  if (mappedQuery) return redirectTo(mappedQuery, req)

  if (!searchParams.get('filter_flavour') && !searchParams.get('product_cat')) {
    const mappedPath = lookupLegacyPath('/shop')
    if (mappedPath) return redirectTo(mappedPath, req)
  }

  if (pathname === '/shop/') {
    const url = req.nextUrl.clone()
    url.pathname = '/shop'
    return withCsp(NextResponse.rewrite(url))
  }

  return null
}

function redirectTo(target, req) {
  const url = new URL(target, req.url)
  for (const [key, value] of req.nextUrl.searchParams) {
    if (TRACKING_PARAM.test(key)) url.searchParams.append(key, value)
  }
  return withCsp(
    NextResponse.redirect(url, {
      status: 301,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  )
}

/**
 * Clerk development instances 307-redirect unknown clients to
 * *.clerk.accounts.dev for a "dev browser" handshake. Screaming Frog and
 * many SEO tools refuse to follow that external domain, so they only ever
 * see the homepage URL and zero internal links.
 *
 * Skip Clerk entirely for known crawlers on public pages so they receive
 * normal HTML with <a href> links.
 */
const clerkHandler = clerkMiddleware(async (auth, req) => {
  const shop = shopRootOneHop(req)
  if (shop) return shop

  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return withCsp(NextResponse.redirect(signInUrl))
    }
  }

  return withCsp(NextResponse.next())
})

export default function middleware(req, event) {
  const shop = shopRootOneHop(req)
  if (shop) return shop

  const ua = req.headers.get('user-agent')
  if (isCrawlerUserAgent(ua) && !isProtectedRoute(req)) {
    return withCsp(NextResponse.next())
  }
  return clerkHandler(req, event)
}

export const config = {
  matcher: [
    // Skip Clerk on high-frequency public APIs to cut Fluid provisioned memory.
    '/((?!_next|api/stripe/webhook|api/analytics|api/live-chat|api/live|order-successful|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|woff2?|ico)).*)',
  ],
}
