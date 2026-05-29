'use client'

import { ShoppingBag } from 'lucide-react'
import { useAside } from '../aside'
import { useCart } from '../useCartStore'

export default function CartBtn() {
  const { open: openAside } = useAside()
  const totalItems = useCart((state) => state.totalItems)

  return (
    <button
      onClick={() => openAside('cart')}
      aria-label="Open cart"
      className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-cocoa transition-colors hover:bg-cream-deep focus-visible:outline-0"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
      {totalItems > 0 && (
        <span className="font-bake-body absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-accent px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-ivory">
          {totalItems}
        </span>
      )}
    </button>
  )
}
