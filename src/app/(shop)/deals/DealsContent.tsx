'use client'

import { CakeProductCard, Product, gridColsClass, sortProducts } from '@/components/HomePage/_shared'
import Link from 'next/link'

interface DealsContentProps {
  products: Record<string, unknown>[]
  sortOrder?: string
}

export default function DealsContent({ products, sortOrder }: DealsContentProps) {
  const sorted = sortProducts(products as unknown as Product[], sortOrder)

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-bake-display text-[24px] font-medium text-cocoa">
          No deals available right now
        </p>
        <p className="bake-body mt-3 text-taupe">
          Check back soon — we refresh our flash deals regularly.
        </p>
        <Link href="/collections/all-items" className="bake-btn mt-8 inline-flex">
          Browse all cupcakes <span aria-hidden>→</span>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className={`grid gap-6 md:gap-8 ${gridColsClass(4)}`}>
        {sorted.map((p, i) => (
          <CakeProductCard
            key={(p as Product)._id}
            product={p as Product}
            index={i}
            badge="Today only"
            badgeTone="dark"
          />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Link href="/collections/flash-deals" className="bake-btn bake-btn-ghost">
          View in collection <span aria-hidden>→</span>
        </Link>
      </div>
    </>
  )
}
