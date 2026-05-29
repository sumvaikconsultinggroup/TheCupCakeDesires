'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart, Sparkles } from 'lucide-react'
import { useCart } from '@/components/useCartStore'

interface RecommendedProduct {
  handle: string
  title: string
  image: string
  price: number
}

interface YouMayAlsoLikeProps {
  productHandle: string
  title?: string
}

export default function YouMayAlsoLike({ productHandle, title = 'You May Also Like' }: YouMayAlsoLikeProps) {
  const [products, setProducts] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`/api/admin/recommendations/handle/${productHandle}?type=you_may_also_like`)
        
        // Silently handle non-OK responses (including 520 proxy errors)
        if (!res.ok) {
          setLoading(false)
          return
        }
        
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          setLoading(false)
          return
        }
        
        const text = await res.text()
        // Check if response is actually JSON (not HTML error page)
        if (!text.startsWith('{') && !text.startsWith('[')) {
          setLoading(false)
          return
        }
        
        const data = JSON.parse(text)
        if (data.success && data.data?.youMayAlsoLike?.length) {
          setProducts(data.data.youMayAlsoLike)
        }
      } catch {
        // Silent fail - don't log errors for this non-critical feature
      } finally {
        setLoading(false)
      }
    }

    if (productHandle) {
      fetchRecommendations()
    }
  }, [productHandle])

  // Don't render anything if loading or no products
  if (loading || products.length === 0) return null

  return (
    <section className="py-12">
      <div className="mb-8 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-purple-500" />
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.handle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <Link href={`/products/${product.handle}`} className="block">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-neutral-300" />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h3 className="font-semibold text-neutral-900 line-clamp-2 group-hover:text-[#1B198F] dark:text-white">
                  {product.title}
                </h3>
                <p className="mt-1 text-lg font-bold text-[#1B198F]">
                  ${product.price?.toLocaleString()}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
