'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import ImagePlaceholder from '../ImagePlaceholder'

type Tile = {
  title: string
  blurb: string
  href: string
  tone: 'cream' | 'rose' | 'mint' | 'beige' | 'gold'
  hint: string
}

const tiles: Tile[] = [
  {
    title: 'Classic Cupcakes',
    blurb: 'Vanilla bean, chocolate fudge, red velvet.',
    href: '/collections/classics',
    tone: 'cream',
    hint: 'Three classic cupcakes on white linen',
  },
  {
    title: 'Signature Flavours',
    blurb: 'Pistachio rose, salted caramel, brown butter banana.',
    href: '/collections/signatures',
    tone: 'rose',
    hint: 'Pistachio rose cupcake macro shot',
  },
  {
    title: 'Eggless Edition',
    blurb: 'Every flavour, without the egg.',
    href: '/collections/eggless',
    tone: 'mint',
    hint: 'Eggless cupcakes flat-lay with greenery',
  },
  {
    title: 'Vegan Bakes',
    blurb: 'Oat milk, plant butter, real chocolate.',
    href: '/collections/vegan',
    tone: 'beige',
    hint: 'Vegan cupcakes with botanical styling',
  },
  {
    title: 'Mini Cupcakes',
    blurb: 'Bite-sized, party-perfect.',
    href: '/collections/minis',
    tone: 'gold',
    hint: 'Tray of mini cupcakes overhead',
  },
  {
    title: 'Gift Boxes',
    blurb: 'Six, twelve, twenty-four — ribbon-wrapped.',
    href: '/combos',
    tone: 'cream',
    hint: 'Gift box of twelve with ribbon detail',
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
          <Link href="/collections/all" className="bake-btn bake-btn-ghost bake-btn-sm">
            View entire menu <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: Math.min(i * 0.06, 0.3) }}
            >
              <Link href={tile.href} className="bake-card bake-img-zoom group block">
                <ImagePlaceholder
                  ratio="aspect-[4/5]"
                  tone={tile.tone}
                  rounded="none"
                  label="Category image"
                  hint={tile.hint}
                />
                <div className="flex items-start justify-between gap-4 p-6">
                  <div>
                    <h3 className="font-bake-display text-[22px] font-medium text-cocoa">
                      {tile.title}
                    </h3>
                    <p className="bake-body-sm mt-1">{tile.blurb}</p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-cocoa transition-all group-hover:border-rose-accent group-hover:bg-rose-accent group-hover:text-white"
                  >
                    →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
