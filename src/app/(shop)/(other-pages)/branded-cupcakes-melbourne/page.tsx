import Image from 'next/image'
import Link from 'next/link'

const reasons = [
  {
    title: 'Freshness evidence',
    body: 'We bake the cupcakes crafted with care in every crumb, ensuring that every bite tastes as tasty as the first. Our store delivers your order to your doorstep, ensuring that they are fresh and pillow-light in texture.',
  },
  {
    title: 'Infused with love',
    body: 'Each cupcake is baked with care and love. We at The Cupcake Desire ensure that you meet your expectations, and so our team of bakers makes sure that you receive the buttery soft cupcake from our store.',
  },
  {
    title: 'Customisation available',
    body: 'Whether it\u2019s a corporate-branded cupcake, an anniversary party, a birthday gift, or any other special occasion, we have a wide range of options to choose from. Just send us the design, and no matter the event, we bake the cupcakes which is uniquely yours with the touch of luxe.',
  },
  {
    title: 'Has variety',
    body: 'From classic chocolate, to salted caramel, molten chocolate, classic vanilla, vegan chocolate, gluten-free red velvet, and many more. Simply provide us the occasion and choice, we will bake you the best.',
  },
  {
    title: 'Soft, fluffy, and tasty',
    body: 'Our cupcakes are known for their perfect texture with melt-in-your-mouth flavours. Each cupcake from our store is baked in such a way that it satisfies your taste buds.',
  },
] as const

export default function BrandedCupcakesMelbournePage() {
  return (
    <main className="bake-canvas">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[72vh] overflow-hidden md:min-h-[80vh]">
        <Image
          src="/images/corporate-1.png"
          alt="Custom branded cupcakes with edible logos in Melbourne"
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
              Custom branding · Melbourne
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[18ch] leading-tight">
              Branded Cupcakes Melbourne
            </h1>
            <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
              Custom branded cupcakes with edible logos, fresh daily baking, and delivery across
              Melbourne — for corporate events, client gifts, and every celebration worth remembering.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/corporate" className="bake-btn bake-btn-rose">
                Get a corporate quote
              </Link>
              <Link href="/contact" className="bake-btn bake-btn-cream">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Intro ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <h2 className="bake-display-lg max-w-[28ch]">
            Custom Branded Cupcakes Melbourne:{' '}
            <span className="bake-display-italic text-rose-accent">
              A delicious way to celebrate every occasion
            </span>
          </h2>
          <div className="bake-body-lg mt-8 space-y-6 text-cocoa-soft">
            <p>
              Cupcakes are a sweet treat that fits in every occasion, and you can have them without
              thinking twice, isn&rsquo;t it? It&rsquo;s because these are buttery-soft, moreish, and
              sufficient. But finding freshly infused branded cupcakes in Melbourne is not an easy
              task. Crafted with care in every crumb, The Cupcake Desire&rsquo;s online cupcake
              delivery has a wide variety of cupcakes to impress, and you can now enjoy the velvety
              melt-in-your-mouth at your home.
            </p>
            <p>
              With The Cupcake Desire, you can order cupcakes online, without thinking twice about
              delivery, as our delivery team will deliver your ordered customised cupcakes for every
              occasion to your doorstep in just 2 days. Whether you are looking for different
              occasions, be it birthday cupcakes, anniversary cupcakes, or sorry cupcakes, thank you
              cupcakes, or anything, we offer a wide variety of luscious cupcakes that you can enjoy
              on every occasion and make them more special. You will also find the best cupcake price
              in Melbourne without complaining about where to buy good cupcakes anymore.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Doorstep delivery ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="bake-caption text-taupe">Delivered fresh</p>
              <h2 className="bake-display-lg mt-3 max-w-[22ch]">
                Get customised, branded cupcakes at your doorstep
              </h2>
              <div className="bake-body mt-6 space-y-5 text-cocoa-soft">
                <p>
                  The best cupcake shop, The Cupcake Desire, is here to satisfy your cravings and
                  make your moment an occasion with a bang. We offer you the best branded cupcakes
                  in Melbourne, which not only satisfy your taste buds but also make you smile with
                  the luscious taste. From treating your loved one, your family, kids, friends,
                  corporate buddy, or your clients, we offer a wide range to explore. The Cupcake
                  Desire has a huge range of fresh, flavoured, and creamy cupcakes to choose from our
                  online cake shop.
                </p>
                <p>
                  Order cupcakes online from The Cupcake Desire, a Melbourne cupcake shop, and
                  experience the convenience and quality of the best cupcake shop around.
                </p>
              </div>
              <Link href="/collections/standard-cupcakes" className="bake-btn bake-btn-rose mt-8 inline-flex">
                Shop standard cupcakes
              </Link>
            </div>
            <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-30px_rgba(46,31,21,0.35)]">
              <Image
                src="/images/corporate-3.png"
                alt="Branded corporate cupcakes in a gift box"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why everyone loves us ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Why choose us
          </p>
          <h2 className="bake-display-lg mt-6 max-w-[28ch]">
            Why does everyone love cupcakes from The Cupcake Desire?
          </h2>
          <p className="bake-body-lg mt-6 max-w-[68ch] text-cocoa-soft">
            Cupcakes from our store are the perfect combination of locally baked and lovingly
            delivered, as they are made with love and offer a wide range of customisable options.
            Starting from corporate branded cupcakes to birthdays, anniversaries, thank you, sorry,
            mothers day, festivals, and whatnot! Cupcakes from our store are versatile for every
            occasion. We have custom-branded cupcakes, our quality is unmatched, a wide variety to
            explore, and it all comes under affordable elegance.
          </p>
          <p className="bake-body mt-5 max-w-[68ch] text-cocoa-soft">
            Get your custom cupcakes delivered to your doorstep as we deliver them within 2 days in
            all areas of Melbourne.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map((item, i) => (
              <div
                key={item.title}
                className="rounded-2xl border border-line bg-ivory p-7 transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
              >
                <p className="bake-caption text-taupe">No. 0{i + 1}</p>
                <h3 className="font-bake-display mt-2 text-[22px] font-medium text-cocoa">
                  {item.title}
                </h3>
                <p className="bake-body-sm mt-3 text-cocoa-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-cocoa py-16 text-ivory md:py-24">
        <div className="mx-auto max-w-[920px] px-6 text-center md:px-10">
          <h2 className="bake-display-lg text-ivory">
            Buy branded cupcakes in Melbourne:{' '}
            <span className="bake-display-italic text-rose-accent">choose us, choose the best</span>
          </h2>
          <p className="bake-body-lg mx-auto mt-6 max-w-[62ch] text-ivory/80">
            When looking to make a lasting impression, company branded cupcakes Melbourne from our
            store are the best thing you can look for. They are not just scrumptious but velvety
            too. Whether you are looking to elevate your corporate event or a family function, or
            any other special occasion, we&rsquo;ve got you covered with everything. Not just
            logo-branded cupcakes, but we have a lot of other designs and options to look after.
          </p>
          <p className="bake-body mx-auto mt-5 max-w-[62ch] text-ivory/80">
            Baked fresh daily across Melbourne, you are just one click away from the perfect way to
            celebrate your special day, delivered to your doorstep with infused love and care. Every
            cupcake tells a story — make yours delicious with The Cupcake Desire.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="bake-btn bake-btn-rose">
              Contact now
            </Link>
            <Link href="/corporate" className="bake-btn bake-btn-cream">
              Corporate ordering
            </Link>
            <a href="tel:+61397050051" className="bake-btn bake-btn-ghost border border-ivory/30 text-ivory">
              03 9705 0051
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
