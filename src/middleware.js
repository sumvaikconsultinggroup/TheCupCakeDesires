import { CONTENT_SECURITY_POLICY } from '@/lib/csp.mjs'
import { isCrawlerUserAgent } from '@/lib/crawler-ua'
import { APEX_HOST, WWW_HOST, apexDestination, resolveLegacyOneHop } from '@/lib/legacy-one-hop'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/account-billing(.*)'])
const TRACKING_PARAM = /^(utm_[a-z]+|gclid|gbraid|wbraid|fbclid|msclkid)$/i

function withCsp(response) {
  response.headers.set('content-security-policy', CONTENT_SECURITY_POLICY)
  return response
}

function normalizePath(path) {
  if (!path || path === '/') return '/'
  return path.replace(/\/+$/, '') || '/'
}

/**
 * Collapse legacy slash / feed / map / www into one permanent hop.
 * Kept in middleware (not next.config) so we stay under Vercel's 2048 route limit.
 */
function legacyOneHop(req) {
  const { pathname, searchParams, host } = req.nextUrl
  const target = resolveLegacyOneHop(pathname, searchParams)

  if (target) {
    if (host === APEX_HOST && normalizePath(target) === normalizePath(pathname)) {
      return null
    }
    const dest = host === WWW_HOST ? apexDestination(target) : target
    return redirectTo(dest, req)
  }

  // www leftover (no map hit): still collapse host in one hop, keep path.
  if (host === WWW_HOST) {
    return redirectTo(apexDestination(pathname === '/' ? '/' : pathname), req)
  }

  // /shop/ with unresolved query filters → rewrite to bare /shop for the handler.
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
  const legacy = legacyOneHop(req)
  if (legacy) return legacy

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
  const legacy = legacyOneHop(req)
  if (legacy) return legacy

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
