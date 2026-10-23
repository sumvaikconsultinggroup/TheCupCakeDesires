import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const APEX_HOST = 'thecupcakedesire.com.au'

/**
 * Collapse www + trailing-slash (+ known alias) into a single 301 when the
 * request reaches Next. Vercel’s domain-level www redirect may still win in
 * production; this covers previews and any host that hits the app as www.
 *
 * Apex trailing-slash → final alias is already handled in next.config
 * (skipTrailingSlashRedirect + withSlashVariants). Middleware only acts when
 * the host is www.* so we do not double-redirect apex traffic.
 */
export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get('host') || ''
  const host = hostHeader.split(':')[0]?.toLowerCase() || ''
  if (host !== `www.${APEX_HOST}`) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl
  const stripped =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  // next.config www has:host rules map aliases; middleware ensures any other
  // www path still lands on apex without a trailing slash in one hop.
  const target = new URL(`https://${APEX_HOST}${stripped || '/'}${search}`)
  return NextResponse.redirect(target, 301)
}

export const config = {
  matcher: [
    // Skip Next internals and common static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|map|txt|xml|webmanifest)$).*)',
  ],
}
