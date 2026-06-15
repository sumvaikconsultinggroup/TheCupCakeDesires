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
  eyebrow?: string
  title?: string
  titleAccent?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}

export default function TrendingProducts({
  products,
  displaySettings,
  sortOrder,
  collectionHandle,
  eyebrow = 'Trending in the city',
  title = 'What everyone is',
  titleAccent = 'ordering.',
  description = 'The flavours your neighbours have been picking up on their way home this week.',
  ctaLabel = 'Browse the menu',
  ctaHref,
}: Props) {
  const settings = { itemsPerRow: 4, maxItems: 4, ...displaySettings }
  const sorted = sortProducts(products || [], sortOrder)
  const list = sorted.slice(0, settings.maxItems)
  if (list.length === 0) return null

  return (
    <CakeSection background="cream">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        titleAccent={titleAccent}
        description={description}
        ctaLabel={ctaLabel}
        ctaHref={
          ctaHref ||
          (collectionHandle ? `/collections/${collectionHandle}` : '/collections/all')
        }
      />
      <div className={`grid gap-6 md:gap-8 ${gridColsClass(settings.itemsPerRow)}`}>
        {list.map((p, i) => (
          <CakeProductCard key={p._id} product={p} index={i} badge="Trending" badgeTone="gold" />
        ))}
      </div>
    </CakeSection>
  )
}
