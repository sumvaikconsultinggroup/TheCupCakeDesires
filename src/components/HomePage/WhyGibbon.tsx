'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const PRIMARY_IMAGE = '/images/AboutUs.webp'

/* ─── Refined feature icons ─── */
const IconOven = (p: any) => (
  <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="5" y="6" width="26" height="24" rx="2.5" />
    <path d="M5 13 L 31 13" />
    <circle cx="11" cy="9.5" r="1" fill="currentColor" />
    <circle cx="16" cy="9.5" r="1" fill="currentColor" />
    <rect x="9" y="17" width="18" height="10" rx="1.5" />
    <circle cx="18" cy="22" r="2.5" />
  </svg>
)
const IconLeaf = (p: any) => (
  <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M30 6 C 16 6, 8 14, 8 24 C 8 28, 12 30, 16 28 C 24 24, 30 16, 30 6 Z" />
    <path d="M8 24 L 4 32" />
  </svg>
)
const IconClock = (p: any) => (
  <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="18" cy="18" r="13" />
    <path d="M18 9 L 18 18 L 25 22" />
    <path d="M18 3 L 18 5 M 33 18 L 31 18 M 18 33 L 18 31 M 3 18 L 5 18" />
  </svg>
)
const IconRibbon = (p: any) => (
  <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 14 L 18 4 L 31 14 L 31 30 L 5 30 Z" />
    <path d="M18 4 L 18 22" />
    <path d="M14 22 L 22 22" />
    <path d="M14 22 L 10 30 M 22 22 L 26 30" />
  </svg>
)

const features = [
  {
    Icon: IconOven,
    title: 'Baked Fresh Daily',
    body: 'Every cupcake leaves our kitchen within four hours of being frosted. No freezer, no day-olds.',
  },
  {
    Icon: IconLeaf,
    title: 'Honest Ingredients',
    body: 'Madagascar vanilla, Belgian chocolate, farm butter, free-range eggs — sourced thoughtfully.',
  },
  {
    Icon: IconClock,
    title: 'Baked to Order',
    body: 'Every box is frosted with soft buttercream — please allow 2 days’ notice. Custom event orders take a little longer.',
  },
  {
    Icon: IconRibbon,
    title: 'Crafted For Gifting',
    body: 'Ribbon-wrapped kraft boxes, hand-written notes, sustainable packaging — gift-ready always.',
  },
]

const credentials = [
  { n: '50,000+', l: 'Happy customers' },
  { n: '42k', l: 'Boxes baked / year' },
  { n: '4.9 / 5', l: 'Google rating' },
  { n: 'FSANZ', l: 'Certified kitchen' },
]

export default function OurStory() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        {/* ─── TOP SPLIT: image collage + intro copy ─── */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 lg:gap-20">
          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative md:col-span-6"
          >
            {/* Primary tall image */}
            <div className="relative ml-0 md:ml-12">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-cream-deep">
                <Image
                  src={PRIMARY_IMAGE}
                  alt="Founder at work in the Cupcake Desire kitchen, soft natural light"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Est. card — top right offset */}
            <div className="absolute -top-4 -right-2 hidden md:block">
              <div className="rounded-2xl border border-line bg-ivory px-6 py-5 shadow-[0_18px_40px_-18px_rgba(46,31,21,0.18)]">
                <p className="bake-caption text-taupe">Est.</p>
                <p className="font-bake-display mt-1 text-[44px] leading-none font-medium text-cocoa">
                  2012
                </p>
                <p className="bake-script mt-2 text-[20px] leading-none text-rose-accent">Narre Warren, Melbourne</p>
              </div>
            </div>
          </motion.div>

          {/* Intro copy */}
          <div className="flex flex-col justify-center md:col-span-6">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Why people love us
            </p>
            <h2 className="bake-display-lg mt-5">
              A small bakery,
              <br />
              <span className="bake-display-italic text-rose-accent">made with intention.</span>
            </h2>
            <p className="bake-body-lg mt-6 max-w-[55ch]">
              We started in a 200 sq.ft. kitchen behind an old bookshop. We&rsquo;ve never wanted to be a
              factory &mdash; just the bakery your friend recommends. Six years on, that&rsquo;s still the only
              brief.
            </p>

            {/* Inline pull-quote */}
            <figure className="mt-8 border-l-2 border-rose-accent pl-6">
              <blockquote className="font-bake-display text-[22px] italic leading-snug text-cocoa md:text-[24px]">
                &ldquo;We&rsquo;re not trying to scale &mdash; we&rsquo;re trying to be the bakery your friend recommends.&rdquo;
              </blockquote>
              <figcaption className="bake-caption mt-3 text-taupe">
                — Rupal, founder &amp; head baker
              </figcaption>
            </figure>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/about-us" className="bake-btn">
                Read our full story <span aria-hidden>→</span>
              </Link>
              <Link
                href="/contact"
                className="font-bake-body text-[14px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent hover:text-cocoa"
              >
                Plan a custom event
              </Link>
            </div>
          </div>
        </div>

        {/* ─── MIDDLE: 4-up feature grid ─── */}
        <div className="mt-24 md:mt-32">
          <div className="mb-12 text-center">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              The Cupcake Desire promise
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h3 className="bake-display-md mt-4 max-w-[44ch] mx-auto font-medium">
              Four things we won&rsquo;t compromise on,{' '}
              <span className="bake-display-italic text-rose-accent">ever.</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {features.map((f, i) => {
              const Icon = f.Icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-8 transition-all duration-300 hover:border-rose-accent hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
                >
                  {/* Number watermark */}
                  <span
                    aria-hidden
                    className="font-bake-display absolute -right-2 -bottom-6 text-[120px] leading-none font-medium text-rose/40 transition-colors group-hover:text-rose-deep/60"
                  >
                    0{i + 1}
                  </span>

                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-line text-cocoa transition-colors group-hover:border-rose-accent group-hover:bg-rose-accent group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h4 className="font-bake-display relative mt-6 text-[20px] font-medium text-cocoa">
                    {f.title}
                  </h4>
                  <p className="bake-body-sm relative mt-3 leading-relaxed">{f.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ─── BOTTOM: credentials / stats strip ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 grid grid-cols-2 gap-x-6 gap-y-10 rounded-2xl border border-line bg-ivory px-8 py-10 md:mt-24 md:grid-cols-4 md:gap-12 md:px-12 md:py-12"
        >
          {credentials.map((c) => (
            <div key={c.l} className="text-center">
              <p className="font-bake-display text-[32px] font-medium text-cocoa md:text-[40px]">
                {c.n}
              </p>
              <p className="bake-caption mt-2 text-taupe">{c.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
