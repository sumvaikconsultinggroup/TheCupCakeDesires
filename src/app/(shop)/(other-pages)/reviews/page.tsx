'use client'

import AllReviewsView from '@/components/AllReviewsView'
import ProductDetailsView from '@/components/ProductDetailsView'
import JsonLd from '@/components/SE0/JsonLd'
import { useEffect, useState } from 'react'

export default function ReviewsPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductsWithReviews()
  }, [])

  const fetchProductsWithReviews = async () => {
    try {
      const response = await fetch('/api/products?all=true&published=true')
      const data = await response.json()
      if (data.success) {
        // Hide products that are fully out of stock (all variants sum to 0).
        // Also keep only products that have at least one approved review.
        const productsWithReviews = data.data.filter((product: any) => {
          const hasReviews = product.reviews && product.reviews.length > 0
          if (!hasReviews) return false
          const totalQty = (product.variants || []).reduce(
            (sum: number, v: any) => sum + (Number(v?.inventoryQty) || 0),
            0
          )
          return totalQty > 0
        })
        setProducts(productsWithReviews)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <JsonLd />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#1b198f]"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </>
    )
  }

  if (selectedProduct) {
    return (
      <>
        <JsonLd />
        <ProductDetailsView product={selectedProduct} onBack={() => setSelectedProduct(null)} />
      </>
    )
  }

  return (
    <>
      <JsonLd />
      <AllReviewsView products={products} onViewAll={(product) => setSelectedProduct(product)} />
    </>
  )
}
