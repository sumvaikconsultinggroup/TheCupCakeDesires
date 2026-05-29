'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import HeaderFilterSection from '@/components/HeaderFilterSection'
import Link from 'next/link'

interface Product {
  _id: string
  title: string
  createdAt: string
  productCategory?: string
  tags?: string[]
  variants?: { price: number }[]
  options?: {
    name: string
    values: string[]
  }[]
  images?: { src: string }[]
}

  const SectionGridFeatureItems = ({ className }: { className?: string }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All items')
  const [sortBy, setSortBy] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

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

  // Apply filters when any filter changes
  useEffect(() => {
    let filtered = [...products]

    // Filter by category tab (Protein, Whey, Creatine, etc)
    if (category !== 'All items') {
      filtered = filtered.filter(product => {
        const productCategory = product.productCategory?.toLowerCase() || ''
        const title = product.title?.toLowerCase() || ''
        const tags = product.tags?.map(t => t.toLowerCase()) || []
        
        const categoryLower = category.toLowerCase()
        return productCategory.includes(categoryLower) || 
               title.includes(categoryLower) ||
               tags.some(tag => tag.includes(categoryLower))
      })
    }

    // Filter by selected categories (from filter menu)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        const productCategory = product.productCategory?.toLowerCase() || ''
        return selectedCategories.some(cat => 
          productCategory.includes(cat.toLowerCase())
        )
      })
    }

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.variants?.[0]?.price || 0
      return price >= priceRange.min && price <= priceRange.max
    })

    // Filter by flavors
    if (selectedFlavors.length > 0) {
      filtered = filtered.filter(product => {
        const productFlavors = product.options
          ?.find(opt => opt.name.toLowerCase() === 'flavors' || opt.name.toLowerCase() === 'flavor')
          ?.values || []
        
        return selectedFlavors.some(flavor => 
          productFlavors.some(pf => pf.toLowerCase() === flavor.toLowerCase())
        )
      })
    }

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
  }, [category, sortBy, priceRange, selectedFlavors, selectedCategories, products])

  // Get all unique flavors from products
  const getAllFlavors = () => {
    const flavors = new Set<string>()
    products.forEach(product => {
      const flavorOption = product.options?.find(
        opt => opt.name.toLowerCase() === 'flavors' || opt.name.toLowerCase() === 'flavor'
      )
      flavorOption?.values?.forEach(flavor => flavors.add(flavor))
    })
    return Array.from(flavors)
  }

  // Get all unique categories from products
  const getAllCategories = () => {
    const categories = new Set<string>()
    products.forEach(product => {
      if (product.productCategory) {
        // Extract last part of category path
        // "Health & Beauty > Health Care > Creatine" → "Creatine"
        const categoryParts = product.productCategory.split('>').map(part => part.trim())
        const lastCategory = categoryParts[categoryParts.length - 1]
        categories.add(lastCategory)
      }
    })
    return Array.from(categories)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
  }

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

  if (loading) {
    return (
      <div className="nc-SectionGridFeatureItems relative">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} nc-SectionGridFeatureItems relative `}>
      <HeaderFilterSection 
        heading="Find your favorite products"
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        onPriceRangeChange={handlePriceRangeChange}
        onFlavorsChange={handleFlavorsChange}
        onCategoriesChange={handleCategoriesChange}
        currentCategory={category}
        currentSort={sortBy}
        priceRange={priceRange}
        selectedFlavors={selectedFlavors}
        selectedCategories={selectedCategories}
        availableFlavors={getAllFlavors()}
        availableCategories={getAllCategories()}
      />
      
      {filteredProducts.filter(p => p.images?.[0]?.src).length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-neutral-500">No products found</p>
        </div>
      ) : (
        <div className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
          {filteredProducts
            .filter(p => p.images?.[0]?.src)
            .slice(0, 8)
            .map((item) => (
              <ProductCard data={item} key={item._id} />
            ))}
        </div>
      )}
      
      <div className="my-16 flex items-center justify-center">
          <Link className="flex justify-around items-center py-2 text-lg text-white font-family-roboto font-medium  bg-[#1B198F] cursor-pointer shadow-[4px_6px_0px_black]  border-black  relative overflow-hidden w-[300px]  transition-[box-shadow_250ms,transform_250ms,filter_50ms] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black]  before:content-[''] before:absolute before:inset-0 before:bg-[#2a75b3] before:z-[-1] before:-translate-x-full before:transition-transform before:duration-250 hover:before:translate-x-0" href="/collections/all-items">Shop Best Sellers</Link>
      </div>
    </div>
  )
}

export default SectionGridFeatureItems