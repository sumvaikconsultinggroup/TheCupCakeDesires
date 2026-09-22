import { absoluteUrl } from '@/lib/site-url'

/**
 * Global JSON-LD entities that should appear on every public page.
 *
 * These are merged into a single `@graph` script tag by the `<JsonLd />`
 * component, alongside any page-specific entities (Product, Article,
 * BreadcrumbList, FAQPage, etc.).
 *
 * Linked by `@id` so Google understands the WebSite is published by the same
 * Organization and doesn't treat them as duplicates.
 *
 * TICKET-06/08: Full NAP LocalBusiness/Bakery schema with Melbourne Metro areaServed.
 * No weekend delivery encoded in schema (provisional).
 */
export const globalJsonLdItems: Record<string, any>[] = [
  {
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization'),
    name: 'The Cupcake Desire',
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/og-image.png'),
      width: 1200,
      height: 630,
    },
    sameAs: [
      'https://www.instagram.com/thecupcakedesire/',
      'https://www.facebook.com/thecupcakedesire/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+61-3-9705-0051',
      contactType: 'customer service',
      availableLanguage: ['en'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '352 Princes Hwy',
      addressLocality: 'Narre Warren',
      addressRegion: 'VIC',
      postalCode: '3805',
      addressCountry: 'AU',
    },
    description: 'Small-batch, hand-frosted cupcakes baked fresh every morning.',
  },
  {
    '@type': ['Bakery', 'LocalBusiness'],
    '@id': absoluteUrl('/#business'),
    name: 'The Cupcake Desire',
    url: absoluteUrl('/'),
    telephone: '+61-3-9705-0051',
    description:
      'Online bakery kitchen in Narre Warren — bake-to-order cupcakes delivered across Melbourne Metro. No walk-in store.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '352 Princes Hwy',
      addressLocality: 'Narre Warren',
      addressRegion: 'VIC',
      postalCode: '3805',
      addressCountry: 'AU',
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Melbourne',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Melbourne Metro',
      },
    ],
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/og-image.png'),
      width: 1200,
      height: 630,
    },
    sameAs: [
      'https://www.instagram.com/thecupcakedesire/',
      'https://www.facebook.com/thecupcakedesire/',
    ],
    parentOrganization: {
      '@id': absoluteUrl('/#organization'),
    },
  },
  {
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: 'The Cupcake Desire',
    url: absoluteUrl('/'),
    description: 'Small-batch, hand-frosted cupcakes baked fresh every morning.',
    publisher: {
      '@id': absoluteUrl('/#organization'),
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/collections/all-items?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  },
]
