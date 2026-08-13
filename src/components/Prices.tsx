import clsx from 'clsx'
import { FC } from 'react'

export interface PricesProps {
  className?: string
  price?: number
  compareAtPrice?: number
  contentClass?: string
  priceSizeClass?: string
  crossedPriceClass?: string
}

const Prices: FC<PricesProps> = ({
  className = '',
  price = 0,
  compareAtPrice,
  contentClass = 'py-1 px-2 md:pt-1.5 md:px-2.5 text-sm font-medium',
  priceSizeClass = '',
  crossedPriceClass = 'text-gray-500',
}) => {
  return (
    <div className={`${className}`}>
      <div className={`flex items-baseline font-family-roboto gap-x-1 ${contentClass}`}>
        <span className={`font-semibold text-[20px] dark:text-neutral-100 text-blue-600 ${priceSizeClass}`}>
          {price ? `$${price.toLocaleString()}` : 'Free'}
        </span>
        {typeof compareAtPrice === 'number' && compareAtPrice > price && (
          <>
            <del className={`text-[14px] mx-2.5 font-medium font-family-roboto ${crossedPriceClass}`}>
              ${compareAtPrice.toLocaleString()}
            </del>
            {price > 0 && (
              <span className={`text-[14px] font-600 font-family-roboto text-green-600 dark:text-green-500  `}>
                -{`${Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% off`}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Prices
