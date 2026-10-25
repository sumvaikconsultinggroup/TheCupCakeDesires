'use client'

import { CakeProductCard, type Product } from '@/components/HomePage/_shared'
import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { VEGAN_CAKE_FAQS } from '@/data/vegan-cakes-content'
import Image from 'next/image'
import Link from 'next/link'

const IMG = {
  hero: 'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944859/legacy-migrated/red-velvet-cake.webp',
} as const

type ShowcaseProduct = Product & { isVegan?: boolean }

type Props = {
  products: ShowcaseProduct[]
}

export default function VeganCakesClient({ products }: Props) {
  const veganProducts = products.filter((p) => p.isVegan === true)

  return (
    <main className="bake-canvas">
      {/* Hero: visible on first paint (no opacity-0 entrance). */}
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
          <div className="max-w-[720px]">
            <h1 className="bake-display-xl max-w-[18ch] leading-tight">
              Vegan cakes, made to order in Melbourne
            </h1>
            <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
              Vegan whole cakes are made to order on enquiry for birthdays and celebrations, baked
              in our Narre Warren kitchen and delivered on weekdays across Melbourne Metro. Tell us
              your date, suburb, servings and flavour, and we will confirm the cake before we bake.
              Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs,
              soy and sesame, so it is not suitable for severe allergies or coeliac disease.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="bake-btn bake-btn-rose">
                Enquire about a vegan cake
              </Link>
              <a href="tel:+61397050051" className="bake-btn bake-btn-cream">
                03 9705 0051
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="how-to-order" className="scroll-mt-24 bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">How to order a vegan cake</h2>
          <p className="bake-body mt-6 text-cocoa-soft">
            Vegan whole cakes are not sold through the online shop, so every vegan cake starts with
            an enquiry. Send us the occasion, your delivery date and suburb, how many people you are
            serving and the flavour you would like. We confirm the recipe, size and delivery date
            with you before baking. Cakes need 3 days&apos; notice, so enquire as early as you can.
          </p>
        </div>
      </section>

      {/* Grid from #97: vegan-labelled cakes only (cupcakes excluded server-side). */}
      <section id="shop-vegan" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          {veganProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-[880px]">
              {veganProducts.map((p, i) => (
                <CakeProductCard key={p._id} product={p} index={i} badge="Vegan" badgeTone="mint" />
              ))}
            </div>
          ) : (
            <div className="max-w-[720px] rounded-2xl border border-line bg-ivory p-8">
              <h2 className="font-bake-display text-[22px] font-medium text-cocoa">
                Looking for a vegan cake?
              </h2>
              <p className="bake-body mt-4 text-cocoa-soft">Cakes need 3 days&apos; notice.</p>
              <Link href="/contact" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Enquire for a vegan cake
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">Vegan cake delivery in Melbourne</h2>
          <p className="bake-body mt-6 text-cocoa-soft">
            We are an online bakery kitchen with no walk-in store. We hand deliver across Melbourne
            Metro on weekdays only, with no weekend or public-holiday delivery. For a Saturday
            celebration, ask for Friday delivery when you enquire.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">Looking for vegan cupcakes instead?</h2>
          <p className="bake-body mt-6 text-cocoa-soft">
            If individual treats suit your table better, our{' '}
            <Link
              href="/vegan-cupcakes"
              className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
            >
              vegan cupcakes
            </Link>{' '}
            can be ordered online and delivered across Melbourne Metro.
          </p>
        </div>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg">Vegan cake questions</h2>
          <FaqAccordionList
            className="mt-10"
            items={VEGAN_CAKE_FAQS.map((item, index) => ({
              _id: `vegan-faq-${index}`,
              question: item.question,
              answer: item.answer,
            }))}
          />
          <p className="bake-body mt-10 text-cocoa-soft">
            Ready to plan your cake?{' '}
            <Link
              href="/contact"
              className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
            >
              Enquire about a vegan cake
            </Link>{' '}
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
      </section>
    </main>
  )
}
