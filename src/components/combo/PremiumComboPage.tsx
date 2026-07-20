// c:\Users\dell\Desktop\gibbon-ecomm\src\components\combo\PremiumComboPage.tsx
'use client'
import { useWishlist } from '@/components/LikeButton'
import SafeHTML from '@/components/SafeHTML'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  Beaker,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Eye,
  Heart,
  MapPin,
  Package,
  RotateCcw,
  Share2,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Truck,
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
  altText?: string
}

interface ProductReview {
  _id: string
  star: number
  reviewerName: string
  reviewDescription: string
  reviewerImage?: string | null
  image?: string
  helpfulVotes?: string[]
  helpfulCount?: number
  userId?: string
  isApproved?: boolean
  createdAt?: string
}

interface ComboItem {
  productId: {
    _id: string
    title: string
    handle: string
    bodyHtml?: string
    images?: ProductImage[]
    variants?: any[]
    reviews?: ProductReview[]
    ingredients?: string
    howToUse?: string
    faq?: { question: string; answer: string }[]
  }
  variantId?: string
  titleSnapshot: string
  imageSnapshot: string
  priceSnapshot: number
  quantity: number
  variantDetails?: {
    option1Value?: string
    option2Value?: string
    option3Value?: string
    sku?: string
    image?: string
  }
}

interface Combo {
  _id: string
  handle: string
  title: string
  description?: string
  image: string
  items: ComboItem[]
  totalOriginalPrice: number
  totalPrice: number
  totalQuantity: number
  discount: number
  discountPercentage: number
  savingsAmount: number
  status: string
  createdAt?: string
}

interface PremiumComboPageProps {
  combo: Combo
}

const trustBadges = [
  { icon: Truck, text: 'Free Shipping', subtext: 'Orders $100+', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Shield, text: '100% Authentic', subtext: 'Guaranteed', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: RotateCcw, text: 'Easy Returns', subtext: '7 Day Policy', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: Award, text: 'Best Value', subtext: 'Combo Deal', color: 'text-amber-500', bg: 'bg-amber-50' },
]

const highlights = [
  { icon: Dumbbell, label: 'Complete Bundle', desc: 'Best Value' },
  { icon: Beaker, label: 'Premium Quality', desc: 'Certified' },
  { icon: Target, label: 'Combo Deal', desc: 'Save More' },
  { icon: Sparkles, label: 'Limited Offer', desc: 'Act Now' },
]

export default function PremiumComboPage({ combo }: PremiumComboPageProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [liveViewers, setLiveViewers] = useState(0)
  const [recentPurchases, setRecentPurchases] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [pincode, setPincode] = useState('')
  const [deliveryInfo, setDeliveryInfo] = useState<{ available: boolean; date: string; cod: boolean } | null>(null)

  const addToCartRef = useRef<HTMLButtonElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { addMultipleToCart } = useCart()
  const { open: openCart } = useAside()

  // Collect all images from products only (excluding combo.image)
  const allImages: string[] = combo.items
    .flatMap((item) => {
      const productImages = item.productId?.images?.map((img) => img.src) || []
      return [item.imageSnapshot, ...productImages]
    })
    .filter(Boolean)

  // Collect all reviews from products
  const allReviews = combo.items.flatMap((item) => item.productId?.reviews || []).filter((r) => r.isApproved)

  // Calculate average rating
  const avgRating = allReviews.length > 0 ? allReviews.reduce((acc, r) => acc + r.star, 0) / allReviews.length : 0

  // Collect all FAQs from products
  const allFAQs = combo.items.flatMap((item) => item.productId?.faq || [])

  // Wishlist for combo
  const {
    isLiked: isWishlisted,
    handleLike: toggleWishlist,
    isLoading: isWishlistLoading,
  } = useWishlist({
    comboId: combo._id,
    productName: combo.title,
    itemType: 'combo',
  })

  useEffect(() => {
    setIsClient(true)
    setLiveViewers(Math.floor(Math.random() * 30) + 15)
    setRecentPurchases(Math.floor(Math.random() * 80) + 40)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const interval = setInterval(() => {
      setLiveViewers((prev) => Math.max(10, prev + Math.floor(Math.random() * 5) - 2))
    }, 5000)
    return () => clearInterval(interval)
  }, [isClient])

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

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Calculate discount ratio to distribute combo price across items
    const discountRatio = combo.totalPrice / combo.totalOriginalPrice

    const itemsToAdd = combo.items.map((item) => {
      // Find the actual variant from the product
      const actualVariant = item.productId?.variants?.find(
        (v: any) =>
          v._id === item.variantId ||
          (v.option1Value === item.variantDetails?.option1Value &&
            v.option2Value === item.variantDetails?.option2Value &&
            v.option3Value === item.variantDetails?.option3Value)
      )

      return {
        productId: item.productId._id,
        id: item.productId._id, // Required for cart compatibility
        name: item.titleSnapshot,
        price: item.priceSnapshot * discountRatio,
        imageUrl: item.imageSnapshot || '',
        image: { src: item.imageSnapshot || '', alt: item.titleSnapshot }, // Add image object
        handle: item.productId.handle,
        quantity: item.quantity,
        variant: actualVariant
          ? {
              _id: actualVariant._id || item.variantId,
              option1Value: actualVariant.option1Value || item.variantDetails?.option1Value,
              option2Value: actualVariant.option2Value || item.variantDetails?.option2Value,
              option3Value: actualVariant.option3Value || item.variantDetails?.option3Value,
              sku: actualVariant.sku || item.variantDetails?.sku,
              price: actualVariant.price || item.priceSnapshot,
              compareAtPrice: actualVariant.compareAtPrice,
              inventoryQty: actualVariant.inventoryQty,
              image: actualVariant.image || item.variantDetails?.image || item.imageSnapshot,
            }
          : undefined,
        variants: item.variantDetails
          ? [
              {
                _id: item.variantId,
                name: item.variantDetails.option1Value || 'Size',
                option: item.variantDetails.option1Value || '',
              },
            ]
          : [],
      }
    })

    addMultipleToCart(itemsToAdd as any)
    setIsAddingToCart(false)
    openCart('cart')
    toast.success(`Added ${combo.title} to cart!`)

    if (isWishlisted) {
      toggleWishlist()
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    setTimeout(() => {
      window.location.href = '/checkout'
    }, 300)
  }

  const checkDelivery = () => {
    if (pincode.length === 6) {
      const date = new Date()
      const pincodeNum = parseInt(pincode, 10)
      const daysToAdd = (pincodeNum % 3) + 3
      date.setDate(date.getDate() + daysToAdd)
      setDeliveryInfo({
        available: true,
        date: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        cod: pincodeNum % 10 >= 3,
      })
    }
  }

  const shareProduct = (platform: string) => {
    const url = window.location.href
    const text = `Check out ${combo.title} - Save $${combo.savingsAmount}!`

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      copy: url,
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } else {
      window.open(urls[platform], '_blank')
    }
    setShowShareMenu(false)
  }

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.star === star).length,
    percentage:
      allReviews.length > 0 ? (allReviews.filter((r) => r.star === star).length / allReviews.length) * 100 : 0,
  }))

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 py-3 dark:from-neutral-900 dark:to-neutral-900">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-neutral-500 transition-colors hover:text-[#1B198F]">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            <Link href="/combos" className="text-neutral-500 transition-colors hover:text-[#1B198F]">
              Combos
            </Link>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
            <span className="font-medium text-neutral-900 dark:text-white">{combo.title}</span>
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
            <span className="text-orange-600 dark:text-orange-500">viewing this combo now</span>
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
        <div className="container mx-auto px-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Enhanced Image Gallery */}
            <div className="mx-auto w-full max-w-sm space-y-4 lg:max-w-none">
              {/* Main Image */}
              <div
                ref={imageRef}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-50 shadow-lg sm:rounded-3xl dark:from-neutral-900 dark:to-neutral-800"
                onClick={() => setShowLightbox(true)}
              >
                {allImages[selectedImage] && (
                  <Image
                    src={allImages[selectedImage]}
                    alt={combo.title}
                    fill
                    className="object-contain p-4 transition-transform duration-300 sm:p-6"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {combo.discountPercentage > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                      <Zap className="h-4 w-4" />
                      {combo.discountPercentage}% OFF
                    </div>
                  )}
                  <div className="rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg sm:px-4 sm:py-2 sm:text-sm">
                    <Package className="mr-1 inline h-4 w-4" />
                    {combo.totalQuantity} Items
                  </div>
                </div>

                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
                      }}
                      className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition hover:bg-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
                      }}
                      className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition hover:bg-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                  {selectedImage + 1} / {allImages.length}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-20 ${
                        selectedImage === index
                          ? 'border-[#1B198F] shadow-lg'
                          : 'border-transparent hover:border-neutral-300'
                      }`}
                    >
                      <Image src={img} alt={`View ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-3 sm:grid-cols-4 sm:gap-3 sm:rounded-2xl sm:p-4 dark:from-neutral-900 dark:to-neutral-800">
                {highlights.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 text-center sm:gap-2">
                    <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-neutral-700">
                      <item.icon className="h-5 w-5 text-[#1B198F] sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 sm:text-sm dark:text-white">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="mx-auto w-full max-w-md lg:sticky lg:top-24 lg:max-w-none lg:self-start">
              {/* Category & Rating */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
                  Combo Deal
                </span>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-neutral-600">
                      {avgRating.toFixed(1)} ({allReviews.length} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-4 font-[family-name:var(--font-family-antonio)] text-3xl leading-tight font-black text-neutral-900 uppercase sm:text-4xl lg:text-5xl dark:text-white">
                {combo.title}
              </h1>

              {/* Price Section */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl font-bold text-green-600 sm:text-4xl">
                    ${combo.totalPrice.toLocaleString()}
                  </span>
                  {combo.savingsAmount > 0 && (
                    <>
                      <span className="text-xl text-neutral-400 line-through sm:text-2xl">
                        ${combo.totalOriginalPrice.toLocaleString()}
                      </span>
                      <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white">
                        SAVE ${combo.savingsAmount.toLocaleString()}
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
              {combo.description && (
                <div className="mb-6">
                  <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">{combo.description}</p>
                </div>
              )}

              {/* What's Included */}
              <div className="mb-6 rounded-2xl border-2 border-neutral-200 p-6 dark:border-neutral-700">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
                  <Package className="h-5 w-5 text-[#1B198F]" />
                  What's Included
                </h3>

                <div className="space-y-3">
                  {combo.items.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          <Image
                            src={item.imageSnapshot || '/placeholder-images.webp'}
                            alt={item.titleSnapshot}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-neutral-900 dark:text-white">
                                {item.quantity}x {item.titleSnapshot}
                              </p>
                              {item.variantDetails && (
                                <p className="text-sm text-neutral-500">
                                  {[
                                    item.variantDetails.option1Value,
                                    item.variantDetails.option2Value,
                                    item.variantDetails.option3Value,
                                  ]
                                    .filter(Boolean)
                                    .join(' / ')}
                                </p>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-[#1B198F]">
                              ${(item.priceSnapshot * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          {item.productId && (
                            <Link
                              href={`/products/${item.productId.handle}`}
                              className="mt-1 text-xs text-[#1B198F] hover:underline"
                            >
                              View Product →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  ref={addToCartRef}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#1B198F] bg-white px-8 py-4 text-sm font-bold tracking-wider text-[#1B198F] uppercase transition-all hover:bg-[#1B198F]/5 disabled:opacity-50"
                >
                  {isAddingToCart ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-[#1B198F] border-t-transparent" />
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Add Bundle to Cart
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBuyNow}
                  disabled={isAddingToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 px-8 py-4 text-sm font-bold tracking-wider text-white uppercase shadow-lg shadow-[#1B198F]/30 transition-all hover:shadow-xl disabled:opacity-50"
                >
                  <Zap className="h-5 w-5" />
                  Buy Now
                </motion.button>
              </div>

              {/* Wishlist & Share */}
              <div className="mb-6 flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleWishlist}
                  disabled={isWishlistLoading}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isWishlisted
                      ? 'bg-red-50 text-red-500 dark:bg-red-900/30'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
                  } ${isWishlistLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </motion.button>
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>

                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute top-full right-0 z-10 mt-2 w-48 rounded-xl bg-white p-2 shadow-xl dark:bg-neutral-800"
                      >
                        {['Facebook', 'Twitter', 'WhatsApp', 'Copy Link'].map((platform) => (
                          <button
                            key={platform}
                            onClick={() => shareProduct(platform.toLowerCase().replace(' ', ''))}
                            className="w-full rounded-lg px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            {platform}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Delivery Check */}
              <div className="mb-6 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-[#1B198F]" />
                  Check Delivery
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-[#1B198F] focus:outline-none dark:border-neutral-600 dark:bg-neutral-800"
                  />
                  <button
                    onClick={checkDelivery}
                    className="rounded-lg bg-[#1B198F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1B198F]/90"
                  >
                    Check
                  </button>
                </div>
                {deliveryInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 space-y-2 text-sm"
                  >
                    <p className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      Delivery by {deliveryInfo.date}
                    </p>
                    {deliveryInfo.cod && (
                      <p className="flex items-center gap-2 text-neutral-600">
                        <Check className="h-4 w-4" />
                        Cash on Delivery available
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3">
                {trustBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                    <div className={`rounded-lg ${badge.bg} p-2`}>
                      <badge.icon className={`h-5 w-5 ${badge.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{badge.text}</p>
                      <p className="text-xs text-neutral-500">{badge.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Product Details Tabs */}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-neutral-50 to-white py-12 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="container mx-auto px-4">
          {/* Sticky Tabs */}
          <div className="mb-8 flex flex-col md:flex-row overflow-x-auto rounded-2xl bg-white p-2 shadow-sm dark:bg-neutral-800">
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
              className="rounded-3xl bg-white p-6 shadow-sm lg:p-8 dark:bg-neutral-800"
            >
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-family-antonio)] text-2xl font-black uppercase">
                    Product Details
                  </h2>
                  {combo.items.map((item, idx) => (
                    <div key={idx} className="rounded-xl border-2 border-neutral-200 p-6 dark:border-neutral-700">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                          <Image src={item.imageSnapshot} alt={item.titleSnapshot} fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{item.titleSnapshot}</h3>
                          <p className="text-sm text-neutral-500">
                            {item.quantity}x • ${(item.priceSnapshot * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {item.productId?.bodyHtml && (
                        <SafeHTML
                          html={item.productId.bodyHtml}
                          className="prose max-w-none text-neutral-600 prose-neutral dark:text-neutral-400 dark:prose-invert"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-family-antonio)] text-2xl font-black uppercase">
                    Ingredients
                  </h2>
                  {combo.items.map((item, idx) =>
                    item.productId?.ingredients ? (
                      <div key={idx} className="rounded-xl border-2 border-neutral-200 p-6 dark:border-neutral-700">
                        <h3 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                          {item.titleSnapshot}
                        </h3>
                        <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-400">
                          {item.productId.ingredients}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {activeTab === 'how-to-use' && (
                <div className="space-y-6">
                  <h2 className="font-[family-name:var(--font-family-antonio)] text-2xl font-black uppercase">
                    How to Use
                  </h2>
                  {combo.items.map((item, idx) =>
                    item.productId?.howToUse ? (
                      <div key={idx} className="rounded-xl border-2 border-neutral-200 p-6 dark:border-neutral-700">
                        <h3 className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                          {item.titleSnapshot}
                        </h3>
                        <p className="whitespace-pre-line text-neutral-600 dark:text-neutral-400">
                          {item.productId.howToUse}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-[family-name:var(--font-family-antonio)] text-2xl font-black uppercase">
                      Customer Reviews
                    </h2>
                  </div>

                  {allReviews.length > 0 ? (
                    <>
                      {/* Rating Overview */}
                      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-900/20 dark:to-orange-900/20">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="text-center">
                            <div className="mb-2 text-5xl font-black text-neutral-900 dark:text-white">
                              {avgRating.toFixed(1)}
                            </div>
                            <div className="mb-2 flex items-center justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${star <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              Based on {allReviews.length} reviews
                            </p>
                          </div>

                          <div className="space-y-2">
                            {ratingDistribution.map(({ star, count, percentage }) => (
                              <div key={star} className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                                  {star} ★
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                                  <div
                                    className="h-full bg-amber-400 transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right text-sm text-neutral-600 dark:text-neutral-400">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Reviews List */}
                      <div className="space-y-4">
                        {allReviews.slice(0, 10).map((review) => (
                          <div
                            key={review._id}
                            className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-700"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1B198F] to-blue-600 text-sm font-bold text-white">
                                  {review.reviewerName?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <div>
                                  <p className="font-semibold text-neutral-900 dark:text-white">
                                    {review.reviewerName || 'Anonymous'}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.star ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {review.createdAt && (
                                <span className="text-sm text-neutral-500">
                                  {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400">{review.reviewDescription}</p>
                            {review.image && (
                              <div className="relative mt-3 h-32 w-32 overflow-hidden rounded-lg">
                                <Image src={review.image} alt="Review" fill className="object-cover" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="py-8 text-center text-neutral-500">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <h2 className="font-[family-name:var(--font-family-antonio)] text-2xl font-black uppercase">
                    Frequently Asked Questions
                  </h2>
                  {allFAQs.length > 0 ? (
                    allFAQs.map((faq, index) => (
                      <div key={index} className="rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-700"
                        >
                          <span className="pr-4 font-semibold text-neutral-900 dark:text-white">{faq.question}</span>
                          <ChevronDown
                            className={`h-5 w-5 flex-shrink-0 text-neutral-500 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}
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
                              <div className="border-t border-neutral-200 p-4 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-neutral-500">No FAQs available.</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

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
                <div className="relative hidden h-12 w-12 overflow-hidden rounded-lg md:block">
                  <Image
                    src={allImages[0] || '/placeholder-images.webp'}
                    alt={combo.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{combo.title}</p>
                  <p className="text-sm text-green-600">${combo.totalPrice.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-semibold text-neutral-600 sm:block dark:text-neutral-400">
                  Save ${combo.savingsAmount.toLocaleString()}
                </span>
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1B198F] to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add to Cart
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
                setSelectedImage((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
              }}
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedImage((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
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
              {allImages[selectedImage] && (
                <Image src={allImages[selectedImage]} alt={combo.title} fill className="object-contain" />
              )}
            </motion.div>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {allImages.map((_, index) => (
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
