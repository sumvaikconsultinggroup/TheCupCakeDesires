import { MERCHANT_FEED_PATH } from '@/lib/merchant-catalog'
import { absoluteUrl } from '@/lib/site-url'
import { MetadataRoute } from 'next'

// Leftover WordPress/WooCommerce plugin parameters Google still crawls
// (e.g. /?wordfence_logHuman=1, ?add-to-cart=94, ?wc-ajax=…) — no content.
const DISALLOW = [
  '/admin',
  '/api',
  '/account',
  '/checkout',
  '/sign-in',
  '/sign-up',
  '/*?*wordfence_logHuman=',
  '/*?*add-to-cart=',
  '/*?*wc-ajax=',
  '/*?*orderby=',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', MERCHANT_FEED_PATH],
        disallow: DISALLOW,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', MERCHANT_FEED_PATH],
        disallow: DISALLOW,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
