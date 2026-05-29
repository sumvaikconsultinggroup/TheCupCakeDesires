'use client'

import Form from 'next/form'
import { ReactNode } from 'react'
import { useCart } from '../useCartStore'

interface Product {
  _id: string
  title: string
  handle: string
  images: { src: string }[]
  variants: any[]
  price?: number
}

interface ProductFormProps {
  children: ReactNode
  className?: string
  product: Product
  selectedRecommendedProducts?: Product[]
}

const ProductForm = ({ children, className, product, selectedRecommendedProducts = [] }: ProductFormProps) => {
  const { addItem } = useCart()
  const { images, title, variants, _id, handle } = product || {}

  const onFormSubmit = async (formData: FormData) => {
    const quantity = formData.get('quantity') ? Number(formData.get('quantity')) : 1
    const size = formData.get('size') ? String(formData.get('size')) : ''
    const color = formData.get('flavors') ? String(formData.get('flavors')) : ''

    // ✅ Find variant by matching color with option1Value
    const selectedVariant = variants?.find((variant) => {
      if (!color) return false
      return variant.option1Value?.toLowerCase() === color.toLowerCase()
    }) || variants?.[0]

    // ✅ Create main product cart item
    const mainCartItem: any = {
      productId: _id,
      handle: handle,
      name: title || '',
      price: selectedVariant?.price || 0,
      imageUrl: images[0]?.src || '',
      size,
      color,
      variant: selectedVariant,
      quantity,
    }

    console.warn('Adding main product to cart:', mainCartItem)
    addItem(mainCartItem)


    // ✅ Add selected recommended products to cart
    if (selectedRecommendedProducts.length > 0) {
      selectedRecommendedProducts.forEach((recProduct) => {
        const recCartItem: any = {
          productId: recProduct._id,
          handle: recProduct.handle,
          name: recProduct.title || recProduct.handle,
          price: recProduct.variants?.[0]?.price || recProduct.price || 0,
          imageUrl: recProduct.images?.[0]?.src || '',
          size: '',
          color: '',
          variant: recProduct.variants?.[0]
        }
        
        console.warn('Adding recommended product to cart:', recCartItem)
        addItem(recCartItem)
      })
    }

  }

  return (
    <Form action={onFormSubmit} className={className}>
      {children}
    </Form>
  )
}

export default ProductForm