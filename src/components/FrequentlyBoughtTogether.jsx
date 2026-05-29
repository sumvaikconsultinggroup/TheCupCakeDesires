'use client'

import AddToCartButton from '@/components/AddToCardButton'
import { Check, PlusCircle } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export default function FrequentlyBoughtTogether({ products, currentProduct }) {
  const [selectedProducts, setSelectedProducts] = useState(new Set([currentProduct._id]))
  const [totalPrice, setTotalPrice] = useState(currentProduct.variants[0]?.price || 0)
  const allProducts = [currentProduct, ...products.slice(0, 2)] // Show current + 2 recommended (3 total)

  // Initialize with all products selected
  useEffect(() => {
    const allIds = new Set(allProducts.map((p) => p._id))
    setSelectedProducts(allIds)
  }, [])

  // Calculate total price when selected products change
  useEffect(() => {
    const total = Array.from(selectedProducts).reduce((sum, productId) => {
      const product = allProducts.find((p) => p._id === productId)
      return sum + (product?.variants[0]?.price || 0)
    }, 0)
    setTotalPrice(total)
  }, [selectedProducts])

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  // Properly map products to cart items with correct variant structure
  const productsToAdd = allProducts
    .filter((p) => selectedProducts.has(p._id))
    .map((p) => {
      const variant = p.variants[0]
      return {
        productId: p._id,
        name: p.title,
        price: variant?.price || 0,
        compareAtPrice: variant?.compareAtPrice,
        imageUrl: p.images[0]?.src,
        handle: p.handle,
        // Pass the entire variant object
        variant: variant || undefined,
      }
    })

  const renderCardContent = (product) => (
    <div
      className={`rounded-lg bg-white p-3 shadow-sm transition-all duration-300 ${
        selectedProducts.has(product._id) ? 'opacity-100' : 'opacity-30 blur-[1px] grayscale'
      }`}
    >
      {/* Checkbox - Separate from blur */}
      <button
        onClick={() => toggleProductSelection(product._id)}
        className={`absolute top-2 left-2 z-20 flex h-5 w-5 items-center justify-center rounded transition-all duration-200 ${
          selectedProducts.has(product._id) ? 'scale-100 bg-[#1b198f]' : 'scale-90 border-2 border-gray-300 bg-white'
        }`}
        style={{ filter: 'none', opacity: 1 }}
      >
        {selectedProducts.has(product._id) && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </button>

      {/* Product Image */}
      <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-gray-50">
        <Image
          src={product.images[0]?.src || '/placeholder.svg?height=150&width=150&query=protein product'}
          alt={product.title}
          fill
          className="object-contain p-2"
          sizes="150px"
        />
      </div>

      {/* Product Title */}
      <h4 className="mb-1 line-clamp-2 text-xs leading-tight font-semibold text-gray-800 uppercase">{product.title}</h4>

      {/* Product Price */}
      <p className="text-sm font-bold text-gray-900">$ {product.variants[0]?.price.toLocaleString()}</p>
    </div>
  )

  return (
    <div className="mx-auto mt-12 flex w-full max-w-7xl flex-col items-center px-4 sm:mt-16 sm:px-6 lg:px-8">
      <h2 className="mb-6 w-full text-center font-family-antonio text-3xl font-black tracking-wide text-[#1b198f] uppercase md:text-4xl lg:text-[56px]">
        Frequently Bought Together
      </h2>
      <div className="mx-auto mb-10 w-full max-w-6xl rounded-xl bg-[#FFF5E6] p-6 md:mb-0">
        {/* Products Row */}
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-6">
          {/* Product Cards Container */}
          <div className="w-full lg:w-auto">
            {/* Mobile Swiper */}
            <div className="block w-full lg:hidden">
              <Swiper
                modules={[Pagination]}
                spaceBetween={10}
                slidesPerView={2}
                centeredSlides={false}
                className="pb-10"
              >
                {allProducts.map((product) => (
                  <SwiperSlide key={product._id}>
                    <div className="relative mx-auto w-full">{renderCardContent(product)}</div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop Flex Layout */}
            <div className="hidden items-center justify-center lg:flex lg:flex-nowrap lg:gap-4">
              {allProducts.map((product, index) => (
                <div key={product._id} className="flex items-center">
                  {/* Product Card */}
                  <div className="relative w-[180px]">{renderCardContent(product)}</div>

                  {/* Plus Sign */}
                  {index < allProducts.length - 1 && (
                    <PlusCircle className="mx-2 h-8 w-8 shrink-0 text-gray-400 lg:mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total Price and Add to Cart */}
          <div className="mt-4 flex w-full flex-col items-center gap-3 lg:mt-0 lg:ml-6 lg:w-auto">
            <div className="text-center font-family-roboto text-lg font-bold lg:text-right">
              <span className="font-family-roboto text-lg font-bold text-black">Total price: </span>
              <span className="text-xl font-bold text-red-500">$ {totalPrice.toLocaleString()}</span>
            </div>

            <div className="w-full min-w-[200px] lg:w-auto">
              <AddToCartButton products={productsToAdd} blackVariant={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}