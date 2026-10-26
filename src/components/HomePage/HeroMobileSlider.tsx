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
      {/*
        In-flow copy sizes this shell (min-height, not a hard cap on short
        viewports). Media fills behind via absolute inset-0 so the hero can
        grow when admin H1 + intro need more than 78svh.
      */}
      <div className="relative min-h-[78svh] md:h-[100svh] md:min-h-[560px]">
        <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, i) => {
              const desktopSrc = cloudinaryUrl(slide.src, 1440)
              const desktopSrcSet = cloudinarySrcSet(slide.src)
              const mobileSrc = slide.srcMobile
                ? cloudinaryUrl(slide.srcMobile, 928)
                : undefined
              const media = (
                <div className="relative h-full min-h-[78svh] w-full md:min-h-full">
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
                <div key={`${slide.src}-${i}`} className="relative h-full min-w-0 flex-[0_0_100%]">
                  {slide.href ? (
                    <Link
                      href={slide.href}
                      className="block h-full"
                      aria-label={slide.ctaLabel || slide.alt}
                    >
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

        <div className="pointer-events-none relative z-10 flex min-h-[78svh] flex-col px-5 pb-8 pt-6 text-white md:min-h-[100svh] md:px-12 md:pb-12 md:pt-10">
          <p className="font-bake-script shrink-0 text-[22px] text-rose-deep drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] md:text-[28px]">
            {center.eyebrow}
          </p>

          <div className="flex flex-1 flex-col justify-center text-center">
            <p className="font-bake-body mb-3 block text-[12px] font-semibold uppercase leading-[1.1] tracking-[0.22em] text-white/90 drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] md:mb-4 md:text-[14px]">
              <Link
                href="/cupcake-delivery"
                className="pointer-events-auto underline-offset-4 hover:underline"
              >
                Cupcake delivery Melbourne
              </Link>
            </p>
            {/* Slightly smaller type under ~680px viewport height so short phones fit without clipping */}
            <h1 className="font-bake-display text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] [@media(max-height:679px)]:text-[32px] md:text-[72px] md:[@media(max-height:679px)]:text-[72px] lg:text-[88px] lg:[@media(max-height:679px)]:text-[88px]">
              {center.title}
            </h1>
            <p className="font-bake-script mt-3 text-[22px] text-gold-soft [@media(max-height:679px)]:mt-2 [@media(max-height:679px)]:text-[18px] md:mt-4 md:text-[32px] md:[@media(max-height:679px)]:mt-4 md:[@media(max-height:679px)]:text-[32px]">
              {center.footer}
            </p>
            <p
              id="hero-home-intro"
              className="font-bake-body mx-auto mt-4 max-w-[60ch] text-[14px] leading-relaxed text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] [@media(max-height:679px)]:mt-3 [@media(max-height:679px)]:text-[13px] md:text-[16px] md:[@media(max-height:679px)]:mt-4 md:[@media(max-height:679px)]:text-[16px]"
            >
              {HOME_INTRO}
            </p>
            <Link
              href={activeCtaHref}
              className="pointer-events-auto mt-6 inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-full bg-white/95 px-5 py-2.5 text-[13px] font-semibold tracking-wide text-cocoa shadow-[0_12px_28px_-12px_rgba(46,31,21,0.45)] md:mt-8 md:px-7 md:py-3 md:text-[15px]"
            >
              {activeCtaLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/*
            Fixed-height dots slot in SSR HTML (box-content h-1.5 + pb-10) so an
            empty scrollSnaps map before embla hydration cannot collapse this row
            and push the text/CTA when dots appear.
          */}
          <div className="pointer-events-auto box-content flex h-1.5 shrink-0 items-center justify-center gap-2 pb-10">
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
      </div>
    </section>
  )
}
