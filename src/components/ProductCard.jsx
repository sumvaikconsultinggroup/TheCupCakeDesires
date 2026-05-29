'use client'

import { useAside } from '@/components/aside'
import NcImage from '@/shared/NcImage/NcImage'
import { ArrowsPointingOutIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import LikeButton from './LikeButton'
import { Link } from './Link'
import Prices from './Prices'
import ProductStatus from './ProductStatus'
import { useCart } from './useCartStore'
import axios from 'axios'
import toast from 'react-hot-toast'



const ProductCard = ({ className = '', data, isLiked = false }) => {
  const { _id, title, status, options, handle, images, variants, reviews } = data

  const defaultVariant = variants?.[0]
  const price = defaultVariant?.price
  const featuredImage = images?.[0]
  const inStock = (defaultVariant?.inventoryQty ?? 0) > 0

  const ratingCount = reviews?.length > 0 ? reviews?.reduce((sum, review) => sum + review.star, 0) / reviews.length : 0

  const [showMoreColors, setShowMoreColors] = useState(false)
  const { open: openAside, setProductQuickViewHandle } = useAside()
  const { addItem } = useCart()
  const [likedState, setLikedState] = useState(isLiked)

  useEffect(() => {
    setLikedState(isLiked)
  }, [isLiked])

  useEffect(() => {
    const handleWishlistUpdate = (e) => {
      if (e.detail.productId === _id) {
        setLikedState(e.detail.isLiked)
      }
    }
    window.addEventListener('wishlist-updated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate)
  }, [_id])

  const renderColorOptions = () => {
    const optionColorValues = options?.find((option) => option.name === 'Flavors')?.values

    if (!optionColorValues?.length) {
      return null
    }

    const toggleShowMore = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setShowMoreColors(!showMoreColors)
    }

    const colorMap = {
      // Existing
      'green apple': '#84cc16',
      'raw mango': '#f97316',
      'musk melon': '#f59e0b',
      'blue raspberry': '#3b82f6',
      mango: '#ffc107',
      orange: '#f97316',
      'fruit punch': '#ef4444',
      cola: '#3E2723',
      pinacolada: '#fefce8',
      guava: '#ec4899',
      'water melon': '#f43f5e',
      'bubble gum': '#d946ef',
      unflavored: '#a3a3a3',
      // New Additions
      'mocha chino': '#A56A44',
      'vanilla caramel': '#D2691E',
      saffron: '#F4C430',
      'double chocolate': '#3D2B1F',
      'pina colada': '#fefce8',
      'kiwi strawberry': '#FC819E',
      'green mango': '#90EE90',
      grape: '#6F2DA8',
      watermelon: '#f43f5e',
      blueberry: '#464196',
      bubblegum: '#d946ef',
      chocolate: '#7B3F00',
      'cookies cream': '#F5F5DC',
      vanilla: '#F3E5AB',
      'rich chocolate': '#5C3317',
      'cookies n cream': '#F5F5DC',
      'saffron milk': '#FFD700',
      'irish chocolate': '#622A0F',
      'coffee mocha': '#4A2C2A',
      banana: '#FFE135',
      'butter scotch': '#E3963E',
      'creamy vanilla': '#F3E5AB',
      'real chocolate': '#5D4037',
      'dutch chocolate': '#4B3621',
      'saffron milk shake': '#FFD700',
      coffee: '#6F4E37',
      'mango shake': '#FFBF00',
      'banana shake': '#FAE392',
      'mango mangifera': '#FFBF00',
      'chocolate creme': '#D2691E',
      'malai kulfi': '#FFFDD0',
      'vanilla elite': '#F3E5AB',
      'straw & berries': '#E0115F',
      'saffron mix': '#F4C430',
      'pineapple twist': '#FFEC8B',
      'chocolate peanuts': '#4a2c2a',
      'cookies confection': '#F5F5DC',
      'rose macarron': '#F4C2C2',
      'vanilla shake': '#F3E5AB',
      'mango maza': '#FFBF00',
      'silk chocolate': '#C4A484',
      'chocolate peanut': '#4a2c2a',
    }

    const colorsToShow = showMoreColors ? optionColorValues : optionColorValues.slice(0, 3)

    return (
      <div className="flex items-center gap-2">
        {colorsToShow.map((colorName) => (
          <div key={colorName} className="group relative size-4 cursor-pointer">
            <div
              className="h-full w-full rounded-full bg-cover ring-1 ring-neutral-900/20 dark:ring-white/20"
              style={{
                backgroundColor: colorMap[colorName.toLowerCase()] || colorName.toLowerCase(),
              }}
            />
            <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-700">
              {colorName}
            </span>
          </div>
        ))}
        {optionColorValues.length > 3 && (
          <button
            onClick={toggleShowMore}
            className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700"
          >
            {showMoreColors ? 'Less' : `+${optionColorValues.length - 3}`}
          </button>
        )}
      </div>
    )
  }

  const renderGroupButtons = () => {
    const cartProductVariants = []
    if (defaultVariant?.option1) {
      cartProductVariants.push({ name: defaultVariant.option1, option: defaultVariant.option1Value })
    }
    if (defaultVariant?.option2) {
      cartProductVariants.push({ name: defaultVariant.option2, option: defaultVariant.option2Value })
    }

    const productForCart = {
      productId: _id,
      name: title,
      price: price || 0,
      imageUrl: featuredImage?.src || '',
      handle: handle || '',
      variant: defaultVariant,

    }

    const handleAddToCart = async () => {
      // Check if product is in stock
      if (!inStock) {
        toast.error('This product is out of stock')
        return
      }

      addItem(productForCart)
      if (likedState) {
        try {
          await axios.delete('/api/wishlists', { data: { productId: _id, itemType: 'product' } })
          toast.success(`${title} removed from wishlist`)
          window.dispatchEvent(new CustomEvent('wishlist-updated', {
            detail: { productId: _id, itemType: 'product', isLiked: false }
          }))
        } catch (error) {
          console.error('Error removing from wishlist:', error)
        }
      }
    }

    return (
      <div className="invisible font-family-antonio absolute inset-x-1 bottom-0 flex justify-center gap-1.5 opacity-0 transition-all group-hover:visible group-hover:bottom-4 group-hover:opacity-100">
        {!inStock ? (
          <div className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs/normal text-white shadow-lg font-bold">
            Out of Stock
          </div>
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs/normal text-white shadow-lg hover:bg-neutral-800"
            >
              <ShoppingBagIcon className="-ml-1 size-3.5" />
              <span>Add to bag</span>
            </button>

            <button
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs/normal text-neutral-950 shadow-lg hover:bg-neutral-50"
              type="button"
              onClick={() => {
                setProductQuickViewHandle(handle || '')
                openAside('product-quick-view')
              }}
            >
              <ArrowsPointingOutIcon className="-ml-1 size-3.5" />
              <span>Quick view</span>
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={`product-card font-family-antonio relative flex flex-col bg-transparent ${className}`}>
        <Link href={'/products/' + handle} className="absolute inset-0"></Link>

        <div className="group relative z-1 shrink-0 overflow-hidden rounded-3xl bg-neutral-50 dark:bg-neutral-300">
          <Link href={'/products/' + handle} className="block">
            {featuredImage?.src && (
              <NcImage
                containerClassName="relative aspect-square w-full overflow-hidden"
                src={featuredImage?.src}
                className="h-full w-full object-cover"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 40vw"
                alt={handle}
              />
            )}
          </Link>
          <ProductStatus status={status} />
          {!inStock && (
            <div className="absolute inset-0 z-5 flex items-center justify-center bg-black/40 rounded-3xl">
              <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
          <LikeButton liked={isLiked} productId={_id} productName={title} className="absolute end-3 top-3 z-10" />
          {renderGroupButtons()}
        </div>

        <div className="space-y-4 px-2.5 pt-5 pb-2.5">
          {renderColorOptions()}
          <div>
            <h2 className="nc-ProductCard__title text-base font-semibold transition-colors">
              {title} {variants?.[0]?.option2Value && `(${variants[0].option2Value})`}
            </h2>
            <p className={`mt-1 text-sm text-neutral-500 dark:text-neutral-400`}>{defaultVariant?.option1Value}</p>
          </div>

          <div className="flex items-end justify-between">
            <Prices price={price ?? 1} />
            <div className="mb-0.5 flex items-center">
              <StarIcon className="h-5 w-5 pb-px text-amber-400" />
              <span className="ms-1 text-sm text-neutral-500 dark:text-neutral-400">
                {ratingCount.toFixed(1) || 0} ({reviews?.length || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductCard