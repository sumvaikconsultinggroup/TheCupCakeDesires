/**
 * Global JSON-LD entities that should appear on every public page.
 *
 * These are merged into a single `@graph` script tag by the `<JsonLd />`
 * component, alongside any page-specific entities (Product, Article,
 * BreadcrumbList, FAQPage, etc.).
 *
 * Linked by `@id` so Google understands the WebSite is published by the same
 * Organization and doesn't treat them as duplicates.
 */
export const globalJsonLdItems: Record<string, any>[] = [
  {
    '@type': 'Organization',
    '@id': 'https://cupcakedesires.com/#organization',
    name: 'CupCake Desires',
    url: 'https://cupcakedesires.com/',
    logo: {
      '@type': 'ImageObject',
      url: 'https://cupcakedesires.com/og-image.png',
      width: 1200,
      height: 630,
    },
    sameAs: [
      'https://www.instagram.com/cupcakedesires/',
      'https://www.facebook.com/cupcakedesires/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+61398765432',
      contactType: 'customer service',
      areaServed: 'AU',
      availableLanguage: ['en'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
    },
    description: 'Small-batch, hand-frosted cupcakes baked fresh every morning.',
  },
  {
    '@type': 'WebSite',
    '@id': 'https://cupcakedesires.com/#website',
    name: 'CupCake Desires',
    url: 'https://cupcakedesires.com/',
    description: 'Small-batch, hand-frosted cupcakes baked fresh every morning.',
    publisher: {
      '@id': 'https://cupcakedesires.com/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://cupcakedesires.com/collections/all-items?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },
]
