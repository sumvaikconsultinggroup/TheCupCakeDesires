// SEO Configuration and Utilities

import { BRAND_NAME } from '@/lib/brand'
import { DELIVERY_FEE_NEAR, FREE_DELIVERY_THRESHOLD } from '@/utils/deliveryZones'
import { getSiteUrl } from '@/lib/site-url'

export const siteConfig = {
  name: BRAND_NAME,
  description: 'Small-batch, hand-frosted cupcakes baked to order in Narre Warren. Eggless, vegan and classic flavours, delivered across Melbourne Metro. Online orders only.',
  url: getSiteUrl(),
  ogImage: '/og-image.png',
  links: {
    instagram: 'https://www.instagram.com/thecupcakedesire/',
    facebook: 'https://www.facebook.com/thecupcakedesire/',
    twitter: 'https://twitter.com/cupcakedesires',
  },
  creator: BRAND_NAME,
  keywords: [
    BRAND_NAME,
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
// Mirrors src/utils/deliveryZones.ts and the shipping / refund policy pages:
// Victoria (Melbourne Metro) only, weekday hand delivery, next day when ordered
// before noon, $9.95 standard zone fee, free from $100. Perishable, so no
// returns — damaged or wrong items are refunded or remade without a return.
const MERCHANT_RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'AU',
  returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
  merchantReturnLink: `${siteConfig.url}/refund-policy`,
}

/** Current Melbourne UTC offset, e.g. "+11:00" in daylight saving. */
function melbourneUtcOffset() {
  const name = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', timeZoneName: 'longOffset' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value
  return name?.replace('GMT', '') || '+10:00'
}

function productShippingDetails(price: number) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: price >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_NEAR,
      currency: 'AUD',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'AU',
      addressRegion: 'VIC',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
      cutoffTime: `12:00:00${melbourneUtcOffset()}`,
      businessDays: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(
          (d) => `https://schema.org/${d}`
        ),
      },
    },
  }
}

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
  /** Rating over every approved review; falls back to the reviews passed in. */
  ratingSummary?: { average: number; count: number }
}) {
  const price = product.variants?.[0]?.price || 0
  const sku = product.variants?.[0]?.sku || product.handle
  const inStock = (product.variants?.[0]?.inventoryQty ?? 10) > 0
  const ratingCount = product.ratingSummary?.count || product.reviews?.length || 0
  const avgRating = product.ratingSummary?.count
    ? product.ratingSummary.average
    : product.reviews?.length
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
      shippingDetails: productShippingDetails(Number(price)),
      hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    },
    ...(avgRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: ratingCount,
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
    logo: `${siteConfig.url}/images/Cupcake-Logo.png`,
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
    image: article.image || `${siteConfig.url}/og-image.png`,
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
    '@type': ['Bakery', 'LocalBusiness'],
    '@id': `${siteConfig.url}/#business`,
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
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
    priceRange: '$$',
  }
}
