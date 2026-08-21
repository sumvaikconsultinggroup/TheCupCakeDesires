import JsonLd from '@/components/SE0/JsonLd'
import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
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

const storageTips = [
  {
    title: 'Keep them in an airtight box',
    body: 'Our cakes are baked fresh. The airtight box maintains the moisture and does not allow any external odours to interfere with the flavour.',
  },
  {
    title: 'Avoid warm, humid spaces',
    body: 'Nut-free cakes can be stored at room temperature. Heat may soften the buttercream or change the sponge texture.',
  },
  {
    title: 'Refrigerate only when needed',
    body: 'If the cakes have cream-based toppings, storing them in the refrigerator is better. While serving, keep them at room temperature for 20 minutes for a yummy taste.',
  },
  {
    title: 'Use cake liners while serving',
    body: 'This is an easy method of keeping the dishes and appearance clean-cut, especially during parties and get-togethers.',
  },
  {
    title: 'Transport with care',
    body: 'When transporting them to events, be sure to place the box on a flat surface and do not stack it to prevent frosting smudges.',
  },
] as const

const faqs = [
  {
    question: 'Are The Cupcake Desire\u2019s nut-free cakes prepared in a dedicated nut-free kitchen?',
    answer:
      'Yes, all our nut-free cakes are prepared in a controlled, nut-free environment to ensure complete allergen safety.',
  },
  {
    question: 'Can I customize nut-free cakes for birthdays or events?',
    answer:
      'Absolutely! We offer flavour, frosting, colour, and topper customizations specially crafted for nut-free orders.',
  },
  {
    question: 'How early should I place an order for bulk nut-free cakes?',
    answer:
      'For large events, we recommend placing your order 24\u201348 hours in advance to ensure freshness and timely delivery.',
  },
  {
    question: 'Are nut-free cakes safe for school celebrations?',
    answer:
      'Yes, nut-free cakes are school-safe and widely preferred for children\u2019s events due to allergen restrictions.',
  },
  {
    question: 'Do nut-free cakes taste different from regular cakes?',
    answer:
      'Not at all. When made with high-quality ingredients, nut-free cakes offer the same softness, sweetness, and texture as traditional cakes.',
  },
] as const

export default function NutFreeCakesPage() {
  const faqSchema = generateFAQSchema([...faqs])
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Nut-free Cakes', url: `${siteConfig.url}/nut-free-cakes` },
  ])

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />

      <main className="bake-canvas">
        {/* ─── Hero ─── */}
        <section className="relative min-h-[72vh] overflow-hidden md:min-h-[80vh]">
          <Image
            src="/images/nut-free-cake-1.webp"
            alt="Nut-free cakes and cupcakes in Melbourne"
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
                Allergen-conscious · Melbourne
              </p>
              <h1 className="bake-display-xl mt-6 max-w-[14ch] leading-tight">Nut-free Cakes</h1>
              <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
                Safe, inclusive, and flavourful nut-free cakes and cupcakes — baked fresh for events,
                parties, gifting, and school celebrations across Melbourne.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/contact" className="bake-btn bake-btn-rose">
                  Enquire now
                </Link>
                <Link href="/collections/cakes" className="bake-btn bake-btn-cream">
                  Shop cakes
                </Link>
              </div>
            </div>
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
                    To get started, simply share your design with us and we will print it on the
                    cakes for you. Complete our enquiry form or start a conversation through email at{' '}
                    <a
                      href="mailto:info@thecupcakedesire.com.au"
                      className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                    >
                      info@thecupcakedesire.com.au
                    </a>{' '}
                    or over the phone on{' '}
                    <a
                      href="tel:+61397050051"
                      className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                    >
                      03 9705 0051
                    </a>{' '}
                    and find out how we can help you.
                  </p>
                  <p>
                    Order your <strong>nut-free cupcakes &amp; cakes in Melbourne</strong> with your
                    business logo.
                  </p>
                </div>
                <Link href="/contact" className="bake-btn bake-btn-rose mt-8 inline-flex">
                  Send us an enquiry
                </Link>
              </div>
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)]">
                <Image
                  src="/images/nut-free-cake-2.webp"
                  alt="Custom nut-free cake with edible print"
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
              <span className="bake-display-italic text-rose-accent">trendy cakes</span>
            </h2>
            <div className="bake-body-lg mt-8 space-y-6 text-cocoa-soft">
              <p>
                Nut-free cakes are gaining popularity at a rapid pace as consumers focus on safety,
                inclusivity, and sourcing of ingredients that can be found easily. As awareness grows
                of nut allergies, bakeries and brands are changing to provide a variety of products
                that satisfy the needs of various diets without sacrificing creativity or flavor.
              </p>
              <p>
                Events in school prefer nut-free treats where allergen restriction is the norm. Also,
                the increased preference towards clean-label and allergen-conscious food has prompted
                manufacturers to roll out certified nut-free products. This change is indicative of a
                larger market trend where buyers are demanding convenience, trust, and healthier
                options. If you are constantly looking for the same and searching for a nut-free cake
                near me, then <strong>The Cupcake Desire</strong> is the place you should opt for. As
                nut-free cakes are no longer a niche, they are turning into a mainstream favourite in
                cafes, bakeries, and online dessert websites.
              </p>
            </div>
            <Link href="/collections/cakes" className="bake-btn bake-btn-rose mt-10 inline-flex">
              Shop now
            </Link>
          </div>
        </section>

        {/* ─── Nut-free cakes intro + portrait image ─── */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid items-start gap-12 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-16">
              <div>
                <h2 className="bake-display-lg max-w-[20ch]">Nut-free Cakes</h2>
                <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                  <p>
                    Nut-free cakes are now becoming a vital choice for those who want to eat the tasty
                    desserts without the fear of allergens that are caused by nuts. Nut-free cakes in
                    Melbourne from The Cupcake Desire are the best combination of flavor, consistency,
                    and a sense of safety, as more individuals are in search of safer and more
                    inclusive and allergen-conscious bakery choices. Whether it is prepared to meet
                    dietary needs, make school-safe snacks, or it is just that you need to make an
                    allergen-friendly alternative, these cakes offer a safe option that will not
                    sacrifice flavour.
                  </p>
                  <p>
                    With increasing consumer awareness, bakers are innovating with new recipes,
                    ingredients, and techniques to make nut-free cakes in Melbourne both indulgent and
                    accessible.
                  </p>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)] lg:mx-0">
                <div className="relative aspect-3/4">
                  <Image
                    src="/images/nut-free-cake-4.webp"
                    alt="Nut-free celebration cake"
                    fill
                    sizes="(max-width: 1024px) 80vw, 360px"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Events & gifting ─── */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)] lg:order-1">
                <Image
                  src="/images/nut-free-cake-3.webp"
                  alt="Nut-free cupcakes for events and gifting"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="lg:order-2">
                <h2 className="bake-display-lg max-w-[24ch]">
                  Nut-free cakes for events, parties, and gifting
                </h2>
                <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                  <p>
                    Nut-free cakes are now a favorite among events and celebrations, as this helps
                    ensure that all guests will be able to enjoy the desserts without worry. It can
                    be an office party, a baby shower, a school event, or any other occasion; a
                    nut-free birthday cake in Melbourne eliminates stressful restrictions associated
                    with allergens and makes hosting easier.
                  </p>
                  <p>
                    They are also versatile and therefore suitable for themed parties, where
                    customised flavours, colours, and decorations can be made without the use of
                    nut-based ingredients. Nut-free cupcakes from The Cupcake Desire are a safe and
                    considerate choice in case of gifting. They fit well into hampers, gifting
                    boxes, or customised dessert trays. They are not just a delicious snack but a
                    thoughtful present.
                  </p>
                </div>
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

        {/* ─── Storage tips ─── */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[920px] px-6 md:px-10">
            <h2 className="bake-display-lg max-w-[28ch]">
              Tips for storing and handling nut-free cakes &amp; cupcakes
            </h2>
            <p className="bake-body mt-6 max-w-[68ch] text-cocoa-soft">
              At The Cupcake Desire, our best nut-free cakes in Melbourne are made with a lot of care
              and proper storage to maintain their freshness and taste as they leave our kitchen. To
              preserve their softness, stability in frosting, and allergenic safety, adhere to these
              simple but effective guidelines:
            </p>
            <div className="mt-10 space-y-5">
              {storageTips.map((tip, i) => (
                <div
                  key={tip.title}
                  className="rounded-2xl border border-line bg-ivory p-6 md:p-7"
                >
                  <p className="bake-caption text-taupe">Tip 0{i + 1}</p>
                  <h3 className="font-bake-display mt-2 text-[20px] font-medium text-cocoa">
                    {tip.title}
                  </h3>
                  <p className="bake-body-sm mt-3 text-cocoa-soft">{tip.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why choose nut-free ─── */}
        <section className="bg-cocoa py-16 text-ivory md:py-24">
          <div className="mx-auto max-w-[920px] px-6 text-center md:px-10">
            <h2 className="bake-display-lg text-ivory">
              Why choose nut-free cakes from{' '}
              <span className="bake-display-italic text-rose-accent">The Cupcake Desire?</span>
            </h2>
            <div className="bake-body-lg mx-auto mt-6 max-w-[62ch] space-y-5 text-ivory/80">
              <p>
                Looking for gluten-free cakes Melbourne nearby, vegan-friendly cupcakes, or nut-free
                cupcakes, and not finding the right place? We&rsquo;ve got your back.
              </p>
              <p>
                Enjoy the optimal combination of safety, taste, and craftsmanship with nut-free cakes
                in Melbourne City, which are freshly baked, carefully selected, and 100%
                allergen-conscious.
              </p>
              <p>
                Craving a treat? Explore our delicious options with our fast nut-free cakes Melbourne
                delivery. Whether it&rsquo;s a birthday, anniversary, get-together, or a gift
                present, our cakes ensure that the occasion turns into a sweet memory.
              </p>
              <p>
                Choose a nut-free cake to order from The Cupcake Desire now and present your loved
                ones with the treats. Order now and experience the difference.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contact" className="bake-btn bake-btn-rose">
                Order now
              </Link>
              <Link href="/collections/cakes" className="bake-btn bake-btn-cream">
                Browse cakes
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
              items={faqs.map((item, index) => ({
                _id: `nut-free-faq-${index}`,
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
