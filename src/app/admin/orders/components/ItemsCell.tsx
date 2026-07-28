'use client'

import { parseCupcakeContents } from '@/lib/cupcake-builder-images'
import Image from 'next/image'

export interface OrderItem {
  productId?: string
  name?: string
  quantity?: number
  price?: number
  imageUrl?: string
  variants?: { name?: string; option?: string }[]
  /** Corporate logo artwork attached to this line. */
  logoUrl?: string
}
export interface ItemsCellProps {
  items: OrderItem[]
}

export default function ItemsCell({ items }: ItemsCellProps) {
  if (!items || items.length === 0) return <span className="text-xs text-neutral-400">No items</span>
  const first = items[0],
    more = items.length - 1
  const totalQty = items.reduce((s, i) => s + (i.quantity ?? 0), 0)
  const firstContents = first.variants?.find((v) => v.name === 'Contents')?.option
  const firstFlavours = parseCupcakeContents(firstContents)
  // Any line in the order needing artwork printed — worth seeing without
  // opening the order.
  const hasLogo = items.some((i) => i.logoUrl || i.variants?.some((v) => v.name === 'Logo'))
  return (
    <div className="group relative flex min-w-0 items-center gap-2">
      {first.imageUrl ? (
        <Image
          src={first.imageUrl}
          alt={first.name ?? 'Product'}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-md bg-neutral-100 object-cover dark:bg-neutral-800"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800" />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {first.name ?? 'Product'} &times; {first.quantity ?? 1}
          {hasLogo && (
            <span className="ml-1.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
              LOGO
            </span>
          )}
        </span>
        {more > 0 && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            + {more} more &middot; {totalQty} total
          </span>
        )}
        {firstFlavours.length > 0 && (
          <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {firstFlavours.map((flavour) => `${flavour.quantity}x ${flavour.name}`).join(', ')}
          </span>
        )}
      </div>
      {items.length > 1 && (
        <div className="invisible absolute top-full left-0 z-30 mt-1 min-w-[200px] rounded-md bg-neutral-900 p-2 text-xs text-white shadow-lg group-hover:visible">
          {items.map((it, i) => (
            <div key={it.productId ?? it.name ?? i} className="flex justify-between gap-3 py-0.5">
              <span className="truncate">{it.name}</span>
              <span className="shrink-0 font-mono">&times; {it.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
