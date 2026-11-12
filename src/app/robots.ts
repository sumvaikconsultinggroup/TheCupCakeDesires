import { MERCHANT_FEED_PATH } from '@/lib/merchant-catalog'
import { absoluteUrl } from '@/lib/site-url'
import { MetadataRoute } from 'next'

// Non-content endpoints and leftover WordPress/WooCommerce parameters Google
// still crawls (e.g. /?wordfence_logHuman=1, ?add-to-cart=94, ?wc-ajax=…).
// Never disallow /_next (or CSS/JS) - Googlebot needs those to render.
const DISALLOW = [
  '/admin',
  '/api',
  '/account',
  '/account-wishlists',
  '/account-billing',
  '/cart',
  '/checkout',
  '/sign-in',
  '/sign-up',
  '/order-successful',
  '/payment-failure',
  '/profile',
  '/hello-world',
  '/wc-api',
  '/wp-admin',
  '/wp-content',
  '/wp-includes',
  '/wp-json',
  '/media',
  '/*?*wordfence_logHuman=',
  '/*?*add-to-cart=',
  '/*?*wc-ajax=',
  '/*?*orderby=',
  '/*?*__clerk_handshake=',
  '/*?*s=',
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
