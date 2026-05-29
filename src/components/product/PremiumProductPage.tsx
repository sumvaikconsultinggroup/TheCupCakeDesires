'use client'

import { useWishlist } from '@/components/LikeButton'
import ProductBundleOffers from '@/components/ProductBundleOffers'
import SafeHTML from '@/components/SafeHTML'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import { useAside } from '@/components/aside/aside'
import BoughtTogether from '@/components/product/BoughtTogether'
import LabTestReport from '@/components/product/LabTestReport'
import RecentlyViewed, { addToRecentlyViewed } from '@/components/product/RecentlyViewed'
import YouMayAlsoLike from '@/components/product/YouMayAlsoLike'
import { useCart } from '@/components/useCartStore'
import { getLabReport } from '@/lib/labReports'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  BadgeCheck,
  Beaker,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dumbbell,
  Edit2,
  Eye,
  Facebook,
  Flame,
  Heart,
  Info,
  MapPin,
  Maximize2,
  MessageCircle,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Truck,
  Twitter,
  X,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface ProductImage {
  src: string
  alt?: string
}

interface ProductVariant {
  _id?: string
  price: number
  compareAtPrice?: number
  option1Value?: string
  option2Value?: string
  inventoryQty?: number
  sku?: string
  grams?: number
  weightUnit?: string
}

interface ProductReview {
  _id: string
  star: number
  text?: string
  name?: string
  reviewerName?: string
  reviewDescription?: string
  reviewerImage?: string | null
  createdAt?: string
  image?: string
  helpful?: number
  userId?: string
  helpfulVotes?: string[]
  helpfulCount?: number
  isApproved?: boolean
}

interface Product {
  _id: string
  handle: string
  title: string
  description?: string
  bodyHtml?: string
  images?: ProductImage[]
  variants?: ProductVariant[]
  reviews?: ProductReview[]
  productCategory?: string
  tags?: string[]
  options?: { name: string; values: string[] }[]
  benefits?: string[]
  nutritionFacts?: { name: string; value: string; percentage?: number }[]
  ingredients?: string
  howToUse?: string
  vendor?: string
  faq?: { question: string; answer: string }[]
}

interface PremiumProductPageProps {
  product: Product
  relatedProducts?: Product[]
}

// Trust badges with enhanced design
const trustBadges = [
  { icon: Truck, text: 'Free Shipping', subtext: 'Orders $999+', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Shield, text: '100% Authentic', subtext: 'Guaranteed', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: RotateCcw, text: 'Easy Returns', subtext: '7 Day Policy', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Award, text: 'Lab Tested', subtext: 'Quality Assured', color: 'text-amber-500', bg: 'bg-amber-50' },
]

// Product highlights
const highlights = [
  { icon: Dumbbell, label: '24g Protein', desc: 'Per Serving' },
  { icon: Beaker, label: 'Lab Tested', desc: 'Certified' },
  { icon: Target, label: 'Fast Absorbing', desc: 'Whey Protein' },
  { icon: Sparkles, label: 'Premium Quality', desc: 'Imported' },
]

// FAQ data
const productFAQs = [
  {
    q: 'How should I take this product?',
    a: 'Mix 1 scoop (30g) with 200-250ml of cold water or milk. Shake well and consume immediately. Best taken post-workout or between meals.',
  },
  {
    q: 'Is this product suitable for beginners?',
    a: 'Yes! This protein is perfect for both beginners and advanced athletes. Start with one serving per day and adjust based on your protein needs.',
  },
  {
    q: 'Are there any side effects?',
    a: 'Our product is made from high-quality ingredients and is generally well-tolerated. However, if you have any pre-existing conditions, consult your doctor first.',
  },
  {
    q: 'How long will one pack last?',
    a: 'A 1kg pack contains approximately 33 servings. If you consume one serving daily, it will last about a month.',
  },
]

/** PDP `/products/creatine`: hidden H1 for SEO only; visible title stays `product.title`. */
const PURE_CREATINE_SEO_HANDLE = 'creatine'
const PURE_CREATINE_SEO_H1 = 'Pure Creatine - Gibbon Nutrition'

export default function PremiumProductPage({ product, relatedProducts = [] }: PremiumProductPageProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [pincode, setPincode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState<{
    available: boolean
    cod: boolean
  } | null>(null)
  const [checkingDelivery, setCheckingDelivery] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [liveViewers, setLiveViewers] = useState(0) // Initialize with 0, set in useEffect
  const [recentPurchases, setRecentPurchases] = useState(0) // Initialize with 0, set in useEffect
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set())
  const [isClient, setIsClient] = useState(false)
  const [localReviews, setLocalReviews] = useState<ProductReview[]>([])
  const [isWritingReview, setIsWritingReview] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({ star: 5, reviewDescription: '', reviewerName: '' })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewImage, setReviewImage] = useState<File | null>(null)
  const [reviewPage, setReviewPage] = useState(1)
  const REVIEWS_PER_PAGE = 20

  const imageRef = useRef<HTMLDivElement>(null)
  const addToCartRef = useRef<HTMLButtonElement>(null)
  const productInfoRef = useRef<HTMLDivElement>(null)

  const { addItem } = useCart()
  const { open: openCart } = useAside()
  const { user } = useUser()

  const images = product.images || []
  const variants = product.variants || []

  const displayFAQs =
    product.faq && product.faq.length > 0 ? product.faq.map((f) => ({ q: f.question, a: f.answer })) : productFAQs

  useEffect(() => {
    setLocalReviews((product.reviews || []).filter((r) => r.isApproved))
  }, [product.reviews])

  // Pagination derivations for the reviews list
  const totalReviewPages = Math.max(1, Math.ceil(localReviews.length / REVIEWS_PER_PAGE))
  const paginatedReviews = localReviews.slice(
    (reviewPage - 1) * REVIEWS_PER_PAGE,
    reviewPage * REVIEWS_PER_PAGE
  )

  // Snap page back into range if reviews shrink below current page (e.g. after delete)
  useEffect(() => {
    if (reviewPage > totalReviewPages) setReviewPage(totalReviewPages)
  }, [reviewPage, totalReviewPages])

  const currentVariant = variants[selectedVariant] || variants[0]

  const {
    isLiked: isWishlisted,
    handleLike: toggleWishlist,
    isLoading: isWishlistLoading,
  } = useWishlist({
    productId: product._id,
    productName: product.title,
    variant: currentVariant,
  })

  const price = currentVariant?.price || 0
  const compareAtPrice = currentVariant?.compareAtPrice
  const discount =
    compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0
  const avgRating = localReviews.length > 0 ? localReviews.reduce((acc, r) => acc + r.star, 0) / localReviews.length : 0
  const inStock = (currentVariant?.inventoryQty ?? 0) > 0
  const lowStock = (currentVariant?.inventoryQty ?? 0) <= 5 && (currentVariant?.inventoryQty ?? 0) > 0

  // Get unique options
  const sizeOptions = [...new Set(variants.map((v) => v.option1Value).filter(Boolean))]

  // Initialize random values after hydration to prevent mismatch
  useEffect(() => {
    setIsClient(true)
    setLiveViewers(Math.floor(Math.random() * 50) + 20)
    setRecentPurchases(Math.floor(Math.random() * 100) + 50)
  }, [])

  // Simulated live viewers update
  useEffect(() => {
    if (!isClient) return
    const interval = setInterval(() => {
      setLiveViewers((prev) => Math.max(10, prev + Math.floor(Math.random() * 5) - 2))
    }, 5000)
    return () => clearInterval(interval)
  }, [isClient])

  // Sticky bar visibility
  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect()
        setShowStickyBar(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track recently viewed products
  useEffect(() => {
    if (product?.handle) {
      addToRecentlyViewed({
        handle: product.handle,
        title: product.title,
        image: images[0]?.src || '',
        price: price,
      })
    }
  }, [product?.handle, product?.title, images, price])

  // Image zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  // Check delivery using Shiprocket API
  const checkDelivery = async () => {
    if (pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }

    setCheckingDelivery(true)
    setDeliveryInfo(null)

    try {
      // Get product weight (convert grams to kg, default to 0.5kg if not available)
      let productWeight = 0.5 // default weight in kg
      if (currentVariant?.grams) {
        // Convert grams to kg
        productWeight = currentVariant.grams / 1000
      } else if ((currentVariant as any)?.weight) {
        // Fallback to weight property if it exists
        productWeight = (currentVariant as any).weight
      }

      const response = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pincode,
          weight: productWeight,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.message || 'Failed to check delivery')
        setDeliveryInfo({
          available: false,
          cod: false,
        })
        return
      }

      if (result.serviceable) {
        setDeliveryInfo({
          available: true,
          cod: result.cod,
        })
        toast.success(`Delivery available to ${pincode}`)
      } else {
        setDeliveryInfo({
          available: false,
          cod: false,
        })
        toast.error(result.message || 'Delivery not available to this pincode')
      }
    } catch (error: any) {
      console.error('Error checking delivery:', error)
      toast.error('Failed to check delivery. Please try again.')
      setDeliveryInfo({
        available: false,
        cod: false,
      })
    } finally {
      setCheckingDelivery(false)
    }
  }

  const handleAddToCart = async () => {
    // Check stock before adding
    if (!inStock) {
      toast.error('This product is out of stock')
      return
    }

    if ((currentVariant?.inventoryQty ?? 0) < quantity) {
      toast.error(`Only ${currentVariant?.inventoryQty} items available in stock`)
      return
    }

    setIsAddingToCart(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    addItem({
      productId: product._id,
      name: product.title,
      price: price,
      imageUrl: images[0]?.src || '',
      handle: product.handle,
      quantity: quantity,
      variants: currentVariant?.option1Value ? [{ name: 'Size', option: currentVariant.option1Value }] : [],
      variant: currentVariant as any,
    })
    setIsAddingToCart(false)
    // Open cart drawer after adding item
    openCart('cart')

    if (isWishlisted) {
      toggleWishlist()
    }
  }

  const handleBuyNow = async () => {
    // Check stock before buying
    if (!inStock) {
      toast.error('This product is out of stock')
      return
    }

    if ((currentVariant?.inventoryQty ?? 0) < quantity) {
      toast.error(`Only ${currentVariant?.inventoryQty} items available in stock`)
      return
    }

    setIsAddingToCart(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    addItem({
      productId: product._id,
      name: product.title,
      price: price,
      imageUrl: images[0]?.src || '',
      handle: product.handle,
      quantity: quantity,
      variants: currentVariant?.option1Value ? [{ name: 'Size', option: currentVariant.option1Value }] : [],
      variant: currentVariant as any,
    })
    setIsAddingToCart(false)
    window.location.href = '/checkout'
  }

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

  const shareProduct = (platform: string) => {
    const url = window.location.href
    const text = `Check out ${product.title} at Gibbon Nutrition!`

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      copy: url,
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      alert('Link copied!')
    } else {
      window.open(urls[platform], '_blank')
    }
    setShowShareMenu(false)
  }

  // Rating distribution calculation
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: localReviews.filter((r) => r.star === star).length,
    percentage:
      localReviews.length > 0 ? (localReviews.filter((r) => r.star === star).length / localReviews.length) * 100 : 0,
  }))

  // Lab report lookup (public/Poduct_Reports/*) — see src/lib/labReports.ts
  const labReport = getLabReport(product.handle)

  // Auto-switch to variant's image when variant changes
  useEffect(() => {
    if (!currentVariant || !images.length) return

    // Find image associated with current variant
    const variantImageIndex = images.findIndex((img: any) => img.variantId === `variant-${selectedVariant}`)

    // If found, switch to that image
    if (variantImageIndex >= 0) {
      setSelectedImage(variantImageIndex)
    }
  }, [selectedVariant, currentVariant, images])

  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-neutral-950">
      {/* Breadcrumb with enhanced design */}
      <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 py-3 dark:from-neutral-900 dark:to-neutral-900">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-neutral-500 transition-colors hover:text-[#1B198F]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            <Link href="/collections/all-items" className="text-neutral-500 transition-colors hover:text-[#1B198F]">
              Products
            </Link>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            <span className="font-medium text-neutral-900 dark:text-white">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Live Social Proof Banner */}
      <div className="border-b border-neutral-100 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 py-2 dark:border-neutral-800 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-6 px-4 text-sm">
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Eye className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-orange-700 dark:text-orange-400">
              {isClient ? liveViewers : '--'} people
            </span>
            <span className="text-orange-600 dark:text-orange-500">viewing this right now</span>
          </motion.div>
          <div className="hidden h-4 w-px bg-orange-200 sm:block dark:bg-orange-800" />
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-semibold text-green-700 dark:text-green-400">
              {isClient ? recentPurchases : '--'}+ sold
            </span>
            <span className="text-green-600 dark:text-green-500">in last 7 days</span>
          </div>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto max-w-full overflow-hidden px-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Enhanced Image Gallery */}
            <div className="min-w-0 w-full space-y-3 sm:space-y-4">
              {/* Main Image with Zoom */}
              <div
                ref={imageRef}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50 shadow-lg sm:rounded-3xl dark:from-neutral-900 dark:to-neutral-800"
                onClick={() => setShowLightbox(true)}
              >
                {images[selectedImage] && (
                  <Image
                    src={images[selectedImage].src}
                    alt={images[selectedImage].alt || product.title}
                    fill
                    className="object-contain p-4 transition-transform duration-300 sm:p-6"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 sm:top-4 sm:left-4 sm:gap-2">
                  {discount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm"
                    >
                      -{discount}% OFF
                    </motion.span>
                  )}
                  {!inStock ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2 py-1 text-xs font-bold text-white shadow-lg sm:px-3 sm:py-1.5 sm:text-sm"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" /> Out of Stock
                    </motion.span>
                  ) : (
                    lowStock && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-1 text-xs font-bold text-white shadow-lg sm:px-3 sm:py-1.5 sm:text-sm"
                      >
                        <Flame className="h-3 w-3 sm:h-4 sm:w-4" /> Only {currentVariant?.inventoryQty} left!
                      </motion.span>
                    )
                  )}
                  {product.tags?.includes('bestseller') && (
                    <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-2 py-1 text-xs font-bold text-white shadow-lg sm:px-3 sm:py-1.5 sm:text-sm">
                      <Award className="h-3 w-3 sm:h-4 sm:w-4" /> Bestseller
                    </span>
                  )}
                </div>

                {/* Zoom & Fullscreen Icons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 sm:top-4 sm:right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowLightbox(true)
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white"
                  >
                    <Maximize2 className="h-5 w-5 text-neutral-700" />
                  </button>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                      }}
                      className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-all hover:scale-110 hover:bg-white sm:left-4 sm:h-12 sm:w-12"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                      }}
                      className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-all hover:scale-110 hover:bg-white sm:right-4 sm:h-12 sm:w-12"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm sm:bottom-4 sm:px-3 sm:py-1 sm:text-sm">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>

              {/* Enhanced Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
                  {images.map((image, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20 sm:rounded-xl ${
                        selectedImage === index
                          ? 'border-[#1B198F] shadow-lg shadow-[#1B198F]/30'
                          : 'border-transparent hover:border-neutral-300'
                      }`}
                    >
                      <Image
                        src={image.src}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        className="bg-neutral-50 object-contain p-1 sm:p-2"
                        sizes="80px"
                      />
                      {selectedImage === index && <div className="absolute inset-0 bg-[#1B198F]/10" />}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Product Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-3 sm:grid-cols-4 sm:gap-3 sm:rounded-2xl sm:p-4 dark:from-neutral-900 dark:to-neutral-800">
                {highlights.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center gap-1 text-center"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B198F]/10 sm:h-10 sm:w-10">
                      <item.icon className="h-4 w-4 text-[#1B198F] sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-900 sm:text-xs dark:text-white">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-neutral-500 sm:text-[10px]">{item.desc}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div
              ref={productInfoRef}
              className="min-w-0 w-full lg:sticky lg:top-24 lg:self-start"
            >
              {/* Category & Rating */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
                  {product.productCategory || 'Supplements'}
                </span>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 dark:bg-amber-900/30">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(avgRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-neutral-200 text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-amber-600 dark:text-amber-500">({localReviews.length} reviews)</span>
                  </div>
                )}
              </div>

              {/* Title — hidden SEO H1 only for Pure Creatine; everyone else uses normal H1 = product.title */}
              {product.handle === PURE_CREATINE_SEO_HANDLE ? (
                <>
                  <h1 className="sr-only">{PURE_CREATINE_SEO_H1}</h1>
                  <p className="mb-4 font-[family-name:var(--font-family-antonio)] text-3xl leading-tight font-black text-neutral-900 uppercase sm:text-4xl lg:text-5xl dark:text-white">
                    {product.title}
                  </p>
                </>
              ) : (
                <h1 className="mb-4 font-[family-name:var(--font-family-antonio)] text-3xl leading-tight font-black text-neutral-900 uppercase sm:text-4xl lg:text-5xl dark:text-white">
                  {product.title}
                </h1>
              )}

              {/* Price Section */}
              <div className="mb-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:mb-6 sm:p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                  <span className="text-2xl font-black text-neutral-900 sm:text-4xl dark:text-white">
                    ${price.toLocaleString()}
                  </span>
                  {compareAtPrice != null && compareAtPrice > price && (
                    <>
                      <span className="text-xl text-neutral-400 line-through">${(compareAtPrice ?? 0).toLocaleString()}</span>
                      <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-bold text-white">
                        Save ${((compareAtPrice ?? 0) - price).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                  <Check className="mr-1 inline-block h-4 w-4" />
                  Inclusive of all taxes
                </p>
              </div>

              {/* Short Description */}
              {(product.description || product.bodyHtml) && (
                <div className="mb-6 overflow-hidden">
                  <SafeHTML
                    html={(product.bodyHtml || product.description || '').slice(0, 300) + '...'}
                    className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 [&>p]:m-0"
                  />
                </div>
              )}

              {/* Size Options with Price */}
              {sizeOptions.length > 0 && (
                <div className="mb-6">
                  <label className="mb-3 flex items-center justify-between text-sm font-bold tracking-wider text-neutral-500 uppercase">
                    <span>Select Variant</span>
                  </label>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {sizeOptions.map((size, index) => {
                      const variantIndex = variants.findIndex((v) => v.option1Value === size)
                      const variant = variants[variantIndex]
                      const isSelected = currentVariant?.option1Value === size
                      return (
                        <motion.button
                          key={size}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedVariant(variantIndex >= 0 ? variantIndex : 0)}
                          className={`relative rounded-xl border-2 px-4 py-2 transition-all sm:rounded-2xl sm:px-6 sm:py-3 ${
                            isSelected
                              ? 'border-[#1B198F] bg-[#1B198F] text-white shadow-lg shadow-[#1B198F]/30'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#1B198F] hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          <span className="text-xs font-bold sm:text-sm">{size}</span>
                          {variant && (
                            <span className={`block text-xs ${isSelected ? 'text-white/80' : 'text-neutral-500'}`}>
                              ${variant.price.toLocaleString()}
                            </span>
                          )}
                          {isSelected && (
                            <motion.div
                              layoutId="selected-size"
                              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500"
                            >
                              <Check className="h-3 w-3 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-bold tracking-wider text-neutral-500 uppercase">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border-2 border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-12 w-12 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-neutral-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(q + 1, currentVariant?.inventoryQty ?? 0))}
                      disabled={!inStock || quantity >= (currentVariant?.inventoryQty ?? 0)}
                      className={`flex h-12 w-12 items-center justify-center transition-colors ${
                        !inStock || quantity >= (currentVariant?.inventoryQty ?? 0)
                          ? 'cursor-not-allowed text-neutral-300 dark:text-neutral-600'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  {currentVariant?.inventoryQty !== undefined && (
                    <motion.div
                      key={currentVariant._id || 'inventory'}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center"
                    >
                      {currentVariant.inventoryQty > 0 ? (
                        <div
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                            currentVariant.inventoryQty <= 10
                              ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                              : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                        >
                          {currentVariant.inventoryQty <= 10 ? (
                            <Flame className="h-4 w-4 animate-pulse fill-current" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                          <span className="text-sm font-bold">
                            {currentVariant.inventoryQty <= 10
                              ? `Hurry! Only ${currentVariant.inventoryQty} Left`
                              : `${currentVariant.inventoryQty} In Stock`}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-500 dark:bg-red-900/20">
                          Out of Stock
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!inStock ? (
                <div className="mb-6 flex items-center justify-center rounded-2xl bg-red-50 p-6 dark:bg-red-900/20">
                  <div className="text-center">
                    <X className="mx-auto mb-2 h-12 w-12 text-red-500" />
                    <h3 className="mb-1 text-xl font-bold text-red-600 dark:text-red-400">Out of Stock</h3>
                    <p className="text-sm text-red-500 dark:text-red-400">This product is currently unavailable</p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:gap-3">
                  <motion.button
                    ref={addToCartRef}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#1B198F] bg-white px-4 py-3 text-xs font-bold tracking-wider text-[#1B198F] uppercase transition-all hover:bg-[#1B198F]/5 disabled:opacity-50 sm:px-8 sm:py-4 sm:text-sm"
                  >
                    {isAddingToCart ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBuyNow}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-4 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-[#1B198F]/30 transition-all hover:shadow-xl sm:px-8 sm:py-4 sm:text-sm"
                  >
                    <Zap className="h-5 w-5" />
                    Buy Now
                  </motion.button>
                </div>
              )}

              {/* Wishlist & Share */}
              <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                    isWishlisted
                      ? 'bg-red-50 text-red-500 dark:bg-red-900/30'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                  } ${isWishlistLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                >
                  {isWishlistLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  )}
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </motion.button>
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-200 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Share</span>
                  </motion.button>
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 z-20 mt-2 flex gap-2 rounded-xl bg-white p-2 shadow-xl dark:bg-neutral-800"
                      >
                        <button
                          onClick={() => shareProduct('facebook')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <Facebook className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => shareProduct('twitter')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600"
                        >
                          <Twitter className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => shareProduct('whatsapp')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => shareProduct('copy')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-500 text-white hover:bg-neutral-600"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Delivery Check */}
              <div className="mb-4 rounded-2xl border border-neutral-200 p-3 sm:mb-6 sm:p-4 dark:border-neutral-700">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-[#1B198F]" />
                  Check Delivery
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter Pincode"
                    className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-[#1B198F] sm:px-4 dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <button
                    onClick={checkDelivery}
                    disabled={pincode.length !== 6 || checkingDelivery}
                    className="shrink-0 rounded-xl bg-[#1B198F] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                  >
                    {checkingDelivery ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {deliveryInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {deliveryInfo.available ? (
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" />
                          Delivery available to {pincode}
                        </p>
                        {deliveryInfo.cod ? (
                          <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <BadgeCheck className="h-4 w-4" />
                            Cash on Delivery (COD) available
                          </p>
                        ) : (
                          <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <X className="h-4 w-4" />
                            Cash on Delivery (COD) not available
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                        <X className="h-4 w-4" />
                        Delivery not available to this pincode
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Enhanced Trust Badges */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {trustBadges.map((badge, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-2 rounded-xl p-3 sm:gap-3 sm:rounded-2xl sm:p-4 ${badge.bg} dark:bg-opacity-20`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ${badge.color}`}
                    >
                      <badge.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{badge.text}</p>
                      <p className="text-xs text-neutral-500">{badge.subtext}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bundle Offers Section */}
              <ProductBundleOffers productId={product._id} currentProductPrice={price} />
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Product Details Tabs */}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-neutral-50 to-white py-12 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="container mx-auto px-4">
          {/* Sticky Tabs */}
          <div className="mb-8 flex-col md:flex-row flex overflow-x-auto rounded-2xl bg-white p-2 shadow-sm dark:bg-neutral-800">
            {['description', 'ingredients', 'how-to-use', 'reviews', 'faq'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative rounded-xl px-6 py-3 text-sm font-bold tracking-wider whitespace-nowrap uppercase transition-all ${
                  activeTab === tab
                    ? 'bg-[#1B198F] text-white shadow-md'
                    : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="overflow-hidden rounded-3xl bg-white p-6 shadow-sm lg:p-8 dark:bg-neutral-800"
            >
              {activeTab === 'description' && (
                <div className="prose max-w-none prose-neutral dark:prose-invert prose-headings:font-bold prose-p:text-neutral-600 prose-p:dark:text-neutral-400 prose-li:text-neutral-600 prose-li:dark:text-neutral-400">
                  {product.description || product.bodyHtml ? (
                    <SafeHTML
                      html={product.bodyHtml || product.description || ''}
                      className="text-lg leading-relaxed"
                    />
                  ) : (
                    <p className="text-lg leading-relaxed text-neutral-500">No description available.</p>
                  )}
                  {product.benefits && product.benefits.length > 0 && (
                    <div className="mt-8">
                      <h3 className="mb-6 text-2xl font-bold">Key Benefits</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {product.benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4 rounded-2xl bg-green-50 p-4 dark:bg-green-900/20"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                              <Check className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-white">{benefit}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="prose max-w-none prose-neutral dark:prose-invert">
                  <div className="rounded-2xl bg-amber-50 p-6 dark:bg-amber-900/20">
                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                      <Beaker className="h-6 w-6 text-amber-500" />
                      Ingredients
                    </h3>
                    <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                      {product.ingredients || 'Ingredients information not available.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'how-to-use' && (
                <div className="prose max-w-none prose-neutral dark:prose-invert">
                  <div className="rounded-2xl bg-blue-50 p-6 dark:bg-blue-900/20">
                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                      <Target className="h-6 w-6 text-blue-500" />
                      How to Use
                    </h3>
                    <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                      {product.howToUse || 'Usage instructions not available.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Reviews Summary */}
                  <div className="grid gap-8 lg:grid-cols-3">
                    {/* Overall Rating */}
                    <div className="rounded-2xl bg-neutral-50 p-6 text-center dark:bg-neutral-900">
                      <div className="mb-2 text-5xl font-black text-[#1B198F] dark:text-[#3086C8]">
                        {avgRating.toFixed(1)}
                      </div>
                      <div className="mb-2 flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(avgRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-neutral-200 text-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-neutral-500">Based on {localReviews.length} reviews</p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="col-span-2 space-y-3">
                      {ratingDistribution.map((item) => (
                        <div key={item.star} className="flex items-center gap-4">
                          <div className="flex w-12 items-center gap-1 text-sm font-bold text-neutral-700 dark:text-neutral-300">
                            {item.star} <Star className="h-3 w-3 fill-current" />
                          </div>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                            <div
                              className="h-full rounded-full bg-[#1B198F]"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <div className="w-12 text-right text-sm text-neutral-500">{item.percentage.toFixed(0)}%</div>
                        </div>
                      ))}

                      <div className="mt-6 flex justify-end">
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
                          className="rounded-xl bg-[#1B198F] px-6 py-2 text-sm font-bold text-white transition-all hover:bg-blue-800"
                        >
                          {isWritingReview ? 'Cancel' : 'Write a Review'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Review Form */}
                  <AnimatePresence>
                    {isWritingReview && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmitReview}
                        className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <h3 className="mb-4 text-lg font-bold">{editingReviewId ? 'Edit Review' : 'Write a Review'}</h3>
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-bold">Rating</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, star })}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-6 w-6 ${
                                    star <= reviewForm.star
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-neutral-200 text-neutral-200'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-bold">Review</label>
                          <textarea
                            required
                            value={reviewForm.reviewDescription}
                            onChange={(e) => setReviewForm({ ...reviewForm, reviewDescription: e.target.value })}
                            className="w-full rounded-xl border border-neutral-200 p-3 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800"
                            rows={4}
                            placeholder="Share your experience..."
                          />
                        </div>
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-bold">Add Photo (Optional)</label>
                          <div className="flex items-center gap-4">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                              <Camera className="h-5 w-5 text-neutral-500" />
                              <span className="text-neutral-600 dark:text-neutral-400">Upload Photo</span>
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
                              <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <Image
                                  src={URL.createObjectURL(reviewImage)}
                                  alt="Preview"
                                  fill
                                  className="object-cover"
                                />
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
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="rounded-xl bg-[#1B198F] px-6 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {isSubmittingReview ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {localReviews.length > 0 ? (
                      paginatedReviews.map((review) => (
                        <div
                          key={review._id}
                          className="border-b border-neutral-100 pb-6 last:border-0 dark:border-neutral-800"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1B198F]/10 text-lg font-bold text-[#1B198F]">
                                {review.reviewerImage ? (
                                  <Image
                                    src={review.reviewerImage}
                                    alt={review.reviewerName || ''}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  (review.reviewerName || review.name || 'A').charAt(0)
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-neutral-900 dark:text-white">
                                  {review.reviewerName || review.name || 'Anonymous'}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span>
                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                                  </span>
                                  {review.reviewerName && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <BadgeCheck className="h-3 w-3" /> Verified Buyer
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.star
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'fill-neutral-200 text-neutral-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              {user && review.userId === user.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingReviewId(review._id)
                                      setReviewForm({
                                        star: review.star,
                                        reviewDescription: review.reviewDescription || review.text || '',
                                        reviewerName: review.reviewerName || '',
                                      })
                                      setReviewImage(null)
                                      setIsWritingReview(true)
                                    }}
                                    className="text-neutral-400 hover:text-[#1B198F]"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(review._id)}
                                    className="text-neutral-400 hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {review.reviewDescription && (
                            <p className="text-neutral-600 dark:text-neutral-400">{review.reviewDescription}</p>
                          )}

                          {review.image && (
                            <div className="relative mt-3 h-24 w-24 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                              <Image src={review.image} alt="Review attachment" fill className="object-cover" />
                            </div>
                          )}
                          <div className="mt-4 flex items-center gap-4">
                            <button
                              onClick={() => markHelpful(review._id)}
                              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                review.helpfulVotes?.includes(user?.id || '') || helpfulReviews.has(review._id)
                                  ? 'text-[#1B198F]'
                                  : 'text-neutral-500 hover:text-neutral-900'
                              }`}
                            >
                              <ThumbsUp
                                className={`h-3 w-3 ${review.helpfulVotes?.includes(user?.id || '') || helpfulReviews.has(review._id) ? 'fill-current' : ''}`}
                              />
                              Helpful ({review.helpfulCount || review.helpful || 0})
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-neutral-500">No reviews yet. Be the first to review!</div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalReviewPages > 1 && (
                    <div className="mt-8 flex flex-col items-center gap-3 border-t border-neutral-100 pt-6 dark:border-neutral-800 sm:flex-row sm:justify-between">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        Showing{' '}
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {(reviewPage - 1) * REVIEWS_PER_PAGE + 1}
                          –
                          {Math.min(reviewPage * REVIEWS_PER_PAGE, localReviews.length)}
                        </span>{' '}
                        of{' '}
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {localReviews.length}
                        </span>{' '}
                        reviews
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                          disabled={reviewPage === 1}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-[#1B198F] hover:text-[#1B198F] disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300"
                        >
                          Prev
                        </button>
                        {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((p) => {
                          // Compact pager: show 1, last, current, neighbors, with ellipses
                          const isEdge = p === 1 || p === totalReviewPages
                          const isNear = Math.abs(p - reviewPage) <= 1
                          if (!isEdge && !isNear) {
                            // Render a single ellipsis on each side
                            if (p === reviewPage - 2 || p === reviewPage + 2) {
                              return (
                                <span key={p} className="px-1 text-xs text-neutral-400">
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
                                  ? 'bg-[#1B198F] text-white'
                                  : 'border border-neutral-200 text-neutral-700 hover:border-[#1B198F] hover:text-[#1B198F] dark:border-neutral-700 dark:text-neutral-300'
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
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-[#1B198F] hover:text-[#1B198F] disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  {displayFAQs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-2xl border border-neutral-200 dark:border-neutral-700"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="flex w-full items-center justify-between p-6 text-left"
                      >
                        <span className="font-bold text-neutral-900 dark:text-white">{faq.q}</span>
                        <ChevronDown
                          className={`h-5 w-5 text-neutral-500 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedFAQ === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="border-t border-neutral-200 p-6 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Lab Test Report (Certificate of Analysis) */}
      {labReport && (
        <LabTestReport
          pdfUrl={labReport.pdfUrl}
          productName={product.title}
          reportId={labReport.reportId}
          lab={labReport.lab}
          testDate={labReport.testDate}
          batchNumber={labReport.batchNumber}
          testedFor={labReport.testedFor}
        />
      )}

      {/* Frequently Bought Together (CMS-driven) */}
      <section className="pb-6 lg:pb-10">
        <div className="container mx-auto px-4">
          <BoughtTogether
            productHandle={product.handle}
            currentProduct={{
              productId: product._id,
              handle: product.handle,
              title: product.title,
              image: images[0]?.src || '',
              price: price,
              variant: currentVariant,
              variants: currentVariant?.option1Value ? [{ name: 'Size', option: currentVariant.option1Value }] : [],
            }}
          />
        </div>
      </section>

      {/* You May Also Like (CMS-driven) */}
      <section className="pb-6 lg:pb-10">
        <div className="container mx-auto px-4">
          <YouMayAlsoLike productHandle={product.handle} />
        </div>
      </section>

      {/* Recently Viewed (Client-side auto-generated) */}
      <section className="pb-6 lg:pb-10">
        <div className="container mx-auto px-4">
          <RecentlyViewed excludeHandle={product.handle} limit={6} />
        </div>
      </section>

      {/* Fallback Related Products (if no CMS recommendations) */}
      {relatedProducts.length > 0 && (
        <section className="pb-10 lg:pb-14">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-family-antonio)] text-3xl font-black uppercase">
                More Products
              </h2>
              <Link
                href="/collections/all-items"
                className="flex items-center gap-1 text-sm font-semibold text-[#1B198F] hover:underline"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.slice(0, 8).map((p, index) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/products/${p.handle}`} className="group block">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-sm transition-shadow hover:shadow-lg dark:bg-neutral-900">
                      <Image
                        src={p.images?.[0]?.src || '/placeholder-images.webp'}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {p.variants?.[0]?.compareAtPrice &&
                        p.variants[0].compareAtPrice > (p.variants[0]?.price || 0) && (
                          <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                            -
                            {Math.round(
                              ((p.variants[0].compareAtPrice - (p.variants[0]?.price || 0)) /
                                p.variants[0].compareAtPrice) *
                                100
                            )}
                            %
                          </span>
                        )}
                    </div>
                    <h3 className="mt-4 font-semibold text-neutral-900 transition-colors group-hover:text-[#1B198F] dark:text-white">
                      {p.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#1B198F]">${p.variants?.[0]?.price?.toLocaleString()}</span>
                      {p.variants?.[0]?.compareAtPrice && (
                        <span className="text-sm text-neutral-400 line-through">
                          ${p.variants[0].compareAtPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Sticky Add to Cart Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed right-0 bottom-0 left-0 z-40 border-t border-neutral-200 bg-white/95 py-3 shadow-2xl backdrop-blur-lg dark:border-neutral-700 dark:bg-neutral-900/95"
          >
            <div className="container mx-auto flex items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl shadow-md">
                  {images[0] && <Image src={images[0].src} alt={product.title} fill className="object-cover" />}
                </div>
                <div className="hidden sm:block">
                  <p className="line-clamp-1 font-semibold text-neutral-900 dark:text-white">{product.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#1B198F]">${price.toLocaleString()}</span>
                    {compareAtPrice && (
                      <span className="text-sm text-neutral-400 line-through">${compareAtPrice.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center gap-2 rounded-full border-2 border-[#1B198F] px-6 py-3 text-sm font-bold text-[#1B198F] transition-all hover:bg-[#1B198F]/5"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-6 py-3 text-sm font-bold tracking-wider text-white uppercase shadow-lg"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))
              }}
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))
              }}
              className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <motion.div
              key={selectedImage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative h-[80vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              {images[selectedImage] && (
                <Image src={images[selectedImage].src} alt={product.title} fill className="object-contain" />
              )}
            </motion.div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(index)
                  }}
                  className={`h-2 w-2 rounded-full transition-all ${selectedImage === index ? 'w-8 bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AsideSidebarCart />
    </div>
  )
}
