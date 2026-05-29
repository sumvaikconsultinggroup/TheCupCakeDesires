import Image from 'next/image'
import StarRating from '../StarRating'
import AddToCartButton from '../AddToCardButton'
import { useState } from 'react'
import { useAside } from '@/components/aside'

const NewProductCard = ({ product: data }) => {
  const { _id, title, status, options, handle, images, variants, reviews } = data

  const defaultVariant = variants?.[0]
  const price = defaultVariant?.price
  const featuredImage = images?.[0]
  const inStock = (defaultVariant?.inventoryQty ?? 0) > 0

  const ratingCount = reviews?.length > 0 ? reviews?.reduce((sum, review) => sum + review.star, 0) / reviews.length : 0

  const [showMoreColors, setShowMoreColors] = useState(false)
  const { open: openAside, setProductQuickViewHandle } = useAside()

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

  const salePrice = data.variants?.[0]?.price || 0
  const comparePrice = data.variants?.[0]?.compareAtPrice || salePrice
  const discount = comparePrice > salePrice ? Math.round(((comparePrice - salePrice) / comparePrice) * 100) : 0

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
    compareAtPrice: comparePrice || 0,
    variant: defaultVariant,
  }

  return (
    <div
      key={data._id}
      className=" p-4  border-[1.75px] border-[#1B198F] shrink-0 bg-white relative"
    >
      {/* Red left border accent */}
      {/* <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1B198F]" /> */}

      {/* Product Image */}
      <div className="relative bg-[#e8e4df] p-6">
        {/* Bestseller Badge */}
        {/* Assuming 'bestseller' tag exists */}
        {data.tags?.includes('bestseller') && (
          <div className="absolute top-0 right-12 z-10">
            <div className="bg-[#1B198F] text-white text-xs font-bold px-3 py-1 rotate-0 origin-top-right">
              BESTSELLER
            </div>
          </div>
        )}

        {/* Green indicator */}


        <div className="flex items-center justify-center h-64">
          <Image
            src={data.images?.[0]?.src || "/placeholder.svg"}
            alt={data.title}
            fill
            className="object-cover max-h-full"
          />
        </div>

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="py-4 text-center [font-family:var(--font-roboto)]">
        {/* Using placeholder rating/reviews as they are not in the API response */}
        <StarRating rating={ratingCount || 4.5} reviews={data.reviews_count || 75} />

        <h3 className=" min-h-[120px] font-family-antonio text-[#151515] mt-2.5 mb-2 text-[28px] leading-[1.2] uppercase  tracking-normal no-underline ">
          {data.title}
        </h3>

        {/* Pricing */}
        <div className="flex items-center font-family-roboto justify-center gap-2 mb-3">
          <span className="text-gray-400 line-through text-sm">
            ${comparePrice.toLocaleString()}
          </span>
          <span className="font-bold text-gray-900 text-lg">${salePrice.toLocaleString()}/-</span>
          {discount > 0 && (
            <span className="text-green-600 font-semibold text-sm">-{discount}% OFF</span>
          )}
        </div>

        {/* Free Shipping Badge */}
        <div className="inline-block bg-[#1B198F] text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          FREE SHIPPING + 3% PREPAID BONUS
        </div>

        {/* Add to Cart Button */}
        <div>
          <AddToCartButton blackVariant={false} product={productForCart} />
        </div>
      </div>
    </div>
  )
}

export default NewProductCard
