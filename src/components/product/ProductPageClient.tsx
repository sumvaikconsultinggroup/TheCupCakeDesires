'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Heart,
  ShoppingBag,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Award,
  Minus,
  Plus,
  Clock,
  Users,
  Zap,
  ChevronDown,
  Play,
  X,
  Flame,
  Package,
  BadgeCheck,
} from 'lucide-react'
import { useCart } from '@/components/useCartStore'

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
}

interface ProductReview {
  _id: string
  star: number
  text: string
  name: string
  createdAt: string
}

interface Product {
  _id: string
  handle: string
  title: string
  description?: string
  images?: ProductImage[]
  variants?: ProductVariant[]
  reviews?: ProductReview[]
  productCategory?: string
  tags?: string[]
  options?: { name: string; values: string[] }[]
  benefits?: string[]
  nutritionFacts?: { name: string; value: string }[]
  ingredients?: string
  howToUse?: string
}

interface ProductPageClientProps {
  product: Product
  relatedProducts?: Product[]
}

const trustBadges = [
  { icon: Truck, text: 'Free Shipping', subtext: 'Orders $100+' },
  { icon: Shield, text: 'Authenticity', subtext: '100% Genuine' },
  { icon: RotateCcw, text: 'Easy Returns', subtext: '7 Day Policy' },
  { icon: Award, text: 'Lab Tested', subtext: 'Quality Assured' },
]

export default function ProductPageClient({ product, relatedProducts = [] }: ProductPageClientProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const addToCartRef = useRef<HTMLButtonElement>(null)

  const { addItem } = useCart()

  const images = product.images || []
  const variants = product.variants || []
  const reviews = product.reviews || []
  const currentVariant = variants[selectedVariant] || variants[0]
  const price = currentVariant?.price || 0
  const compareAtPrice = currentVariant?.compareAtPrice
  const discount = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0
  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.star, 0) / reviews.length : 0
  const inStock = (currentVariant?.inventoryQty ?? 10) > 0
  const lowStock = (currentVariant?.inventoryQty ?? 10) <= 5 && (currentVariant?.inventoryQty ?? 10) > 0

  // Get unique options
  const sizeOptions = [...new Set(variants.map((v) => v.option1Value).filter(Boolean))]
  const flavorOptions = [...new Set(variants.map((v) => v.option2Value).filter(Boolean))]

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

  // Image zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    addItem({
      productId: product._id,
      name: product.title,
      price: price,
      imageUrl: images[0]?.src || '',
      handle: product.handle,
      // Drives the delivery lead-time tier at checkout (cakes need more notice).
      category: product.productCategory,
      quantity: quantity,
      variants: [
        ...(currentVariant?.option1Value ? [{ name: 'Size', option: currentVariant.option1Value }] : []),
        ...(currentVariant?.option2Value ? [{ name: 'Flavor', option: currentVariant.option2Value }] : []),
      ],
      variant: currentVariant as any,
    })
    setIsAddingToCart(false)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    window.location.href = '/checkout'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Breadcrumb */}
      <div className="bg-neutral-50 py-3 dark:bg-neutral-900">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-[#1B198F]">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/collections/all-items" className="hover:text-[#1B198F]">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-neutral-900 dark:text-white">{product.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div
                ref={imageRef}
                className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                {images[selectedImage] && (
                  <Image
                    src={images[selectedImage].src}
                    alt={images[selectedImage].alt || product.title}
                    fill
                    className={`object-cover transition-transform duration-200 ${
                      isZoomed ? 'scale-150' : 'scale-100'
                    }`}
                    style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : {}}
                    priority
                  />
                )}

                {/* Badges */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <span className="rounded-full bg-red-500 px-3 py-1.5 text-sm font-bold text-white">
                      -{discount}% OFF
                    </span>
                  )}
                  {lowStock && (
                    <span className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-sm font-bold text-white">
                      <Flame className="h-4 w-4" /> Low Stock
                    </span>
                  )}
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                        selectedImage === index ? 'border-[#1B198F]' : 'border-transparent'
                      }`}
                    >
                      <Image src={image.src} alt={`${product.title} ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* Category & Rating */}
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#1B198F]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1B198F]">
                  {product.productCategory || 'Supplements'}
                </span>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-neutral-200 text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      {avgRating.toFixed(1)} ({reviews.length} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-4 font-[family-name:var(--font-family-antonio)] text-3xl font-black uppercase text-neutral-900 sm:text-4xl dark:text-white">
                {product.title}
              </h1>

              {/* Price */}
              <div className="mb-6 flex items-baseline gap-3">
                <span className="text-4xl font-black text-neutral-900 dark:text-white">${price}</span>
                {compareAtPrice && compareAtPrice > price && (
                  <>
                    <span className="text-xl text-neutral-500 line-through">${compareAtPrice}</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                      Save ${compareAtPrice - price}
                    </span>
                  </>
                )}
              </div>

              {/* Short Description */}
              {product.description && (
                <p className="mb-6 leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {product.description.slice(0, 200)}...
                </p>
              )}

              {/* Size Options */}
              {sizeOptions.length > 0 && (
                <div className="mb-6">
                  <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-neutral-500">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size, index) => {
                      const variantIndex = variants.findIndex((v) => v.option1Value === size)
                      const isSelected = currentVariant?.option1Value === size
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedVariant(variantIndex >= 0 ? variantIndex : 0)}
                          className={`rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                            isSelected
                              ? 'border-[#1B198F] bg-[#1B198F] text-white'
                              : 'border-neutral-200 text-neutral-700 hover:border-[#1B198F] dark:border-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-neutral-500">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-12 w-12 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-12 w-12 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  {lowStock && (
                    <span className="text-sm font-semibold text-orange-500">
                      Only {currentVariant?.inventoryQty} left!
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart & Buy Now */}
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <button
                  ref={addToCartRef}
                  onClick={handleAddToCart}
                  disabled={!inStock || isAddingToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#1B198F] bg-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#1B198F] transition-all hover:bg-[#1B198F]/5 disabled:opacity-50"
                >
                  {isAddingToCart ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Adding...
                    </span>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1B198F] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#1B198F]/90 disabled:opacity-50"
                >
                  <Zap className="h-5 w-5" />
                  Buy Now
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="mb-8 flex items-center gap-4">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isWishlisted ? 'text-red-500' : 'text-neutral-500 hover:text-[#1B198F]'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
                <button className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-[#1B198F]">
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                {trustBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B198F]/10">
                      <badge.icon className="h-5 w-5 text-[#1B198F]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{badge.text}</p>
                      <p className="text-xs text-neutral-500">{badge.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Info */}
              <div className="mt-6 rounded-2xl bg-green-50 p-4 dark:bg-green-900/20">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-400">
                      Estimated Delivery: 3-5 Business Days
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-500">Order within 2 hrs for faster dispatch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <div className="mb-8 flex overflow-x-auto border-b border-neutral-200 dark:border-neutral-700">
            {['description', 'ingredients', 'how-to-use', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-[#1B198F] text-[#1B198F]'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tab.replace('-', ' ')}
                {tab === 'reviews' && ` (${reviews.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800 lg:p-8">
            {activeTab === 'description' && (
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                <p className="text-lg leading-relaxed">{product.description || 'No description available.'}</p>
                {product.benefits && product.benefits.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-xl font-bold">Key Benefits</h3>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {product.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{product.ingredients || 'Ingredients information not available.'}</p>
              </div>
            )}

            {activeTab === 'how-to-use' && (
              <div className="prose prose-neutral max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{product.howToUse || 'Usage instructions not available.'}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b border-neutral-200 pb-6 last:border-0 dark:border-neutral-700">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B198F] text-sm font-bold text-white">
                            {review.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{review.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < review.star ? 'fill-yellow-400 text-yellow-400' : 'fill-neutral-200 text-neutral-200'}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-neutral-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-neutral-500">No reviews yet. Be the first to review!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 font-[family-name:var(--font-family-antonio)] text-3xl font-black uppercase">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((p) => (
                <Link key={p._id} href={`/products/${p.handle}`} className="group">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                    <Image
                      src={p.images?.[0]?.src || '/placeholder-images.webp'}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <h3 className="mt-4 font-semibold text-neutral-900 group-hover:text-[#1B198F] dark:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1 font-bold text-[#1B198F]">${p.variants?.[0]?.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Add to Cart Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 py-3 shadow-2xl backdrop-blur-md dark:border-neutral-700 dark:bg-neutral-900/95"
          >
            <div className="container mx-auto flex items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-lg">
                  {images[0] && <Image src={images[0].src} alt={product.title} fill className="object-cover" />}
                </div>
                <div className="hidden sm:block">
                  <p className="font-semibold text-neutral-900 dark:text-white">{product.title}</p>
                  <p className="text-lg font-bold text-[#1B198F]">${price}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center gap-2 rounded-full border-2 border-[#1B198F] px-6 py-3 text-sm font-bold text-[#1B198F] hover:bg-[#1B198F]/5"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex items-center gap-2 rounded-full bg-[#1B198F] px-6 py-3 text-sm font-bold text-white"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
