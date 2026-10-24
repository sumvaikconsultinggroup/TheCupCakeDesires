import JsonLd from '@/components/SE0/JsonLd'
import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
import Image from 'next/image'
import Link from 'next/link'

const SHARED_KITCHEN_LINE =
  'Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so our products are not suitable for anyone with a severe allergy. For other dietary questions, please contact us before ordering.'

const faqs = [
  {
    question: 'Do you offer a nut-free range?',
    answer:
      'No. We do not offer a nut-free range and we cannot guarantee that any item is free of nuts. ' +
      SHARED_KITCHEN_LINE,
  },
  {
    question: 'Is your kitchen dedicated nut-free?',
    answer: `No. ${SHARED_KITCHEN_LINE}`,
  },
  {
    question: 'Do some flavours contain nuts?',
    answer:
      'Yes. Some flavours contain nuts as an ingredient, for example hazelnut. Other flavours do not use nuts as an ingredient, but cross-contact is still possible because everything is made in the same kitchen.',
  },
  {
    question: 'Can someone with a severe nut allergy order from you?',
    answer:
      'No. Our products are not suitable for anyone with a severe allergy. Please choose a bakery that can meet that requirement, or contact us if you have a milder dietary question before ordering.',
  },
  {
    question: 'Where can I read more about allergens?',
    answer:
      'See our allergen information page for the main allergens we handle, then contact us before ordering if you have a specific dietary question.',
  },
] as const

export default function NutFreeCakesPage() {
  const faqSchema = generateFAQSchema([...faqs])
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Nut allergies and our cakes', url: `${siteConfig.url}/nut-free-cakes` },
  ])

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />

      <main className="bake-canvas">
        {/* ─── Hero ─── */}
        <section className="relative min-h-[72vh] overflow-hidden md:min-h-[80vh]">
          <Image
            src="/images/nut-free-cake-1.webp"
            alt="Cakes and cupcakes baked in Melbourne by The Cupcake Desire"
            title="Cakes and cupcakes baked in Melbourne by The Cupcake Desire"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-r from-cream via-cream/90 to-cream/30 md:via-cream/75 md:to-transparent"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-cream via-transparent to-cream/30"
          />

          <div className="relative mx-auto flex min-h-[72vh] max-w-[1320px] items-end px-6 py-16 md:min-h-[80vh] md:items-center md:px-10 md:py-24">
            <div className="max-w-[720px]">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
                Allergen information · Melbourne
              </p>
              <h1 className="bake-display-xl mt-6 max-w-[18ch] leading-tight">
                Nut allergies and our cupcakes
              </h1>
              <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
                We do not offer a nut-free range and we cannot guarantee that any item is free of
                nuts. Everything is made in a shared kitchen that also handles nuts, gluten, dairy,
                eggs, soy and sesame, so our products are not suitable for anyone with a severe
                allergy.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/allergen-info" className="bake-btn bake-btn-rose">
                  Allergen information
                </Link>
                <Link href="/contact" className="bake-btn bake-btn-cream">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Answer first ─── */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[920px] px-6 md:px-10">
            <h2 className="bake-display-lg max-w-[24ch]">
              What this means{' '}
              <span className="bake-display-italic text-rose-accent">before you order</span>
            </h2>
            <div className="bake-body-lg mt-8 space-y-6 text-cocoa-soft">
              <p>
                Some flavours contain nuts as an ingredient, for example hazelnut. Other flavours do
                not use nuts as an ingredient, but cross-contact is still possible because everything
                is baked and finished in the same kitchen.
              </p>
              <p>
                If you or a guest has a severe nut allergy, please do not order from us. If you have
                a milder dietary question, contact us before ordering so we can talk through the
                flavours and how we bake.
              </p>
              <p>
                Full allergen notes live on our{' '}
                <Link
                  href="/allergen-info"
                  className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                >
                  allergen information
                </Link>{' '}
                page. You can also email{' '}
                <a
                  href="mailto:info@thecupcakedesire.com.au"
                  className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                >
                  info@thecupcakedesire.com.au
                </a>{' '}
                or call{' '}
                <a
                  href="tel:+61397050051"
                  className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                >
                  03 9705 0051
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ─── Shared kitchen ─── */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="bake-display-lg max-w-[22ch]">
                  One kitchen,{' '}
                  <span className="bake-display-italic text-rose-accent">honest limits</span>
                </h2>
                <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                  <p>
                    We bake to order in Narre Warren and deliver across Melbourne Metro on weekdays
                    only, 9am to 3pm. Order by noon for next-weekday delivery. Fees are typically $0
                    to $20, with free delivery over $100. Cakes need 3 days&rsquo; notice.
                  </p>
                  <p>
                    Our cupcakes and cakes are made from scratch with no added preservatives. That
                    care does not change the shared-kitchen reality: we cannot claim any product is
                    nut-free.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/collections/all-items" className="bake-btn bake-btn-rose">
                    Browse the shop
                  </Link>
                  <Link href="/allergen-info" className="bake-btn bake-btn-cream">
                    Allergen information
                  </Link>
                </div>
              </div>
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)]">
                <Image
                  src="/images/nut-free-cake-2.webp"
                  alt="Celebration cake from The Cupcake Desire"
                  title="Celebration cake from The Cupcake Desire"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Next steps ─── */}
        <section className="bg-cocoa py-16 text-ivory md:py-24">
          <div className="mx-auto max-w-[920px] px-6 text-center md:px-10">
            <h2 className="bake-display-lg text-ivory">
              Still shopping?{' '}
              <span className="bake-display-italic text-rose-accent">Read allergens first</span>
            </h2>
            <p className="bake-body-lg mx-auto mt-6 max-w-[62ch] text-ivory/80">
              If nut allergies are not a concern for your order, you are welcome to browse our shop.
              If they are, please use the allergen page and contact us before you place anything in
              the cart.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/allergen-info" className="bake-btn bake-btn-rose">
                Allergen information
              </Link>
              <Link href="/collections/all-items" className="bake-btn bake-btn-cream">
                Shop
              </Link>
              <Link href="/contact" className="bake-btn bake-btn-ghost border border-ivory/30 text-ivory">
                Contact us
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[920px] px-6 md:px-10">
            <h2 className="bake-display-lg">FAQs</h2>
            <FaqAccordionList
              className="mt-10"
              items={faqs.map((item, index) => ({
                _id: `nut-allergy-faq-${index}`,
                question: item.question,
                answer: item.answer,
              }))}
            />
          </div>
        </section>
      </main>
    </>
  )
}
