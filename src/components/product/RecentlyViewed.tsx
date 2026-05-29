'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Clock, ShoppingCart, X } from 'lucide-react'

interface RecentProduct {
  handle: string
  title: string
  image: string
  price: number
  viewedAt: number
}

const STORAGE_KEY = 'recently_viewed_products'
const MAX_ITEMS = 10

// Helper to normalize image - handles both string and object formats
const normalizeImage = (img: any): string => {
  if (!img) return ''
  if (typeof img === 'string') return img
  if (typeof img === 'object') {
    // Handle ProductImage object format { src: string, alt?: string }
    if (img.src) return img.src
    // Handle array of images
    if (Array.isArray(img) && img[0]) {
      return typeof img[0] === 'string' ? img[0] : img[0].src || ''
    }
  }
  return ''
}

// Helper to get recently viewed from localStorage
export const getRecentlyViewed = (): RecentProduct[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const items = JSON.parse(stored)
    // Normalize images when reading
    return items.map((item: any) => ({
      ...item,
      image: normalizeImage(item.image)
    }))
  } catch {
    return []
  }
}

// Helper to add a product to recently viewed
export const addToRecentlyViewed = (product: Omit<RecentProduct, 'viewedAt'>) => {
  if (typeof window === 'undefined') return
  try {
    const items = getRecentlyViewed()
    
    // Remove if already exists
    const filtered = items.filter(p => p.handle !== product.handle)
    
    // Normalize the image before storing
    const normalizedProduct = {
      ...product,
      image: normalizeImage(product.image),
      viewedAt: Date.now()
    }
    
    // Add to front with timestamp
    const newItems = [normalizedProduct, ...filtered].slice(0, MAX_ITEMS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
  } catch (error) {
    // Silent fail - don't break the app
  }
}

// Helper to clear recently viewed
export const clearRecentlyViewed = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silent fail
  }
}

interface RecentlyViewedProps {
  excludeHandle?: string
  limit?: number
  title?: string
  showClearButton?: boolean
}

export default function RecentlyViewed({
  excludeHandle,
  limit = 6,
  title = 'Recently Viewed',
  showClearButton = false
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<RecentProduct[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const items = getRecentlyViewed()
    const filtered = excludeHandle
      ? items.filter(p => p.handle !== excludeHandle)
      : items
    setProducts(filtered.slice(0, limit))
  }, [excludeHandle, limit])

  const handleClear = () => {
    clearRecentlyViewed()
    setProducts([])
  }

  // Don't render on server or if no products
  if (!mounted || products.length === 0) return null

  return (
    <section className="py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-neutral-500" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{title}</h2>
        </div>
        {showClearButton && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
        {products.map((product, index) => {
          const imageSrc = normalizeImage(product.image)
          
          return (
            <motion.div
              key={product.handle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Link href={`/products/${product.handle}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingCart className="h-10 w-10 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 group-hover:text-[#1B198F] dark:text-white">
                    {product.title}
                  </h3>
                  <p className="mt-1 font-bold text-[#1B198F]">
                    ${product.price?.toLocaleString()}
                  </p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
