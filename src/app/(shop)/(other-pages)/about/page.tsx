import JsonLd from '@/components/SE0/JsonLd'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Story — CupCake Desires',
  description:
    'CupCake Desires started in a 200 sq.ft. kitchen behind an old bookshop. Today, we bake every cupcake the morning you order it.',
}

const stats = [
  { value: '42,000+', label: 'Cupcakes baked last year' },
  { value: '6 hrs', label: 'From oven to your door' },
  { value: '32', label: 'Rotating flavors on the board' },
  { value: '04', label: 'Bakers, one tiny kitchen' },
]

const milestones = [
  { year: '2019', body: 'We rented 200 sq.ft. behind an old bookshop in Narre Warren. The oven was secondhand, the menu was six flavors.' },
  { year: '2020', body: 'The lockdown turned us into a delivery-only bakery overnight. We learned to box cupcakes for survival.' },
  { year: '2022', body: 'We moved into our current shop, a proper kitchen with windows. Started the Cupcake Club.' },
  { year: '2024', body: 'A second oven, eight bakers, and our first wholesale partners. The menu doubled.' },
  { year: 'Today', body: 'Hand-frosting every cupcake by morning. Same butter, same vanilla, no shortcuts.' },
]

export default function PageAbout() {
  return (
    <div className="bg-white text-black">
      <JsonLd />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-5 pt-12 pb-6 md:px-8 md:pt-20">
        <p className="cake-eyebrow text-black/60">Our story</p>
        <h1 className="cake-display-xl mt-6 max-w-[18ch]">
          A small bakery <span className="italic font-[420]">that grew up slowly.</span>
        </h1>
        <p className="cake-body-lg mt-6 max-w-[60ch] text-black/80">
          CupCake Desires began in 2019 with a secondhand oven, six flavors, and the firm belief that a good
          cupcake should taste like someone&rsquo;s grandmother made it. We&rsquo;re still that small bakery — just with
          a better oven.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/collections/all" className="cake-btn-primary">
            See today&rsquo;s flavors
          </Link>
          <Link href="/contact" className="cake-btn-secondary">
            Talk to our team
          </Link>
        </div>
      </section>

      {/* Stat block */}
      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8 md:py-14">
        <div className="cake-block bg-[var(--color-block-cream)]">
          <p className="cake-eyebrow text-black/60">By the numbers</p>
          <h2 className="cake-display-lg mt-3 max-w-[20ch]">
            The bakery, <span className="italic font-[420]">in counts.</span>
          </h2>
          <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="cake-caption text-black/60">{s.label}</dt>
                <dd
                  className="cake-display-lg mt-2 text-black"
                  style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 340 }}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Founder + manifesto */}
      <section className="mx-auto grid max-w-[1280px] gap-10 px-5 py-10 md:grid-cols-12 md:gap-16 md:px-8 md:py-14">
        <div className="md:col-span-5">
          <p className="cake-eyebrow text-black/60">A note from the founder</p>
          <h2 className="cake-display-lg mt-3 text-black">
            We&rsquo;re not <span className="italic font-[420]">trying to scale.</span>
          </h2>
        </div>
        <div className="md:col-span-7">
          <p className="cake-body-lg text-black/85">
            &ldquo;When people ask me where we&rsquo;ll be in five years, I say: probably right here, on this same
            street, with maybe one more oven and one more baker. We&rsquo;re not a factory. We&rsquo;re the bakery your
            friend recommended. That&rsquo;s the whole job.&rdquo;
          </p>
          <p className="cake-body-sm mt-6 text-black/60">— Aanya, founder &amp; head baker</p>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[var(--color-block-pink)] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8">
          <p className="cake-eyebrow text-black/60">How we got here</p>
          <h2 className="cake-display-lg mt-3 max-w-[24ch]">
            Six years of <span className="italic font-[420]">very slow growth.</span>
          </h2>
          <ol className="mt-12 divide-y divide-black/20 border-y border-black/20">
            {milestones.map((m) => (
              <li key={m.year} className="grid grid-cols-12 gap-4 py-8 md:gap-8">
                <div className="col-span-3 md:col-span-2">
                  <span className="cake-eyebrow text-black/60">{m.year}</span>
                </div>
                <div className="col-span-9 md:col-span-10">
                  <p className="cake-body text-black/80">{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-block-navy)] py-20 text-white md:py-28">
        <div className="mx-auto max-w-[1280px] px-5 text-center md:px-8">
          <p className="cake-eyebrow text-white/60">Order online</p>
          <h2 className="cake-display-lg mx-auto mt-3 max-w-[24ch]">
            Baked fresh.
            <span className="italic font-[420]"> Delivered to you.</span>
          </h2>
          <p className="cake-body mt-6 mx-auto max-w-[55ch] text-white/80">
            We&rsquo;re an online-only kitchen at 352 Princes Hwy, Narre Warren — every order is
            baked to order, so please allow 2 days&rsquo; notice.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/collections/all" className="cake-btn-primary" style={{ backgroundColor: '#fff', color: '#000' }}>
              Shop today&rsquo;s menu
            </Link>
            <Link href="/contact" className="cake-link text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">
              Plan a custom event →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
