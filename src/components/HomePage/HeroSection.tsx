'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ImagePlaceholder from '../ImagePlaceholder'

type Slide = {
  id: string | number
  eyebrow: string
  titleA: string
  titleAccent: string
  titleB: string
  description: string
  cta: string
  ctaLink: string
  secondaryCta?: string
  secondaryCtaLink?: string
  imageHint: string
}

const fallbackSlides: Slide[] = [
  {
    id: 1,
    eyebrow: 'Baked this morning',
    titleA: 'Handcrafted',
    titleAccent: 'cupcakes',
    titleB: 'made with intention.',
    description:
      'Small-batch baking with real butter, single-origin vanilla, and Belgian chocolate. Baked to order and delivered fresh — please allow 2 days&rsquo; notice on every order.',
    cta: 'Shop today’s collection',
    ctaLink: '/collections/all',
    secondaryCta: 'Build a custom box',
    secondaryCtaLink: '/cupcake-builder',
    imageHint: 'Hero — bestseller cupcake on a pedestal, soft natural light',
  },
  {
    id: 2,
    eyebrow: 'Seasonal release',
    titleA: 'Strawberries',
    titleAccent: '&',
    titleB: 'cream.',
    description:
      'Whipped vanilla bean buttercream piped over a delicate almond sponge, crowned with a fresh farm-market berry.',
    cta: 'Explore the season',
    ctaLink: '/collections/new',
    secondaryCta: 'See all signatures',
    secondaryCtaLink: '/collections/signatures',
    imageHint: 'Strawberry cupcake, overhead 45°, warm linen backdrop',
  },
  {
    id: 3,
    eyebrow: 'Gift-ready boxes',
    titleA: 'Boxes for',
    titleAccent: 'every',
    titleB: 'celebration.',
    description:
      'Curated cupcake boxes of six, twelve, or twenty-four — ribbon-wrapped, hand-noted, delivered city-wide.',
    cta: 'Order a gift box',
    ctaLink: '/combos',
    secondaryCta: 'Talk to our team',
    secondaryCtaLink: '/contact',
    imageHint: 'Gift box of twelve cupcakes, ribbon detail, marble surface',
  },
]

export default function HeroSection() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/admin/home-banners')
        const data = await res.json()
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: Slide[] = data.data.map((b: any, i: number) => {
            const w = (b.title || '').split(' ')
            const a = w.slice(0, Math.max(1, Math.floor(w.length / 3))).join(' ')
            const mid = w.slice(Math.floor(w.length / 3), Math.floor((2 * w.length) / 3)).join(' ')
            const c = w.slice(Math.floor((2 * w.length) / 3)).join(' ')
            return {
              id: b._id ?? i,
              eyebrow: b.badge || 'Baked this morning',
              titleA: a || 'Handcrafted',
              titleAccent: mid || 'cupcakes',
              titleB: c || 'made with care.',
              description: b.description || b.subtitle || '',
              cta: b.buttonText || 'Shop the collection',
              ctaLink: b.buttonLink || '/collections/all',
              imageHint: 'Featured product photography',
            }
          })
          setSlides(mapped)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchBanners()
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 8000)
    return () => clearInterval(t)
  }, [slides.length])

  const slide = slides[current] ?? fallbackSlides[0]

  return (
    <section className="relative bg-ivory">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 pt-12 pb-20 md:grid-cols-12 md:gap-16 md:px-10 md:pt-20 md:pb-28 lg:gap-20">
        {/* LEFT — copy */}
        <div className="flex flex-col justify-center md:col-span-6">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bake-eyebrow"
          >
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            {slide.eyebrow}
          </motion.p>

          <motion.h1
            key={`t-${slide.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="bake-display-xl mt-6"
          >
            {slide.titleA}{' '}
            <span className="bake-display-italic text-rose-accent">{slide.titleAccent}</span>{' '}
            {slide.titleB}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="bake-body-lg mt-7 max-w-[52ch]"
          >
            {slide.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link href={slide.ctaLink} className="bake-btn">
              {slide.cta}
              <span aria-hidden>→</span>
            </Link>
            {slide.secondaryCta && (
              <Link href={slide.secondaryCtaLink || '/'} className="bake-btn bake-btn-ghost">
                {slide.secondaryCta}
              </Link>
            )}
          </motion.div>

          {/* Slide indicators */}
          {slides.length > 1 && (
            <div className="mt-12 flex items-center gap-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-[2px] transition-all duration-300 ${
                    i === current ? 'w-12 bg-cocoa' : 'w-6 bg-line hover:bg-taupe'
                  }`}
                />
              ))}
              <span className="bake-caption ml-4 text-taupe">
                {String(current + 1).padStart(2, '0')} <span className="opacity-40">/</span>{' '}
                {String(slides.length).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT — image placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative md:col-span-6"
        >
          <ImagePlaceholder
            ratio="aspect-[4/5]"
            tone="rose"
            rounded="xl"
            label="Hero product image"
            hint={slide.imageHint}
          />

          {/* Floating mini card — bottom left */}
          <div className="absolute -bottom-6 left-4 hidden w-[230px] rounded-2xl border border-line bg-white p-4 shadow-[0_18px_40px_-18px_rgba(46,31,21,0.18)] md:block">
            <p className="bake-caption text-taupe">Today’s pick</p>
            <p className="font-bake-display mt-1 text-[20px] font-medium text-cocoa">
              Pistachio Rose
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bake-display text-[18px] text-cocoa">$140</span>
              <span className="bake-badge bake-badge-rose">Bestseller</span>
            </div>
          </div>

          {/* Floating mini card — top right */}
          <div className="absolute -top-4 -right-4 hidden w-[180px] rounded-2xl bg-cocoa p-4 text-ivory md:block">
            <p className="bake-caption text-cream-deep/70">Limited drop</p>
            <p className="font-bake-display mt-1 text-[18px] font-medium leading-snug">
              Strawberries &amp; cream
            </p>
            <p className="bake-body-sm mt-2 text-cream-deep/80">Only 24 boxes today</p>
          </div>
        </motion.div>
      </div>

      {/* Soft divider line */}
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="bake-divider" />
      </div>
    </section>
  )
}
