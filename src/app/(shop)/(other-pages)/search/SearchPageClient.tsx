'use client'

import { Divider } from '@/components/Divider'
import { FilterSortByMenuListBox } from '@/components/FilterSortByMenu'
import { FiltersMenuTabs } from '@/components/FiltersMenu'
import ProductCard from '@/components/ProductCard'
import SectionPromo1 from '@/components/SectionPromo1'
import SectionSliderLargeProduct from '@/components/SectionSliderLargeProduct'
import ButtonCircle from '@/shared/Button/ButtonCircle'
import {
  Pagination,
  PaginationList,
  PaginationNext,
  PaginationPage,
  PaginationPrevious,
} from '@/shared/Pagination/Pagination'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Product {
  _id: string
  title: string
  description?: string
  vendor?: string
  tags?: string[]
  createdAt: string
  variants?: { price: number }[]
  productCategory?: string
  options?: {
    name: string
    values: string[]
  }[]
  images?: { src: string }[]
}

export default function SearchPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  // Filter states
  const [sortBy, setSortBy] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryTab, setCategoryTab] = useState('All items')

  // Pagination states
  const currentPage = Number(searchParams.get('page')) || 1
  const itemsPerPage = 12
  const [totalPages, setTotalPages] = useState(1)
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products?all=true')
        const data = await response.json()

        if (data.success) {
          setProducts(data.data)
          setFilteredProducts(data.data)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Apply all filters whenever any filter changes
  useEffect(() => {
    let filtered = [...products]

    // Filter by search query first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((product) => {
        const title = product.title?.toLowerCase() || ''
        const description = product.description?.toLowerCase() || ''
        const vendor = product.vendor?.toLowerCase() || ''
        const tags = product.tags?.map((t) => t.toLowerCase()) || []

        return (
          title.includes(query) ||
          description.includes(query) ||
          vendor.includes(query) ||
          tags.some((tag) => tag.includes(query))
        )
      })
    }

    // Filter by category tab (Protein, Whey, Creatine, etc)
    if (categoryTab !== 'All items') {
      filtered = filtered.filter((product) => {
        const productCategory = product.productCategory?.toLowerCase() || ''
        const title = product.title?.toLowerCase() || ''
        const tags = product.tags?.map((t) => t.toLowerCase()) || []
        const categoryLower = categoryTab.toLowerCase()

        return (
          productCategory.includes(categoryLower) ||
          title.includes(categoryLower) ||
          tags.some((tag) => tag.includes(categoryLower))
        )
      })
    }

    // Filter by selected categories (from filter menu)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        const productCategory = product.productCategory?.toLowerCase() || ''
        return selectedCategories.some((cat) => productCategory.includes(cat.toLowerCase()))
      })
    }

    // Filter by flavors
    if (selectedFlavors.length > 0) {
      filtered = filtered.filter((product) => {
        const productFlavors =
          product.options?.find((opt) => opt.name.toLowerCase() === 'flavors' || opt.name.toLowerCase() === 'flavor')
            ?.values || []

        return selectedFlavors.some((flavor) =>
          productFlavors.some((pf) => pf.toLowerCase() === flavor.toLowerCase()),
        )
      })
    }

    // Filter by price range
    filtered = filtered.filter((product) => {
      const price = product.variants?.[0]?.price || 0
      return price >= priceRange.min && price <= priceRange.max
    })

    // Sort products
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()

          case 'price-low-to-high':
            const priceA = a.variants?.[0]?.price || 0
            const priceB = b.variants?.[0]?.price || 0
            return priceA - priceB

          case 'price-high-to-low':
            const priceA2 = a.variants?.[0]?.price || 0
            const priceB2 = b.variants?.[0]?.price || 0
            return priceB2 - priceA2

          case 'a-to-z':
            return (a.title || '').localeCompare(b.title || '')

          case 'z-to-a':
            return (b.title || '').localeCompare(a.title || '')

          default:
            return 0
        }
      })
    }

    setFilteredProducts(filtered)

    // Reset to page 1 when filters change
    if (currentPage > 1) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', '1')
      router.push(`?${params.toString()}`)
    }
  }, [searchQuery, sortBy, priceRange, selectedFlavors, selectedCategories, categoryTab, products])

  // Handle pagination
  useEffect(() => {
    const total = Math.ceil(filteredProducts.length / itemsPerPage)
    setTotalPages(total)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = filteredProducts.filter((p) => p.images?.[0]?.src).slice(startIndex, endIndex)

    setPaginatedProducts(paginated)
  }, [filteredProducts, currentPage])

  // Get all unique flavors
  const getAllFlavors = () => {
    const flavors = new Set<string>()
    products.forEach((product) => {
      const flavorOption = product.options?.find(
        (opt) => opt.name.toLowerCase() === 'flavors' || opt.name.toLowerCase() === 'flavor',
      )
      flavorOption?.values?.forEach((flavor) => flavors.add(flavor))
    })
    return Array.from(flavors)
  }

  // Get all unique categories
  const getAllCategories = () => {
    const categories = new Set<string>()
    products.forEach((product) => {
      if (product.productCategory) {
        const categoryParts = product.productCategory.split('>').map((part) => part.trim())
        const lastCategory = categoryParts[categoryParts.length - 1]
        categories.add(lastCategory)
      }
    })
    return Array.from(categories)
  }

  // Predefined category tabs
  const categoryTabs = ['All items', 'Protein', 'BCAA', 'Whey', 'Creatine', 'Pre-Workout', 'Vitamins']

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
  }

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max })
  }

  const handleFlavorsChange = (flavors: string[]) => {
    setSelectedFlavors(flavors)
  }

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories)
  }

  const clearAllFilters = () => {
    setPriceRange({ min: 0, max: 10000 })
    setSelectedFlavors([])
    setSelectedCategories([])
    setSortBy('')
    setCategoryTab('All items')
    setSearchQuery('')

    // Clear URL params
    router.push('/search')
  }

  const hasActiveFilters =
    priceRange.min > 0 ||
    priceRange.max < 10000 ||
    selectedFlavors.length > 0 ||
    selectedCategories.length > 0 ||
    categoryTab !== 'All items' ||
    searchQuery.trim() !== ''

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search-input')?.toString() || ''
    setSearchQuery(query)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  // Generate pagination pages
  const generatePaginationPages = () => {
    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const featuredProducts = products.slice(0, 4)

  return (
    <div>
      <div className={'h-24 w-full bg-primary-50 2xl:h-28 dark:bg-white/10'} />
      <div className="container">
        <header className="mx-auto -mt-10 flex max-w-2xl flex-col lg:-mt-7">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <fieldset className="text-neutral-500 dark:text-neutral-300">
              <label htmlFor="search-input" className="sr-only">
                Search all products
              </label>
              <HugeiconsIcon
                className="absolute top-1/2 left-3.5 -translate-y-1/2 text-2xl sm:left-5"
                icon={Search01Icon}
                size={24}
              />
              <input
                className="block w-full rounded-full border bg-white py-4 pr-5 pl-12 placeholder:text-zinc-500 focus:border-primary-300 focus:ring-3 focus:ring-primary-200/50 sm:py-5 sm:text-sm md:pl-15 dark:bg-neutral-800 dark:placeholder:text-zinc-400 dark:focus:ring-primary-600/25"
                id="search-input"
                name="search-input"
                type="search"
                placeholder="Type your keywords"
                defaultValue={searchQuery}
              />
              <ButtonCircle
                className="absolute top-1/2 right-2 -translate-y-1/2 sm:right-2.5"
                size="size-11"
                type="submit"
              >
                <ArrowRightIcon className="size-5 text-white" />
              </ButtonCircle>
            </fieldset>
          </form>
        </header>
      </div>

      <div className="container flex flex-col gap-y-16 py-16 lg:gap-y-28 lg:pt-20 lg:pb-28">
        <main>
          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Search results for {searchQuery}</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {filteredProducts.length} products found
              </p>
            </div>
          )}

          {/* Category Tabs */}
          {!loading && categoryTabs.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {categoryTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCategoryTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    categoryTab === tab
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* FILTER */}
          <div className="flex flex-wrap items-center gap-2.5">
            <FiltersMenuTabs
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              selectedFlavors={selectedFlavors}
              onFlavorsChange={handleFlavorsChange}
              selectedCategories={selectedCategories}
              onCategoriesChange={handleCategoriesChange}
              availableFlavors={getAllFlavors()}
              availableCategories={getAllCategories()}
            />
            <FilterSortByMenuListBox className="ml-auto" onSortChange={handleSortChange} currentSort={sortBy} />
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Active filters:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                  Search: {searchQuery}
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      const params = new URLSearchParams(searchParams.toString())
                      params.delete('q')
                      router.push(`?${params.toString()}`)
                    }}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    ×
                  </button>
                </span>
              )}

              {categoryTab !== 'All items' && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                  Category: {categoryTab}
                  <button
                    onClick={() => setCategoryTab('All items')}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    ×
                  </button>
                </span>
              )}

              {(priceRange.min > 0 || priceRange.max < 10000) && (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                  ${priceRange.min} - ${priceRange.max}
                  <button
                    onClick={() => handlePriceRangeChange(0, 10000)}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedFlavors.map((flavor) => (
                <span
                  key={flavor}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                >
                  {flavor}
                  <button
                    onClick={() => handleFlavorsChange(selectedFlavors.filter((f) => f !== flavor))}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    ×
                  </button>
                </span>
              ))}

              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                >
                  {cat}
                  <button
                    onClick={() => handleCategoriesChange(selectedCategories.filter((c) => c !== cat))}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    ×
                  </button>
                </span>
              ))}

              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear all
              </button>
            </div>
          )}

          <Divider className="mt-8" />

          {/* Results Count */}
          <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            Showing {paginatedProducts.length} of {filteredProducts.filter((p) => p.images?.[0]?.src).length} products
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500"></div>
            </div>
          ) : (
            <>
              {/* LOOP ITEMS */}
              {paginatedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-lg text-neutral-500">No products found</p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 xl:grid-cols-4">
                  {paginatedProducts.map((item) => (
                    <ProductCard data={item} key={item._id} />
                  ))}
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-20 flex justify-center lg:mt-24">
                  <Pagination className="mx-auto">
                    <PaginationPrevious
                      href={
                        currentPage > 1
                          ? `?${new URLSearchParams({
                              ...Object.fromEntries(searchParams),
                              page: String(currentPage - 1),
                            }).toString()}`
                          : '#'
                      }
                      aria-disabled={currentPage === 1}
                    />
                    <PaginationList>
                      {generatePaginationPages().map((page) => (
                        <PaginationPage
                          key={page}
                          href={`?${new URLSearchParams({
                            ...Object.fromEntries(searchParams),
                            page: String(page),
                          }).toString()}`}
                          current={page === currentPage}
                        >
                          {page}
                        </PaginationPage>
                      ))}
                    </PaginationList>
                    <PaginationNext
                      href={
                        currentPage < totalPages
                          ? `?${new URLSearchParams({
                              ...Object.fromEntries(searchParams),
                              page: String(currentPage + 1),
                            }).toString()}`
                          : '#'
                      }
                      aria-disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </main>

        {featuredProducts.length > 0 && (
          <>
            <Divider />
            <SectionSliderLargeProduct products={featuredProducts} />
          </>
        )}

        <Divider />
        <SectionPromo1 />
      </div>
    </div>
  )
}