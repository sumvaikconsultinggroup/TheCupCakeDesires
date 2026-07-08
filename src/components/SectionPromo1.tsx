import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import ButtonSecondary from '@/shared/Button/ButtonSecondary'
import { FC } from 'react'

const PromoSVG = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute w-full h-full">
      <defs>
        <linearGradient id="promoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="text-primary-400" stopColor="currentColor" />
          <stop offset="100%" className="text-primary-600" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <path fill="url(#promoGradient)" d="M53.5,-69.7C67.9,-61.6,77.1,-45.3,79.9,-28.2C82.7,-11.1,79.1,6.8,71.2,23.1C63.3,39.4,51.1,54.1,36.4,64.2C21.7,74.3,4.5,79.8,-12.6,78.2C-29.7,76.6,-46.7,67.9,-59.4,54.7C-72.1,41.5,-80.5,23.8,-82.9,5.3C-85.3,-13.2,-81.7,-32.5,-70.8,-46.7C-59.9,-60.9,-41.7,-70,-24.6,-74.8C-7.5,-79.6,8.5,-80.1,23.6,-78.1C38.7,-76.1,53.5,-69.7,53.5,-69.7Z" transform="translate(100 100) scale(1.1)" />
    </svg>
  </div>
)

interface SectionPromo1Props {
  className?: string
}

const SectionPromo1: FC<SectionPromo1Props> = ({ className = '' }) => {
  return (
    <div className={`relative flex flex-col items-center lg:flex-row ${className}`}>
      <div className="relative mb-16 max-w-lg shrink-0 text-center lg:mr-10 lg:mb-0 lg:w-2/5 lg:text-left">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl 2xl:text-6xl">
          Sweeten Every Moment with <span className="text-primary-600 dark:text-primary-400">The Cupcake Desire</span>
        </h2>
        <span className="mt-6 block text-neutral-500 dark:text-neutral-400">
          Small-batch, hand-frosted cupcakes baked fresh every morning. Perfect for celebrations or an everyday treat.
        </span>
        <div className="mt-6 flex flex-wrap gap-2 sm:mt-12 sm:gap-x-5">
          <ButtonPrimary href="/collections/all-items">Shop Best Sellers</ButtonPrimary>
          <ButtonSecondary href="/about" className="border border-neutral-100 dark:border-neutral-700">
            Our Story
          </ButtonSecondary>
        </div>
      </div>
      <div className="relative max-w-xl flex-1 lg:max-w-none">
        <PromoSVG />
      </div>
    </div>
  )
}

export default SectionPromo1
