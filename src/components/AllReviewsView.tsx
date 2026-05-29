'use client'

import { Star } from 'lucide-react'
import Image from 'next/image'

interface Review {
  _id: string
  star: number
  reviewerName: string
  reviewDescription: string
  createdAt?: string
  helpfulCount?: number
  isApproved?: boolean
}

interface Product {
  _id: string
  title: string
  handle: string
  images?: { src: string }[]
  variants?: { price: number; compareAtPrice?: number }[]
  reviews?: Review[]
}

interface AllReviewsViewProps {
  products: Product[]
  onViewAll: (product: Product) => void
}

export default function AllReviewsView({ products, onViewAll }: AllReviewsViewProps) {
  const renderStars = (count: number, size: number = 16) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={size} className={i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
        ))}
      </div>
    )
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Recently'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getAverageRating = (reviews: Review[] = []) => {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, review) => acc + review.star, 0)
    return (sum / reviews.length).toFixed(1)
  }

  return (
    <div className="min-h-content md:min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b198f] to-[#3086C8] px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl font-bold text-white">Product Reviews</h1>
          <p className="text-white/90">See what our customers are saying</p>
        </div>
      </div>

      {/* Products List */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-4 h-64 w-64">
              <Image
                src="/no-reviews-illustration.svg"
                alt="No reviews found"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-lg text-gray-600">No products with reviews found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {products.map((product) => {
              const approvedReviews = product.reviews?.filter((r) => r.isApproved) || []
              const firstTwoReviews = approvedReviews.slice(0, 2)
              const price = product.variants?.[0]?.price || 0
              const comparePrice = product.variants?.[0]?.compareAtPrice
              const avgRating = getAverageRating(approvedReviews)

              return (
                <div key={product._id} className="border-b border-gray-200 pb-8 last:border-0">
                  <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Product Info Section */}
                    <div className="flex shrink-0 gap-4 lg:w-1/4">
                      <div className="h-24 w-24 shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-2">
                        {product.images?.[0]?.src ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.title}
                            width={96}
                            height={96}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="mb-1 line-clamp-2 text-lg font-bold text-gray-900">{product.title}</h2>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-lg font-bold text-[#1b198f]">${price.toLocaleString()}</span>
                          {comparePrice && comparePrice > price && (
                            <span className="text-base text-gray-400 line-through">
                              ${comparePrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="hidden w-px self-stretch bg-[#1b198f] lg:block"></div>

                    {/* Reviews Section */}
                    <div className="flex-1">
                      {firstTwoReviews.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-gray-500 italic">No approved reviews yet</p>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col gap-6 md:flex-row">
                          {firstTwoReviews.map((review) => (
                            <div key={review._id} className="min-w-0 flex-1">
                              <div className="mb-2">{renderStars(review.star, 16)}</div>
                              <p className="mb-2 text-sm text-gray-700">{review.reviewDescription}</p>
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{review.reviewerName}</span>
                                <div className="flex items-center gap-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M23 12L20.56 9.21L20.9 5.52L17.29 4.7L15.4 1.5L12 2.96L8.6 1.5L6.71 4.69L3.1 5.5L3.44 9.2L1 12L3.44 14.79L3.1 18.49L6.71 19.31L8.6 22.5L12 21.03L15.4 22.49L17.29 19.3L20.9 18.48L20.56 14.79L23 12ZM9.38 16.01L7 13.61C6.61 13.22 6.61 12.59 7 12.2L7.07 12.13C7.46 11.74 8.1 11.74 8.49 12.13L10.1 13.75L15.25 8.59C15.64 8.2 16.28 8.2 16.67 8.59L16.74 8.66C17.13 9.05 17.13 9.68 16.74 10.07L10.82 16.01C10.41 16.4 9.78 16.4 9.38 16.01Z"
                                      fill="#00A856"
                                    />
                                  </svg>
                                  <span className="text-sm font-medium text-green-600">Verified Buyer</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{formatDate(review.createdAt)}</span>
                                <span>{review.helpfulCount || 0} people found this helpful</span>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => onViewAll(product)}
                            className="shrink-0 self-center rounded-full bg-[#1b198f] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3086C8] hover:shadow-lg"
                          >
                            View All
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}