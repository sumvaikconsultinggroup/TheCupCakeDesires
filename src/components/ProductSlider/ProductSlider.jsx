"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import Image from "next/image"

import NewProductCard from "@/components/NewProductCard/NewProductCard"
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';

function StarRating({ rating, reviews }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : star - 0.5 <= rating
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">| {reviews} Reviews</span>
    </div>
  )
}

export default function ProductCarouselSection({className = ''}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products?all=true')
        const data = await response.json()
        
        if (data.success) {
          const allProducts = data.data

          const isProtein = (product) => {
            const category = 'protein'
            const productCategory = product.productCategory?.toLowerCase() || ''
            const title = product.title?.toLowerCase() || ''
            const tags = product.tags?.map(t => t.toLowerCase()) || []
            
            return productCategory.includes(category) || 
                   title.includes(category) ||
                   tags.some(tag => tag.includes(category))
          }

          const proteinProducts = allProducts.filter(isProtein)
          const otherProducts = allProducts.filter(p => !isProtein(p))

          const sortedProducts = [...proteinProducts, ...otherProducts]
          setProducts(sortedProducts)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) {
    return (
      <section className="bg-[#f5f5f5] py-12 px-4 min-h-[600px] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-[#3086C8]"></div>
      </section>
    )
  }

  return (
    <section className="pt-12">
      <div className="">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto justify-between mb-8 px-4 gap-6 md:gap-0">
          <h2 className="text-5xl md:text-4xl lg:text-[56px] font-black text-[#1b198f] tracking-wide font-family-antonio text-center md:text-left">
            OUR TASTIEST PRODUCTS
          </h2>
          <div className="flex gap-2">
            <button
              className="flex justify-around items-center py-4 text-lg text-white font-family-roboto font-medium bg-[#1b198f] cursor-pointer shadow-[4px_6px_0px_black] border-black relative overflow-hidden transition-[box-shadow_250ms,transform_250ms,filter_50ms] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black] before:content-[''] before:absolute before:inset-0 before:bg-[#2a75b3] before:z-[-1] before:-translate-x-full before:transition-transform before:duration-250 hover:before:translate-x-0 w-10 h-10 sm:w-[50px] sm:h-[50px] swiper-button-prev-custom"
              aria-label="Previous products"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              className="flex justify-around items-center py-4 text-lg text-white font-family-roboto font-medium bg-[#1b198f] cursor-pointer shadow-[4px_6px_0px_black] border-black relative overflow-hidden transition-[box-shadow_250ms,transform_250ms,filter_50ms] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black] before:content-[''] before:absolute before:inset-0 before:bg-[#2a75b3] before:z-[-1] before:-translate-x-full before:transition-transform before:duration-250 hover:before:translate-x-0 w-10 h-10 sm:w-[50px] sm:h-[50px] swiper-button-next-custom"
              aria-label="Next products"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Products Carousel */}
        <Swiper
          modules={[Navigation]}
          spaceBetween={24}
          slidesPerView={1}
          centeredSlides={true}
          loop={true}
          navigation={{
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              centeredSlides: false,
            },
            768: {
              slidesPerView: 3,
              centeredSlides: false,
            },
            1024: {
              slidesPerView: 3.8,
              centeredSlides: true,
            },
          }}
          className="px-4! sm:px-8! lg:px-12!"
        >
          {products?.map((product) => (
            <SwiperSlide key={product._id}>
              <NewProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}