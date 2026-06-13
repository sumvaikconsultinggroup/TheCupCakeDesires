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

export default function FlashDeals({
  products,
  displaySettings,
  sortOrder,
  collectionHandle,
  eyebrow = 'Today only · ends midnight',
  title = 'The baker’s',
  titleAccent = 'favourites.',
  description = 'Same morning butter, same vanilla bean — at a friendlier price. Only a handful of boxes per flavour while they last.',
  ctaLabel = 'All deals',
  ctaHref,
}: Props) {
  const settings = { itemsPerRow: 4, maxItems: 4, ...displaySettings }
  const sorted = sortProducts(products || [], sortOrder)
  const list = sorted.slice(0, settings.maxItems)
  if (list.length === 0) return null

  return (
    <CakeSection background="rose">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        titleAccent={titleAccent}
        description={description}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref || `/collections/${collectionHandle || 'deals'}`}
      />
      <div className={`grid gap-6 md:gap-8 ${gridColsClass(settings.itemsPerRow)}`}>
        {list.map((p, i) => (
          <CakeProductCard key={p._id} product={p} index={i} badge="Today only" badgeTone="dark" />
        ))}
      </div>
    </CakeSection>
  )
}
