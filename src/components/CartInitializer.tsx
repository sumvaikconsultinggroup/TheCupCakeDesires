'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart, CartItem } from '@/components/useCartStore'

const CartInitializer = () => {
  const { addMultipleToCart } = useCart()
  const searchParams = useSearchParams()

  useEffect(() => {
    const productsParam = searchParams.get('products_to_add')
    if (productsParam) {
      try {
        const productsToAdd: Omit<CartItem, 'quantity' | 'id'>[] = JSON.parse(productsParam)
        if (Array.isArray(productsToAdd)) {
          addMultipleToCart(productsToAdd)
          // Optional: remove the query param from URL after adding to cart
          const newUrl = window.location.pathname
          window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
        }
      } catch (error) {
        console.error('Failed to parse products from URL params', error)
      }
    }
  }, [searchParams, addMultipleToCart])

  return null // This component does not render anything
}

export default CartInitializer
