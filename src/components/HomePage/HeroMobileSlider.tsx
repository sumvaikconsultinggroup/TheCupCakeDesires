'use client'

import { useCarouselDotButton } from '@/hooks/use-carousel-dot-buttons'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/cloudinary-url'
import { HOME_INTRO } from '@/data/home-head-term'
import { DEFAULT_HERO_SLIDES, type HeroSlide } from '@/data/hero-defaults'
import type { HeroScrollMaskProps } from './HeroScrollMask'

const DEFAULT_CENTER = {
  eyebrow: 'We create',
  title: 'Sweet moments',
  footer: 'that delight.',
}

function resolveSlides(props: HeroScrollMaskProps): HeroSlide[] {
  if (props.slides && props.slides.length > 0) {
    return props.slides.filter((s) => Boolean(s.src?.trim()))
  }
  if (props.images && props.images.length > 0) {
    return props.images
      .filter((src) => Boolean(src?.trim()))
      .map((src, i) => ({
        src,
        alt: DEFAULT_HERO_SLIDES[i]?.alt || 'Hand-frosted cupcakes from The Cupcake Desire',
      }))
  }
  return DEFAULT_HERO_SLIDES.map((s) => ({ ...s }))
}

export default function HeroMobileSlider(props: HeroScrollMaskProps = {}) {
  const slides = resolveSlides(props)
  const center = { ...DEFAULT_CENTER, ...(props.center ?? {}) }

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 32, align: 'start' }, [
    Autoplay({ playOnInit: true, delay: 5000, stopOnInteraction: false, stopOnMouseEnter: false }),
  ])
  const { selectedIndex, scrollSnaps, onDotButtonClick } = useCarouselDotButton(emblaApi)

  const activeSlide = slides[selectedIndex] || slides[0]
  const activeCtaHref = activeSlide?.href || '/collections/all-items'
  const activeCtaLabel = activeSlide?.ctaLabel || 'Shop the collection'

  return (
    <section
      className="hero-slider relative isolate overflow-hidden bg-cocoa"
      aria-label="The Cupcake Desire featured hero"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => {
            const desktopSrc = cloudinaryUrl(slide.src, 1440)
            const desktopSrcSet = cloudinarySrcSet(slide.src)
            const mobileSrc = slide.srcMobile
              ? cloudinaryUrl(slide.srcMobile, 928)
              : undefined
            const media = (
              <div className="relative h-[78svh] min-h-[420px] max-h-[680px] md:h-[100svh] md:min-h-[560px] md:max-h-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <picture className="absolute inset-0 block h-full w-full">
                  {mobileSrc ? (
                    <source media="(max-width: 767px)" srcSet={mobileSrc} />
                  ) : null}
                  <img
                    src={desktopSrc}
                    srcSet={desktopSrcSet}
                    sizes="100vw"
                    alt={slide.alt}
                    title={slide.alt}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding={i === 0 ? 'sync' : 'async'}
                    draggable={false}
                  />
                </picture>
              </div>
            )
            return (
              <div key={`${slide.src}-${i}`} className="relative min-w-0 flex-[0_0_100%]">
                {slide.href ? (
                  <Link href={slide.href} className="block" aria-label={slide.ctaLabel || slide.alt}>
                    {media}
                  </Link>
                ) : (
                  media
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-cocoa/45 via-cocoa/20 to-cocoa/70" />

      {/*
        Overlay is absolutely layered (not justify-between flex) so font-swap /
        intro re-wrap cannot shift sibling slots. Text block top is pinned;
        intro keeps a min-height sized for the longest HOME_INTRO wrap at 360px.
      */}
      <div className="pointer-events-none absolute inset-0 text-white">
        <p className="font-bake-script absolute left-5 top-6 text-[22px] text-rose-deep drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] md:left-12 md:top-10 md:text-[28px]">
          {center.eyebrow}
        </p>

        <div className="absolute inset-x-5 top-[18%] text-center md:inset-x-12 md:top-[22%]">
          <p className="font-bake-body mb-3 block text-[12px] font-semibold uppercase leading-[1.1] tracking-[0.22em] text-white/90 drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] md:mb-4 md:text-[14px]">
            <Link
              href="/cupcake-delivery"
              className="pointer-events-auto underline-offset-4 hover:underline"
            >
              Cupcake delivery Melbourne
            </Link>
          </p>
          <h1 className="font-bake-display text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] md:text-[72px] lg:text-[88px]">
            {center.title}
          </h1>
          <p className="font-bake-script mt-3 text-[22px] text-gold-soft md:mt-4 md:text-[32px]">{center.footer}</p>
          {/* ~8 lines at 14px/leading-relaxed in a 320px content column (360px viewport) */}
          <p className="font-bake-body mx-auto mt-4 min-h-[12.5rem] max-w-[60ch] text-[14px] leading-relaxed text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] md:min-h-[6.5rem] md:text-[16px]">
            {HOME_INTRO}
          </p>
          <Link
            href={activeCtaHref}
            className="pointer-events-auto mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-[13px] font-semibold tracking-wide text-cocoa shadow-[0_12px_28px_-12px_rgba(46,31,21,0.45)] md:mt-8 md:px-7 md:py-3 md:text-[15px]"
          >
            {activeCtaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-8 flex items-center justify-center gap-2 pb-10 md:bottom-12">
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
