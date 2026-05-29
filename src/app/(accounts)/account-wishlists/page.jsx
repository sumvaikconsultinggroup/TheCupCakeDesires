'use client'

import { useWishlist } from '@/components/LikeButton'
import { useCart } from '@/components/useCartStore'
import { useAside } from '@/components/aside/aside'
import { useAuth } from '@clerk/nextjs'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Heart, Loader2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const Page = () => {
  const { isSignedIn, userId, isLoaded } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/sign-in?redirect_url=/account-wishlists')
  }, [isSignedIn, isLoaded, router])

  useEffect(() => {
    const fetch = async () => {
      if (!isSignedIn || !userId) {
        setLoading(false)
        return
      }
      try {
        const { data } = await axios.get('/api/wishlists')
        const wishlist = data.wishlist || []
        if (wishlist.length === 0) {
          setItems([])
          return
        }
        const productIds = wishlist.filter((w) => w.itemType === 'product').map((w) => w.productId)
        const comboIds = wishlist.filter((w) => w.itemType === 'combo').map((w) => w.comboId)
        const list = []
        if (productIds.length > 0) {
          const res = await axios.get('/api/products?all=true')
          const allProducts = res.data.data || []
          list.push(
            ...allProducts
              .filter((p) => productIds.includes(p._id))
              .map((p) => ({ ...p, itemType: 'product' }))
          )
        }
        if (comboIds.length > 0) {
          try {
            const res = await axios.get('/api/combos')
            const allCombos = res.data.combos || []
            list.push(
              ...allCombos
                .filter((c) => comboIds.includes(c._id))
                .map((c) => ({ ...c, itemType: 'combo' }))
            )
          } catch (e) {
            console.error('Error fetching combos:', e)
          }
        }
        setItems(list)
      } catch (e) {
        console.error(e)
        setError('We couldn’t load your wishlist right now.')
      } finally {
        setLoading(false)
      }
    }
    if (isSignedIn && userId) fetch()
  }, [isSignedIn, userId])

  useEffect(() => {
    const handler = (e) => {
      const { productId, comboId, itemType, isLiked } = e.detail || {}
      if (!isLiked) {
        setItems((prev) =>
          prev.filter((item) =>
            itemType === 'combo' ? item._id !== comboId : item._id !== productId
          )
        )
      }
    }
    window.addEventListener('wishlist-updated', handler)
    return () => window.removeEventListener('wishlist-updated', handler)
  }, [])

  const filtered = items.filter((item) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'products') return item.itemType === 'product'
    if (activeFilter === 'combos') return item.itemType === 'combo'
    return true
  })

  const productCount = items.filter((i) => i.itemType === 'product').length
  const comboCount = items.filter((i) => i.itemType === 'combo').length

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-cream px-5 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-rose-accent" strokeWidth={1.8} />
          <p className="bake-body-sm text-cocoa-soft">Gathering your saved bakes…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) return null

  if (error) {
    return (
      <div className="rounded-3xl border border-line bg-rose/30 p-10 text-center">
        <p className="bake-body text-cocoa-soft">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bake-btn bake-btn-ghost mt-6"
        >
          Try again
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-cream/40 p-12 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent">
          <Heart className="h-6 w-6" strokeWidth={1.6} />
        </span>
        <h2 className="font-bake-display mt-6 text-[24px] font-medium text-cocoa">
          Nothing saved yet.
        </h2>
        <p className="bake-body mt-3 max-w-[44ch] mx-auto text-cocoa-soft">
          Tap the heart on any cupcake or box to save it here — perfect for planning a future
          order or a birthday surprise.
        </p>
        <Link href="/collections/all" className="bake-btn mt-7">
          Browse the bakery
        </Link>
      </div>
    )
  }

  const filterChips = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'products', label: 'Cupcakes', count: productCount },
    { key: 'combos', label: 'Gift boxes', count: comboCount },
  ].filter((c) => c.count > 0)

  return (
    <div className="space-y-8">
      {/* Section header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="bake-eyebrow text-taupe">Saved for later</p>
          <h2 className="font-bake-display mt-1 text-[26px] font-medium text-cocoa">
            Your wishlist.{' '}
            <span className="bake-display-italic text-rose-accent">
              {items.length} {items.length === 1 ? 'bake' : 'bakes'}.
            </span>
          </h2>
        </div>
        {filterChips.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {filterChips.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveFilter(c.key)}
                className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                  activeFilter === c.key
                    ? 'bg-cocoa text-ivory'
                    : 'border border-line bg-ivory text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                }`}
              >
                {c.label} <span className="text-taupe">· {c.count}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, i) => (
          <WishlistCard key={item._id} item={item} index={i} />
        ))}
      </div>
    </div>
  )
}

function WishlistCard({ item, index }) {
  const { addItem } = useCart()
  const { open: openAside } = useAside()
  const productId = item.itemType === 'combo' ? undefined : item._id
  const comboId = item.itemType === 'combo' ? item._id : undefined
  const { isLiked, handleLike } = useWishlist({
    productId,
    comboId,
    productName: item.title || item.name,
    variant: item.variants?.[0],
    itemType: item.itemType,
    liked: true,
  })

  const variant = item.variants?.[0]
  const price = variant?.price ?? item.price ?? 0
  const compareAt = variant?.compareAtPrice
  const image = item.images?.[0]?.src || item.image
  const href = item.itemType === 'combo' ? `/combos/${item.handle}` : `/products/${item.handle}`
  const inStock = item.itemType === 'combo' ? true : (variant?.inventoryQty ?? 0) > 0

  const handleAdd = () => {
    if (!inStock || !variant) {
      toast.error('This one is sold out right now.')
      return
    }
    addItem({
      productId: item._id,
      name: item.title || item.name,
      price: variant.price,
      imageUrl: image,
      handle: item.handle,
      variant,
      quantity: 1,
    })
    openAside('cart')
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.24) }}
      className="group flex h-full flex-col"
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-cream-deep">
        <Link href={href}>
          {image ? (
            <Image
              src={image}
              alt={item.title || item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-cocoa-soft">
              <ShoppingBag className="h-6 w-6" />
            </div>
          )}
        </Link>
        {item.itemType === 'combo' && (
          <span className="bake-badge absolute left-4 top-4 bg-ivory text-cocoa">Gift box</span>
        )}
        <button
          onClick={handleLike}
          aria-label="Remove from wishlist"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent transition-all hover:scale-105 hover:bg-rose-accent hover:text-white"
        >
          <Heart className="h-4 w-4" strokeWidth={1.8} fill="currentColor" />
        </button>
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        {item.productCategory && (
          <p className="bake-caption text-taupe">{item.productCategory}</p>
        )}
        <Link href={href} className="block flex-1">
          <h3 className="font-bake-display mt-1.5 line-clamp-2 text-[17px] font-medium leading-snug text-cocoa transition-colors group-hover:text-rose-accent">
            {item.title || item.name}
          </h3>
        </Link>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-bake-display text-[17px] font-semibold text-cocoa">
              ${Number(price).toLocaleString()}
            </span>
            {compareAt && compareAt > price && (
              <span className="bake-body-sm text-taupe line-through">
                ${Number(compareAt).toLocaleString()}
              </span>
            )}
          </div>
          {inStock ? (
            <button
              onClick={handleAdd}
              className="font-bake-body inline-flex items-center gap-1.5 rounded-full bg-cocoa px-3.5 py-1.5 text-[12px] font-medium text-ivory transition-colors hover:bg-rose-accent"
            >
              <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.8} />
              Add
            </button>
          ) : (
            <span className="font-bake-body rounded-full border border-line bg-ivory px-3 py-1.5 text-[12px] font-medium text-taupe">
              Sold out
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default Page
