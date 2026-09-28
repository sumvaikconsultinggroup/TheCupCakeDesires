import { CONTENT_SECURITY_POLICY } from '@/lib/csp.mjs'
import { isCrawlerUserAgent } from '@/lib/crawler-ua'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/account-billing(.*)'])

function withCsp(response) {
  response.headers.set('content-security-policy', CONTENT_SECURITY_POLICY)
  return response
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
  const ua = req.headers.get('user-agent')
  if (isCrawlerUserAgent(ua) && !isProtectedRoute(req)) {
    return withCsp(NextResponse.next())
  }
  return clerkHandler(req, event)
}

export const config = {
  matcher: [
    '/((?!_next|api/stripe/webhook|order-successful|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|woff2?|ico)).*)',
  ],
}
