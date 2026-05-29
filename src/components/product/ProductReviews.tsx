'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Star, ThumbsUp, Shield, ChevronDown, User, Calendar,
  Image as ImageIcon, X, Loader2, CheckCircle, AlertCircle,
  MessageSquare, Filter, SortAsc, SortDesc
} from 'lucide-react'
import toast from 'react-hot-toast' 

interface Review {
  _id: string
  customerName: string
  rating: number
  title: string
  content: string
  images: string[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
}

interface ReviewStats {
  avgRating: number
  totalReviews: number
  verifiedCount: number
  distribution: { star: number; count: number }[]
}

interface ProductReviewsProps {
  productHandle: string
  productTitle: string
}

export default function ProductReviews({ productHandle, productTitle }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [helpedReviews, setHelpedReviews] = useState<Set<string>>(new Set())
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    content: '',
    images: [] as string[]
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const fetchReviews = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sortBy,
        sortOrder
      })
      
      const res = await fetch(`/api/product-reviews/${productHandle}?${params}`)
      
      if (!res.ok) {
        console.error('Failed to fetch reviews:', res.status)
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid response type')
        return
      }
      
      const data = await res.json()
      
      if (data.success) {
        if (append) {
          setReviews(prev => [...prev, ...data.data])
        } else {
          setReviews(data.data)
        }
        setStats(data.stats)
        setHasMore(pageNum < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [productHandle, sortBy, sortOrder])

  useEffect(() => {
    fetchReviews(1)
  }, [fetchReviews])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchReviews(nextPage, true)
  }

  const handleSort = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const markHelpful = async (reviewId: string) => {
    if (helpedReviews.has(reviewId)) return
    
    try {
      const res = await fetch(`/api/reviews/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reviewId,
          voterId: 'user_' + Math.random().toString(36).substr(2, 9) 
        })
      })
      
      if (!res.ok) {
        console.error('Failed to mark helpful:', res.status)
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid response type')
        return
      }
      
      const data = await res.json()
      
      if (data.success) {
        setHelpedReviews(prev => new Set([...prev, reviewId]))
        setReviews(prev => prev.map(r => 
          r._id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r
        ))
      } else {
        toast.error(data.error || 'Already marked as helpful')
      }
    } catch (error) {
      toast.error('Failed to mark as helpful')
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.customerName.trim()) errors.customerName = 'Name is required'
    if (!formData.customerEmail.trim()) errors.customerEmail = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format'
    }
    if (!formData.title.trim()) errors.title = 'Review title is required'
    if (!formData.content.trim()) errors.content = 'Review content is required'
    if (formData.content.length < 20) errors.content = 'Review must be at least 20 characters'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productHandle,
          ...formData
        })
      })
      
      if (!res.ok) {
        toast.error('Server error. Please try again.')
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        toast.error('Server error. Please try again.')
        return
      }
      
      const data = await res.json()
      
      if (data.success) {
        setSubmitted(true)
        setShowForm(false)
        toast.success('Review submitted! It will appear after approval.')
        setFormData({
          customerName: '',
          customerEmail: '',
          rating: 5,
          title: '',
          content: '',
          images: []
        })
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B198F]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Rating Summary */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-black text-neutral-900 dark:text-white">
              {stats?.avgRating?.toFixed(1) || '0.0'}
            </div>
            <div className="mt-2 flex justify-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(stats?.avgRating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-neutral-200 text-neutral-200'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              {stats?.totalReviews || 0} reviews
            </p>
          </div>
          
          {/* Distribution */}
          <div className="flex-1 max-w-xs">
            {stats?.distribution?.map(({ star, count }) => {
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 text-sm font-medium text-neutral-600">{star}</span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: (5 - star) * 0.1 }}
                      className="h-full rounded-full bg-amber-400"
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-neutral-500">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Write Review Button */}
        {!submitted && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1B198F]/90"
          >
            <MessageSquare className="h-5 w-5" />
            Write a Review
          </button>
        )}
        
        {submitted && (
          <div className="flex items-center gap-2 rounded-xl bg-green-100 px-6 py-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Review Submitted!
          </div>
        )}
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={submitReview} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-6 text-lg font-bold">Write Your Review</h3>
              
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Your Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= formData.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-neutral-200 text-neutral-200 hover:fill-amber-200 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Name & Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Your Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className={`w-full rounded-lg border px-4 py-2.5 outline-none transition-colors ${
                        formErrors.customerName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-neutral-300 focus:border-[#1B198F] dark:border-neutral-600'
                      } dark:bg-neutral-700`}
                      placeholder="John Doe"
                    />
                    {formErrors.customerName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.customerName}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Your Email *</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className={`w-full rounded-lg border px-4 py-2.5 outline-none transition-colors ${
                        formErrors.customerEmail
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-neutral-300 focus:border-[#1B198F] dark:border-neutral-600'
                      } dark:bg-neutral-700`}
                      placeholder="john@example.com"
                    />
                    {formErrors.customerEmail && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.customerEmail}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">Your email won't be displayed publicly</p>
                  </div>
                </div>
                
                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Review Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full rounded-lg border px-4 py-2.5 outline-none transition-colors ${
                      formErrors.title
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-300 focus:border-[#1B198F] dark:border-neutral-600'
                    } dark:bg-neutral-700`}
                    placeholder="Summarize your experience"
                    maxLength={200}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>
                
                {/* Content */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Your Review *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className={`w-full rounded-lg border px-4 py-2.5 outline-none transition-colors ${
                      formErrors.content
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-300 focus:border-[#1B198F] dark:border-neutral-600'
                    } dark:bg-neutral-700`}
                    rows={4}
                    placeholder="Share your experience with this product..."
                    maxLength={2000}
                  />
                  {formErrors.content && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.content}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">{formData.content.length}/2000 characters</p>
                </div>
                
                {/* Submit */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-2.5 font-semibold text-white disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>Submit Review</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">Sort by:</span>
          <button
            onClick={() => handleSort('createdAt')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortBy === 'createdAt' ? 'bg-[#1B198F] text-white' : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            Most Recent
            {sortBy === 'createdAt' && (sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />)}
          </button>
          <button
            onClick={() => handleSort('helpful')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortBy === 'helpful' ? 'bg-[#1B198F] text-white' : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            Most Helpful
          </button>
          <button
            onClick={() => handleSort('rating')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sortBy === 'rating' ? 'bg-[#1B198F] text-white' : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            Highest Rated
            {sortBy === 'rating' && (sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />)}
          </button>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700">
          <MessageSquare className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
          <p className="mt-2 text-neutral-500">Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B198F] to-blue-600 text-lg font-bold text-white">
                  {getInitials(review.customerName)}
                </div>
                
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {review.customerName}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Shield className="h-3 w-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-neutral-200 text-neutral-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-neutral-500">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h4 className="mt-3 font-semibold text-neutral-900 dark:text-white">
                    {review.title}
                  </h4>
                  <p className="mt-2 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {review.content}
                  </p>
                  
                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {review.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(img)}
                          className="relative h-20 w-20 overflow-hidden rounded-lg transition-transform hover:scale-105"
                        >
                          <Image src={img} alt="Review" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => markHelpful(review._id)}
                      disabled={helpedReviews.has(review._id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        helpedReviews.has(review._id)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${helpedReviews.has(review._id) ? 'fill-green-600' : ''}`} />
                      {helpedReviews.has(review._id) ? 'Helpful' : 'Helpful'}
                      {review.helpfulCount > 0 && ` (${review.helpfulCount})`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 px-6 py-3 font-medium transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-5 w-5" />
                    Load More Reviews
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-h-[80vh] max-w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="Review image"
                width={800}
                height={600}
                className="rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
