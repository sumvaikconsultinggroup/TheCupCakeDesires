'use client'

import CardSwap, { Card } from '@/components/CardSwap'
import {
  CORPORATE_CAKE_SLICE_MIX_IMAGE,
  CORPORATE_ROUND_CAKE_IMAGE,
  MINI_CORPORATE_GALLERY,
  STANDARD_CORPORATE_GALLERY,
} from '@/lib/corporate-pages'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const PRODUCTS = [
  {
    href: '/corporate',
    index: '01',
    name: 'Corporate cupcakes',
    blurb:
      'Edible logos on standard boxes — Vanilla, Chocolate or Mix of Both. The range Melbourne offices come back to.',
    price: 'From $66 · box of 12',
    image: STANDARD_CORPORATE_GALLERY[1].src,
    alt: STANDARD_CORPORATE_GALLERY[1].alt,
    fit: 'cover' as const,
  },
  {
    href: '/corporate/mini',
    index: '02',
    name: 'Corporate minis',
    blurb:
      'One or two bites — no plates, no fuss. Branded minis for standing receptions and networking nights.',
    price: 'From $84 · 24 minis',
    image: MINI_CORPORATE_GALLERY[1].src,
    alt: MINI_CORPORATE_GALLERY[1].alt,
    fit: 'cover' as const,
  },
  {
    href: '/corporate/cake-slices',
    index: '03',
    name: 'Corporate cake slices',
    blurb:
      'Logo-topped slices in catering boxes. Pick a flavour, or Mix — every slice in the box.',
    price: 'From $48 · box of 12',
    image: CORPORATE_CAKE_SLICE_MIX_IMAGE.src,
    alt: CORPORATE_CAKE_SLICE_MIX_IMAGE.alt,
    fit: 'cover' as const,
  },
  {
    href: '/corporate/logo-cakes',
    index: '04',
    name: 'Corporate logo cakes',
    blurb: 'A full branded cake for the boardroom. Upload one logo — we print it on the cake.',
    highlight: 'The cake trim will be matched to your logo.',
    price: 'From $70 · 6, 8 or 10 inch',
    image: CORPORATE_ROUND_CAKE_IMAGE.src,
    alt: CORPORATE_ROUND_CAKE_IMAGE.alt,
    fit: 'contain' as const,
  },
] as const

export default function CorporateGiftingShowcase() {
  const router = useRouter()
  const [active, setActive] = useState(0)
  const product = PRODUCTS[active] ?? PRODUCTS[0]

  return (
    <section className="relative overflow-hidden bg-ivory text-cocoa">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-rose/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 h-80 w-80 rounded-full bg-rose-deep/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-rose/80 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[1320px] items-start gap-8 px-6 pb-28 pt-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-4 md:px-10 md:pb-36 md:pt-10 lg:gap-10">
        <div className="relative z-10 max-w-[520px]">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            Corporate gifting
          </p>
          <h2 className="bake-display-lg mt-5">
            Your logo.{' '}
            <span className="bake-display-italic text-rose-accent">Our kitchen.</span>
          </h2>
          <p className="bake-body mt-4">
            Four branded ranges — hover the stack, tap a card to shop.
          </p>

          <div className="mt-8 min-h-[170px]">
            <p className="bake-script">{product.index}</p>
            <h3 className="font-bake-display mt-1 text-[28px] font-medium leading-tight text-cocoa md:text-[32px]">
              {product.name}
            </h3>
            <p className="bake-body-sm mt-3 max-w-[42ch]">
              {product.blurb}
              {'highlight' in product && product.highlight ? (
                <>
                  {' '}
                  <span className="font-semibold italic text-rose-accent">{product.highlight}</span>
                </>
              ) : null}
            </p>
            <p className="bake-caption mt-4">{product.price}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={product.href} className="bake-btn bake-btn-rose bake-btn-sm">
              Shop this range <span aria-hidden>→</span>
            </Link>
            <Link href="/corporate" className="bake-btn bake-btn-ghost bake-btn-sm">
              All corporate
            </Link>
          </div>
        </div>

        <div className="relative h-[460px] w-full pb-16 md:h-[600px] md:pb-24 lg:h-[680px]">
          <CardSwap
            width={420}
            height={460}
            cardDistance={48}
            verticalDistance={56}
            delay={2400}
            pauseOnHover
            skewAmount={4}
            easing="linear"
            className="right-[6%] bottom-8"
            onSwap={setActive}
            onCardClick={(idx) => router.push(PRODUCTS[idx].href)}
          >
            {PRODUCTS.map((item) => (
              <Card
                key={item.href}
                customClass={`overflow-hidden border-ivory/50 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.55)] ${
                  item.fit === 'contain' ? '!bg-white' : '!bg-cream-deep'
                }`}
              >
                <div className="relative h-full w-full cursor-pointer">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="420px"
                    className={item.fit === 'contain' ? 'object-contain p-8' : 'object-cover'}
                  />
                  {item.fit === 'cover' ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-cocoa/90 via-cocoa/30 to-transparent px-5 pb-5 pt-16">
                      <p className="font-bake-display text-[20px] text-ivory">{item.name}</p>
                    </div>
                  ) : (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5">
                      <p className="font-bake-display text-[20px] text-cocoa">{item.name}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </CardSwap>
        </div>
      </div>
    </section>
  )
}
