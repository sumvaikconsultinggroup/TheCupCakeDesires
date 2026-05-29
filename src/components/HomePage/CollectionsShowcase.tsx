'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import ImagePlaceholder from '../ImagePlaceholder'

type Collection = {
  name: string
  tagline: string
  blurb: string
  count: string
  href: string
  tone: 'rose' | 'cream' | 'beige' | 'gold' | 'mint'
  hint: string
  span: 'tall' | 'short'
}

const collections: Collection[] = [
  {
    name: 'For Birthdays',
    tagline: 'Make the day taste like a celebration.',
    blurb: 'Boxes of 6 or 12 with candles, custom messages, and the flavours people fight over.',
    count: '24 boxes',
    href: '/collections/birthday',
    tone: 'rose',
    hint: 'Birthday box with candle being placed',
    span: 'tall',
  },
  {
    name: 'For Weddings',
    tagline: 'Cupcake towers worth photographing.',
    blurb: 'Custom flavours, edible logos, branded packaging — for 50 guests or 5,000.',
    count: '12 collections',
    href: '/collections/weddings',
    tone: 'cream',
    hint: 'Wedding cupcake tower with floral styling',
    span: 'short',
  },
  {
    name: 'Office Gifting',
    tagline: 'For client thank-yous &amp; team treats.',
    blurb: 'Volume orders, custom branding, GST invoices — handled.',
    count: '8 packages',
    href: '/collections/corporate',
    tone: 'beige',
    hint: 'Stack of branded gift boxes',
    span: 'short',
  },
  {
    name: 'Just Because',
    tagline: 'Tuesday deserves cake too.',
    blurb: 'Our everyday signature flavours, in our smallest gift-ready boxes.',
    count: '36 cupcakes',
    href: '/collections/everyday',
    tone: 'gold',
    hint: 'Single cupcake on counter — soft window light',
    span: 'tall',
  },
]

export default function CollectionsShowcase() {
  return (
    <section className="relative bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Heading */}
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:mb-20 md:flex-row md:items-end">
          <div className="max-w-[58ch]">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Shop by occasion
            </p>
            <h2 className="bake-display-lg mt-5">
              Curated for the days{' '}
              <span className="bake-display-italic text-rose-accent">that matter.</span>
            </h2>
            <p className="bake-body mt-4 max-w-[52ch]">
              Birthdays, weddings, office gifts, or a Tuesday-afternoon pick-me-up — we&rsquo;ve curated
              edits for every moment worth marking.
            </p>
          </div>
          <Link href="/collections/all" className="bake-btn bake-btn-ghost bake-btn-sm">
            View every edit <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Magazine grid — asymmetric: 2 tall + 2 short */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
          {collections.map((c, i) => {
            const isTall = c.span === 'tall'
            const colSpan = isTall ? 'md:col-span-6' : 'md:col-span-6 lg:col-span-3'
            const aspect = isTall ? 'aspect-[4/5]' : 'aspect-[4/5] lg:aspect-[3/5]'

            return (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.3) }}
                className={`${colSpan} ${isTall ? 'lg:row-span-2' : ''}`}
              >
                <Link
                  href={c.href}
                  className="group bake-img-zoom relative block overflow-hidden rounded-2xl"
                >
                  {/* Image */}
                  <ImagePlaceholder
                    ratio={aspect}
                    tone={c.tone}
                    rounded="none"
                    label="Lifestyle"
                    hint={c.hint}
                  />

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa/70 via-cocoa/15 to-transparent" />

                  {/* Top-left count chip */}
                  <span className="bake-badge bake-badge-dark absolute left-5 top-5">
                    {c.count}
                  </span>

                  {/* Bottom-left content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                    <p className="bake-caption text-rose-deep">{c.name}</p>
                    <h3 className="font-bake-display mt-2 text-[24px] font-medium leading-tight text-ivory md:text-[28px]">
                      <span dangerouslySetInnerHTML={{ __html: c.tagline }} />
                    </h3>
                    <p className="bake-body-sm mt-3 max-w-[36ch] text-cream-deep/85">
                      <span dangerouslySetInnerHTML={{ __html: c.blurb }} />
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 font-bake-body text-[14px] font-medium text-ivory">
                      <span>Shop the edit</span>
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ivory/40 transition-all duration-300 group-hover:translate-x-1 group-hover:border-ivory group-hover:bg-ivory group-hover:text-cocoa"
                      >
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
