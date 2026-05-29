'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

/* ─────────────────── Page data ─────────────────── */

const values = [
  {
    name: 'Freshness over scale',
    body: 'We cap each flavour at sixty cupcakes a day. Once it&rsquo;s sold out, it&rsquo;s sold out &mdash; tomorrow brings the next batch.',
  },
  {
    name: 'People over process',
    body: 'Every order is touched by a person, not a packing line. If something&rsquo;s off, a real human reads your email and answers it.',
  },
  {
    name: 'Quality without compromise',
    body: 'Real butter, single-origin vanilla, farm eggs, Belgian chocolate. If we can&rsquo;t pronounce an ingredient, we don&rsquo;t use it.',
  },
  {
    name: 'Care in every detail',
    body: 'From the hand-piped swirl on top to the ribbon on the box &mdash; we sweat the small stuff so you don&rsquo;t have to.',
  },
]

const dayInKitchen = [
  {
    time: '4:00 AM',
    title: 'Lights on, ovens up',
    body: 'Aanya is in first. Coffee, playlist, ovens pre-heating to 165°C. The dough that was prepped last night comes out to soften.',
  },
  {
    time: '5:30 AM',
    title: 'First batch in',
    body: 'Today&rsquo;s flavours go in by category &mdash; vanillas, chocolates, signatures &mdash; on rotation. Browned butter starts foaming.',
  },
  {
    time: '7:00 AM',
    title: 'Frosting',
    body: 'Italian meringue buttercream gets whipped in the Hobart for twenty minutes. Cherries pitted, berries hulled, mint picked.',
  },
  {
    time: '8:30 AM',
    title: 'Piping starts',
    body: 'Every swirl is hand-piped &mdash; no two cupcakes ever look identical, and that&rsquo;s the point.',
  },
  {
    time: '10:00 AM',
    title: 'Boxing the day’s orders',
    body: 'Today&rsquo;s online orders &mdash; placed two days ago &mdash; get hand-boxed, ribbon-tied, and labelled for their drivers.',
  },
  {
    time: '2:00 PM',
    title: 'Couriers roll out',
    body: 'Vans head out across Melbourne. Custom event boxes for weddings and corporate gigs are routed first.',
  },
  {
    time: '8:00 PM',
    title: 'Prep tomorrow',
    body: 'Last delivery van returns. Dough for tomorrow gets mixed and rested. Counter wiped, ovens off, lights low.',
  },
]

const noGo = [
  'No powdered cake mix',
  'No artificial colouring',
  'No premix frosting from tubs',
  'No day-old cupcakes',
  'No "we&rsquo;ll make it work" custom orders we can&rsquo;t actually do well',
  'No corner-cutting on dietary versions',
]

/* ─────────────────── Page ─────────────────── */

export default function AboutUsPage() {
  return (
    <main className="bake-canvas">
      {/* ─── HERO ─── */}
      <section className="bg-cream pt-20 md:pt-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-14 md:items-end">
            <div className="md:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bake-eyebrow"
              >
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                About CupCake Desires
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.06 }}
                className="bake-display-xl mt-6 max-w-[18ch]"
              >
                Six years of small,{' '}
                <span className="bake-display-italic text-rose-accent">hand-frosted moments.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.12 }}
                className="bake-body-lg mt-7 max-w-[58ch]"
              >
                One small bakery, one tiny Narre Warren shop, one stubborn idea: that a cupcake
                should taste like someone&rsquo;s grandmother spent a Sunday making it &mdash; even
                when there are five hundred of them on the tray.
              </motion.p>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-2xl border border-line bg-ivory p-6 text-right">
                <p className="bake-caption text-taupe">Established</p>
                <p
                  className="font-bake-display mt-1 text-[56px] leading-none font-medium text-cocoa"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  2019
                </p>
                <p className="font-bake-script mt-2 text-[22px] leading-none text-rose-accent">
                  Narre Warren, Victoria
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-bleed-ish AboutUs.webp image — the one shop counter image */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-14 max-w-[1320px] px-6 md:mt-20 md:px-10"
        >
          <div className="relative aspect-16/9 w-full overflow-hidden rounded-[28px] bg-cream-deep md:aspect-[21/9]">
            <Image
              src="/images/AboutUs.webp"
              alt="Inside the CupCake Desires shop counter"
              fill
              priority
              sizes="(max-width: 1320px) 100vw, 1280px"
              className="object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-cocoa/30 via-transparent to-transparent"
            />
            <p className="bake-caption absolute bottom-5 left-6 text-ivory md:bottom-7 md:left-10">
              The counter · 352 Princes Hwy, Narre Warren
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── FOUNDER LETTER ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <p className="bake-eyebrow">
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            A letter from the founder
          </p>
          <h2 className="bake-display-lg mt-5 max-w-[18ch]">
            On the{' '}
            <span className="bake-display-italic text-rose-accent">first cupcake</span> we ever
            sold.
          </h2>

          <div className="bake-body-lg mt-10 space-y-6 text-cocoa-soft">
            <p>
              In June 2019 we rented a 200 sq.ft. kitchen behind an old bookshop in Narre Warren.
              The oven was secondhand, the menu was six flavours, and the only marketing we had
              was a chalkboard out front that said &ldquo;cupcakes today.&rdquo;
            </p>
            <p>
              The first cupcake we ever sold was a red velvet to a woman named Margaret on her way
              to her granddaughter&rsquo;s birthday. She paid in coins, asked us to write
              &ldquo;happy 7th&rdquo; on a sticky note, and said she&rsquo;d come back if it was
              any good.
            </p>
            <p>
              She came back the next week. So did her daughter. So did her daughter&rsquo;s book
              club. Six years later we&rsquo;re still in Narre Warren, still hand-piping every
              swirl, still writing names on sticky notes. We never wanted to be a factory &mdash;
              we wanted to be the bakery your friend recommends.
            </p>
            <p>
              That&rsquo;s the whole job. Thank you for ordering from us &mdash; whether it&rsquo;s
              your first time or your fiftieth.
            </p>
          </div>

          <div className="mt-12 flex items-center gap-5 border-t border-line pt-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-deep">
              <span
                className="font-bake-script text-[24px] text-rose-accent"
                style={{ lineHeight: 1 }}
              >
                A
              </span>
            </div>
            <div>
              <p
                className="font-bake-script text-[32px] leading-none text-rose-accent"
                style={{ transform: 'rotate(-2deg)', display: 'inline-block' }}
              >
                Aanya
              </p>
              <p className="bake-caption mt-2 text-taupe">Aanya Mehta · Founder &amp; head baker</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 max-w-[58ch] md:mb-20">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              What we live by
            </p>
            <h2 className="bake-display-lg mt-5">
              Four ideas we&rsquo;ve never{' '}
              <span className="bake-display-italic text-rose-accent">budged on.</span>
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-x-14 md:gap-y-12">
            {values.map((v, i) => (
              <motion.li
                key={v.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="border-t border-line pt-8"
              >
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-bake-display text-[32px] font-medium text-rose-accent"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-bake-display text-[24px] font-medium text-cocoa">
                    {v.name}
                  </h3>
                </div>
                <p
                  className="bake-body mt-4 max-w-[48ch] pl-[60px]"
                  dangerouslySetInnerHTML={{ __html: v.body }}
                />
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── A DAY IN OUR KITCHEN — timeline ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:gap-12 md:items-end">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Inside the kitchen
              </p>
              <h2 className="bake-display-lg mt-5">
                A day at{' '}
                <span className="bake-display-italic text-rose-accent">352 Princes Hwy.</span>
              </h2>
            </div>
            <p className="bake-body md:col-span-5">
              Some bakeries bake before close. We bake before sunrise &mdash; here&rsquo;s how a
              regular Wednesday goes.
            </p>
          </div>

          <ol className="relative space-y-12 md:space-y-16">
            {/* Vertical hairline */}
            <span
              aria-hidden
              className="absolute left-[88px] top-3 bottom-3 hidden w-px bg-line md:block"
            />

            {dayInKitchen.map((d, i) => (
              <motion.li
                key={d.time}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.3) }}
                className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-8"
              >
                <div className="md:col-span-3 md:flex md:items-start md:gap-4">
                  <span
                    className="font-bake-display text-[24px] font-medium text-rose-accent md:text-[26px]"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {d.time}
                  </span>
                  {/* Timeline dot */}
                  <span
                    aria-hidden
                    className="relative hidden h-3 w-3 rounded-full border-2 border-rose-accent bg-ivory md:mt-3 md:block"
                  />
                </div>
                <div className="md:col-span-9 md:pl-2">
                  <h3 className="font-bake-display text-[22px] font-medium text-cocoa">
                    {d.title}
                  </h3>
                  <p className="bake-body mt-2 max-w-[58ch]">{d.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── NO-GO LIST ─── */}
      <section className="bg-cocoa py-20 text-ivory md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
                The no-go list
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch] text-ivory">
                Six things you won&rsquo;t find in{' '}
                <span className="bake-display-italic text-rose-deep">our kitchen.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[40ch] text-cream-deep/80">
                We&rsquo;d rather say no than say yes badly. Here&rsquo;s where we draw the line.
              </p>
            </div>

            <ul className="md:col-span-7">
              {noGo.map((n, i) => (
                <motion.li
                  key={n}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  className="flex items-start gap-5 border-b border-ivory/15 py-6 last:border-b-0"
                >
                  <span
                    className="font-bake-display text-[22px] font-medium text-rose-deep"
                    aria-hidden
                  >
                    ✕
                  </span>
                  <p
                    className="font-bake-display text-[20px] font-medium text-ivory md:text-[22px]"
                    dangerouslySetInnerHTML={{ __html: n }}
                  />
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── HOW TO ORDER FROM US ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 md:items-center">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                How to order from us
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[22ch]">
                We&rsquo;re an{' '}
                <span className="bake-display-italic text-rose-accent">online-only kitchen.</span>
              </h2>
              <p className="bake-body-lg mt-6 max-w-[55ch]">
                There&rsquo;s no walk-in store at the kitchen — every box is baked to order and
                routed straight to your door. That keeps us tiny, careful, and able to say yes to
                custom event work we couldn&rsquo;t do over a counter.
              </p>

              <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2 sm:gap-y-10">
                <div>
                  <dt className="bake-caption text-taupe">Lead time</dt>
                  <dd className="font-bake-display mt-2 text-[18px] font-medium text-cocoa">
                    2 days minimum
                    <br />
                    <span className="text-cocoa-soft">on every order</span>
                  </dd>
                </div>
                <div>
                  <dt className="bake-caption text-taupe">Custom events</dt>
                  <dd className="font-bake-display mt-2 text-[18px] font-medium text-cocoa">
                    Allow a week
                    <br />
                    <span className="text-cocoa-soft">for weddings &amp; corporate</span>
                  </dd>
                </div>
                <div>
                  <dt className="bake-caption text-taupe">Delivery</dt>
                  <dd className="bake-body mt-2 max-w-[34ch]">
                    Melbourne metro by our own couriers. Victoria-wide for event orders on request.
                  </dd>
                </div>
                <div>
                  <dt className="bake-caption text-taupe">Customer support</dt>
                  <dd className="bake-body mt-2 max-w-[34ch]">
                    Mon — Sat, replies within a working day. WhatsApp for quick questions.
                  </dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/collections/all" className="bake-btn">
                  Shop today&rsquo;s menu <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/contact"
                  className="font-bake-body text-[14px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                >
                  Plan a custom event
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-5"
            >
              {/* Bake-to-order lead-time card */}
              <div className="rounded-3xl border border-line bg-ivory p-8 md:p-10">
                <p className="bake-caption text-taupe">Order today, bake</p>
                <p
                  className="font-bake-display mt-2 text-[64px] font-medium leading-none text-cocoa"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Day +2
                </p>
                <p className="font-bake-script mt-3 text-[24px] leading-none text-rose-accent">
                  fresh from the oven, never from a shelf
                </p>

                <ul className="mt-10 divide-y divide-line">
                  {[
                    ['Day 0', 'You place the order online'],
                    ['Day 1', 'We bake the sponges, whip the buttercream'],
                    ['Day 2', 'Hand-piped, boxed, on the road to you'],
                  ].map(([label, body]) => (
                    <li key={label} className="flex items-start gap-5 py-4">
                      <span className="font-bake-display w-16 shrink-0 text-[15px] font-medium text-rose-accent">
                        {label}
                      </span>
                      <span className="bake-body-sm text-cocoa-soft">{body}</span>
                    </li>
                  ))}
                </ul>

                <p className="bake-caption mt-8 text-taupe">
                  Custom events follow a separate planning timeline
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="rounded-3xl border border-line bg-cream-deep px-8 py-14 text-center md:px-16 md:py-20">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Now that you know us
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-lg mt-6 max-w-[22ch] mx-auto">
              Try the cupcakes that{' '}
              <span className="bake-display-italic text-rose-accent">started it all.</span>
            </h2>
            <p className="bake-body-lg mt-6 max-w-[52ch] mx-auto">
              Six flavours on opening day. Today, twenty-four &mdash; with one new release every
              season. Start with a classic.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/collections/all" className="bake-btn">
                Shop the bakery <span aria-hidden>→</span>
              </Link>
              <Link
                href="/blog"
                className="font-bake-body text-[14px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
              >
                Read more stories
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
