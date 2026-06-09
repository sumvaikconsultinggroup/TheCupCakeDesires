'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const PROFILE_URL = 'https://www.instagram.com/thecupcakedesire/'

// Real post URLs paired with a representative thumbnail from the bakery's own
// product photography. Instagram doesn't expose post images without an API
// token, so we proxy each tile with a brand-accurate bakery photo.
const posts: { href: string; image: string; alt: string }[] = [
  {
    href: 'https://www.instagram.com/p/DZLdHDyzZCE/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Anniversary-1.jpg',
    alt: 'Anniversary cupcakes',
  },
  {
    href: 'https://www.instagram.com/p/DZG2QPFTSkg/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Valentines-day.jpg',
    alt: "Valentine's Day cupcakes",
  },
  {
    href: 'https://www.instagram.com/p/DYyOV90TpnX/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Happy-Birthday.jpg',
    alt: 'Birthday cupcakes',
  },
  {
    href: 'https://www.instagram.com/p/DYsmBXQTLE1/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Salted-Caramel.jpg',
    alt: 'Salted caramel macarons',
  },
  {
    href: 'https://www.instagram.com/p/DYeFsUKsU7B/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Easter-2.jpg',
    alt: 'Easter cupcakes',
  },
  {
    href: 'https://www.instagram.com/p/DX8CoGizXFa/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Mothers-day.jpg',
    alt: "Mother's Day cupcakes",
  },
  {
    href: 'https://www.instagram.com/p/DX5qBt6k-L7/',
    image: 'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Christmas.jpg',
    alt: 'Christmas cupcakes',
  },
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
              <span className="bake-display-italic text-rose-accent">@</span>thecupcakedesire
            </h2>
            <p className="bake-body mt-4 max-w-[52ch]">
              Follow along for behind-the-scenes baking, new flavour drops, and the cupcakes we
              can&rsquo;t stop photographing.
            </p>
          </div>
          <Link
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bake-btn bake-btn-ghost bake-btn-sm"
          >
            Follow on Instagram <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-7">
          {posts.map((p, i) => (
            <motion.a
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.24) }}
              className="group relative block overflow-hidden rounded-xl bg-cream-deep"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 14vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-cocoa/0 opacity-0 transition-all duration-300 group-hover:bg-cocoa/45 group-hover:opacity-100">
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
