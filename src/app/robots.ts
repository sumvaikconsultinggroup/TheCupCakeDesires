import { absoluteUrl } from '@/lib/site-url'
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/account', '/checkout', '/sign-in', '/sign-up'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api', '/account', '/checkout', '/sign-in', '/sign-up'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
