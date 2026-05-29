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

export default function NewArrivals({ products, displaySettings, sortOrder, collectionHandle }: Props) {
  const settings = { itemsPerRow: 4, maxItems: 8, ...displaySettings }
  const sorted = sortProducts(products || [], sortOrder)
  const list = sorted.slice(0, settings.maxItems)
  if (list.length === 0) return null

  return (
    <CakeSection background="ivory">
      <SectionHeader
        eyebrow="Just out of the oven"
        title="New for"
        titleAccent="the season."
        description="Seasonal experiments we’re testing — pistachio rose, salted miso caramel, lemon olive oil, and a couple of recipes we’re still perfecting."
        ctaLabel="See all new arrivals"
        ctaHref={`/collections/${collectionHandle || 'new'}`}
      />
      <div className={`grid gap-6 md:gap-8 ${gridColsClass(settings.itemsPerRow)}`}>
        {list.map((p, i) => (
          <CakeProductCard key={p._id} product={p} index={i} badge="New" badgeTone="rose" />
        ))}
      </div>
    </CakeSection>
  )
}
