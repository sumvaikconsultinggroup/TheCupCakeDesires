'use client'

import { Gift } from 'lucide-react'
import Image from 'next/image'
import { FC } from 'react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Link } from '../Link'

// DEMO DATA using public URLs
const data = [
  {
    id: 1,
    imageUrl: '/images/Banner-1.webp',
    heading: 'Hand-Frosted. Baked Fresh Daily.',
    subHeading: 'Made in Melbourne. Small-batch. Eggless & Vegan options available.',
    para: 'The Cupcake Desire bakes small-batch, hand-frosted cupcakes every morning. Premium ingredients, indulgent flavours, and perfect gift boxes for every celebration.',
    btnText: 'Sweet Squad ',
    btnHref: '/collections/all-items',
    reviews: 1250,
  },
  {
    id: 2,
    imageUrl: '/images/Banner-2.webp',
    heading: 'Cupcakes That Make Every Day Special.',
    subHeading: 'Made in Melbourne. Small-batch. Eggless & Vegan options available.',
    para: 'The Cupcake Desire bakes small-batch, hand-frosted cupcakes every morning. Premium ingredients, indulgent flavours, and perfect gift boxes for every celebration.',
    btnText: 'Sweet Squad',
    btnHref: '/collections/all-items',
    reviews: 1250,
  },
  {
    id: 3,
    imageUrl: '/images/Banner-3.webp',
    heading: 'Hand-Frosted. Baked Fresh Daily.',
    subHeading: 'Made in Melbourne. Small-batch. Eggless & Vegan options available.',
    para: 'The Cupcake Desire bakes small-batch, hand-frosted cupcakes every morning. Premium ingredients, indulgent flavours, and perfect gift boxes for every celebration.',
    btnText: 'Sweet Squad',
    btnHref: '/collections/all-items',
    reviews: 1250,
  },
  {
    id: 4,
    imageUrl: '/images/Banner-4.webp',
    heading: 'Celebrate Every Moment With The Cupcake Desire.',
    subHeading: 'Made in Melbourne. Small-batch. Eggless & Vegan options available.',
    para: 'The Cupcake Desire bakes small-batch, hand-frosted cupcakes every morning. Premium ingredients, indulgent flavours, and perfect gift boxes for every celebration.',
    btnText: 'Sweet Squad',
    btnHref: '/collections/all-items',
    reviews: 1250,
  },
]

interface Props {
  className?: string
}

const SectionHero2: FC<Props> = ({ className = '' }) => {
  return (
    <div className={`relative z-1  ${className}`}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        pagination={{ clickable: true }}
        navigation={false}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        className="h-full"
      >
        {data.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="relative h-[900px]">
              {/* BG Image */}
              <Image src={item.imageUrl} alt="background" fill className=" object-cover" priority={item.id === 1} />

              {/* Content Overlay */}
              <div className="absolute top-20 left-0 w-full md:w-auto md:top-20 md:left-20 flex items-center [font-family:var(--font-antonio)]">
                <div className="container mx-auto px-4">
                  <div className="max-w-3xl space-y-4">
                    {/* Heading */}
                    <h1
                      className={`font-family-antonio text-4xl sm:text-5xl font-bold md:text-8xl ${
                        item.id === 1 ? 'text-[#A71B00]' : 'text-white'
                      } leading-tight`}
                    >
                      {item.heading}
                    </h1>

                    {/* Subheading */}
                    <h2 className={`text-2xl font-family-antonio md:text-3xl max-w-2xl ${item.id === 1 ? 'text-black' : 'text-white/90'}`}>
                      {item.subHeading}
                    </h2>

                    {/* Paragraph */}
                    <p className={`text-lg md:text-xl font-family-roboto max-w-2xl ${item.id === 1 ? 'text-black' : 'text-white/80'}`}>
                      {item.para}
                    </p>

                
                    {/* Reviews */}
                    <div className={`flex items-center mt-3 gap-2 ${item.id === 1 ? 'text-black' : 'text-white'}`}>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="h-5 w-5 fill-yellow-400" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm">/ {item.reviews.toLocaleString()} Reviews</span>
                    </div>

                    {/* Shop Bestseller Button */}
                    <Link
                      href="/collections/bestsellers"
                      className="inline-block rounded-lg mt-3 text-sm md:text-lg bg-[#1B198F] px-6 py-3 md:px-10 md:py-5 font-medium text-white transition-colors hover:bg-[#2770a8]"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default SectionHero2
