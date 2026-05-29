'use client'

import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ChevronLeft, Edit2, Star, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Review {
  _id: string
  star: number
  reviewerName: string
  reviewDescription: string
  createdAt?: string
  helpfulCount?: number
  image?: string
  helpfulVotes?: string[]
  userId?: string
}

interface Product {
  _id: string
  title: string
  handle: string
  images?: { src: string }[]
  variants?: { price: number; compareAtPrice?: number }[]
  reviews?: Review[]
}

interface ProductDetailsViewProps {
  product: Product
  onBack: () => void
}

const REVIEWS_PER_PAGE = 20

export default function ProductDetailsView({ product, onBack }: ProductDetailsViewProps) {
  const { user } = useUser()
  const [localReviews, setLocalReviews] = useState<Review[]>([])
  const [reviewPage, setReviewPage] = useState(1)
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({ star: 5, reviewDescription: '', reviewerName: '' })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewImage, setReviewImage] = useState<File | null>(null)

  useEffect(() => {
    setLocalReviews((product.reviews?.filter((r) => (r as any).isApproved !== false) || []) as Review[])
  }, [product.reviews])

  useEffect(() => {
    setReviewPage(1)
  }, [product.handle])

  const totalReviewPages = Math.max(1, Math.ceil(localReviews.length / REVIEWS_PER_PAGE))
  const paginatedReviews = localReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE)

  useEffect(() => {
    if (reviewPage > totalReviewPages) setReviewPage(totalReviewPages)
  }, [reviewPage, totalReviewPages])

  const markHelpful = async (reviewId: string) => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }

    // Optimistic update
    const reviewIndex = localReviews.findIndex((r) => r._id === reviewId)
    if (reviewIndex === -1) return

    const review = localReviews[reviewIndex]
    const hasVoted = review.helpfulVotes?.includes(user.id)

    const updatedReviews = [...localReviews]
    updatedReviews[reviewIndex] = {
      ...review,
      helpfulVotes: hasVoted
        ? review.helpfulVotes?.filter((id) => id !== user.id)
        : [...(review.helpfulVotes || []), user.id],
      helpfulCount: hasVoted ? Math.max(0, (review.helpfulCount || 0) - 1) : (review.helpfulCount || 0) + 1,
    }
    setLocalReviews(updatedReviews)

    try {
      await axios.patch(`/api/reviews/${product.handle}`, { reviewId })
    } catch (error) {
      console.error('Error voting helpful:', error)
      toast.error('Failed to update vote')
      // Revert on error
      setLocalReviews(localReviews)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to write a review')
      return
    }

    setIsSubmittingReview(true)
    try {
      const formData = new FormData()
      formData.append('star', reviewForm.star.toString())
      formData.append('reviewDescription', reviewForm.reviewDescription)
      formData.append('reviewerName', reviewForm.reviewerName || user.fullName || 'Anonymous')
      if (reviewImage) {
        formData.append('image', reviewImage)
      }

      if (editingReviewId) {
        formData.append('reviewId', editingReviewId)
        const { data } = await axios.put(`/api/reviews/${product.handle}`, formData)
        if (data.success) {
          if (data.data.isApproved) {
            setLocalReviews((prev) => prev.map((r) => (r._id === editingReviewId ? { ...r, ...data.data } : r)))
            toast.success('Review updated successfully')
          } else {
            setLocalReviews((prev) => prev.filter((r) => r._id !== editingReviewId))
            toast.success('Review updated and pending approval')
          }
        }
      } else {
        const { data } = await axios.post(`/api/reviews/${product.handle}`, formData)
        if (data.success) {
          if (data.data.isApproved) {
            setLocalReviews((prev) => [...prev, data.data])
            toast.success('Review submitted successfully')
          } else {
            toast.success('Review submitted for approval')
          }
        }
      }

      setIsWritingReview(false)
      setEditingReviewId(null)
      setReviewForm({ star: 5, reviewDescription: '', reviewerName: '' })
      setReviewImage(null)
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const { data } = await axios.delete(`/api/reviews/${product.handle}`, {
        data: { reviewId },
      })

      if (data.success) {
        setLocalReviews((prev) => prev.filter((r) => r._id !== reviewId))
        toast.success('Review deleted')
      }
    } catch (error: any) {
      console.error('Error deleting review:', error)
      toast.error(error.response?.data?.message || 'Failed to delete review')
    }
  }

  const renderStars = (count: number, size: number = 16) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={size} className={i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
        ))}
      </div>
    )
  }

  const getAverageRating = () => {
    if (!localReviews.length) return 0
    const sum = localReviews.reduce((acc, review) => acc + review.star, 0)
    return (sum / localReviews.length).toFixed(1)
  }

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]
    localReviews.forEach((review) => {
      distribution[review.star - 1]++
    })
    return distribution.reverse().map((count, index) => ({
      stars: 5 - index,
      percentage: localReviews.length > 0 ? Math.round((count / localReviews.length) * 100) : 0,
    }))
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Recently'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const price = product.variants?.[0]?.price || 0
  const comparePrice = product.variants?.[0]?.compareAtPrice
  const avgRating = getAverageRating()
  const starDistribution = getRatingDistribution()

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button Header */}
      <div className="bg-gradient-to-r from-[#1b198f] to-[#3086C8] px-6 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-white transition hover:text-white/80">
          <ChevronLeft size={20} />
          <span className="font-medium">Back to All Reviews</span>
        </button>
      </div>

      {/* Product Header */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-4 md:flex md:items-start md:gap-8">
            {/* Product Image */}
            <div className="col-span-1 flex justify-center md:flex-shrink-0">
              <div className="h-40 w-40 rounded-lg bg-gray-50 p-2">
                {product.images?.[0]?.src ? (
                  <Image
                    src={product.images[0].src}
                    alt={product.title}
                    width={160}
                    height={160}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded bg-gray-200">
                    <span className="text-sm text-gray-400">No image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="col-span-1 md:flex-1">
              <h1 className="mb-2 text-xl font-bold text-gray-900 md:mb-4 md:text-3xl">{product.title}</h1>

              <div className="mb-2 flex flex-wrap items-center gap-3 md:mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(Number(avgRating)), 20)}
                  <span className="text-xl font-bold text-[#1b198f] md:text-2xl">{avgRating}</span>
                </div>
                <span className="text-sm text-gray-600 md:text-base">({localReviews.length} reviews)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-[#1b198f] md:text-3xl">${price.toLocaleString()}</span>
                {comparePrice && comparePrice > price && (
                  <span className="text-sm text-gray-400 line-through md:text-xl">
                    ${comparePrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Button moves under info on mobile */}
              <div className="mt-4 md:hidden">
                <Link
                  href={`/products/${product.handle}`}
                  className="block w-full rounded-lg bg-[#1b198f] py-3 text-center text-sm font-bold text-white hover:bg-[#3086C8]"
                >
                  View Product
                </Link>
              </div>
            </div>

            {/* Desktop Button */}
            <div className="hidden md:flex md:flex-shrink-0">
              <Link
                href={`/products/${product.handle}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#1b198f] px-6 py-3 text-sm font-bold text-white hover:bg-[#3086C8]"
              >
                View Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center px-6">
        <div className="h-px w-full max-w-7xl bg-gray-200" />
      </div>

      {/* Reviews Section */}
      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Customer Reviews for {product.title}</h2>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Left Sidebar - Rating Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-xl bg-[#f9fafb] p-6">
                <h3 className="mb-4 text-center text-lg font-bold text-[#1b198f]">Overall Rating</h3>

                <div className="mb-6 text-center">
                  <div className="mb-2 flex justify-center gap-1">{renderStars(Math.round(Number(avgRating)), 20)}</div>
                  <p className="text-4xl font-bold text-[#1b198f]">{avgRating}</p>
                  <p className="text-sm text-gray-600">Based on {localReviews.length} reviews</p>
                </div>

                {/* Star Distribution */}
                <div className="space-y-3">
                  {starDistribution.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2">
                      <span className="w-14 text-sm font-medium text-gray-700">{item.stars} star</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-[#1b198f] to-[#3086C8] transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-medium text-gray-700">{item.percentage}%</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <p className="mb-4 text-center text-sm text-gray-600">
                    We would love to know what you feel about the product
                  </p>
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.error('Please login to write a review')
                        return
                      }
                      setIsWritingReview(!isWritingReview)
                      setEditingReviewId(null)
                      setReviewForm({ star: 5, reviewDescription: '', reviewerName: user.fullName || '' })
                      setReviewImage(null)
                    }}
                    className="w-full rounded-lg bg-[#1b198f] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#3086C8]"
                  >
                    Write a Review
                  </button>
                </div>
              </div>
            </div>

            {/* Main Reviews Area */}
            <div className="lg:col-span-3">
              <AnimatePresence>
                {isWritingReview && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSubmitReview}
                    className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-6"
                  >
                    <h3 className="mb-4 text-lg font-bold text-gray-900">
                      {editingReviewId ? 'Edit Review' : 'Write a Review'}
                    </h3>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-bold text-gray-700">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, star })}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${star <= reviewForm.star ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-bold text-gray-700">Review</label>
                      <textarea
                        required
                        value={reviewForm.reviewDescription}
                        onChange={(e) => setReviewForm({ ...reviewForm, reviewDescription: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-[#1B198F] focus:ring-1 focus:ring-[#1B198F]"
                        rows={4}
                        placeholder="Share your experience..."
                      />
                    </div>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-bold text-gray-700">Add Photo (Optional)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-100">
                          <Camera className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-600">Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setReviewImage(e.target.files[0])
                              }
                            }}
                          />
                        </label>
                        {reviewImage && (
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200">
                            <Image src={URL.createObjectURL(reviewImage)} alt="Preview" fill className="object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviewImage(null)}
                              className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center bg-red-500 text-white hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="rounded-lg bg-[#1B198F] px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-[#3086C8] disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsWritingReview(false)
                          setEditingReviewId(null)
                          setReviewForm({ star: 5, reviewDescription: '', reviewerName: '' })
                          setReviewImage(null)
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {localReviews.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-12 text-center">
                  <p className="text-lg text-gray-600">No reviews yet for this product</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {paginatedReviews.map((review) => (
                    <div
                      key={review._id}
                      className="rounded-xl border-2 border-gray-200 bg-white p-6 transition-colors hover:border-[#1b198f]"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1b198f] to-[#3086C8] text-lg font-bold text-white">
                            {review.reviewerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{review.reviewerName}</span>
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
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              {renderStars(review.star, 14)}
                              <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                          {user && review.userId === user.id && (
                            <div className="ml-auto flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingReviewId(review._id)
                                  setReviewForm({
                                    star: review.star,
                                    reviewDescription: review.reviewDescription || '',
                                    reviewerName: review.reviewerName || '',
                                  })
                                  setReviewImage(null)
                                  setIsWritingReview(true)
                                }}
                                className="text-gray-400 hover:text-[#1B198F]"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review._id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mb-4 text-base leading-relaxed text-gray-700">{review.reviewDescription}</p>

                      {review.image && (
                        <div className="mb-4">
                          <Image
                            src={review.image}
                            alt="Review image"
                            width={200}
                            height={200}
                            className="rounded-lg border border-gray-200"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-6 border-t border-gray-200 pt-4 text-sm">
                        <span className="text-gray-600">{review.helpfulCount || 0} people found this helpful</span>
                        <button
                          onClick={() => markHelpful(review._id)}
                          className="rounded border border-[#1b198f] px-4 py-1 text-[#1b198f] transition hover:bg-[#1b198f] hover:text-white"
                        >
                          Helpful
                        </button>
                      </div>
                    </div>
                  ))}

                  {totalReviewPages > 1 && (
                    <div className="mt-8 flex flex-col items-center gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between">
                      <div className="text-xs text-gray-600">
                        Showing{' '}
                        <span className="font-semibold text-gray-900">
                          {(reviewPage - 1) * REVIEWS_PER_PAGE + 1}–
                          {Math.min(reviewPage * REVIEWS_PER_PAGE, localReviews.length)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-gray-900">{localReviews.length}</span> reviews
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                          disabled={reviewPage === 1}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:border-[#1b198f] hover:text-[#1b198f] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((p) => {
                          const isEdge = p === 1 || p === totalReviewPages
                          const isNear = Math.abs(p - reviewPage) <= 1
                          if (!isEdge && !isNear) {
                            if (p === reviewPage - 2 || p === reviewPage + 2) {
                              return (
                                <span key={p} className="px-1 text-xs text-gray-400">
                                  …
                                </span>
                              )
                            }
                            return null
                          }
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setReviewPage(p)}
                              className={`min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                                p === reviewPage
                                  ? 'bg-[#1b198f] text-white'
                                  : 'border border-gray-300 text-gray-800 hover:border-[#1b198f] hover:text-[#1b198f]'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
                          disabled={reviewPage === totalReviewPages}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:border-[#1b198f] hover:text-[#1b198f] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
