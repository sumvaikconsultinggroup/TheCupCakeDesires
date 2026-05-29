'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import ImagePlaceholder from '../ImagePlaceholder'

const posts = [
  { tone: 'rose' as const, hint: 'Pistachio rose, top-down composition' },
  { tone: 'cream' as const, hint: 'Frosting macro shot' },
  { tone: 'mint' as const, hint: 'Eggless matcha cupcake' },
  { tone: 'beige' as const, hint: 'Customer photo — birthday box' },
  { tone: 'gold' as const, hint: 'Caramel drizzle in progress' },
  { tone: 'rose' as const, hint: 'Strawberries on tray' },
]

export default function InstagramGallery() {
  return (
    <section className="bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div>
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              From the kitchen
            </p>
            <h2 className="bake-display-lg mt-5">
              <span className="bake-display-italic text-rose-accent">@</span>cupcakedesires
            </h2>
            <p className="bake-body mt-4 max-w-[52ch]">
              Follow along for behind-the-scenes baking, new flavour drops, and the cupcakes we
              can&rsquo;t stop photographing.
            </p>
          </div>
          <Link
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bake-btn bake-btn-ghost bake-btn-sm"
          >
            Follow on Instagram <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {posts.map((p, i) => (
            <motion.a
              key={i}
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.24) }}
              className="group relative block overflow-hidden rounded-xl"
            >
              <ImagePlaceholder
                ratio="aspect-square"
                tone={p.tone}
                rounded="none"
                label="Instagram"
                hint={p.hint}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-cocoa/0 opacity-0 transition-all duration-300 group-hover:bg-cocoa/40 group-hover:opacity-100">
                <span className="font-bake-body text-[12px] font-semibold tracking-[0.16em] uppercase text-white">
                  View post
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
