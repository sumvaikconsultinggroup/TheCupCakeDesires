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
    sitemap: 'https://gibbonnutrition.com/sitemap.xml',
  }
}
