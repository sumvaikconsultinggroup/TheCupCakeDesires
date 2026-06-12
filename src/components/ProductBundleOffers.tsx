'use client'

import { motion } from 'framer-motion'
import { Clock, Gift, Package, Percent, Plus, ShoppingCart, Sparkles, TrendingUp, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useCart } from './useCartStore'

interface BundleProduct {
  productId: {
    _id: string
    title: string
    handle: string
    images?: { src: string }[]
    variants?: {
      _id?: string
      option1Value?: string
      option2Value?: string
      option3Value?: string
      price: number
      compareAtPrice?: number
      image?: string
      sku?: string
    }[]
  }
  quantity: number
  isRequired: boolean
  isGift?: boolean
}

interface BundleOffer {
  _id: string
  name: string
  shortDescription?: string
  bundleType: 'combo' | 'bogo' | 'quantity' | 'tiered' | 'mix-match' | 'gift-with-purchase'
  products: BundleProduct[]
  discountType: 'percentage' | 'fixed' | 'free' | 'fixed-price'
  discountValue: number
  originalPrice?: number
  bundlePrice?: number
  savingsAmount?: number
  savingsPercentage?: number
  displayStyle: 'card' | 'banner' | 'inline' | 'popup' | 'floating'
  badgeText?: string
  badgeColor?: string
  highlightColor?: string
  image?: string
  ctaText?: string
  urgencyText?: string
  endDate?: string
}

interface ProductBundleOffersProps {
  productId: string
  currentProductPrice?: number
}

export default function ProductBundleOffers({ productId, currentProductPrice }: ProductBundleOffersProps) {
  const [bundles, setBundles] = useState<BundleOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  const { addMultipleToCart } = useCart()

  useEffect(() => {
    async function fetchBundles() {
      try {
        const res = await fetch(`/api/bundles/product/${productId}`)
        const data = await res.json()
        if (data.success) {
          setBundles(data.data)
        }
      } catch (error) {
        console.error('Error fetching bundles:', error)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchBundles()
    }
  }, [productId])

  const handleAddBundleToCart = async (bundle: BundleOffer) => {
    setAddingToCart(bundle._id)

    // Calculate total original price and prepare items
    let totalOriginalPrice = 0
    const cartItems: Array<{
      productId: string
      name: string
      price: number
      imageUrl?: string
      handle: string
      quantity: number
      comapreAtPrice?: number
      category?: string
      variant?: {
        id: string
        name: string
        option1Value?: string
        option2Value?: string
        option3Value?: string
        sku?: string
        price?: number
        compareAtPrice?: number
        image?: string
      }
    }> = []

    // Validate and prepare each product
    let hasError = false
    for (const item of bundle.products) {
      const product = item.productId

      // Check if product has variants
      if (product.variants && product.variants.length > 0) {
        // Get selected variant for this product
        const selectedVariantId = selectedVariants[product._id]

        if (!selectedVariantId && product.variants.length > 1) {
          toast.error(`Please select a variant for ${product.title}`)
          hasError = true
          break
        }

        // Use first variant if only one exists or get the selected one
        const variant = selectedVariantId
          ? product.variants.find((v) => v._id === selectedVariantId) || product.variants[0]
          : product.variants[0]

        // Add to total original price
        totalOriginalPrice += variant.price * item.quantity

        cartItems.push({
          productId: product._id,
          name: product.title,
          price: variant.price, // We'll adjust this later
          imageUrl: variant.image || product.images?.[0]?.src,
          handle: product.handle,
          quantity: item.quantity,
          comapreAtPrice: variant.compareAtPrice || variant.price,
          variant: {
            id: variant._id || '',
            name: [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' / '),
            option1Value: variant.option1Value,
            option2Value: variant.option2Value,
            option3Value: variant.option3Value,
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            image: variant.image,
          },
        })
      } else {
        // No variants, add product directly
        const price = product.variants?.[0]?.price || 0
        totalOriginalPrice += price * item.quantity

        cartItems.push({
          productId: product._id,
          name: product.title,
          price: price,
          imageUrl: product.images?.[0]?.src,
          handle: product.handle,
          quantity: item.quantity,
          comapreAtPrice: product.variants?.[0]?.compareAtPrice || price,
        })
      }
    }

    if (hasError) {
      setAddingToCart(null)
      return
    }

    // Calculate the discount ratio to apply proportionally to each item
    const bundlePrice = bundle.bundlePrice || totalOriginalPrice
    const discountRatio = bundlePrice / totalOriginalPrice

    // Apply proportional discount to each item's price
    const adjustedCartItems = cartItems.map((item) => ({
      ...item,
      price: Math.round(item.price * discountRatio), // Apply bundle discount proportionally
      comapreAtPrice: item.comapreAtPrice, // Keep original price for comparison
    }))

    // Verify the total matches bundle price
    const calculatedTotal = adjustedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Add all items to cart
    try {
      addMultipleToCart(adjustedCartItems)

      toast.success(`${bundle.name} added to cart! Total: $${calculatedTotal.toLocaleString()}`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add bundle to cart')
    }

    setAddingToCart(null)
  }

  const handleVariantSelect = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }))
  }

  const getCountdown = (endDate: string) => {
    const end = new Date(endDate).getTime()
    const now = Date.now()
    const diff = end - now

    if (diff <= 0) return null

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const getBundleIcon = (type: string) => {
    switch (type) {
      case 'bogo':
        return Gift
      case 'gift-with-purchase':
        return Sparkles
      case 'quantity':
      case 'tiered':
        return TrendingUp
      default:
        return Package
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-neutral-200" />
        <div className="h-64 rounded-2xl bg-neutral-200" />
      </div>
    )
  }

  if (bundles.length === 0) {
    return null
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Bundle & Save</h3>
          <p className="text-sm text-neutral-500">Get more value with these exclusive deals</p>
        </div>
      </div>

      {/* Bundle Cards */}
      <div className="space-y-4">
        {bundles.map((bundle, index) => {
          const BundleIcon = getBundleIcon(bundle.bundleType)
          const isSelected = selectedBundle === bundle._id
          const countdown = bundle.endDate ? getCountdown(bundle.endDate) : null

          // Card Display Style
          if (bundle.displayStyle === 'card' || !bundle.displayStyle) {
            return (
              <motion.div
                key={bundle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-blue-500 shadow-xl shadow-blue-500/20'
                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${bundle.highlightColor}08, ${bundle.highlightColor}15)`
                    : 'white',
                }}
              >
                {/* Badge */}
                {bundle.badgeText && (
                  <div
                    className="absolute top-0 right-0 rounded-bl-xl px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase"
                    style={{ backgroundColor: bundle.badgeColor }}
                  >
                    {bundle.badgeText}
                  </div>
                )}

                {/* Urgency/Countdown */}
                {(countdown || bundle.urgencyText) && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">{countdown || bundle.urgencyText}</span>
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${bundle.highlightColor}20` }}
                    >
                      <BundleIcon className="h-7 w-7" style={{ color: bundle.highlightColor }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{bundle.name}</h4>
                      {bundle.shortDescription && (
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{bundle.shortDescription}</p>
                      )}
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mt-5 space-y-3">
                    {bundle.products.map((item, i) => {
                      const product = item.productId
                      const hasVariants = product.variants && product.variants.length > 1
                      const selectedVariantId = selectedVariants[product._id]
                      const selectedVariant = selectedVariantId
                        ? product.variants?.find((v) => v._id === selectedVariantId)
                        : product.variants?.[0]

                      return (
                        <div key={i} className="space-y-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800">
                          <div className="flex items-center gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                              {product.images?.[0]?.src ? (
                                <Image src={product.images[0].src} alt={product.title} fill className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-6 w-6 text-neutral-300" />
                                </div>
                              )}
                              {item.isGift && (
                                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                                  <Gift className="h-3.5 w-3.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/products/${product.handle}`}
                                className="line-clamp-1 font-medium text-neutral-900 hover:text-blue-600 dark:text-white"
                              >
                                {product.title}
                              </Link>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm text-neutral-500">Qty: {item.quantity}</span>
                                {item.isGift && (
                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                    FREE GIFT
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {item.isGift ? (
                                <span className="text-lg font-bold text-green-600">FREE</span>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs text-neutral-400 line-through">
                                    ${((selectedVariant?.price || 0) * item.quantity).toLocaleString()}
                                  </span>
                                  <span className="font-semibold text-green-600">Bundle Price</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Variant Selector */}
                          {hasVariants && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                Select Variant:
                              </label>
                              <select
                                value={selectedVariantId || product.variants?.[0]?._id || ''}
                                onChange={(e) => handleVariantSelect(product._id, e.target.value)}
                                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                              >
                                {product.variants?.map((variant) => (
                                  <option key={variant._id} value={variant._id}>
                                    {[variant.option1Value, variant.option2Value, variant.option3Value]
                                      .filter(Boolean)
                                      .join(' / ')}{' '}
                                    - ${variant.price.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Pricing */}
                  <div className="mt-5 flex items-end justify-between rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 p-4 dark:from-neutral-700 dark:to-neutral-600">
                    <div>
                      <p className="text-xs font-medium text-neutral-400">Bundle Price</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-3xl font-black text-white">${bundle.bundlePrice?.toLocaleString()}</span>
                        {bundle.originalPrice && (
                          <span className="text-lg text-neutral-400 line-through">
                            ${bundle.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {bundle.savingsPercentage && bundle.savingsPercentage > 0 && (
                        <div
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold"
                          style={{ backgroundColor: bundle.highlightColor, color: 'white' }}
                        >
                          <Percent className="h-4 w-4" />
                          Save {bundle.savingsPercentage}%
                        </div>
                      )}
                      {bundle.savingsAmount && bundle.savingsAmount > 0 && (
                        <p className="mt-1 text-sm text-green-400">You save ${bundle.savingsAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleAddBundleToCart(bundle)}
                    disabled={addingToCart === bundle._id}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white transition-all hover:shadow-lg disabled:opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${bundle.highlightColor}, ${bundle.badgeColor || bundle.highlightColor})`,
                    }}
                  >
                    {addingToCart === bundle._id ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        {bundle.ctaText || 'Add Bundle to Cart'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          }

          // Banner Display Style
          if (bundle.displayStyle === 'banner') {
            return (
              <motion.div
                key={bundle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${bundle.highlightColor}, ${bundle.badgeColor || bundle.highlightColor})`,
                }}
              >
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />

                <div className="relative flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                      <BundleIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {bundle.badgeText && (
                          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white uppercase backdrop-blur">
                            {bundle.badgeText}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 text-xl font-bold text-white">{bundle.name}</h4>
                      {bundle.shortDescription && (
                        <p className="mt-1 text-sm text-white/80">{bundle.shortDescription}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">${bundle.bundlePrice?.toLocaleString()}</span>
                        {bundle.originalPrice && (
                          <span className="text-lg text-white/60 line-through">
                            ${bundle.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {bundle.savingsPercentage && (
                        <p className="mt-1 text-sm font-semibold text-white/90">
                          Save {bundle.savingsPercentage}% • ${bundle.savingsAmount?.toLocaleString()} off
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddBundleToCart(bundle)}
                      disabled={addingToCart === bundle._id}
                      className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-neutral-900 transition-all hover:bg-neutral-100"
                    >
                      {addingToCart === bundle._id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          {bundle.ctaText || 'Get Bundle'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mini Product Preview */}
                <div className="flex items-center gap-2 border-t border-white/20 bg-white/10 px-6 py-3 backdrop-blur">
                  <span className="text-sm text-white/80">Includes:</span>
                  <div className="flex -space-x-2">
                    {bundle.products.slice(0, 5).map((item, i) => (
                      <div key={i} className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/50 bg-white">
                        {item.productId?.images?.[0]?.src ? (
                          <Image
                            src={item.productId.images[0].src}
                            alt=""
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-4 w-4 text-neutral-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-white/80">{bundle.products.length} items</span>
                  {countdown && (
                    <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-white">
                      <Clock className="h-4 w-4" />
                      {countdown}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          }

          // Inline Display Style
          if (bundle.displayStyle === 'inline') {
            return (
              <motion.div
                key={bundle._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${bundle.highlightColor}20` }}
                  >
                    <BundleIcon className="h-5 w-5" style={{ color: bundle.highlightColor }} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{bundle.name}</h4>
                    <p className="text-sm text-neutral-500">
                      {bundle.products.length} items • Save {bundle.savingsPercentage}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-bold" style={{ color: bundle.highlightColor }}>
                      ${bundle.bundlePrice?.toLocaleString()}
                    </span>
                    {bundle.originalPrice && (
                      <span className="ml-2 text-sm text-neutral-400 line-through">
                        ${bundle.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddBundleToCart(bundle)}
                    disabled={addingToCart === bundle._id}
                    className="flex items-center gap-1 rounded-lg px-4 py-2 font-semibold text-white"
                    style={{ backgroundColor: bundle.highlightColor }}
                  >
                    {addingToCart === bundle._id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          }

          // Floating Display Style
          if (bundle.displayStyle === 'floating') {
            return (
              <motion.div
                key={bundle._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="fixed top-1/2 right-4 z-40 w-72 -translate-y-1/2 overflow-hidden rounded-2xl shadow-2xl"
                style={{
                  background: `linear-gradient(180deg, white, ${bundle.highlightColor}10)`,
                }}
              >
                {bundle.badgeText && (
                  <div
                    className="py-2 text-center text-xs font-bold tracking-wider text-white uppercase"
                    style={{ backgroundColor: bundle.badgeColor }}
                  >
                    {bundle.badgeText}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <BundleIcon className="h-6 w-6" style={{ color: bundle.highlightColor }} />
                    <h4 className="font-bold">{bundle.name}</h4>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black" style={{ color: bundle.highlightColor }}>
                      ${bundle.bundlePrice?.toLocaleString()}
                    </span>
                    {bundle.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        ${bundle.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {bundle.savingsPercentage && (
                    <p className="mt-1 text-sm text-green-600">Save {bundle.savingsPercentage}%</p>
                  )}

                  <button
                    onClick={() => handleAddBundleToCart(bundle)}
                    disabled={addingToCart === bundle._id}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white"
                    style={{ backgroundColor: bundle.highlightColor }}
                  >
                    {addingToCart === bundle._id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        {bundle.ctaText || 'Add Bundle'}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
