'use client'

import { useCarouselArrowButtons } from '@/hooks/use-carousel-arrow-buttons'
import { type EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'

import Link from 'next/link'
import ProductCard from './ProductCard'

interface SectionSliderProductCardProps {
  className?: string
  headingFontClassName?: string
  headingClassName?: string
  heading?: string
  subHeading?: string
  data: any[]
  relatedProducts?: any[]
  emblaOptions?: EmblaOptionsType
}

const SectionSliderProductCard = ({
  className = '',
  headingFontClassName = '',
  headingClassName = '',
  heading = 'New Arrivals',
  subHeading = 'REY backpacks & bags',
  data,
  relatedProducts = [],
  emblaOptions = {
    slidesToScroll: 'auto',
  },
}: SectionSliderProductCardProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = useCarouselArrowButtons(emblaApi)

  return (
    <div className={`nc-SectionSliderProductCard ${className}`}>
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        <div className="relative mb-8 shrink-0 px-4 text-center sm:mb-12 lg:mb-0">
          <h2 className="text-center font-family-antonio text-2xl font-black tracking-wide text-[#1b198f] sm:text-3xl md:text-4xl lg:text-[56px]">
            Unleash Your Potential with <span className="text-[#1b198f] dark:text-primary-400">Gibbon Nutrition</span>
            .
          </h2>
          <span className="mt-4 md:mb-7 mx-auto block max-w-4xl text-center font-family-antonio text-sm text-neutral-500 dark:text-neutral-400 sm:mt-6 sm:text-base">
            Premium supplements engineered for peak performance, recovery, and a healthier you.
          </span>
        </div>
      </div>

      {/* Wrapper to contain the carousel and prevent overflow */}
      <div className="overflow-hidden">
        <div className="embla" ref={emblaRef}>
          <div className="-ms-5 embla__container sm:-ms-8">
            {data
              ?.filter((p) => p.images?.[0]?.src)
              .map((product) => (
                <div
                  key={product._id}
                  className="embla__slide md: basis-[86%] ps-5 sm:basis-[calc(50%-1rem)] sm:ps-8 md:basis-[calc(50%-1rem)] lg:basis-[calc(33.333%-1rem)] xl:basis-[calc(25%-1rem)]"
                >
                  <ProductCard data={product} />
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2 px-4 sm:mt-12 sm:gap-x-5">
        <Link
          className="relative flex w-full max-w-[300px] cursor-pointer items-center justify-around overflow-hidden border-black bg-[#1B198F] py-2 px-4 font-family-roboto text-base font-medium text-white shadow-[4px_6px_0px_black] transition-[box-shadow_250ms,transform_250ms,filter_50ms] before:absolute before:inset-0 before:z-[-1] before:-translate-x-full before:bg-[#2a75b3] before:transition-transform before:duration-250 before:content-[''] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_3px_0px_black] hover:before:translate-x-0 sm:text-lg"
          href="/collections/all-items"
        >
          Shop Best Sellers
        </Link>
      </div>
    </div>
  )
}

export default SectionSliderProductCard