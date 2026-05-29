'use client'

import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface SearchResult {
  _id?: string
  handle: string
  title: string
  images?: Array<{ src: string }>
  variants?: Array<{ price: number; compareAtPrice?: number; inventoryQty?: number }>
  productCategory?: string
}

interface ProductSearchProps {
  placeholder?: string
  maxResults?: number
  onResultClick?: () => void
  className?: string
  buttonClassName?: string
}

export default function SearchBtnPopover({
  placeholder = 'Search cupcakes, boxes, cakes…',
  maxResults = 5,
  onResultClick,
  className = '',
  buttonClassName = '',
}: ProductSearchProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([])
  const { addItem } = useCart()
  const { open: openAside } = useAside()
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)

  /* Lock body scroll while open */
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  /* Close on ESC */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  /* Fetch recommended products once */
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch('/api/products?limit=12')
        if (res.ok) {
          const data = await res.json()
          const products = data.products || data.data || []
          const filtered = products.filter((p: any) =>
            p.variants?.some((v: any) => (v.inventoryQty || 0) > 0)
          )
          setRecommendedProducts(filtered.slice(0, 4))
        }
      } catch (error) {
        console.error('Failed to fetch recommended products:', error)
      }
    }
    fetchRecommended()
  }, [])

  /* Debounced search */
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(searchQuery)}&limit=${maxResults}`
        )
        if (!res.ok) {
          setSearchResults([])
          return
        }
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          setSearchResults(data.products || data.data || [])
        } catch {
          setSearchResults([])
        }
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }
    const debounce = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, maxResults])

  /* Auto-focus when opened */
  useEffect(() => {
    if (isOpen) {
      // Slight delay so the modal animation finishes first
      const t = setTimeout(() => searchInputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleResultClick = () => {
    setIsOpen(false)
    setSearchQuery('')
    setSearchResults([])
    onResultClick?.()
  }

  const handleQuickAdd = async (product: any) => {
    const variant = product.variants?.[0]
    if (!variant) return
    const inStock = (variant.inventoryQty ?? 0) > 0
    if (!inStock) return

    addItem({
      productId: product._id,
      name: product.title,
      price: variant.price,
      imageUrl: product.images?.[0]?.src || '',
      handle: product.handle,
      variant: variant as any,
      quantity: 1,
    })
    openAside('cart')

    try {
      await axios.delete('/api/wishlists', {
        data: { productId: product._id, itemType: 'product' },
      })
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId: product._id, itemType: 'product', isLiked: false },
        })
      )
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      handleResultClick()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-cocoa transition-colors hover:bg-cream-deep focus-visible:outline-0 ${buttonClassName}`}
        aria-label="Search"
      >
        <Search className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-cocoa/55 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Search Panel — refined ivory card */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="font-bake-body fixed left-1/2 top-6 z-50 w-[calc(100vw-1rem)] max-w-[1080px] -translate-x-1/2 overflow-hidden rounded-3xl border border-line bg-ivory shadow-[0_40px_100px_-20px_rgba(46,31,21,0.35)] md:top-10 md:w-[calc(100vw-3rem)]"
              role="dialog"
              aria-modal="true"
              aria-label="Search products"
            >
              <div className="max-h-[80vh] overflow-y-auto">
                <div className="mx-auto max-w-[920px] px-5 py-6 md:px-8 md:py-8">
                  {/* Header row */}
                  <div className="mb-6 flex items-center justify-between">
                    <p className="bake-eyebrow">
                      <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                      Search the bakery
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close search"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
                    >
                      <X className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>

                  {/* Search input */}
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 transition-all focus-within:border-rose-accent focus-within:shadow-[0_0_0_4px_rgba(217,113,133,0.12)] md:gap-3 md:px-5 md:py-3"
                  >
                    <Search className="h-5 w-5 text-taupe" strokeWidth={1.6} />
                    <input
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      placeholder={placeholder}
                      className="font-bake-body w-full border-none bg-transparent px-1 py-1 text-[15px] text-cocoa placeholder:text-taupe focus:outline-none md:text-[16px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      name="q"
                      aria-label="Search for products"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="rounded-full p-1 text-taupe transition-colors hover:bg-cream-deep hover:text-cocoa"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    )}
                    <button
                      type="submit"
                      aria-label="Search"
                      className="flex h-10 items-center gap-1.5 rounded-full bg-cocoa px-4 text-[13px] font-medium text-ivory transition-colors hover:bg-rose-accent disabled:opacity-50"
                      disabled={!searchQuery}
                    >
                      <span className="hidden sm:inline">Search</span>
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </form>

                  {/* Live search results */}
                  {searchQuery.length >= 2 && (
                    <div className="mt-6">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-rose-accent" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div>
                          <p className="bake-caption mb-3 text-taupe">
                            {searchResults.length} result
                            {searchResults.length === 1 ? '' : 's'} for &ldquo;{searchQuery}&rdquo;
                          </p>
                          <ul className="divide-y divide-line border-y border-line">
                            {searchResults.map((product) => (
                              <li key={product._id || product.handle}>
                                <Link
                                  href={`/products/${product.handle}`}
                                  onClick={handleResultClick}
                                  className="group flex items-center gap-4 py-3 transition-colors hover:bg-cream-deep/30"
                                >
                                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep">
                                    {product.images?.[0]?.src ? (
                                      <Image
                                        src={product.images[0].src}
                                        alt={product.title}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-taupe">
                                        <Search className="h-5 w-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    {product.productCategory && (
                                      <p className="bake-caption text-taupe">
                                        {product.productCategory}
                                      </p>
                                    )}
                                    <p className="font-bake-display mt-1 truncate text-[15px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
                                      {product.title}
                                    </p>
                                  </div>
                                  {product.variants?.[0]?.price && (
                                    <p className="font-bake-display text-[16px] font-semibold text-cocoa">
                                      ${product.variants[0].price}
                                    </p>
                                  )}
                                  <ArrowRight
                                    className="h-4 w-4 text-taupe transition-all group-hover:translate-x-1 group-hover:text-rose-accent"
                                    strokeWidth={1.8}
                                  />
                                </Link>
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={`/search?q=${encodeURIComponent(searchQuery)}`}
                            onClick={handleResultClick}
                            className="font-bake-body mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                          >
                            View all results
                            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                          </Link>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-line bg-cream-deep/40 px-6 py-10 text-center">
                          <Search className="mx-auto mb-3 h-8 w-8 text-taupe" strokeWidth={1.4} />
                          <p className="font-bake-display text-[18px] font-medium text-cocoa">
                            Nothing matches yet
                          </p>
                          <p className="bake-body-sm mt-1">
                            Try a different flavour, occasion, or box size.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommended products — only shown when not searching */}
                  {searchQuery.length < 2 && recommendedProducts.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-5 flex items-end justify-between">
                        <div>
                          <p className="bake-eyebrow">
                            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                            Browse popular
                          </p>
                          <h3 className="bake-display-md mt-2 font-medium">
                            Customer{' '}
                            <span className="bake-display-italic text-rose-accent">favourites</span>
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                        {recommendedProducts.map((product, index) => {
                          const variant = product.variants?.[0]
                          const price = variant?.price || 0
                          const compareAtPrice = variant?.compareAtPrice
                          const isHovered = hoveredProduct === product._id
                          const inStock = (variant?.inventoryQty ?? 0) > 0

                          return (
                            <motion.div
                              key={product._id || index}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05, duration: 0.35 }}
                              className="group"
                              onMouseEnter={() => setHoveredProduct(product._id)}
                              onMouseLeave={() => setHoveredProduct(null)}
                            >
                              <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream-deep">
                                <Link
                                  href={`/products/${product.handle}`}
                                  onClick={handleResultClick}
                                >
                                  {product.images?.[0]?.src ? (
                                    <Image
                                      src={product.images[0].src}
                                      alt={product.title}
                                      fill
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-taupe">
                                      <Search className="h-6 w-6" strokeWidth={1.4} />
                                    </div>
                                  )}
                                </Link>
                                {/* Quick Add */}
                                <motion.div
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{
                                    opacity: isHovered ? 1 : 0,
                                    y: isHovered ? 0 : 8,
                                  }}
                                  className="absolute inset-x-3 bottom-3"
                                >
                                  {inStock ? (
                                    <button
                                      onClick={() => handleQuickAdd(product)}
                                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-cocoa py-2.5 text-[12px] font-medium text-ivory transition-colors hover:bg-rose-accent"
                                    >
                                      <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.8} />
                                      Quick add
                                    </button>
                                  ) : (
                                    <div className="flex w-full items-center justify-center rounded-full border border-line bg-ivory py-2.5 text-[12px] font-medium text-taupe">
                                      Sold out
                                    </div>
                                  )}
                                </motion.div>
                              </div>

                              <div className="mt-3">
                                {product.productCategory && (
                                  <p className="bake-caption text-taupe">
                                    {product.productCategory}
                                  </p>
                                )}
                                <Link
                                  href={`/products/${product.handle}`}
                                  onClick={handleResultClick}
                                >
                                  <h3 className="font-bake-display mt-1 line-clamp-2 text-[15px] font-medium text-cocoa transition-colors hover:text-rose-accent">
                                    {product.title}
                                  </h3>
                                </Link>
                                <div className="mt-1.5 flex items-baseline gap-2">
                                  <span className="font-bake-display text-[15px] font-semibold text-cocoa">
                                    ${price.toLocaleString()}
                                  </span>
                                  {compareAtPrice && compareAtPrice > price && (
                                    <span className="bake-body-sm text-taupe line-through">
                                      ${compareAtPrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick-link tags when nothing typed */}
                  {searchQuery.length < 2 && (
                    <div className="mt-8 border-t border-line pt-6">
                      <p className="bake-caption text-taupe">Popular searches</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          'Red Velvet',
                          'Vanilla',
                          'Gift Boxes',
                          'Vegan',
                          'Eggless',
                          'Birthday',
                          'Wedding',
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchQuery(tag)}
                            className="rounded-full border border-line bg-ivory px-4 py-1.5 text-[13px] font-medium text-cocoa-soft transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
