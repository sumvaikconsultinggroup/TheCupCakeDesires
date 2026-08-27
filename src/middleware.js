import { isCrawlerUserAgent } from '@/lib/crawler-ua'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/account(.*)', '/account-billing(.*)'])

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://www.googletagmanager.com https://www.google-analytics.com https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://challenges.cloudflare.com",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://*.clerk.com https://api.clerk.dev https://www.google-analytics.com https://analytics.google.com",
  "img-src 'self' data: blob: https://img.clerk.com https://images.unsplash.com https://unsplash.com https://images.pexels.com https://res.cloudinary.com https://cdn.shopify.com https://thecupcakedesire.com.au https://www.youtube.com",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://www.google.com https://maps.google.com",
  "form-action *",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
].join('; ')

function withCsp(response) {
  response.headers.set('content-security-policy', cspHeader)
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
