'use client'

import type { ResolvedShowcaseSection } from '@/lib/homepage-sections-defaults'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface CollectionsShowcaseProps {
  section: ResolvedShowcaseSection
}

export default function CollectionsShowcase({ section }: CollectionsShowcaseProps) {
  return (
    <section className="relative bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:mb-20 md:flex-row md:items-end">
          <div className="max-w-[58ch]">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              {section.eyebrow}
            </p>
            <h2 className="bake-display-lg mt-5">
              {section.title}{' '}
              <span className="bake-display-italic text-rose-accent">{section.titleAccent}</span>
            </h2>
            {section.description ? (
              <p className="bake-body mt-4 max-w-[52ch]">{section.description}</p>
            ) : null}
          </div>
          <Link href={section.ctaHref} className="bake-btn bake-btn-ghost bake-btn-sm">
            {section.ctaLabel} <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {section.tiles.map((tile, i) => {
            const isWide = tile.span === 'wide'
            const colSpan = isWide ? 'sm:col-span-2 lg:col-span-2' : ''
            const aspect = isWide
              ? 'aspect-4/5 sm:aspect-16/9 lg:aspect-2/1'
              : 'aspect-4/5'

            return (
              <motion.div
                key={`${tile.handle}-${i}`}
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
                  <div className={`relative ${aspect} w-full overflow-hidden bg-cream-deep`}>
                    <Image
                      src={tile.image}
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

                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-cocoa/75 via-cocoa/15 to-transparent" />

                  <span className="bake-badge bake-badge-dark absolute left-5 top-5">
                    {tile.badge}
                  </span>

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
