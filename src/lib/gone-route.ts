import { NextResponse } from 'next/server'

/**
 * 410 Gone for URLs that should never have existed on this domain — spam pages
 * injected into the old WordPress site (e.g. /zhHant/product/surugaya/…) and
 * WordPress/WooCommerce system endpoints. Google drops 410s faster than 404s.
 */
export function GET() {
  return new NextResponse('Gone', {
    status: 410,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  })
}
