// SEO Configuration and Utilities

export const siteConfig = {
  name: 'The Cupcake Desire',
  description: 'Small-batch, hand-frosted cupcakes baked fresh every morning. Melbourne bakery with eggless, vegan, and classic flavours. Order gift boxes online across Australia.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://cupcakedesires.com',
  ogImage: '/og-image.jpg',
  links: {
    instagram: 'https://instagram.com/cupcakedesires',
    facebook: 'https://facebook.com/cupcakedesires',
    twitter: 'https://twitter.com/cupcakedesires',
  },
  creator: 'The Cupcake Desire',
  keywords: [
    'The Cupcake Desire',
    'Cupcakes',
    'Bakery',
    'Gift Boxes',
    'Eggless Cupcakes',
    'Vegan Cupcakes',
    'Birthday Cupcakes',
    'Cupcake Delivery Melbourne',
    'Hand-frosted Cupcakes',
    'Small Batch Bakery',
    'Desserts',
    'Customised Cupcakes',
    'Celebration Cupcakes',
    'Fresh Baked',
    'Melbourne Bakery',
    'Artisan Cupcakes',
  ],
}

function stripHtmlTags(html: string): string {
  return (
    html
      ?.replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim() || ''
  )
}

/** Truncate plain text at a word boundary under maxLen; no ellipsis. */
function truncatePlainAtWord(text: string, maxLen: number): string {
  const t = text.trim()
  if (t.length <= maxLen) return t
  const slice = t.slice(0, maxLen)
  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace > 0) return slice.slice(0, lastSpace).trim()
  return slice.trim()
}

function blogPostingPlainDescription(excerpt?: string, content?: string): string | undefined {
  const fromExcerpt = excerpt ? truncatePlainAtWord(stripHtmlTags(excerpt), 160) : ''
  if (fromExcerpt) return fromExcerpt
  if (!content) return undefined
  const fromContent = truncatePlainAtWord(stripHtmlTags(content), 160)
  return fromContent || undefined
}

// Generate Product JSON-LD Schema
export function generateProductSchema(product: {
  title: string
  description?: string
  handle: string
  images?: { src: string }[]
  variants?: { price: number; compareAtPrice?: number; sku?: string; inventoryQty?: number }[]
  reviews?: {
    star: number
    reviewerName?: string
    reviewDescription?: string
    createdAt?: string | Date
  }[]
  vendor?: string
  productCategory?: string
}) {
  const price = product.variants?.[0]?.price || 0
  const sku = product.variants?.[0]?.sku || product.handle
  const inStock = (product.variants?.[0]?.inventoryQty ?? 10) > 0
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((acc, r) => acc + r.star, 0) / product.reviews.length
    : undefined

  // Surface up to 10 individual Review entries inside the Product schema
  // (Google's preferred pattern — semantically equivalent to separate Review
  // entities with itemReviewed, and renders Review rich snippets).
  const reviewItems = product.reviews?.slice(0, 10).map((r) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: r.reviewerName || 'Verified Buyer',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(r.star),
      bestRating: '5',
      worstRating: '1',
    },
    ...(r.reviewDescription && { reviewBody: r.reviewDescription }),
    ...(r.createdAt && {
      datePublished: typeof r.createdAt === 'string'
        ? r.createdAt
        : r.createdAt.toISOString(),
    }),
  }))

  // priceValidUntil: end of next year (Google requires a future date when offers are present)
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`
  const url = `${siteConfig.url}/products/${product.handle}`

  return {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.title,
    description: product.description || `${product.title} - Freshly baked artisan cupcake from The Cupcake Desire`,
    image: product.images?.map(img => img.src) || [],
    sku: sku,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'The Cupcake Desire',
    },
    category: product.productCategory || 'Cupcakes',
    mainEntityOfPage: url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'AUD',
      price: String(price),
      priceValidUntil,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${siteConfig.url}/#organization` },
    },
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: product.reviews?.length || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(reviewItems && reviewItems.length > 0 && { review: reviewItems }),
  }
}

// Generate Organization JSON-LD Schema
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Cupcake Desire',
    url: siteConfig.url,
    logo: `${siteConfig.url}/og-image.png`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.facebook,
      siteConfig.links.twitter,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+61-3-9705-0051',
      contactType: 'customer service',
      areaServed: 'AU',
      availableLanguage: ['English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Narre Warren',
      addressRegion: 'Victoria',
      addressCountry: 'AU',
    },
  }
}

// Generate WebSite JSON-LD Schema with SearchAction
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The Cupcake Desire',
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// Generate BreadcrumbList JSON-LD Schema
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// Generate Collection/Category JSON-LD Schema
export function generateCollectionSchema(collection: {
  title: string
  handle: string
  description?: string
  products?: { title: string; handle: string; images?: { src: string }[]; variants?: { price: number }[] }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.description || `Shop ${collection.title} at The Cupcake Desire`,
    url: `${siteConfig.url}/collections/${collection.handle}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: collection.products?.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.title,
          url: `${siteConfig.url}/products/${product.handle}`,
          image: product.images?.[0]?.src,
          offers: {
            '@type': 'Offer',
            price: product.variants?.[0]?.price || 0,
            priceCurrency: 'AUD',
          },
        },
      })) || [],
    },
  }
}

// Generate Article/Blog JSON-LD Schema
export function generateArticleSchema(article: {
  title: string
  handle: string
  content?: string
  excerpt?: string
  image?: string
  author?: string
  publishedAt?: string
  updatedAt?: string
}) {
  const url = `${siteConfig.url}/blogs/${article.handle}`
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#blogposting`,
    headline: article.title,
    description: blogPostingPlainDescription(article.excerpt, article.content),
    image: article.image || `${siteConfig.url}/og-image.jpg`,
    url,
    mainEntityOfPage: url,
    datePublished: article.publishedAt || new Date().toISOString(),
    dateModified: article.updatedAt || article.publishedAt || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'The Cupcake Desire',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/og-image.png`,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Cupcake Desire',
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/og-image.png`,
      },
    },
  }
}

// Generate FAQ JSON-LD Schema
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// Generate Local Business Schema
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${siteConfig.url}/#store`,
    name: 'The Cupcake Desire',
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: '+61-3-9705-0051',
    email: 'info@thecupcakedesire.com.au',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '352 Princes Hwy',
      addressLocality: 'Narre Warren',
      addressRegion: 'Victoria',
      postalCode: '3805',
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-38.0306',
      longitude: '145.3018',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: '$$',
  }
}
