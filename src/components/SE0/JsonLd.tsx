import { globalJsonLdItems } from '@/lib/jsonLd'

interface JsonLdProps {
  /**
   * Page-specific schema entities to add to the `@graph` array,
   * e.g. Product, Article, BreadcrumbList, FAQPage, CollectionPage.
   * They are merged with the global Organization + WebSite items
   * and emitted as a single <script type="application/ld+json"> tag.
   */
  data?: Record<string, any> | Record<string, any>[]
}

export default function JsonLd({ data }: JsonLdProps) {
  const pageItems = data ? (Array.isArray(data) ? data : [data]) : []

  const merged = {
    '@context': 'https://schema.org',
    '@graph': [...globalJsonLdItems, ...pageItems],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(merged) }}
    />
  )
}
