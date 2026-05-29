'use client'

import AsideSidebarCart from '@/components/aside-sidebar-cart'
import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpDown, ChevronDown, Grid3X3, LayoutGrid, SlidersHorizontal, X, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import CollectionFAQ from './CollectionFAQ'

interface Product {
  _id: string
  handle: string
  title: string
  images?: { src: string; alt?: string }[]
  variants?: { price: number; compareAtPrice?: number; option1Value?: string; inventoryQty?: number }[]
  reviews?: { star: number }[]
  productCategory?: string
  tags?: string[]
}

interface Collection {
  _id: string
  handle: string
  title: string
  description?: string
  contentDescription?: string
  productHandles?: string[]
  collectionType: 'manual' | 'automated'
  conditions?: any[]
  conditionMatch?: 'all' | 'any'
  seo?: {
    title?: string
    description?: string
  }
  faq?: {
    question: string
    answer: string
  }[]
}

interface CollectionPageClientProps {
  collection: string // collection handle
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'alpha-asc', label: 'Alphabetically: A-Z' },
  { value: 'alpha-desc', label: 'Alphabetically: Z-A' },
]

const priceRanges = [
  { min: 0, max: 999, label: 'Under $999' },
  { min: 1000, max: 1999, label: '$1,000 - $1,999' },
  { min: 2000, max: 2999, label: '$2,000 - $2,999' },
  { min: 3000, max: 4999, label: '$3,000 - $4,999' },
  { min: 5000, max: 100000, label: '$5,000+' },
]

export default function CollectionPageClient({ collection }: CollectionPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [collectionData, setCollectionData] = useState<Collection | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [gridCols, setGridCols] = useState(4)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

  const [filters, setFilters] = useState({
    priceRange: searchParams.get('price') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
  })

  const { addItem } = useCart()
  const { open } = useAside()

  // Derive available categories from loaded products
  const availableCategories = Array.from(
    new Set(allProducts.map((p) => p.productCategory).filter((c): c is string => !!c))
  ).sort()

  // Fetch collection and all products (initial load)
  useEffect(() => {
    const fetchCollectionAndProducts = async () => {
      setIsLoading(true)
      try {
        if (collection === 'all-items') {
          setCollectionData(null)

          const productsRes = await fetch(`/api/products?limit=1000`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })

          if (!productsRes.ok) {
            console.error('Failed to fetch products:', productsRes.status)
            setIsLoading(false)
            return
          }

          const productsResult = await productsRes.json()
          const products = productsResult.data || []
          const filtered = products.filter((p: any) => p.variants?.some((v: any) => (v.inventoryQty || 0) > 0))
          setAllProducts(filtered)
          setIsLoading(false)
          return
        }

        // Step 1: Fetch collection data
        const collectionRes = await fetch(`/api/collections?handle=${collection}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!collectionRes.ok) {
          console.error('Failed to fetch collection:', collectionRes.status)
          setIsLoading(false)
          return
        }

        const collectionResult = await collectionRes.json()

        if (!collectionResult.success || !collectionResult.collection) {
          console.error('Collection not found')
          setIsLoading(false)
          return
        }

        const collectionInfo = collectionResult.collection
        setCollectionData(collectionInfo)

        // Step 2: Fetch products based on productHandles
        // Step 2: Fetch products based on productHandles
        if (collectionInfo.productHandles && collectionInfo.productHandles.length > 0) {
          const params = new URLSearchParams()
          params.set('handles', collectionInfo.productHandles.join(','))

          const productsRes = await fetch(`/api/products/by-handles?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          })

          if (!productsRes.ok) {
            console.error('Failed to fetch products:', productsRes.status)
            setIsLoading(false)
            return
          }

          const productsResult = await productsRes.json()
          const products = productsResult.products || []
          const filtered = products.filter((p: any) => p.variants?.some((v: any) => (v.inventoryQty || 0) > 0))
          setAllProducts(filtered)
        } else {
          setAllProducts([])
        }
      } catch (err) {
        console.error('Error fetching collection and products:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollectionAndProducts()
  }, [collection])

  // Client-side filtering
  useEffect(() => {
    let result = [...allProducts]

    // Filter by Category
    if (filters.category) {
      result = result.filter(
        (p) =>
          p.productCategory?.toLowerCase() === filters.category.toLowerCase() ||
          p.tags?.some((t) => t.toLowerCase() === filters.category.toLowerCase())
      )
    }

    // Filter by Price Range
    if (filters.priceRange) {
      const range = priceRanges.find((r) => `${r.min}-${r.max}` === filters.priceRange)
      if (range) {
        result = result.filter((p) => {
          const price = p.variants?.[0]?.price || 0
          return price >= range.min && price <= range.max
        })
      }
    }

    // Sort
    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0))
        break
      case 'price-desc':
        result.sort((a, b) => (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0))
        break
      case 'rating':
        result.sort((a, b) => {
          const ratingA =
            a.reviews && a.reviews.length > 0 ? a.reviews.reduce((acc, r) => acc + r.star, 0) / a.reviews.length : 0
          const ratingB =
            b.reviews && b.reviews.length > 0 ? b.reviews.reduce((acc, r) => acc + r.star, 0) / b.reviews.length : 0
          return ratingB - ratingA
        })
        break
      case 'bestselling':
        result.sort((a, b) => {
          const aBest = a.tags?.includes('bestseller') ? 1 : 0
          const bBest = b.tags?.includes('bestseller') ? 1 : 0
          return bBest - aBest
        })
        break
      case 'alpha-asc':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'alpha-desc':
        result.sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'newest':
      default:
        result.sort((a, b) => (a._id > b._id ? -1 : 1))
    }
    setProducts(result)
    setCurrentPage(1)
  }, [allProducts, filters])

  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams()
      if (newFilters.priceRange) params.set('price', newFilters.priceRange)
      if (newFilters.category) params.set('category', newFilters.category)
      if (newFilters.sort) params.set('sort', newFilters.sort)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const clearFilters = () => {
    const newFilters = { priceRange: '', category: '', sort: 'newest' }
    setFilters(newFilters)
    router.push(pathname)
  }

  const activeFiltersCount = [filters.priceRange, filters.category].filter(Boolean).length

  const handleQuickAdd = (product: Product) => {
    const variant = product.variants?.[0]
    if (!variant) return
    addItem({
      productId: product._id,
      name: product.title,
      price: variant.price,
      imageUrl: product.images?.[0]?.src || '',
      handle: product.handle,
      variants: variant.option1Value ? [{ name: 'Size', option: variant.option1Value }] : [],
      variant: variant as any,
      quantity: 1,
    })
    open('cart')
  }

  const getAverageRating = (reviews?: { star: number }[]) => {
    if (!reviews || reviews.length === 0) return 0
    return reviews.reduce((acc, r) => acc + r.star, 0) / reviews.length
  }

  const getDiscount = (price: number, compareAt?: number) => {
    if (!compareAt || compareAt <= price) return 0
    return Math.round(((compareAt - price) / compareAt) * 100)
  }

  const formatCategoryName = (category: string) => {
    return category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage)
  const currentProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Collection Header */}
      <div className="bg-gradient-to-r from-[#1B198F] to-[#1B198F]/80 py-12 text-white">
        <div className="container mx-auto px-4">
          <nav className="mb-4 text-sm text-white/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="capitalize">{collectionData?.title || collection.replace(/-/g, ' ')}</span>
          </nav>
          <h1 className="font-[family-name:var(--font-family-antonio)] text-4xl font-black uppercase sm:text-5xl">
            {collectionData?.title || collection.replace(/-/g, ' ')}
          </h1>
          {collectionData?.description && <p className="mt-2 text-white/90">{collectionData.description}</p>}
          <p className="mt-2 text-white/70">{products.length} products</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-900">
          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[#1B198F] hover:bg-[#1B198F]/5 dark:border-neutral-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B198F] text-xs text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filters.priceRange && (
                <span className="flex items-center gap-1 rounded-full bg-[#1B198F]/10 px-3 py-1.5 text-xs font-semibold text-[#1B198F]">
                  {priceRanges.find((r) => `${r.min}-${r.max}` === filters.priceRange)?.label}
                  <button onClick={() => handleFilterChange('priceRange', '')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="flex items-center gap-1 rounded-full bg-[#1B198F]/10 px-3 py-1.5 text-xs font-semibold text-[#1B198F]">
                  {formatCategoryName(filters.category)}
                  <button onClick={() => handleFilterChange('category', '')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs font-semibold text-neutral-500 hover:text-[#1B198F]">
                Clear All
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-semibold dark:border-neutral-700"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOptions.find((o) => o.value === filters.sort)?.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 z-20 mt-2 w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleFilterChange('sort', option.value)
                          setIsSortOpen(false)
                        }}
                        className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${filters.sort === option.value
                          ? 'bg-[#1B198F] text-white'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Grid Toggle */}
            <div className="hidden items-center gap-1 rounded-full border border-neutral-200 p-1 sm:flex dark:border-neutral-700">
              {[3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => setGridCols(cols)}
                  className={`rounded-full p-2 ${gridCols === cols ? 'bg-[#1B198F] text-white' : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                >
                  {cols === 3 ? <Grid3X3 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-neutral-200 sm:rounded-2xl dark:bg-neutral-800" />
                <div className="mt-3 h-3 w-3/4 rounded bg-neutral-200 sm:mt-4 sm:h-4 dark:bg-neutral-800" />
                <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200 sm:h-4 dark:bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center sm:py-20">
            <p className="text-base text-neutral-500 sm:text-lg">No products found</p>
            <button onClick={clearFilters} className="mt-4 text-[#1B198F] hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-3 sm:gap-4 xl:gap-6 ${gridCols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}
            >
              {currentProducts.map((product, index) => {
                const variant = product.variants?.[0]
                const price = variant?.price || 0
                const compareAtPrice = variant?.compareAtPrice
                const discount = getDiscount(price, compareAtPrice)
                const rating = getAverageRating(product.reviews)
                const isHovered = hoveredProduct === product._id

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="group"
                    onMouseEnter={() => setHoveredProduct(product._id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl dark:bg-neutral-900">
                      <Link href={`/products/${product.handle}`} className="block h-full w-full">
                        {discount > 0 && (
                          <div className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white sm:px-3">
                            {discount}% OFF
                          </div>
                        )}

                        <Image
                          src={product.images?.[0]?.src || '/placeholder.png'}
                          alt={product.images?.[0]?.alt || product.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </Link>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                        className="absolute right-2 bottom-3 left-2 z-10"
                      >
                        {(variant?.inventoryQty ?? 0) > 0 ? (
                          <button
                            onClick={() => handleQuickAdd(product)}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1B198F] py-3 text-sm font-bold text-white shadow-lg"
                          >
                            <ShoppingBag className="h-4 w-4" /> Add to Cart
                          </button>
                        ) : (
                          <div className="flex w-full items-center justify-center rounded-full bg-red-500 py-3 text-sm font-bold text-white shadow-lg">
                            Out of Stock
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Product Info */}
                    <div className="mt-3 sm:mt-4">
                      <Link href={`/products/${product.handle}`}>
                        <h3 className="line-clamp-2 text-xs font-semibold sm:text-sm">{product.title}</h3>
                      </Link>
                      {rating > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-xs sm:text-sm">
                                {i < Math.floor(rating) ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-neutral-500">({product.reviews?.length || 0})</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-bold sm:text-base">${price.toLocaleString()}</span>
                        {compareAtPrice && compareAtPrice > price && (
                          <span className="text-xs text-neutral-400 line-through sm:text-sm">
                            ${compareAtPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(
                      Math.max(0, Math.min(currentPage - 3, totalPages - 5)),
                      Math.min(totalPages, Math.max(5, currentPage + 2))
                    )
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${currentPage === page
                          ? 'bg-[#1B198F] text-white'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Content Description & FAQ */}
        {(collectionData?.contentDescription || (collectionData?.faq && collectionData.faq.length > 0)) && (
          <div className="mt-16 border-t border-neutral-200 pt-16 dark:border-neutral-800">
            {collectionData?.contentDescription && (
              <div className="mb-16">
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: collectionData.contentDescription }}
                />
              </div>
            )}

            {collectionData?.faq && collectionData.faq.length > 0 && (
              <CollectionFAQ items={collectionData.faq} />
            )}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 z-50 h-full w-[85vw] max-w-sm overflow-y-auto bg-white p-4 pb-24 sm:p-6 dark:bg-neutral-900"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Price Range</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={`${range.min}-${range.max}`} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="price"
                        checked={filters.priceRange === `${range.min}-${range.max}`}
                        onChange={() => handleFilterChange('priceRange', `${range.min}-${range.max}`)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Category</h3>
                <div className="space-y-2">
                  {availableCategories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat}
                        onChange={() => handleFilterChange('category', cat)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{formatCategoryName(cat)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Apply/Clear Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 rounded-full border border-neutral-200 py-3 font-semibold"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 rounded-full bg-[#1B198F] py-3 font-semibold text-white"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AsideSidebarCart />
    </div>
  )
}
