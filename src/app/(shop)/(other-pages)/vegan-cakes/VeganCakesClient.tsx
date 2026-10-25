'use client'

import { CakeProductCard, type Product } from '@/components/HomePage/_shared'
import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { VEGAN_CAKE_FAQS } from '@/data/vegan-cakes-content'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const whyOrder = [
  {
    title: 'Baked to order',
    body: 'Made from scratch with no added preservatives. Vegan cakes need 3 days notice so we can bake for your date.',
  },
  {
    title: 'Dairy-free and egg-free',
    body: 'Our vegan range uses oat milk and plant butter. Confirm the flavour when you enquire so the cake matches your brief.',
  },
  {
    title: 'Melbourne Metro delivery',
    body: 'Weekday delivery only, 9am to 3pm. Order by 12 noon for next-weekday delivery. Fees typically $0 to $20, free on orders over $100.',
  },
  {
    title: 'Honest kitchen note',
    body: 'Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease.',
  },
] as const

const IMG = {
  hero: 'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944859/legacy-migrated/red-velvet-cake.webp',
  side: '/images/Best-Vegan-Cake-in-Melbourne-for-Birthday-Chocolate-Vegan-Cake.webp',
} as const

type ShowcaseProduct = Product & { isVegan?: boolean }

type Props = {
  products: ShowcaseProduct[]
}

export default function VeganCakesClient({ products }: Props) {
  const veganProducts = products.filter((p) => p.isVegan === true)

  return (
    <main className="bake-canvas">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[72vh] overflow-hidden md:min-h-[80vh]">
        <Image
          src={IMG.hero}
          alt="Vegan cakes Melbourne"
          title="Vegan cakes Melbourne"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-cream via-cream/90 to-cream/25 md:via-cream/75 md:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-cream via-transparent to-cream/30"
        />

        <div className="relative mx-auto flex min-h-[72vh] max-w-[1320px] items-end px-6 py-16 md:min-h-[80vh] md:items-center md:px-10 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-[720px]"
          >
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              dairy-free · egg-free · Melbourne Metro
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[12ch] leading-tight">Vegan Cakes</h1>
            <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
              Order vegan cakes in Melbourne for birthdays and celebrations. Dairy-free and
              egg-free whole cakes, made from scratch with no added preservatives, baked to order
              in Narre Warren and delivered across Melbourne Metro on weekdays. Made in a shared
              kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable
              for severe allergies or coeliac disease. For other dietary questions, please contact
              us before ordering.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="bake-btn bake-btn-rose">
                Enquire about a vegan cake
              </Link>
              <Link href="#how-to-order" className="bake-btn bake-btn-cream">
                How to order
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Whole cakes ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="bake-display-lg max-w-[22ch]">
                Vegan birthday cakes{' '}
                <span className="bake-display-italic text-rose-accent">baked to order</span>
              </h2>
              <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                <p>
                  This page is for whole vegan cakes: vegan birthday cakes, dairy free cakes
                  Melbourne customers order for celebrations, and plant-based sponges confirmed
                  before we bake. Cakes need 3 days notice. Tell us the date, suburb, servings and
                  flavour so we can confirm the cake for your day.
                </p>
                <p>
                  Looking for individual treats instead? We also offer{' '}
                  <Link
                    href="/vegan-cupcakes"
                    className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
                  >
                    vegan cupcakes delivered in Melbourne
                  </Link>
                  , made with oat milk and plant butter.
                </p>
                <p>
                  Email{' '}
                  <a
                    href="mailto:info@thecupcakedesire.com.au"
                    className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
                  >
                    info@thecupcakedesire.com.au
                  </a>{' '}
                  or call{' '}
                  <a
                    href="tel:+61397050051"
                    className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
                  >
                    03 9705 0051
                  </a>
                  .
                </p>
              </div>
              <Link href="/contact" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Send a cake enquiry
              </Link>
            </div>
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)]">
              <Image
                src={IMG.side}
                alt="Chocolate vegan cake for birthdays in Melbourne"
                title="Chocolate vegan cake for birthdays in Melbourne"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Inclusive cakes ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">
            Dairy free cakes Melbourne{' '}
            <span className="bake-display-italic text-rose-accent">guests can share</span>
          </h2>
          <div className="bake-body-lg mt-8 space-y-6 text-cocoa-soft">
            <p>
              More hosts ask for dairy-free and egg-free celebration cakes so everyone at the table
              can have a slice. Our vegan cakes use plant-based recipes with oat milk and plant
              butter, baked to order rather than adapted at the last minute from a butter cake.
            </p>
            <p>
              <strong>The Cupcake Desire</strong> bakes vegan cakes in Melbourne for birthdays,
              office celebrations and private events. Delivery covers Melbourne Metro only, on
              weekdays from 9am to 3pm.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Products (vegan-labelled only) ─── */}
      <section id="shop-vegan" className="scroll-mt-24 bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="max-w-[720px]">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Shop vegan cakes
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[22ch]">Vegan cakes to order</h2>
            <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
              <p>
                We only list products here when the product page itself marks them as vegan. Ready
                to order vegan cupcakes live on a separate page. Whole vegan cakes are confirmed by
                enquiry so the recipe, size and delivery date are clear before we bake.
              </p>
            </div>
          </div>

          {veganProducts.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-[880px]">
              {veganProducts.map((p, i) => (
                <CakeProductCard key={p._id} product={p} index={i} badge="Vegan" badgeTone="mint" />
              ))}
            </div>
          ) : (
            <div className="mt-12 max-w-[720px] rounded-2xl border border-line bg-ivory p-8">
              <h3 className="font-bake-display text-[22px] font-medium text-cocoa">
                Enquire for a vegan cake
              </h3>
              <p className="bake-body mt-4 text-cocoa-soft">
                Whole vegan cakes are baked to order with 3 days notice. Share your date, suburb,
                servings and flavour and we will confirm before baking.
              </p>
              <Link href="/contact" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Contact us
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Why order ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow text-center">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Why order with us
          </p>
          <h2 className="bake-display-lg mx-auto mt-6 max-w-[24ch] text-center">
            Why order vegan cakes from The Cupcake Desire
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {whyOrder.map((item, i) => (
              <div
                key={item.title}
                className="rounded-2xl border border-line bg-ivory p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
              >
                <p className="bake-caption text-taupe">0{i + 1}</p>
                <h3 className="font-bake-display mt-2 text-[20px] font-medium text-cocoa">
                  {item.title}
                </h3>
                <p className="bake-body-sm mt-3 text-cocoa-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How to order ─── */}
      <section id="how-to-order" className="scroll-mt-24 bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">
            How to order a vegan cake{' '}
            <span className="bake-display-italic text-rose-accent">online</span>
          </h2>
          <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
            <p>
              Send an enquiry with the occasion, cake size, flavour preference and delivery suburb.
              We confirm the vegan recipe and the weekday delivery window before you pay. Delivery
              is Melbourne Metro only, weekdays only, 9am to 3pm. Order by 12 noon for next-weekday
              delivery when the lead time allows. Cakes need 3 days notice.
            </p>
            <p>
              Delivery fees are typically $0 to $20 by suburb, with free delivery on orders over
              $100. We do not offer same-day or weekend delivery.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-cocoa py-16 text-ivory md:py-24">
        <div className="mx-auto max-w-[920px] px-6 text-center md:px-10">
          <h2 className="bake-display-lg text-ivory">
            Order vegan cakes{' '}
            <span className="bake-display-italic text-rose-accent">in Melbourne</span>
          </h2>
          <p className="bake-body-lg mx-auto mt-6 max-w-[62ch] text-ivory/80">
            Choose The Cupcake Desire for vegan cakes Melbourne hosts can serve with confidence:
            dairy-free, egg-free, made from scratch with no added preservatives, and delivered on
            weekdays across Melbourne Metro.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="bake-btn bake-btn-rose">
              Enquire now
            </Link>
            <a
              href="tel:+61397050051"
              className="bake-btn bake-btn-ghost border border-ivory/30 text-ivory"
            >
              03 9705 0051
            </a>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg">FAQs</h2>
          <FaqAccordionList
            className="mt-10"
            items={VEGAN_CAKE_FAQS.map((item, index) => ({
              _id: `vegan-faq-${index}`,
              question: item.question,
              answer: item.answer,
            }))}
          />
        </div>
      </section>
    </main>
  )
}
