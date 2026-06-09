'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

type TileSpec = {
  handle: string
  name: string
  tagline: string
  blurb: string
  count: string
  alt: string
  span: 'short' | 'wide'
}

// Marketing copy stays curated here, but every tile's IMAGE is read from the
// `Collection.image` field in MongoDB — admin can re-skin any tile by editing
// the collection record (no code change needed).
const TILES: TileSpec[] = [
  {
    handle: 'christmas-cupcakes',
    name: 'Christmas Cupcakes',
    tagline: 'December, hand-piped.',
    blurb:
      'Gingerbread, peppermint chocolate and snowy vanilla — boxes designed to land under the tree.',
    count: '4 boxes',
    alt: 'Christmas cupcake box',
    span: 'short',
  },
  {
    handle: 'mothers-day-cupcakes',
    name: 'Mother’s Day Cupcakes',
    tagline: 'Make her Sunday.',
    blurb:
      'Floral piped buttercream in soft pinks and creams — gift-boxed and ready for brunch.',
    count: '4 boxes',
    alt: 'Mother’s Day cupcake box',
    span: 'short',
  },
  {
    handle: 'fathers-day-cupcakes',
    name: 'Father’s Day Cupcakes',
    tagline: 'Better than a tie.',
    blurb:
      'Whisky caramel, salted chocolate and coffee-finished cupcakes for the dad who deserves more.',
    count: '4 boxes',
    alt: 'Father’s Day cupcake box',
    span: 'short',
  },
  {
    handle: 'anniversary-cupcakes',
    name: 'Anniversary Cupcakes',
    tagline: 'For the quiet milestones.',
    blurb:
      'Champagne buttercream, rose gold accents — a celebration when flowers feel too obvious.',
    count: '4 boxes',
    alt: 'Anniversary cupcake box',
    span: 'short',
  },
  {
    handle: 'valentines-day-cupcakes',
    name: 'Valentine’s Day Cupcakes',
    tagline: 'Say it in cupcake form.',
    blurb:
      'Rose petal, raspberry and dark chocolate cupcakes wrapped in a love-letter box. Delivered on the day, never before.',
    count: '5 boxes',
    alt: 'Valentine’s Day cupcake box',
    span: 'wide',
  },
]

interface CollectionsShowcaseProps {
  /** Map of collection handle → image URL pulled from the Collection.image field in MongoDB. */
  imagesByHandle?: Record<string, string>
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1200&q=80'

export default function CollectionsShowcase({ imagesByHandle = {} }: CollectionsShowcaseProps) {
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
          <Link href="/collections/all-items" className="bake-btn bake-btn-ghost bake-btn-sm">
            View every edit <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Clean tiling grid — 4 standard tiles + 1 wide hero tile that spans the last row. */}
        {/* 3 cols on lg / 2 cols on sm / 1 col on mobile — no empty cells at any breakpoint. */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {TILES.map((tile, i) => {
            const isWide = tile.span === 'wide'
            const colSpan = isWide ? 'sm:col-span-2 lg:col-span-2' : ''
            const aspect = isWide
              ? 'aspect-4/5 sm:aspect-16/9 lg:aspect-2/1'
              : 'aspect-4/5'
            const src = imagesByHandle[tile.handle] || FALLBACK_IMAGE

            return (
              <motion.div
                key={tile.handle}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: Math.min(i * 0.07, 0.3) }}
                className={colSpan}
              >
                <Link
                  href={`/collections/${tile.handle}`}
                  className="group bake-img-zoom relative block overflow-hidden rounded-2xl"
                >
                  {/* Image — pulled from Collection.image in MongoDB */}
                  <div className={`relative ${aspect} w-full overflow-hidden bg-cream-deep`}>
                    <Image
                      src={src}
                      alt={tile.alt}
                      fill
                      sizes={
                        isWide
                          ? '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw'
                          : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                      }
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-cocoa/75 via-cocoa/15 to-transparent" />

                  {/* Top-left count chip */}
                  <span className="bake-badge bake-badge-dark absolute left-5 top-5">
                    {tile.count}
                  </span>

                  {/* Bottom-left content */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                    <p className="bake-caption text-rose-deep">{tile.name}</p>
                    <h3 className="font-bake-display mt-2 text-[24px] font-medium leading-tight text-ivory md:text-[28px]">
                      {tile.tagline}
                    </h3>
                    <p className="bake-body-sm mt-3 max-w-[36ch] text-cream-deep/85">
                      {tile.blurb}
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
