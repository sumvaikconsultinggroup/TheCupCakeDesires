'use client'

import {
  CakeProductCard,
  CakeSection,
  DisplaySettings,
  Product,
  SectionHeader,
  gridColsClass,
  sortProducts,
} from './_shared'

interface Props {
  products: Product[]
  displaySettings?: DisplaySettings | null
  sortOrder?: string
  collectionHandle?: string | null
}

export default function BestSellers({ products, displaySettings, sortOrder, collectionHandle }: Props) {
  const settings = { itemsPerRow: 4, maxItems: 8, ...displaySettings }
  const sorted = sortProducts(products || [], sortOrder)
  const list = sorted.slice(0, settings.maxItems)
  if (list.length === 0) return null

  return (
    <CakeSection background="ivory">
      <SectionHeader
        eyebrow="Most loved this week"
        title="Bestsellers from"
        titleAccent="our kitchen."
        description="The classics our regulars come back for — vanilla bean, red velvet, salted caramel, and a few more we’ve fought to keep on the menu."
        ctaLabel="See all bestsellers"
        ctaHref={`/collections/${collectionHandle || 'bestsellers'}`}
      />
      <div className={`grid gap-6 md:gap-8 ${gridColsClass(settings.itemsPerRow)}`}>
        {list.map((p, i) => (
          <CakeProductCard
            key={p._id}
            product={p}
            index={i}
            badge={i < 3 ? `No. ${i + 1}` : undefined}
            badgeTone="cream"
          />
        ))}
      </div>
    </CakeSection>
  )
}
