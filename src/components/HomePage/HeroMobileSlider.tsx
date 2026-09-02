'use client'

import { useCarouselDotButton } from '@/hooks/use-carousel-dot-buttons'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import type { HeroScrollMaskProps } from './HeroScrollMask'

const DEFAULT_IMAGES = [
  '/images/Banner-1.webp',
  '/images/Banner-2.webp',
  '/images/Banner-3.webp',
  '/images/Banner-4.webp',
]

const DEFAULT_CENTER = {
  eyebrow: 'We create',
  title: 'Sweet moments',
  footer: 'that delight.',
}

export default function HeroMobileSlider(props: HeroScrollMaskProps = {}) {
  const images =
    props.images && props.images.length > 0
      ? props.images.filter((src) => Boolean(src?.trim()))
      : [...DEFAULT_IMAGES]
  const center = { ...DEFAULT_CENTER, ...(props.center ?? {}) }

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 32, align: 'start' }, [
    Autoplay({ playOnInit: true, delay: 5000, stopOnInteraction: false, stopOnMouseEnter: false }),
  ])
  const { selectedIndex, scrollSnaps, onDotButtonClick } = useCarouselDotButton(emblaApi)

  return (
    <section
      className="hero-slider relative isolate overflow-hidden bg-cocoa"
      aria-label="The Cupcake Desire featured hero"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[78svh] min-h-[420px] max-h-[680px] md:h-[100svh] md:min-h-[560px] md:max-h-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  decoding="async"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-cocoa/45 via-cocoa/20 to-cocoa/70" />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 pb-8 pt-6 text-white md:px-12 md:pb-12 md:pt-10">
        <p className="font-bake-script text-[22px] text-rose-deep drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] md:text-[28px]">
          {center.eyebrow}
        </p>

        <div className="text-center">
          <h1 className="font-bake-display text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] md:text-[72px] lg:text-[88px]">
            {center.title}
          </h1>
          <p className="font-bake-script mt-3 text-[22px] text-gold-soft md:mt-4 md:text-[32px]">{center.footer}</p>
          <Link
            href="/collections/all-items"
            className="pointer-events-auto mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[13px] font-semibold tracking-wide text-cocoa shadow-[0_12px_28px_-12px_rgba(46,31,21,0.45)] md:mt-8 md:px-7 md:py-3 md:text-[15px]"
          >
            Shop the collection
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="pointer-events-auto flex items-center justify-center gap-2 pb-10">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === selectedIndex}
              onClick={() => onDotButtonClick(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === selectedIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/45'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
