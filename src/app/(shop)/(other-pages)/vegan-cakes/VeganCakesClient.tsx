'use client'

import { CakeProductCard, type Product } from '@/components/HomePage/_shared'
import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { VEGAN_CAKE_FAQS } from '@/data/vegan-cakes-content'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const whyChooseUs = [
  {
    title: 'Unmatched quality',
    body: 'Handcrafted with premium ingredients, ensuring every bite is as delicious as it is beautiful.',
  },
  {
    title: 'Custom branding',
    body: 'Showcase your company\u2019s logo or a special message with edible artistry.',
  },
  {
    title: 'Affordable elegance',
    body: 'Competitive pricing without compromising on quality, suitable for businesses of any size.',
  },
  {
    title: 'Wide variety',
    body: 'A diverse selection of flavors to suit every taste, including standard and deluxe options.',
  },
] as const

const testimonials = [
  {
    name: 'Sharen S',
    quote:
      'I highly recommend The Cupcake Desire. Having family members with dietary issues, we ordered a gluten and dairy-free birthday cake, and it was amazing! Most gluten-free cakes I have had in the past are dry and tasteless. Not these!',
  },
  {
    name: 'Josef Sawko',
    quote:
      'Great cupcakes. Wide range and options, was after vegan cupcakes for a mate\u2019s birthday, and she said it was the best vegan cupcakes she\u2019s had in a while. The owner is friendly and helped out regarding inquiries about said vegan cupcakes, and clearly knows his product. Highly recommend the place.',
  },
  {
    name: 'Olivia Jones',
    quote:
      'My experience was outstanding. We ordered custom vegan cupcakes; everything was done super meticulously from the initial consult up until delivery. The cupcakes themselves were also delicious. Super genuine and incredible customer service — thanks so much!',
  },
  {
    name: 'Leo Wilson',
    quote:
      'Fabulous experience from start to finish. Very personalised customer service, which is what you want! Especially when you are getting a cake for a birthday. Beautifully presented cakes, promptly delivered to the door, great customer service, and value.',
  },
] as const

const IMG = {
  hero: 'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944859/legacy-migrated/red-velvet-cake.webp',
  side: '/images/cupcake-builder/vegan-chocolate-vanilla.jpg',
  redVelvet:
    'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944862/legacy-migrated/red-velvet-2.jpg',
  chocolate:
    'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944850/legacy-migrated/chocolate-chocolate-round-cake-1.jpg',
  custom: '/images/cupcake-builder/chocolate-chocolate.webp',
} as const

type Props = {
  products: Product[]
}

export default function VeganCakesClient({ products }: Props) {
  return (
    <main className="bake-canvas">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[72vh] overflow-hidden md:min-h-[80vh]">
        <Image
          src={IMG.hero}
          alt="Vegan cakes and cupcakes in Melbourne"
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
              100% plant-based · Melbourne
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[12ch] leading-tight">Vegan Cakes</h1>
            <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
              Dairy-free and egg-free cakes &amp; cupcakes with no compromise on flavour — custom
              designs, edible logos, and delivery across Melbourne.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#shop-vegan" className="bake-btn bake-btn-rose">
                Shop vegan cakes
              </Link>
              <Link href="/contact" className="bake-btn bake-btn-cream">
                Enquire now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Only the best ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="bake-display-lg max-w-[22ch]">
                Only the best{' '}
                <span className="bake-display-italic text-rose-accent">for our customers</span>
              </h2>
              <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                <p>
                  To get started simply share your image with us and we will print it on the cupcakes
                  for you. Complete our enquiry form or start a conversation through email at{' '}
                  <a
                    href="mailto:info@thecupcakedesire.com.au"
                    className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
                  >
                    info@thecupcakedesire.com.au
                  </a>{' '}
                  or over the phone on{' '}
                  <a
                    href="tel:+61397050051"
                    className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
                  >
                    03 9705 0051
                  </a>{' '}
                  and find out how we can help you.
                </p>
                <p>
                  Order your <strong>vegan cakes &amp; cupcakes in Melbourne</strong> with your
                  business logo.
                </p>
              </div>
              <Link href="/contact" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Send us an enquiry
              </Link>
            </div>
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)]">
              <Image
                src={IMG.side}
                alt="Vegan chocolate vanilla cupcakes"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Safe, inclusive ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">
            Safe, inclusive &amp; flavourful{' '}
            <span className="bake-display-italic text-rose-accent">trendy cupcakes</span>
          </h2>
          <div className="bake-body-lg mt-8 space-y-6 text-cocoa-soft">
            <p>
              Dairy-free cupcakes are gaining popularity at a rapid pace as consumers focus on
              safety, inclusivity, and sourcing of ingredients that can be found easily. As awareness
              grows, bakeries and brands are changing to provide a variety of products that satisfy
              the needs of various diets without sacrificing creativity or flavor.
            </p>
            <p>
              The increased preference towards clean-label and allergen-conscious food has prompted
              manufacturers to roll out certified dairy-free products. This change is indicative of a
              larger market trend where buyers are demanding convenience, trust, and healthier
              options. If you are searching for a dairy-free cake near me, then{' '}
              <strong>The Cupcake Desire</strong> is the place you should opt for. As vegan cakes
              &amp; cupcakes are no longer a niche, they are turning into a mainstream favourite in
              cafes, bakeries, and online dessert websites.
            </p>
          </div>
          <Link href="#shop-vegan" className="bake-btn bake-btn-rose mt-10 inline-flex">
            Shop now
          </Link>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section id="shop-vegan" className="scroll-mt-24 bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="max-w-[720px]">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Shop vegan cakes
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[22ch]">Vegan Cakes</h2>
            <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
              <p>
                At The Cupcake Desire, we offer high-quality vegan cakes and cupcakes in Melbourne
                that use 100% plant-based ingredients with no compromise on the flavour. The vegan
                line is carefully designed for customers who want to enjoy tasty desserts without
                dairy, eggs, or animal-based additives. Every product is crafted with fresh
                ingredients and high-quality alternatives that deliver the same richness and
                indulgence as classic desserts.
              </p>
              <p>
                Whether you follow a vegan-friendly diet or simply prefer the healthier option, our
                vegan cupcakes and cakes combine delicious taste, softness, and freshness. The
                Cupcake Desire guarantees highly satisfying best vegan cakes in Melbourne with
                professional baking levels and creative tastes.
              </p>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-[880px]">
              {products.map((p, i) => (
                <CakeProductCard key={p._id} product={p} index={i} badge="Plant-based" badgeTone="mint" />
              ))}
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:max-w-[880px]">
              {[
                {
                  href: '/products/red-velvet-round-cake',
                  title: 'Red Velvet Round Cake',
                  price: '$60.00 – $80.00',
                  image: IMG.redVelvet,
                },
                {
                  href: '/products/chocolate-chocolate-round-cake',
                  title: 'Chocolate Chocolate Round Cake',
                  price: '$60.00 – $80.00',
                  image: IMG.chocolate,
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

      {/* ─── Custom vegan options ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)]">
              <Image
                src={IMG.custom}
                alt="Custom vegan cupcakes"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="bake-display-lg max-w-[22ch]">Custom vegan cupcake options</h2>
              <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                <p>
                  We have a wide selection of personalized vegan cupcakes that can be used to
                  celebrate any occasion, be it a wedding, an anniversary, or a vegan birthday cake
                  in Melbourne. You can get everything at your door, at The Cupcake Desire. Every
                  cupcake is customized using plant-based products, and the flavour, texture, and
                  presentation have the ideal balance.
                </p>
                <p>
                  Whether you like minimalist chic or themed decorations, we tailor colours, frosting,
                  decorations, and flavours to suit the aesthetic of your event. The Cupcake Desire
                  offers fresh vegan cupcakes Melbourne delivery with an indelible taste right to
                  your door.
                </p>
                <p>
                  Customers have the option of customising the flavour — making it less sweet, adding
                  flavourings, or choosing particular toppings. Every tailor-made order is made with
                  precision, and our vegan cupcakes are as special as your party and every moment.
                </p>
              </div>
              <Link href="/cupcake-builder" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Build a custom box
              </Link>
            </div>
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
            {whyChooseUs.map((item, i) => (
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

      {/* ─── Why order online ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">
            Why choose vegan-friendly cupcakes from{' '}
            <span className="bake-display-italic text-rose-accent">The Cupcake Desire</span>
          </h2>
          <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
            <p>
              Ordering vegan-friendly cupcakes online with The Cupcake Desire is a simple and
              seamless process. You can browse through an exclusive selection of plant-based flavours
              on our website, curated collections, and limited-edition designs. All orders are
              handled with a keen eye to detail and delivered on time across Melbourne.
            </p>
            <p>
              You can select desired quantities, leave special comments, and select a delivery slot
              easily. With a focus on efficiency, reliability, and superior taste, our online order
              service makes sure you receive fresh, well-decorated vegan cupcakes on your doorstep —
              for any party or daily pleasure.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow text-center">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Sweet words from our clients
          </p>
          <h2 className="bake-display-lg mx-auto mt-6 max-w-[28ch] text-center">
            Melbourne&rsquo;s trusted choice for vegan cakes &amp; cupcakes
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-ivory p-7"
              >
                <span className="font-bake-display text-[36px] leading-none text-rose-accent">
                  &ldquo;
                </span>
                <blockquote className="bake-body-sm text-cocoa-soft">{t.quote}</blockquote>
                <figcaption className="mt-auto border-t border-line pt-4">
                  <p className="font-bake-display text-[16px] font-medium text-cocoa">{t.name}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-cocoa py-16 text-ivory md:py-24">
        <div className="mx-auto max-w-[920px] px-6 text-center md:px-10">
          <h2 className="bake-display-lg text-ivory">
            Order vegan-friendly cupcakes{' '}
            <span className="bake-display-italic text-rose-accent">online</span>
          </h2>
          <p className="bake-body-lg mx-auto mt-6 max-w-[62ch] text-ivory/80">
            Select The Cupcake Desire and enjoy vegan cake &amp; cupcake delivery in Melbourne made
            with the best ingredients, exquisite artistry, and memorable taste. Our plant-based
            products are freshly prepared, highly decorated, and carefully made to suit all parties.
          </p>
          <p className="bake-body mx-auto mt-5 max-w-[62ch] text-ivory/80">
            Through our trustworthy service, high quality, and a menu crafted for contemporary
            preferences, we bring vegan cupcakes that are indulgent, ethical, and delicious. Shop
            your favourites today.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="#shop-vegan" className="bake-btn bake-btn-rose">
              Shop vegan cakes
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
