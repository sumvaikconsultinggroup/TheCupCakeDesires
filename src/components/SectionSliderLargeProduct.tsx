'use client'

import Heading from '@/components/Heading/Heading'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import useEmblaCarousel from 'embla-carousel-react'
import { useCarouselArrowButtons } from '@/hooks/use-carousel-arrow-buttons'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import axios from 'axios'
import ProductCardLarge from './ProductCardLarge'

interface SectionSliderLargeProductProps {
  className?: string
  products?: any[]
  heading?: string
  headingDim?: string
  emblaOptions?: any
  fetchFromAPI?: boolean
  limit?: number
}

const SectionSliderLargeProduct = ({
  className = '',
  products: initialProducts,
  heading = 'Chosen by experts',
  headingDim = 'Featured of the week',
  emblaOptions = {
    slidesToScroll: 'auto',
  },
  fetchFromAPI = true,
  limit = 6,
}: SectionSliderLargeProductProps) => {
  const [products, setProducts] = useState(initialProducts || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = useCarouselArrowButtons(emblaApi)

  // Fetch products from API if needed
  useEffect(() => {
    if (fetchFromAPI) {
      const fetchProducts = async () => {
        setLoading(true)
        setError(null)
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          const response = await axios.get(`${baseUrl}/api/products?rangeStart=20&rangeEnd=26`)

          if (response.data && response.data.data) {
            setProducts(response.data.data)
          } else {
            setProducts([])
          }
        } catch (err) {
          console.error('Error fetching products:', err)
          setError('Failed to load products')
          setProducts([])
        } finally {
          setLoading(false)
        }
      }

      fetchProducts()
    }
  }, [fetchFromAPI, initialProducts, limit])

  // Loading state
  if (loading) {
    return (
      <div className={`nc-SectionSliderLargeProduct ${className}`}>
        <Heading isCenter={false} hasNextPrev={false} headingDim={headingDim}>
          {heading}
        </Heading>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`nc-SectionSliderLargeProduct ${className}`}>
        <Heading isCenter={false} hasNextPrev={false} headingDim={headingDim}>
          {heading}
        </Heading>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className={`nc-SectionSliderLargeProduct ${className}`}>
        <Heading isCenter={false} hasNextPrev={false} headingDim={headingDim}>
          {heading}
        </Heading>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">No products available</p>
            <Link
              href="/products"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`nc-SectionSliderLargeProduct ${className}`}>
      <Heading
        isCenter={false}
        hasNextPrev
        headingDim={headingDim}
        prevBtnDisabled={prevBtnDisabled}
        nextBtnDisabled={nextBtnDisabled}
        onClickPrev={onPrevButtonClick}
        onClickNext={onNextButtonClick}
      >
        {heading}
      </Heading>

      <div className={'embla'} ref={emblaRef}>
        <div className="-ms-5 embla__container sm:-ms-8">
          {products.map((product) => (
            <div
              key={product._id}
              className="embla__slide basis-full ps-5 sm:basis-2/3 sm:ps-8 lg:basis-1/2 xl:basis-2/5 2xl:basis-1/3"
            >
              <ProductCardLarge product={product} />
            </div>
          ))}

          {/* "More items" card */}
          <Link
            href={'/products'}
            className="group relative block embla__slide basis-full ps-5 sm:basis-2/3 sm:ps-8 lg:basis-1/2 xl:basis-2/5 2xl:basis-1/3"
          >
            <div className="relative h-[410px] overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all duration-300">
              <div className="h-[410px] bg-linear-to-br from-primary-50 to-primary-100 dark:from-neutral-800 dark:to-neutral-700"></div>
              <div className="absolute inset-x-10 inset-y-6 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={24}
                      color="currentColor"
                      className="text-primary-600 dark:text-primary-400"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    More items
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Discover our full collection
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SectionSliderLargeProduct
