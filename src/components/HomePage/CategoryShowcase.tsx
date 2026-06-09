'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

type Tile = {
  title: string
  blurb: string
  href: string
  badge: string
  image: string
  alt: string
}

const tiles: Tile[] = [
  {
    title: 'Bestsellers',
    blurb: 'The boxes Melbourne keeps coming back for — hand-frosted, gift-ready.',
    href: '/collections/bestsellers',
    badge: 'Most loved · 8 boxes',
    image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1000&q=80',
    alt: 'Hand-frosted cupcakes',
  },
  {
    title: 'Round Cakes',
    blurb: 'Six-inch and eight-inch layered cakes — baked the morning of delivery.',
    href: '/collections/cakes',
    badge: 'Eight flavours',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1000&q=80',
    alt: 'Salted caramel layered round cake',
  },
  {
    title: 'Birthday Boxes',
    blurb: 'Bright sprinkles, candy toppers and birthday-sized smiles — our most-ordered themed box.',
    href: '/collections/birthday-cupcakes',
    badge: 'For the big day',
    image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1000&q=80',
    alt: 'Birthday cupcake box with toppers',
  },
  {
    title: 'Wedding Cupcakes',
    blurb: 'Tiered towers and bridal-shower boxes — custom colours, your flavour combo.',
    href: '/collections/wedding-cupcakes',
    badge: 'Custom & elegant',
    image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1000&q=80',
    alt: 'Wedding cake with floral styling',
  },
  {
    title: 'Deluxe Cupcakes',
    blurb: 'Premium flavours, bigger swirls, finished with ganache, brittle and gold leaf.',
    href: '/collections/deluxe-cupcakes',
    badge: 'Signature range',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1000&q=80',
    alt: 'Deluxe cupcakes with ganache and gold leaf',
  },
  {
    title: 'Macarons',
    blurb: 'Almond-meal shells with silky ganache centres — sold by the box of 12.',
    href: '/collections/macarons',
    badge: 'Box of 12',
    image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=1000&q=80',
    alt: 'Almond-meal macarons in a gift box',
  },
]

export default function CategoryShowcase() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* Heading */}
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:mb-20 md:flex-row md:items-end">
          <div className="max-w-[52ch]">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Shop the collection
            </p>
            <h2 className="bake-display-lg mt-5">
              Browse our <span className="bake-display-italic text-rose-accent">favourite</span> places
              to begin.
            </h2>
          </div>
          <Link href="/collections/all-items" className="bake-btn bake-btn-ghost bake-btn-sm">
            View entire menu <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Grid — image-led tiles with dark gradient overlay, matching the section above */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: Math.min(i * 0.06, 0.3) }}
            >
              <Link
                href={tile.href}
                className="group bake-img-zoom relative block overflow-hidden rounded-2xl"
              >
                {/* Image */}
                <div className="relative aspect-4/5 w-full overflow-hidden bg-cream-deep">
                  <Image
                    src={tile.image}
                    alt={tile.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Gradient overlay */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-cocoa/80 via-cocoa/20 to-transparent" />

                {/* Top-left badge */}
                <span className="bake-badge bake-badge-dark absolute left-5 top-5">
                  {tile.badge}
                </span>

                {/* Bottom-left content */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                  <p className="bake-caption text-rose-deep">{tile.title}</p>
                  <h3 className="font-bake-display mt-2 text-[22px] font-medium leading-tight text-ivory md:text-[26px]">
                    {tile.title}
                  </h3>
                  <p className="bake-body-sm mt-2 max-w-[34ch] text-cream-deep/85">
                    {tile.blurb}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 font-bake-body text-[14px] font-medium text-ivory">
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
          ))}
        </div>
      </div>
    </section>
  )
}
