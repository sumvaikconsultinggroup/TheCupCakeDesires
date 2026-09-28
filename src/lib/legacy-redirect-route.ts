import { resolveLegacyPath } from '@/lib/legacy-redirects'
import { NextRequest, NextResponse } from 'next/server'

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
    const url = new URL(target, request.url)
    url.search = request.nextUrl.search // keep gclid / utm_* on ad clicks
    return NextResponse.redirect(url, {
      status: 301,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  }
}
