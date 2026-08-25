'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const miniFeatures = [
  {
    title: 'Baked to order',
    body: 'Every box is hand-frosted with soft buttercream — please allow 2 days.',
  },
  {
    title: 'Real ingredients',
    body: 'Madagascar vanilla, Belgian chocolate, farm butter.',
  },
  {
    title: 'Made for events',
    body: 'Weddings, birthdays, corporate gifting — custom flavours and packaging.',
  },
]

export default function TrustStrip() {
  return (
    <section className="relative bg-ivory py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-14 lg:gap-20">
          {/* ─── LEFT: Image + floating credentials ─── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative md:col-span-5"
          >
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl bg-cream-deep">
              <Image
                src="/images/Banner-2.webp"
                alt="Inside The Cupcake Desire kitchen"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
              {/* Subtle gradient for the floating chip legibility */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-t from-cocoa/40 via-transparent to-transparent"
              />
            </div>

            {/* Floating "Est." card — top right */}
            <div className="absolute -top-5 -right-5 hidden rounded-2xl border border-line bg-ivory px-6 py-5 shadow-[0_18px_40px_-18px_rgba(46,31,21,0.25)] md:block">
              <p className="bake-caption text-taupe">Est.</p>
              <p
                className="font-bake-display mt-1 text-[40px] leading-none font-medium text-cocoa"
                style={{ letterSpacing: '-0.02em' }}
              >
                2012
              </p>
              <p className="font-bake-script mt-2 text-[20px] leading-none text-rose-accent">
                Narre Warren, Melbourne
              </p>
            </div>

            {/* Floating tag — bottom left */}
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-full border border-line bg-ivory px-5 py-3 shadow-[0_14px_30px_-14px_rgba(46,31,21,0.25)] md:flex">
              <span className="flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-rose-accent opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-rose-accent" />
              </span>
              <p className="bake-caption text-cocoa">Booking 2 days ahead</p>
            </div>
          </motion.div>

          {/* ─── RIGHT: Editorial content ─── */}
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bake-eyebrow"
            >
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              From our kitchen
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="bake-display-lg mt-5 max-w-[20ch]"
            >
              Small batches.{' '}
              <span className="bake-display-italic text-rose-accent">Big care.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bake-body-lg mt-6 max-w-[58ch]"
            >
              Six years on, we&rsquo;re still the same tiny Narre Warren bakery that started in 200 sq.ft.
              behind a bookshop. Every cupcake is hand-frosted with soft buttercream — never
              before.
            </motion.p>

            {/* Editorial pull-quote */}
            <motion.figure
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 border-l-2 border-rose-accent pl-6"
            >
              <blockquote
                className="font-bake-display italic text-cocoa"
                style={{
                  fontSize: 'clamp(20px, 2.2vw, 26px)',
                  lineHeight: 1.4,
                  fontWeight: 400,
                }}
              >
                &ldquo;We&rsquo;re not trying to scale &mdash; we&rsquo;re trying to be the bakery
                your friend recommends.&rdquo;
              </blockquote>
              <figcaption className="bake-caption mt-4 text-taupe">
                — Rupal, founder &amp; head baker
              </figcaption>
            </motion.figure>

            {/* Mini features — 3 across */}
            <motion.ul
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-10 grid grid-cols-1 gap-5 border-t border-line pt-8 sm:grid-cols-3 sm:gap-6"
            >
              {miniFeatures.map((f, i) => (
                <li key={f.title} className="relative">
                  <p className="bake-caption text-rose-accent">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="font-bake-display mt-2 text-[18px] font-medium text-cocoa">
                    {f.title}
                  </h3>
                  <p className="bake-body-sm mt-1">{f.body}</p>
                </li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link href="/about-us" className="bake-btn">
                Read our story <span aria-hidden>→</span>
              </Link>
              <Link
                href="/collections/all"
                className="font-bake-body text-[14px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
              >
                Shop today&rsquo;s batch
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
