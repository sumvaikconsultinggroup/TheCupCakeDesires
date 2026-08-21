'use client'

import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { CakeProductCard, type Product } from '@/components/HomePage/_shared'
import {
  GLUTEN_FREE_CUSTOM_OPTIONS,
  GLUTEN_FREE_DIETARY,
  GLUTEN_FREE_FAQS,
  GLUTEN_FREE_FLAVOURS,
  GLUTEN_FREE_INGREDIENTS,
  GLUTEN_FREE_OCCASIONS,
  GLUTEN_FREE_ORDER_STEPS,
  GLUTEN_FREE_SAFETY,
  GLUTEN_FREE_WHY,
  GLUTEN_FREE_WHY_CHOOSE_US,
} from '@/data/gluten-free-cupcakes-content'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  products: Product[]
}

export default function GlutenFreeCupcakesClient({ products }: Props) {
  return (
    <main className="bake-canvas">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[78vh] overflow-hidden md:min-h-[88vh]">
        <Image
          src="/images/gluten-free-cupcakes-1.webp"
          alt="Fresh gluten-free cupcakes in Melbourne"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-cream via-cream/92 to-cream/20 md:via-cream/78 md:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-cream via-transparent to-cream/35"
        />

        <div className="relative mx-auto flex min-h-[78vh] max-w-[1320px] items-end px-6 py-16 md:min-h-[88vh] md:items-center md:px-10 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-[760px]"
          >
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Coeliac-conscious · Melbourne
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[20ch] leading-[1.05]">
              Gluten-free cupcakes in Melbourne
            </h1>
            <p className="bake-body-lg mt-6 max-w-[52ch] text-cocoa-soft">
              Celiac-friendly, baked to order, and fully customisable for birthdays, events &amp;
              corporate gifting.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#shop-gluten-free" className="bake-btn bake-btn-rose">
                Order gluten-free cupcakes
              </Link>
              <Link href="/contact" className="bake-btn bake-btn-cream">
                Request a quote
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Intro ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="bake-display-lg max-w-[22ch]">
                Fresh gluten-free cupcakes{' '}
                <span className="bake-display-italic text-rose-accent">in Melbourne</span>
              </h2>
              <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                <p>
                  Finding safe and delicious gluten-free cupcakes in Melbourne shouldn&rsquo;t feel
                  risky, especially if you or your loved ones live with gluten intolerance or
                  coeliac disease.
                </p>
                <p>
                  At <em>The Cupcake Desire</em>, we specialise in handcrafted cupcakes prepared with
                  carefully selected gluten-free ingredients and strict baking practices. Every batch
                  is baked fresh to order, beautifully decorated, and suitable for birthdays, baby
                  showers, weddings, corporate events, and everyday treats.
                </p>
                <p>
                  Whether you need <strong>gluten and dairy-free cupcakes</strong>,{' '}
                  <strong>vegan and gluten free cupcakes</strong>, or fully customised themed
                  cupcakes, we make indulgence safe again.
                </p>
                <p>
                  To get started simply send your image and we will print it on the cupcakes for you.
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
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#shop-gluten-free" className="bake-btn bake-btn-rose">
                  Shop now
                </Link>
                <Link href="/shipping-policy" className="bake-btn bake-btn-cream">
                  Delivery info
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_28px_70px_-32px_rgba(46,31,21,0.4)]">
                <Image
                  src="/images/gluten-free-cupcakes-2.webp"
                  alt="Handcrafted gluten-free cupcakes"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-line bg-ivory/95 px-5 py-4 shadow-lg backdrop-blur md:block md:-left-6">
                <p className="bake-caption text-taupe">Baked to order</p>
                <p className="font-bake-display mt-1 text-[18px] font-medium text-cocoa">
                  Fresh · Custom · Safe
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="shop-gluten-free" className="scroll-mt-24 py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="max-w-[720px]">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Shop gluten-free
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[20ch]">Gluten-free cupcakes</h2>
            <p className="bake-body mt-6 max-w-[62ch] text-cocoa-soft">
              Gluten-free cupcakes are not just a dietary option — they are a celebration of taste,
              texture, and ingredients. At The Cupcake Desire, we craft soft, moist, and sublimely
              indulgent gluten-free cupcakes using the finest flours to create a perfect crumb. From
              vanilla swirl to chocolate, strawberry, or salted caramel, our gluten-free cupcakes in
              Melbourne satisfy both taste buds and dietary needs.
            </p>
          </div>

          {products.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-[880px]">
              {products.map((p, i) => (
                <CakeProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  badge="Gluten-free"
                  badgeTone="mint"
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-[880px]">
              {[
                {
                  href: '/products/gluten-free-red-velvet-3-cupcakes',
                  title: 'Gluten Free Red Velvet (3 Cupcakes)',
                  price: '$15.00',
                  image: '/images/cupcake-builder/gluten-free-red-velvet.jpg',
                },
                {
                  href: '/products/vegan-chocolate-vanilla-3-cupcakes',
                  title: 'Vegan Chocolate Vanilla (3 Cupcakes)',
                  price: '$15.00',
                  image: '/images/cupcake-builder/vegan-chocolate-vanilla.jpg',
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group overflow-hidden rounded-2xl border border-line bg-ivory transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-cream">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 440px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-bake-display text-[22px] font-medium text-cocoa">
                      {item.title}
                    </h3>
                    <p className="bake-body-sm mt-2 text-cocoa-soft">{item.price}</p>
                    <span className="bake-caption mt-4 inline-block text-rose-accent">
                      View product →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Flavours gallery ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="max-w-[720px]">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Our flavours
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[24ch]">
              Classic flavours — no flavour restrictions
            </h2>
            <p className="bake-body mt-5 max-w-[58ch] text-cocoa-soft">
              We bake classic flavours because dietary restrictions should never mean flavour
              restrictions.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {GLUTEN_FREE_FLAVOURS.map((flavour, i) => (
              <motion.article
                key={flavour.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group overflow-hidden rounded-2xl border border-line bg-ivory transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_24px_55px_-28px_rgba(46,31,21,0.3)]"
              >
                <div className="relative aspect-square overflow-hidden bg-cream">
                  <Image
                    src={flavour.image}
                    alt={flavour.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 md:p-6">
                  <p className="bake-caption text-taupe">0{i + 1}</p>
                  <h3 className="font-bake-display mt-2 text-[18px] font-medium leading-snug text-cocoa md:text-[20px]">
                    {flavour.title}
                  </h3>
                  <p className="bake-body-sm mt-3 text-cocoa-soft">{flavour.body}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Coeliac-conscious safety ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
                Safety first
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[22ch]">
                Truly gluten-free &amp;{' '}
                <span className="bake-display-italic text-rose-accent">coeliac-conscious</span>
              </h2>
              <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                <p>
                  Our gluten-free cakes and cupcakes in Melbourne are made without wheat, barley, or
                  rye. We use alternative flours — almond, rice, coconut, and gluten-free all-purpose
                  blends — to achieve the soft, moist texture of traditional cupcakes.
                </p>
                <p>
                  We understand that &ldquo;gluten-free&rdquo; is not a trend — it is a{' '}
                  <em>health requirement</em>. That&rsquo;s why our baking process focuses on safety,
                  transparency, and consistency.
                </p>
                <p>
                  While we operate in a kitchen that handles various ingredients, we follow careful
                  procedures designed to make our cupcakes suitable for customers avoiding gluten and
                  wheat.
                </p>
              </div>
            </div>
            <div className="lg:col-span-7">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {GLUTEN_FREE_SAFETY.map((item, i) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-line bg-ivory p-6 transition-colors hover:border-rose-accent"
                  >
                    <p className="bake-caption text-taupe">Practice 0{i + 1}</p>
                    <p className="font-bake-display mt-2 text-[18px] font-medium text-cocoa">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Custom occasions ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="bake-display-lg max-w-[24ch]">
                Custom gluten-free cupcakes for every occasion
              </h2>
              <p className="bake-body mt-6 text-cocoa-soft">
                Our cupcakes are not only safe — they are designed to impress. Personalise them for
                any event with elegant designs, fun character toppers, and themed colours. As{' '}
                <strong>Melanie Morales</strong> shared: &ldquo;My family loves getting vegan &amp;
                gluten-free cakes from here because we know it will be made with care and good
                ingredients! Plus, they look fantastic and taste awesome.&rdquo;
              </p>

              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                  <p className="bake-caption text-taupe">We customise for</p>
                  <ul className="mt-4 space-y-2.5">
                    {GLUTEN_FREE_OCCASIONS.map((item) => (
                      <li key={item} className="bake-body-sm flex items-start gap-2.5 text-cocoa">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="bake-caption text-taupe">You can request</p>
                  <ul className="mt-4 space-y-2.5">
                    {GLUTEN_FREE_CUSTOM_OPTIONS.map((item) => (
                      <li key={item} className="bake-body-sm flex items-start gap-2.5 text-cocoa">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-ivory p-8 md:p-10">
              <p className="bake-caption text-taupe">Why customers choose us</p>
              <h3 className="font-bake-display mt-3 text-[26px] font-medium text-cocoa">
                Boutique baking, professional service
              </h3>
              <ul className="mt-8 space-y-4">
                {GLUTEN_FREE_WHY.map((item) => (
                  <li key={item} className="flex items-start gap-3 border-b border-line pb-4 last:border-0 last:pb-0">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-accent/15 text-[12px] text-rose-accent">
                      ✓
                    </span>
                    <span className="bake-body-sm text-cocoa">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/corporate" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Corporate gluten-free orders
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How to order ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="text-center">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              How to custom order
            </p>
            <h2 className="bake-display-lg mx-auto mt-5 max-w-[22ch]">
              Four simple steps to your box
            </h2>
            <p className="bake-body mx-auto mt-5 max-w-[50ch] text-cocoa-soft">
              We recommend ordering 48 hours in advance for custom designs.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {GLUTEN_FREE_ORDER_STEPS.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-line bg-ivory p-7 transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent"
              >
                <p className="font-bake-display text-[28px] font-medium text-rose-accent">{step.n}</p>
                <h3 className="font-bake-display mt-3 text-[20px] font-medium text-cocoa">
                  {step.title}
                </h3>
                <p className="bake-body-sm mt-3 text-cocoa-soft">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/contact" className="bake-btn bake-btn-rose">
              Request a quote
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Dietary + ingredients ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-ivory p-8 md:p-10">
              <p className="bake-caption text-taupe">Dietary options available</p>
              <h2 className="bake-display-lg mt-3 max-w-[18ch]">No compromise needed</h2>
              <p className="bake-body mt-5 text-cocoa-soft">
                We don&rsquo;t believe customers should compromise. We offer multiple dietary
                combinations — please mention your requirement when ordering and we&rsquo;ll guide
                you to the most suitable flavour and frosting.
              </p>
              <ul className="mt-8 space-y-3">
                {GLUTEN_FREE_DIETARY.map((item) => (
                  <li key={item} className="bake-body-sm flex items-start gap-2.5 text-cocoa">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-ivory p-8 md:p-10">
              <p className="bake-caption text-taupe">Ingredients we use</p>
              <h2 className="bake-display-lg mt-3 max-w-[18ch]">Quality determines taste</h2>
              <p className="bake-body mt-5 text-cocoa-soft">
                Our goal is simple: cupcakes that taste like real cupcakes — not &ldquo;diet&rdquo;
                desserts.
              </p>
              <ul className="mt-8 space-y-3">
                {GLUTEN_FREE_INGREDIENTS.map((item) => (
                  <li key={item} className="bake-body-sm flex items-start gap-2.5 text-cocoa">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Delivery ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[24ch]">
            Gluten-free cupcake delivery in Melbourne
          </h2>
          <p className="bake-body mt-6 text-cocoa-soft">
            We provide reliable gluten free cupcake delivery across Melbourne so you can celebrate
            without stress. Options include scheduled delivery, event delivery, corporate office
            delivery, and local pickup.
          </p>
          <p className="bake-body mt-5 text-cocoa-soft">
            Areas we commonly serve: Melbourne CBD, Southbank, Docklands, Carlton, Richmond, St
            Kilda, Brighton, Hawthorn, South Yarra, and surrounding suburbs. For urgent orders,
            please contact us — we often accommodate last-minute celebrations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shipping-policy" className="bake-btn bake-btn-rose">
              Delivery details
            </Link>
            <Link href="/faq" className="bake-btn bake-btn-cream">
              FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Why choose us ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow text-center">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Why choose us
          </p>
          <h2 className="bake-display-lg mx-auto mt-6 max-w-[24ch] text-center">
            Melbourne&rsquo;s favourite cupcake shop
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {GLUTEN_FREE_WHY_CHOOSE_US.map((item, i) => (
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

      {/* ─── Gifting CTA ─── */}
      <section className="bg-cocoa py-16 text-ivory md:py-24">
        <div className="mx-auto max-w-[920px] px-6 text-center md:px-10">
          <h2 className="bake-display-lg text-ivory">
            Order your custom gluten-free cupcakes{' '}
            <span className="bake-display-italic text-rose-accent">today</span>
          </h2>
          <p className="bake-body-lg mx-auto mt-6 max-w-[62ch] text-ivory/80">
            Finding gluten-free cupcakes near you? The Cupcake Desire makes your celebration a little
            sweeter, safer, and more memorable. Whether you want fine designs, themed boxes, or
            unusual flavours, we make each cupcake to suit your occasion perfectly.
          </p>
          <p className="bake-body mx-auto mt-5 max-w-[62ch] text-ivory/80">
            Don&rsquo;t wait — place your order today and get gluten-free cake delivery in Melbourne
            that is fresh, safe, and full of flavour.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="#shop-gluten-free" className="bake-btn bake-btn-rose">
              Shop gluten-free
            </Link>
            <Link href="/contact" className="bake-btn bake-btn-cream">
              Contact us
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
            items={GLUTEN_FREE_FAQS.map((item, index) => ({
              _id: `gf-faq-${index}`,
              question: item.question,
              answer: item.answer,
            }))}
          />
        </div>
      </section>
    </main>
  )
}
