'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface SearchResult {
  _id?: string
  handle: string
  title: string
  images?: Array<{ src: string }>
  variants?: Array<{ price: number; inventoryQty?: number }>
  productCategory?: string
}

interface ProductSearchProps {
  placeholder?: string
  maxResults?: number
  onResultClick?: () => void
  className?: string
  buttonClassName?: string
}

const POPULAR = ['Red Velvet', 'Vanilla', 'Birthday', 'Eggless', 'Wedding']

export default function SearchBtnPopover({
  placeholder = 'Search cupcakes, cakes, boxes…',
  maxResults = 6,
  onResultClick,
  className = '',
  buttonClassName = '',
}: ProductSearchProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recommended, setRecommended] = useState<SearchResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  /* Close on ESC */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  /* Click-outside to close — checks both panel + trigger */
  useEffect(() => {
    if (!isOpen) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (triggerRef.current?.contains(t)) return
      setIsOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [isOpen])

  /* Fetch recommended (idle-state) products once */
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await fetch('/api/products?limit=12')
        if (!res.ok) return
        const data = await res.json()
        const products: SearchResult[] = data.products || data.data || []
        setRecommended(
          products
            .filter((p) => p.variants?.some((v) => (v.inventoryQty || 0) > 0))
            .slice(0, 5)
        )
      } catch (err) {
        console.error('Failed to fetch recommended:', err)
      }
    }
    fetchRecommended()
  }, [])

  /* Debounced search */
  useEffect(() => {
    const run = async () => {
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
        const data = await res.json()
        setSearchResults(data.products || data.data || [])
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }
    const t = setTimeout(run, 220)
    return () => clearTimeout(t)
  }, [searchQuery, maxResults])

  /* Auto-focus when opened */
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const closeAndReset = () => {
    setIsOpen(false)
    setSearchQuery('')
    setSearchResults([])
    onResultClick?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    closeAndReset()
  }

  const showSearching = searchQuery.length >= 2
  const list = showSearching ? searchResults : recommended
  const listLabel = showSearching
    ? isLoading
      ? 'Searching…'
      : list.length > 0
        ? `${list.length} match${list.length === 1 ? '' : 'es'}`
        : 'No matches'
    : 'Suggested for you'

  return (
    <div className={`relative ${className}`}>
      {/* ─── Trigger ─── */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-cocoa transition-colors hover:bg-cream-deep focus-visible:outline-0 ${buttonClassName}`}
        aria-label="Search"
        aria-expanded={isOpen}
      >
        <Search className="h-5 w-5" strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Search products"
            className="font-bake-body fixed left-1/2 right-auto top-[78px] z-50 w-[calc(100vw-1rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_30px_70px_-20px_rgba(46,31,21,0.35)] md:top-[100px]"
          >
            {/* ─── Input row ─── */}
            <form
              onSubmit={handleSubmit}
              className="relative border-b border-line bg-cream/40 px-4 py-3"
            >
              <div className="flex items-center gap-2 rounded-full border border-line bg-ivory pl-4 pr-1 py-1 transition-all focus-within:border-rose-accent focus-within:ring-4 focus-within:ring-rose-accent/15">
                <label htmlFor="bake-search-input" className="sr-only">
                  Search
                </label>
                <Search className="h-4 w-4 shrink-0 text-taupe" strokeWidth={1.8} />
                <input
                  id="bake-search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-bake-body w-full bg-transparent px-2 py-2 text-[14px] text-cocoa placeholder:text-taupe focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      searchInputRef.current?.focus()
                    }}
                    aria-label="Clear"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-taupe transition-colors hover:bg-cream-deep hover:text-cocoa"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  aria-label="Search"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cocoa text-ivory transition-colors hover:bg-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
                  ) : (
                    <Search className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </form>

            {/* ─── Results ─── */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Category label */}
              <div className="flex items-center justify-between px-5 py-3">
                <p className="bake-caption text-taupe">{listLabel}</p>
                {searchQuery.length >= 2 && !isLoading && list.length === maxResults && (
                  <p className="bake-caption text-taupe">Showing top {maxResults}</p>
                )}
              </div>

              {/* List */}
              {list.length === 0 && !isLoading ? (
                <div className="px-5 pb-6 pt-2">
                  {showSearching ? (
                    <div className="rounded-2xl border border-dashed border-line bg-cream/40 px-4 py-6 text-center">
                      <p className="font-bake-display text-[15px] font-medium text-cocoa">
                        Nothing matches yet
                      </p>
                      <p className="bake-body-sm mt-1 text-cocoa-soft">
                        Try a flavour, occasion, or box size.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-line bg-cream/40 px-4 py-6 text-center">
                      <p className="bake-body-sm text-cocoa-soft">No suggestions just yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="border-t border-line">
                  {list.map((p) => (
                    <li key={p._id || p.handle}>
                      <Link
                        href={`/products/${p.handle}`}
                        onClick={closeAndReset}
                        className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-cream/60"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep">
                          {p.images?.[0]?.src ? (
                            <Image
                              src={p.images[0].src}
                              alt={p.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-cocoa-soft">
                              <Search className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bake-display truncate text-[14px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
                            {p.title}
                          </p>
                          {p.productCategory && (
                            <p className="bake-caption mt-0.5 truncate text-taupe">
                              {p.productCategory}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          className="h-3.5 w-3.5 shrink-0 text-cocoa-soft transition-all group-hover:translate-x-0.5 group-hover:text-rose-accent"
                          strokeWidth={1.8}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Popular chips — only when idle */}
              {!showSearching && list.length > 0 && (
                <div className="border-t border-line px-5 py-4">
                  <p className="bake-caption text-taupe">Popular searches</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {POPULAR.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag)
                          searchInputRef.current?.focus()
                        }}
                        className="font-bake-body rounded-full border border-line bg-cream px-3 py-1 text-[12px] font-medium text-cocoa-soft transition-all hover:border-rose-accent hover:text-rose-accent"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Footer: "Search for X" ─── */}
            {searchQuery.trim() && (
              <Link
                href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                onClick={closeAndReset}
                className="group flex items-center justify-between border-t border-line bg-cream/60 px-5 py-3.5 text-[14px] transition-colors hover:bg-cream"
              >
                <span className="font-bake-body text-cocoa">
                  Search for{' '}
                  <span className="font-medium text-rose-accent">
                    “{searchQuery.trim()}”
                  </span>
                </span>
                <ArrowRight
                  className="h-4 w-4 text-cocoa transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
