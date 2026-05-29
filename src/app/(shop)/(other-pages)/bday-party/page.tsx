'use client'

import ImagePlaceholder from '@/components/ImagePlaceholder'
import JsonLd from '@/components/SE0/JsonLd'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type PackId = 'whisk' | 'sprinkle' | 'confetti'

const packs: {
  id: PackId
  name: string
  tag: string
  headcount: string
  duration: string
  price: number
  perGuest: string
  highlight: string
  tone: 'cream' | 'rose' | 'gold'
  badge?: string
  includes: string[]
}[] = [
  {
    id: 'whisk',
    name: 'Mini Whisk',
    tag: 'For the first big one',
    headcount: 'Up to 8 kids',
    duration: '90 minutes',
    price: 320,
    perGuest: '~$40 / guest',
    highlight: 'Best for ages 4 — 7',
    tone: 'cream',
    includes: [
      '8 cupcakes to frost, live with our baker',
      'Three classic flavors + sprinkle bar',
      'Aprons, paper hats & cleanup',
      'Party host for the full session',
      'Boxed cupcakes to take home',
    ],
  },
  {
    id: 'sprinkle',
    name: 'Sprinkle Society',
    tag: 'Our most-booked pack',
    headcount: 'Up to 14 kids',
    duration: '2 hours',
    price: 520,
    perGuest: '~$37 / guest',
    highlight: 'Best for ages 7 — 11',
    tone: 'rose',
    badge: 'Most loved',
    includes: [
      '14 cupcakes to frost + a baker-led demo',
      'Six flavors, full topping wall',
      'Personalised birthday cupcake tower',
      'Polaroid corner with props',
      'Party host, helpers, full reset',
      'Ribbon-tied take-home boxes',
    ],
  },
  {
    id: 'confetti',
    name: 'Confetti Confection',
    tag: 'For the big celebration',
    headcount: 'Up to 24 guests',
    duration: '2.5 hours',
    price: 810,
    perGuest: '~$34 / guest',
    highlight: 'Kids, teens & grown-ups',
    tone: 'gold',
    includes: [
      '24 cupcakes + signature flavor flight',
      'Full topping & drizzle wall',
      'Custom cupcake tower with edible nameplate',
      'Welcome drinks (mocktail bar)',
      'Photographer for the first hour',
      'Themed table styling',
      'Two dedicated party hosts',
    ],
  },
]

const runOfShow = [
  { time: '0:00', title: 'Welcome & aprons', body: 'Guests roll in, slip on aprons, pose at the polaroid corner.' },
  { time: '0:15', title: 'Baker demo', body: 'Our pastry chef shows the three frosting moves of the day.' },
  { time: '0:30', title: 'Frosting bar opens', body: 'Pipe, sprinkle, drizzle. The wall has 40+ toppings.' },
  { time: '1:10', title: 'Sing & blow out', body: 'Cupcake tower wheeled out, lights down, candles lit.' },
  { time: '1:25', title: 'Box & goodbye', body: 'Everyone leaves with their cupcakes, ribbon-tied.' },
]

const flavors = [
  { name: 'Rainbow Funfetti', desc: 'Vanilla sponge, sprinkles inside and out.', tone: 'rose', badge: 'Kid favourite' },
  { name: 'Cookies & Cream', desc: 'Oreo bits folded into a cocoa sponge.', tone: 'cream', badge: undefined },
  { name: 'Strawberry Cloud', desc: 'Pink berry buttercream, freeze-dried fruit.', tone: 'rose', badge: 'Seasonal' },
  { name: 'Choco Chunk', desc: 'Belgian chocolate, fudge centre.', tone: 'cocoa', badge: undefined },
  { name: 'Mango Lassi', desc: 'Alphonso curd, cardamom cream.', tone: 'gold', badge: 'New' },
  { name: 'Vanilla Bean', desc: 'The forever classic, brown-butter sponge.', tone: 'beige', badge: undefined },
] as const

const addOns = [
  { name: 'Custom centerpiece cake', price: 'from $65', body: '6" themed cake to match the cupcakes.' },
  { name: 'Balloon arch styling', price: '$90', body: 'In-house designer balloon arch in your colours.' },
  { name: 'Magician for 30 min', price: '$115', body: 'Close-up magic between the demo and the candles.' },
  { name: 'Live polaroid wall', price: '$65', body: 'Take-home pictures pinned to the wall as they happen.' },
  { name: 'Grown-up coffee bar', price: '$85', body: 'Espresso & cold brew for the parents waiting in the back.' },
  { name: 'Branded goody bag', price: '$8 / kid', body: 'Cupcake, cookie, sticker sheet, name tag.' },
]

const faqs = [
  {
    q: 'Where do parties happen?',
    a: 'In our studio kitchen at 352 Princes Hwy, Narre Warren. We can also bring a roving frosting bar to your venue — ask about our off-site pack.',
  },
  {
    q: 'Can parents stay?',
    a: 'Yes, two parents per family are welcome. We keep a little coffee corner at the back so the room stays the kids&rsquo;.',
  },
  {
    q: 'How far in advance should we book?',
    a: 'Saturdays book 4 — 6 weeks out, weekdays usually 10 days. A 30% deposit holds your slot; the balance is due 48 hours before.',
  },
  {
    q: 'Eggless, vegan, nut-free?',
    a: 'All three. Tell us when you book and we ring-fence ingredients on the morning of your party.',
  },
  {
    q: 'What if a guest cancels?',
    a: 'Headcount can flex by 2 either side up to 24 hours before. Beyond that we hold the original count for ingredients.',
  },
  {
    q: 'Do you do grown-up birthdays?',
    a: 'Absolutely. The Confetti Confection pack scales to adults — we swap the sprinkle wall for a drizzle &amp; gold-leaf bar.',
  },
]

const testimonials = [
  {
    quote:
      'My eight-year-old still talks about the frosting demo. The host had every kid named within ten minutes. We left with cupcakes AND the cleaner kitchen.',
    name: 'Priya R.',
    note: 'Sprinkle Society · Oct ’24',
  },
  {
    quote:
      'We booked for the grown-ups in our office and it was the most fun forty-five minutes we’ve had in a quarter. The drizzle bar is dangerous.',
    name: 'Adit M.',
    note: 'Confetti Confection · adult party',
  },
]

const includes = [
  { k: 'Studio rental', v: 'The whole kitchen, to yourselves' },
  { k: 'Live frosting bar', v: '40+ toppings, real piping bags' },
  { k: 'Dedicated host', v: 'Names, allergies, photos, cleanup' },
  { k: 'Take-home boxes', v: 'Ribbon-tied, named, ready to go' },
]

const heroStats = [
  { k: '120+', l: 'Parties hosted' },
  { k: '4.9', l: 'Avg. parent rating' },
  { k: '0', l: 'Messy kitchens left' },
]

export default function BdayPartyPage() {
  const [activePack, setActivePack] = useState<PackId>('sprinkle')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: '',
    slot: 'afternoon',
    headcount: '10',
    pack: 'sprinkle' as PackId,
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const selectedPack = useMemo(() => packs.find((p) => p.id === activePack)!, [activePack])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="bake-canvas bg-ivory text-cocoa">
      <JsonLd />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative bg-ivory">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 pt-12 pb-20 md:grid-cols-12 md:gap-16 md:px-10 md:pt-20 md:pb-28">
          {/* Copy */}
          <div className="flex flex-col justify-center md:col-span-6">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bake-eyebrow"
            >
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Birthday parties · Studio &amp; off-site
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
              className="bake-display-xl mt-6 max-w-[18ch]"
            >
              Where the wish{' '}
              <span className="bake-display-italic text-rose-accent">meets the whisk.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="bake-body-lg mt-7 max-w-[52ch]"
            >
              We hand over the studio, the frosting bar, and a baker with a microphone. You bring the
              birthday kid and the guests. Two hours later everyone leaves with a box of cupcakes they
              piped themselves &mdash; and a kitchen we&rsquo;ll clean ourselves, thank you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <Link href="#book" className="bake-btn">
                Reserve your date <span aria-hidden>→</span>
              </Link>
              <Link href="#packs" className="bake-btn bake-btn-ghost">
                See party packs
              </Link>
              <span className="bake-caption ml-1 text-taupe">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint-accent align-middle mr-2" />
                4 slots open in May
              </span>
            </motion.div>

            {/* Stat strip */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-[520px]">
              {heroStats.map((s) => (
                <div key={s.l} className="border-t border-line pt-3">
                  <p className="font-bake-display text-[28px] font-medium leading-none text-cocoa md:text-[32px]">
                    {s.k}
                  </p>
                  <p className="bake-caption mt-2 text-taupe">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image + floating mini cards */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative md:col-span-6"
          >
            <ImagePlaceholder
              ratio="aspect-[4/5]"
              tone="rose"
              rounded="xl"
              label="Birthday party — frosting bar"
              hint="Cupcake tower, kids piping, sprinkles in the foreground"
            />

            {/* Bottom-left card */}
            <div className="absolute -bottom-6 left-4 hidden w-[240px] rounded-2xl border border-line bg-white p-4 shadow-[0_18px_40px_-18px_rgba(46,31,21,0.18)] md:block">
              <p className="bake-caption text-taupe">Now booking</p>
              <p className="font-bake-display mt-1 text-[20px] font-medium text-cocoa">
                May — June 2026
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="bake-body-sm text-cocoa-soft">Saturdays book fastest</span>
                <span className="bake-badge bake-badge-rose">Hot</span>
              </div>
            </div>

            {/* Top-right dark card */}
            <div className="absolute -top-4 -right-4 hidden w-[200px] rounded-2xl bg-cocoa p-4 text-ivory md:block">
              <p className="bake-caption text-cream-deep/70">Every party starts with</p>
              <p className="font-bake-display mt-1 text-[18px] font-medium leading-snug">
                A live piping demo
              </p>
              <p className="bake-body-sm mt-2 text-cream-deep/80">By the baker who frosts your tower.</p>
            </div>
          </motion.div>
        </div>

        {/* Soft divider */}
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="bake-divider" />
        </div>
      </section>

      {/* ─── INCLUDED STRIP (cream section) ────────────────── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Every party includes
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                One price,{' '}
                <span className="bake-display-italic text-rose-accent">no surprises.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[42ch]">
                Whichever pack you pick, everything below is already in. We&rsquo;ve hosted a hundred-and-twenty
                of these &mdash; the surprises are good ones.
              </p>
            </div>

            <div className="md:col-span-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
                {includes.map((s, i) => (
                  <div
                    key={s.k}
                    className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-6 transition-all duration-300 hover:border-rose-accent hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
                  >
                    <span
                      aria-hidden
                      className="font-bake-display absolute -right-2 -bottom-6 text-[88px] leading-none font-medium text-rose/40 transition-colors group-hover:text-rose-deep/60"
                    >
                      0{i + 1}
                    </span>
                    <p className="bake-caption relative text-taupe">{s.k}</p>
                    <p className="font-bake-display relative mt-2 text-[18px] font-medium leading-snug text-cocoa md:text-[20px]">
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARTY PACKS ───────────────────────────────────── */}
      <section id="packs" className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-12 text-center">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              The three packs
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-lg mt-4 max-w-[24ch] mx-auto">
              Pick a size.{' '}
              <span className="bake-display-italic text-rose-accent">We&rsquo;ll do the rest.</span>
            </h2>
            <p className="bake-body mt-6 mx-auto max-w-[58ch]">
              Every pack is fully hosted. Add anything from the add-on shelf. Deposit is 30%, the balance
              is due 48 hours before &mdash; and we&rsquo;ll always tell you which Saturday is the worst one
              to ask for.
            </p>
          </div>

          {/* Pill toggle */}
          <div className="flex flex-wrap justify-center gap-2">
            {packs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePack(p.id)
                  setForm((f) => ({ ...f, pack: p.id }))
                }}
                className={
                  'rounded-full px-5 py-2 text-[13px] font-medium tracking-wide transition-colors ' +
                  (activePack === p.id
                    ? 'bg-cocoa text-ivory'
                    : 'border border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa')
                }
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {packs.map((p) => {
              const active = p.id === activePack
              const surface =
                p.tone === 'cream'
                  ? 'bg-cream'
                  : p.tone === 'rose'
                    ? 'bg-rose'
                    : 'bg-gold-soft'
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45 }}
                  className={
                    'relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 ' +
                    (active
                      ? `${surface} border-rose-accent md:scale-[1.02] shadow-[0_24px_56px_-28px_rgba(46,31,21,0.25)]`
                      : 'bg-white border-line hover:border-rose-accent hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.18)]')
                  }
                >
                  {p.badge && (
                    <span className="bake-badge bake-badge-rose absolute right-6 top-6">
                      {p.badge}
                    </span>
                  )}

                  <p className="bake-caption text-taupe">{p.tag}</p>
                  <h3 className="font-bake-display mt-2 text-[28px] font-medium leading-tight text-cocoa md:text-[32px]">
                    {p.name}
                  </h3>
                  <p className="bake-body-sm mt-1 text-cocoa-soft">{p.highlight}</p>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-bake-display text-[36px] font-medium leading-none text-cocoa md:text-[44px]">
                      ${p.price.toLocaleString('en-AU')}
                    </span>
                    <span className="bake-caption text-taupe">{p.perGuest}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-cocoa-soft">
                    <span>{p.headcount}</span>
                    <span aria-hidden className="text-rose-accent">·</span>
                    <span>{p.duration}</span>
                  </div>

                  <ul className="mt-7 space-y-3 border-t border-line pt-6">
                    {p.includes.map((line) => (
                      <li key={line} className="flex items-start gap-3 bake-body-sm">
                        <svg
                          aria-hidden
                          className="mt-[5px] h-3.5 w-3.5 shrink-0 text-rose-accent"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2.5 7.5 L 6 11 L 12 3" />
                        </svg>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link
                      href="#book"
                      onClick={() => {
                        setActivePack(p.id)
                        setForm((f) => ({ ...f, pack: p.id }))
                      }}
                      className={active ? 'bake-btn bake-btn-rose' : 'bake-btn bake-btn-ghost'}
                    >
                      Book {p.name}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── RUN OF SHOW (cream section) ───────────────────── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Run of show
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                Two hours,{' '}
                <span className="bake-display-italic text-rose-accent">perfectly paced.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[42ch]">
                Every party follows the same rhythm &mdash; long enough to feel special, short enough that
                nobody hits sugar-meltdown. Your host keeps the tempo.
              </p>
              <p className="bake-script mt-8">made for memorable mornings</p>
            </div>
            <ol className="md:col-span-7 relative">
              {/* Vertical rose line */}
              <span
                aria-hidden
                className="absolute left-[64px] top-2 bottom-2 w-px bg-rose-deep md:left-[80px]"
              />
              {runOfShow.map((r, i) => (
                <li key={r.time} className="relative grid grid-cols-12 gap-4 py-5 md:gap-8">
                  <div className="col-span-3 md:col-span-2 pl-2">
                    <span className="font-bake-display text-[18px] font-medium text-cocoa md:text-[20px]">
                      {r.time}
                    </span>
                  </div>
                  <div className="relative col-span-9 md:col-span-10">
                    {/* Bullet dot */}
                    <span
                      aria-hidden
                      className="absolute -left-[18px] top-2 inline-flex h-3 w-3 items-center justify-center rounded-full bg-rose-accent ring-4 ring-cream md:-left-[26px]"
                    />
                    <h3 className="font-bake-display text-[18px] font-medium leading-snug text-cocoa md:text-[20px]">
                      {r.title}
                    </h3>
                    <p className="bake-body mt-2 max-w-[52ch]">{r.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── FLAVOR PICKS ──────────────────────────────────── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Party menu
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[20ch]">
                Six flavors{' '}
                <span className="bake-display-italic text-rose-accent">on the wall.</span>
              </h2>
            </div>
            <p className="bake-body max-w-[42ch]">
              Pick any three for the bake, or hand it to the kids and let them argue. Eggless and vegan
              versions of every flavor &mdash; just tell us at booking.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {flavors.map((f) => (
              <article
                key={f.name}
                className="bake-card bake-img-zoom group relative overflow-hidden"
              >
                <div className="relative">
                  <ImagePlaceholder
                    ratio="aspect-[5/4]"
                    tone={f.tone as 'cream' | 'rose' | 'mint' | 'beige' | 'gold' | 'cocoa'}
                    rounded="none"
                    label={f.name}
                    hint={f.desc}
                  />
                  {f.badge && (
                    <span className="bake-badge bake-badge-rose absolute left-4 top-4">{f.badge}</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bake-display text-[20px] font-medium text-cocoa">{f.name}</h3>
                  <p className="bake-body-sm mt-2">{f.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/cupcake-builder"
              className="font-bake-body inline-flex items-center text-[14px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent hover:text-cocoa"
            >
              Or build a custom box <span aria-hidden className="ml-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ADD-ONS (cream section) ───────────────────────── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Add-on shelf
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[24ch]">
                Pile it on,{' '}
                <span className="bake-display-italic text-rose-accent">or keep it simple.</span>
              </h2>
            </div>
            <p className="bake-body max-w-[42ch]">
              Everything below is à la carte. Add at booking or up to a week before the party.
            </p>
          </div>

          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {addOns.map((a, i) => (
              <li
                key={a.name}
                className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-6 transition-all duration-300 hover:border-rose-accent hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
              >
                <span
                  aria-hidden
                  className="font-bake-display absolute -right-2 -bottom-6 text-[88px] leading-none font-medium text-rose/40 transition-colors group-hover:text-rose-deep/60"
                >
                  0{i + 1}
                </span>
                <div className="relative flex items-start justify-between gap-4">
                  <h3 className="font-bake-display text-[18px] font-medium leading-snug text-cocoa md:text-[20px]">
                    {a.name}
                  </h3>
                  <span className="bake-badge bake-badge-gold shrink-0">{a.price}</span>
                </div>
                <p className="bake-body-sm relative mt-3">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-12 text-center">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              What parents say
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-lg mt-4 max-w-[24ch] mx-auto">
              The reviews we keep{' '}
              <span className="bake-display-italic text-rose-accent">on the fridge.</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-line bg-cream-deep p-8 md:p-10"
              >
                <svg
                  aria-hidden
                  className="h-8 w-8 text-rose-accent"
                  viewBox="0 0 32 32"
                  fill="currentColor"
                >
                  <path d="M9 22q-2 0-3.5-1.5T4 17q0-3 2-5.5T11 8l1 2q-2 1-3 2.5T8 15h1q1.5 0 2.5 1t1 2.5q0 1.5-1 2.5T9 22zm12 0q-2 0-3.5-1.5T16 17q0-3 2-5.5T23 8l1 2q-2 1-3 2.5T20 15h1q1.5 0 2.5 1t1 2.5q0 1.5-1 2.5T21 22z" />
                </svg>
                <blockquote>
                  <p className="font-bake-display mt-4 text-[22px] italic leading-snug text-cocoa md:text-[24px]">
                    {t.quote}
                  </p>
                </blockquote>
                <figcaption className="mt-6 flex items-center justify-between border-t border-line pt-4">
                  <span className="font-bake-body text-[14px] font-medium text-cocoa">
                    — {t.name}
                  </span>
                  <span className="bake-caption text-taupe">{t.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOOKING FORM (cocoa dark section) ─────────────── */}
      <section id="book" className="bg-cocoa py-20 text-ivory md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Block your date
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch] text-ivory">
                Tell us about the{' '}
                <span className="bake-display-italic text-rose-accent">birthday kid.</span>
              </h2>
              <p className="bake-body-lg mt-6 max-w-[42ch] text-cream-deep/85">
                We&rsquo;ll confirm the slot within four working hours and send a checklist for the parents.
                No deposit charged until you say go.
              </p>

              <div className="mt-10 space-y-6">
                <div>
                  <p className="bake-caption text-cream-deep/70">Studio</p>
                  <p className="font-bake-display mt-2 text-[18px] text-ivory">
                    352 Princes Hwy, Narre Warren, Melbourne
                  </p>
                </div>
                <div>
                  <p className="bake-caption text-cream-deep/70">Phone the team</p>
                  <a
                    href="tel:+61398765432"
                    className="font-bake-display mt-2 inline-block text-[22px] text-ivory underline underline-offset-4 decoration-rose-accent hover:text-rose-deep"
                  >
                    03 9876 5432
                  </a>
                </div>
                <div>
                  <p className="bake-caption text-cream-deep/70">Slot windows</p>
                  <p className="bake-body mt-2 text-cream-deep/90">
                    Mornings 11 — 13 · Afternoons 15 — 17 · Evenings 18 — 20
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              {submitted ? (
                <div className="rounded-2xl border border-cream-deep/20 bg-ivory/[0.06] p-10">
                  <p className="bake-eyebrow text-rose-deep">
                    <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                    Got it
                  </p>
                  <h3 className="font-bake-display mt-4 text-[28px] font-medium text-ivory md:text-[32px]">
                    We&rsquo;ll call you back today.
                  </h3>
                  <p className="bake-body mt-4 max-w-[48ch] text-cream-deep/85">
                    Your date is pencilled in. Watch for a confirmation from{' '}
                    <span className="text-ivory">parties@cupcakedesires.com</span> &mdash; once you reply,
                    the studio is yours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="bake-btn bake-btn-ghost mt-8"
                    style={{
                      color: 'var(--color-ivory)',
                      borderColor: 'rgba(251,243,232,0.5)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-cream-deep/15 bg-ivory/[0.04] p-7 md:p-10"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Parent's name"
                      value={form.name}
                      onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                      required
                    />
                    <Field
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                      required
                    />
                    <Field
                      label="Preferred date"
                      type="date"
                      value={form.date}
                      onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                      required
                    />
                    <SelectField
                      label="Slot window"
                      value={form.slot}
                      onChange={(v) => setForm((f) => ({ ...f, slot: v }))}
                      options={[
                        { v: 'morning', l: 'Morning · 11 — 13' },
                        { v: 'afternoon', l: 'Afternoon · 15 — 17' },
                        { v: 'evening', l: 'Evening · 18 — 20' },
                      ]}
                    />
                    <Field
                      label="Headcount"
                      type="number"
                      value={form.headcount}
                      onChange={(v) => setForm((f) => ({ ...f, headcount: v }))}
                      required
                    />
                    <SelectField
                      label="Party pack"
                      value={form.pack}
                      onChange={(v) => {
                        setForm((f) => ({ ...f, pack: v as PackId }))
                        setActivePack(v as PackId)
                      }}
                      options={packs.map((p) => ({ v: p.id, l: p.name }))}
                    />
                  </div>

                  <div className="mt-5">
                    <label className="block">
                      <span className="bake-caption text-cream-deep/70">
                        Anything we should know (allergies, theme, surprises)
                      </span>
                      <textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        className="mt-2 block w-full rounded-xl border border-cream-deep/25 bg-transparent px-4 py-3 text-ivory placeholder:text-cream-deep/40 focus:border-rose-accent focus:outline-none"
                        placeholder="Birthday kid is turning 7, loves dinosaurs, mild peanut allergy…"
                      />
                    </label>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                    <p className="bake-body-sm text-cream-deep/80">
                      Choosing <span className="text-ivory">{selectedPack.name}</span> · $
                      {selectedPack.price.toLocaleString('en-AU')} base
                    </p>
                    <button type="submit" className="bake-btn bake-btn-rose">
                      Request this date <span aria-hidden>→</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ (cream section, homepage pattern) ─────────── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                The fine print
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                Six things{' '}
                <span className="bake-display-italic text-rose-accent">parents ask first.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[40ch]">
                Didn&rsquo;t see your question? Write to{' '}
                <a
                  href="mailto:parties@cupcakedesires.com"
                  className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                >
                  parties@cupcakedesires.com
                </a>{' '}
                &mdash; the host who&rsquo;ll run your party is the one who replies.
              </p>
            </div>

            <div className="md:col-span-7">
              <ul className="divide-y divide-line border-y border-line">
                {faqs.map((f, i) => {
                  const isOpen = openFaq === i
                  return (
                    <li key={f.q}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-rose-accent"
                      >
                        <span className="font-bake-display text-[18px] font-medium text-cocoa md:text-[20px]">
                          {f.q}
                        </span>
                        <span
                          aria-hidden
                          className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-cocoa transition-transform ${
                            isOpen ? 'rotate-45 border-rose-accent bg-rose-accent text-white' : ''
                          }`}
                        >
                          +
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <p
                              className="bake-body pb-6 pr-12 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: f.a }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-rose px-8 py-16 text-center md:px-16 md:py-24">
            {/* Decorative watermark */}
            <span
              aria-hidden
              className="font-bake-display pointer-events-none absolute -right-8 -bottom-12 text-[220px] leading-none font-medium text-rose-deep/40 md:text-[280px]"
            >
              ✻
            </span>

            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              One last thing
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-xl relative mx-auto mt-5 max-w-[18ch]">
              Block your{' '}
              <span className="bake-display-italic text-rose-accent">Saturday.</span>
            </h2>
            <p className="bake-body-lg relative mx-auto mt-6 max-w-[52ch]">
              Most weekends are gone six weeks ahead. If you&rsquo;re thinking about it, pencil it in now
              &mdash; we&rsquo;ll hold the slot for forty-eight hours, no deposit.
            </p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-4">
              <Link href="#book" className="bake-btn">
                Reserve your date <span aria-hidden>→</span>
              </Link>
              <a href="tel:+61398765432" className="bake-btn bake-btn-ghost">
                Or call the studio
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="bake-caption text-cream-deep/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-2 block w-full rounded-xl border border-cream-deep/25 bg-transparent px-4 py-3 text-ivory placeholder:text-cream-deep/40 focus:border-rose-accent focus:outline-none [color-scheme:dark]"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <label className="block">
      <span className="bake-caption text-cream-deep/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full appearance-none rounded-xl border border-cream-deep/25 bg-transparent px-4 py-3 text-ivory focus:border-rose-accent focus:outline-none [color-scheme:dark]"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="text-cocoa">
            {o.l}
          </option>
        ))}
      </select>
    </label>
  )
}
