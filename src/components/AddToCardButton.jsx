// src/components/AddToCartButton.jsx (Example)
'use client'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'

import { useCart } from './useCartStore'


export default function AddToCartButton({ product, products, blackVariant = true }) {
  const { addItem, addMultipleToCart } = useCart()

  // Check if product has stock
  const inStock = product?.variant?.inventoryQty ? product.variant.inventoryQty > 0 : true

  const handleAddToCart = () => {
    if (products) {
      addMultipleToCart(products)
    } else if (product) {
      addItem(product)
    }
  }

  // If out of stock, show text instead of button
  if (!inStock) {
    return (
      <div className="flex items-center justify-center py-3 px-4 text-lg font-bold text-red-600 bg-red-50 rounded-lg border-2 border-red-200">
        Out of Stock
      </div>
    )
  }

  return blackVariant ? (
    <ButtonPrimary className=' cursor-pointer' onClick={handleAddToCart}>Add to Cart</ButtonPrimary>
  ) : (
    <button
      onClick={handleAddToCart}
      className="flex justify-around items-center py-2 text-lg text-white font-family-roboto font-medium bg-[#1B198F] cursor-pointer shadow-[4px_6px_0px_black]  border-black  relative overflow-hidden w-full  transition-[box-shadow_250ms,transform_250ms,filter_50ms] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black]  before:content-[''] before:absolute before:inset-0 before:bg-[#2a75b3] before:z-[-1] before:-translate-x-full before:transition-transform before:duration-250 hover:before:translate-x-0"
    >
      Add to Cart
    </button>
  )
}