'use client'

import CorporateQuotePopup from '@/components/CorporateQuotePopup'
import CountUp from '@/components/CountUp'
import ImagePlaceholder from '@/components/ImagePlaceholder'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

/* ─────────────────── Page data ─────────────────── */

const stats: { value: number; suffix: string; format?: 'compact' | 'comma' | 'plain'; decimals?: number; label: string }[] = [
  { value: 500, suffix: '+', label: 'Companies served' },
  { value: 120000, suffix: '', format: 'compact', label: 'Corporate cupcakes delivered / year' },
  { value: 24, suffix: 'h', label: 'Average turnaround for bulk orders' },
  { value: 4.9, suffix: ' ★', decimals: 1, label: 'Across 2,800+ corporate reviews' },
]

const services = [
  {
    title: 'Edible logos & branding',
    body: 'Hand-printed edible images, custom-coloured frosting, branded box wraps — your identity, baked in.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="13" />
        <path d="M16 5 V 27" />
        <path d="M5 16 H 27" />
      </svg>
    ),
  },
  {
    title: 'Premium ingredients',
    body: 'Madagascar vanilla, Belgian chocolate, farm butter. The same recipes our regulars come back for, scaled cleanly.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3 L 20 12 L 29 13 L 22 19 L 24 28 L 16 23 L 8 28 L 10 19 L 3 13 L 12 12 Z" />
      </svg>
    ),
  },
  {
    title: 'Dietary range, by default',
    body: 'Eggless, vegan and gluten-free options on every menu. No add-on cost, no two-week notice required.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 5 C 16 5, 9 12, 9 22 C 9 26, 12 27, 15 25 C 22 22, 27 14, 27 5 Z" />
        <path d="M9 24 L 4 29" />
      </svg>
    ),
  },
  {
    title: 'Delivered to your venue',
    body: 'Single or multi-venue routing across Greater Melbourne. Refrigerated transport. We need 5 to 7 days’ notice on event runs — book the date early.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="16" height="12" rx="1.5" />
        <path d="M19 13 L 24 13 L 29 18 L 29 22 L 19 22" />
        <circle cx="9" cy="24" r="2.5" />
        <circle cx="23" cy="24" r="2.5" />
      </svg>
    ),
  },
]

const tiers = [
  {
    name: 'Starter',
    range: '50 — 99 cupcakes',
    pricePerCupcake: '$4.80',
    blurb: 'Small team gatherings, client thank-yous, milestone celebrations.',
    features: [
      'Up to 4 flavours',
      'Standard kraft box, branded sticker',
      'Melbourne metro delivery on your chosen date',
      'Digital invoice + GST',
    ],
  },
  {
    name: 'Standard',
    range: '100 — 499 cupcakes',
    pricePerCupcake: '$4.20',
    blurb: 'Product launches, office events, all-hands celebrations.',
    features: [
      'Up to 8 flavours',
      'Custom-printed gift box',
      'Edible logos on each cupcake',
      'Multi-venue delivery',
      'Dedicated coordinator',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    range: '500+ cupcakes',
    pricePerCupcake: 'Custom',
    blurb: 'Annual gifting programs, conferences, multi-city rollouts.',
    features: [
      'Unlimited custom flavours',
      'Bespoke packaging design',
      'Branded inserts & note cards',
      'Australia-wide distribution',
      'Recurring delivery schedules',
      'Net-30 invoicing available',
    ],
  },
]

const steps = [
  {
    n: '01',
    title: 'Brief',
    body: 'Tell us your headcount, occasion, brand colours, and delivery dates. Two-minute form or a 10-minute call.',
  },
  {
    n: '02',
    title: 'Design',
    body: 'Our team mocks up the edible artwork and packaging. Two rounds of revisions included.',
  },
  {
    n: '03',
    title: 'Bake',
    body: 'Every cupcake hand-frosted the morning of your delivery. Real butter, real vanilla, real time on each one.',
  },
  {
    n: '04',
    title: 'Deliver',
    body: 'Refrigerated transport to single or multi-venue locations. Tracking link sent the morning of delivery.',
  },
]

const testimonials = [
  {
    quote:
      'Ordered 800 cupcakes for our IPO listing day. They handled four venues across Melbourne and the edible logos were sharper than our printed swag. Our employees still talk about them.',
    name: 'Olivia Bennett',
    role: 'Director, Brand Marketing · ASX-listed Fintech',
  },
  {
    quote:
      'We use CupCake Desires for every quarterly client gifting cycle. 200+ boxes, 5 cities, never a hiccup. Their account manager is on WhatsApp at 11pm if we need her.',
    name: 'James Whitmore',
    role: 'Head of Customer Success · SaaS Scaleup',
  },
  {
    quote:
      'Their eggless and vegan range is the reason we switched from our old vendor. The team has serious dietary needs and CupCake Desires made it a non-issue.',
    name: 'Priya Patel',
    role: 'People Operations Lead · Global Consultancy',
  },
]

const faqs = [
  {
    q: 'How much lead time do you need for a corporate order?',
    a: 'Up to 100 standard cupcakes — 48 hours. 100–500 cupcakes — 72 hours. 500+ with custom edible branding — 5 working days. Rush orders are possible for an extra 15% charge.',
  },
  {
    q: 'Do you offer GST invoices and Net-30 billing?',
    a: 'Yes. Every corporate order includes a GST-compliant invoice. We offer Net-15 by default, and Net-30 for clients with an established relationship or signed MSA.',
  },
  {
    q: 'Can you brand the cupcakes with our company logo?',
    a: 'Yes — edible-ink logos printed on rice paper, embedded into the frosting. We can also do custom-coloured icing, branded packaging, and printed note cards inside each box.',
  },
  {
    q: 'Which cities do you deliver to?',
    a: 'Melbourne metro is our home turf. We cover Victoria-wide for event runs by refrigerated courier — let us know your venue and we&rsquo;ll route it. Interstate gifting is possible on bigger lead times.',
  },
  {
    q: 'How much notice do you need for an event order?',
    a: 'Every order needs at least 2 days&rsquo; notice, but event boxes — weddings, conferences, multi-venue corporate runs — usually take 5 to 7 days from brief to delivery. We&rsquo;re a bake-to-order kitchen with no walk-in store, so locking the date early matters.',
  },
  {
    q: 'Can you handle multi-venue deliveries on the same day?',
    a: 'Yes — once the order is booked. Our largest single-day run was 22 venues across Melbourne. Multi-venue logistics are managed by your dedicated corporate coordinator.',
  },
  {
    q: 'Do you have eggless and vegan options at scale?',
    a: 'Every flavour on our menu has an eggless version, and we have a dedicated vegan range. No minimum order limits or surcharges for dietary options.',
  },
]

/* ─────────────────── Page ─────────────────── */

export default function CorporatePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    date: '',
    quantity: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  /* ─── Popup state ─── */
  const [popupOpen, setPopupOpen] = useState(false)
  const [showStickyCta, setShowStickyCta] = useState(false)

  /* Auto-trigger popup after 25s, once per session */
  useEffect(() => {
    const key = 'cd-corporate-popup-shown'
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(key) === '1') return

    const timer = setTimeout(() => {
      setPopupOpen(true)
      sessionStorage.setItem(key, '1')
    }, 25000)
    return () => clearTimeout(timer)
  }, [])

  /* Sticky floating CTA after scrolling past the hero */
  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subject: `Corporate enquiry · ${form.quantity || 'qty?'} cupcakes for ${form.company || 'company?'}`,
        }),
      })
      if (res.ok) {
        setIsSubmitted(true)
        setForm({ name: '', company: '', email: '', phone: '', date: '', quantity: '', message: '' })
      } else {
        setError('Failed to send. Please try again or email corporate@cupcakedesires.com.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bake-canvas">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 md:items-center">
            <div className="md:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bake-eyebrow"
              >
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Corporate gifting · trusted by 500+ brands
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.05 }}
                className="bake-display-xl mt-6 max-w-[18ch]"
              >
                Corporate cupcakes that{' '}
                <span className="bake-display-italic text-rose-accent">mean business.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.12 }}
                className="bake-body-lg mt-7 max-w-[60ch]"
              >
                Australia&rsquo;s most-loved corporate cupcake partner. Edible logos, custom-branded
                packaging, multi-venue delivery, and dietary range as standard — from a 50-box client
                thank-you to a 5,000-box annual gifting program.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.18 }}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <button onClick={() => setPopupOpen(true)} className="bake-btn bake-btn-rose">
                  Get a quote in 24h <span aria-hidden>→</span>
                </button>
                <Link
                  href="tel:+61398765432"
                  className="font-bake-body text-[14px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                >
                  Or talk to our team · 03 9876 5432
                </Link>
              </motion.div>

              {/* Price-match badge */}
              <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-line bg-ivory px-5 py-3">
                <span className="bake-caption text-rose-accent">Price-match guarantee</span>
                <span className="bake-body-sm text-cocoa">
                  Received a lower quote? Email it &mdash; we&rsquo;ll beat it by{' '}
                  <strong className="font-bake-display font-semibold">5%</strong>.
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="md:col-span-5"
            >
              <div className="relative">
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl bg-cream-deep">
                  <Image
                    src="/images/Banner-3.webp"
                    alt="Corporate cupcakes with edible branded logos"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>

                {/* Floating credentials chips */}
                <div className="absolute -top-5 -right-5 hidden rounded-2xl border border-line bg-ivory px-5 py-4 shadow-[0_18px_40px_-18px_rgba(46,31,21,0.25)] md:block">
                  <p className="bake-caption text-taupe">Avg. order</p>
                  <p className="font-bake-display mt-1 text-[28px] leading-none font-medium text-cocoa">
                    240 boxes
                  </p>
                </div>
                <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-full border border-line bg-ivory px-5 py-3 shadow-[0_14px_30px_-14px_rgba(46,31,21,0.25)] md:flex">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-accent" />
                  <p className="bake-caption text-cocoa">Booking 4 weeks ahead</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="border-y border-line bg-ivory py-14 md:py-16">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-12">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="text-center md:text-left"
              >
                <p
                  className="font-bake-display text-[36px] font-medium text-cocoa md:text-[48px]"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  <CountUp
                    to={s.value}
                    suffix={s.suffix}
                    decimals={s.decimals ?? 0}
                    format={s.format ?? 'plain'}
                  />
                </p>
                <p className="bake-caption mt-2 text-taupe">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMPRESS CLIENTS — editorial copy block ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Made for the occasion
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[22ch]">
                Impress clients with Melbourne&rsquo;s best{' '}
                <span className="bake-display-italic text-rose-accent">corporate cupcakes.</span>
              </h2>
              <div className="mt-7 space-y-5">
                <p className="bake-body-lg max-w-[60ch]">
                  Make your next business event one your team won&rsquo;t forget. CupCake Desires is
                  Melbourne&rsquo;s most-trusted corporate cupcake partner — handcrafted, served at
                  scale, with vegan and gluten-free options as standard, fancy presentation, and a
                  personalised approach to every brand we bake for.
                </p>
                <p className="bake-body max-w-[62ch]">
                  Whether you&rsquo;re thanking a 50-person team, welcoming Fortune-500 clients, or
                  celebrating a milestone with 5,000 employees across cities — we turn it into a
                  high-end edible moment that matches your corporate identity. Edible logos,
                  hand-written messages, branded packaging, multi-city delivery — all standard.
                </p>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-cream-deep">
                <Image
                  src="/images/Banner-4.webp"
                  alt="Corporate event with branded cupcakes"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY US — 4 services ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:gap-12 md:items-end">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Why companies choose us
              </p>
              <h2 className="bake-display-lg mt-5">
                Built for business,{' '}
                <span className="bake-display-italic text-rose-accent">baked like home.</span>
              </h2>
            </div>
            <p className="bake-body md:col-span-5">
              From a 50-cupcake board meeting to a 5,000-cupcake annual gifting drive — same kitchen,
              same standards, same care.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group rounded-2xl border border-line bg-cream p-8 transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent transition-all duration-300 group-hover:bg-rose-accent group-hover:border-rose-accent group-hover:text-white">
                  {s.icon}
                </div>
                <h3 className="font-bake-display mt-6 text-[20px] font-medium text-cocoa">
                  {s.title}
                </h3>
                <p className="bake-body-sm mt-3 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── A DELICIOUS CHOICE — flavours editorial ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 md:items-center">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                A delicious choice for your company
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[22ch]">
                24 flavours.{' '}
                <span className="bake-display-italic text-rose-accent">
                  One non-negotiable standard.
                </span>
              </h2>
              <div className="mt-7 space-y-5">
                <p className="bake-body-lg max-w-[60ch]">
                  We believe no corporate event is complete without a sweet touch. CupCake Desires
                  bakes cakes and branded corporate cupcakes in small, fresh batches with
                  single-origin ingredients. Over 24 decadent flavours &mdash; Red Velvet,
                  Cookies &amp; Cream, Classic Vanilla, Salted Caramel, Molten Chocolate, Pistachio
                  Rose, and more &mdash; with custom corporate flavours for every occasion: product
                  launches, client milestones, all-hands celebrations.
                </p>
                <p className="bake-body max-w-[62ch]">
                  Corporate logo mini cupcakes &mdash; your logo printed on edible toppers
                  &mdash; put your brand front and centre at meetings, launches, and team events. Our
                  gluten-free, vegan, and eggless ranges ensure every employee, client, and partner
                  gets a bite of sweetness alongside dignity and choice. Trusted as Australia&rsquo;s
                  most reliable corporate cupcake brand &mdash; we turn every order into a
                  delicious, professional, and unforgettable experience.
                </p>
              </div>

              {/* Flavour pills */}
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  'Red Velvet',
                  'Cookies & Cream',
                  'Classic Vanilla',
                  'Salted Caramel',
                  'Molten Chocolate',
                  'Pistachio Rose',
                  'Hazelnut Heaven',
                  'Coconut',
                  'Mocha',
                  'Rocky Road',
                  '+ 14 more',
                ].map((f, i) => (
                  <span
                    key={f}
                    className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${
                      i === 10
                        ? 'border-rose-accent bg-rose-accent text-white'
                        : 'border-line bg-ivory text-cocoa-soft'
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-5"
            >
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-cream-deep">
                <Image
                  src="/images/Banner-1.webp"
                  alt="Branded corporate cupcakes with edible logos"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CUSTOMISATION SHOWCASE ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16 md:items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-6"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-deep">
                <Image
                  src="/images/Banner-2.webp"
                  alt="Cupcakes with edible company logos in branded packaging"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </motion.div>

            <div className="md:col-span-6">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Custom branding · edible artwork
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                Your brand, baked{' '}
                <span className="bake-display-italic text-rose-accent">into every frosting.</span>
              </h2>
              <p className="bake-body-lg mt-6 max-w-[55ch]">
                Edible-ink logos on rice paper, custom-coloured Italian buttercream matched to your
                brand guidelines, printed kraft boxes with your hashtag, and hand-written note cards
                tucked into each box.
              </p>

              <ul className="mt-10 space-y-5 border-t border-line pt-8">
                {[
                  'Vector-precise edible logos on every cupcake',
                  'Brand-matched icing colours (Pantone reference accepted)',
                  'Custom box wraps, ribbon, and inserts',
                  'Hand-written or printed note cards',
                  'NDA-friendly — your designs stay with our studio',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-accent text-rose-accent"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 5 L 4 7 L 8 3" />
                      </svg>
                    </span>
                    <span className="bake-body">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING / BOX TIERS ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 text-center md:mb-20">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Corporate packages
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[22ch] mx-auto">
              Three tiers,{' '}
              <span className="bake-display-italic text-rose-accent">one promise.</span>
            </h2>
            <p className="bake-body mt-5 max-w-[58ch] mx-auto">
              Transparent volume pricing. Same kitchen, same recipes, scaled cleanly to your headcount.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-2xl border p-8 md:p-10 ${
                  t.featured
                    ? 'border-cocoa bg-cocoa text-ivory'
                    : 'border-line bg-cream text-cocoa'
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-rose-accent px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                    Most popular
                  </span>
                )}
                <p
                  className={`bake-caption ${t.featured ? 'text-rose-deep' : 'text-taupe'}`}
                >
                  {t.name}
                </p>
                <h3
                  className={`font-bake-display mt-2 text-[26px] font-medium ${
                    t.featured ? 'text-ivory' : 'text-cocoa'
                  }`}
                >
                  {t.range}
                </h3>
                <div className="mt-6 flex items-baseline gap-2">
                  <span
                    className={`font-bake-display text-[40px] font-medium ${
                      t.featured ? 'text-ivory' : 'text-cocoa'
                    }`}
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {t.pricePerCupcake}
                  </span>
                  {t.pricePerCupcake !== 'Custom' && (
                    <span
                      className={`bake-body-sm ${
                        t.featured ? 'text-cream-deep/80' : 'text-taupe'
                      }`}
                    >
                      / cupcake
                    </span>
                  )}
                </div>
                <p
                  className={`bake-body-sm mt-4 ${
                    t.featured ? 'text-cream-deep/85' : 'text-cocoa-soft'
                  }`}
                >
                  {t.blurb}
                </p>

                <ul className="mt-8 flex-1 space-y-3 border-t pt-7"
                  style={{ borderColor: t.featured ? 'rgba(255,251,246,0.18)' : 'var(--color-line)' }}
                >
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          t.featured ? 'text-rose-deep' : 'text-rose-accent'
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6 L 5 9 L 10 3" />
                        </svg>
                      </span>
                      <span
                        className={`bake-body-sm ${
                          t.featured ? 'text-cream-deep/95' : 'text-cocoa-soft'
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="#quote"
                  className={`mt-10 ${
                    t.featured ? 'bake-btn bake-btn-rose' : 'bake-btn bake-btn-ghost'
                  } w-full`}
                >
                  Request {t.name.toLowerCase()} quote <span aria-hidden>→</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-10 md:mb-14">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              How it works
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[24ch]">
              From brief to delivery,{' '}
              <span className="bake-display-italic text-rose-accent">handled.</span>
            </h2>
          </div>

          <ol className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-12 right-0 top-7 hidden h-px bg-line md:block"
                  />
                )}
                <span className="font-bake-display flex h-14 w-14 items-center justify-center rounded-full border border-rose-accent bg-ivory text-[18px] font-medium text-rose-accent">
                  {s.n}
                </span>
                <h3 className="font-bake-display mt-6 text-[22px] font-medium text-cocoa">
                  {s.title}
                </h3>
                <p className="bake-body-sm mt-3 max-w-[28ch]">{s.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 text-center md:mb-20">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              What corporate clients say
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-lg mt-5 max-w-[26ch] mx-auto">
              Trusted by the brands that{' '}
              <span className="bake-display-italic text-rose-accent">don&rsquo;t cut corners.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex flex-col gap-5 rounded-2xl border border-line bg-cream p-7"
              >
                <span
                  aria-hidden
                  className="font-bake-display block text-[60px] leading-none text-rose-accent"
                >
                  &ldquo;
                </span>
                <blockquote className="bake-body text-cocoa leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-auto border-t border-line pt-5">
                  <p className="font-bake-display text-[16px] font-medium text-cocoa">{t.name}</p>
                  <p className="bake-caption mt-1 text-taupe">{t.role}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Corporate FAQ
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                The things companies{' '}
                <span className="bake-display-italic text-rose-accent">ask us most.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[40ch]">
                Still have a question? Email{' '}
                <a
                  href="mailto:corporate@cupcakedesires.com"
                  className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                >
                  corporate@cupcakedesires.com
                </a>{' '}
                or call our corporate team directly on 03 9876 5432.
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
                            <p className="bake-body pb-6 pr-12 leading-relaxed">{f.a}</p>
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

      {/* ─── QUOTE FORM ─── */}
      <section id="quote" className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Only the best for our corporate clients
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[20ch]">
                Tell us about{' '}
                <span className="bake-display-italic text-rose-accent">your event.</span>
              </h2>

              <div className="mt-7 space-y-4">
                <p className="bake-body-lg max-w-[46ch]">
                  To get started, just upload your logo, fill out the brief below, and our corporate
                  team will get back within 24 hours with a tailored quote and a mock-up for custom
                  branding.
                </p>
                <p className="bake-body max-w-[48ch]">
                  Prefer email or phone? Reach{' '}
                  <a
                    href="mailto:corporate@cupcakedesires.com"
                    className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                  >
                    corporate@cupcakedesires.com
                  </a>{' '}
                  or call{' '}
                  <a
                    href="tel:+61398765432"
                    className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                  >
                    03 9876 5432
                  </a>{' '}
                  &mdash; we answer within an hour during business days.
                </p>
              </div>

              {/* Price-match guarantee card */}
              <div className="mt-8 rounded-2xl border border-rose-accent/40 bg-rose px-5 py-5">
                <p className="bake-caption text-rose-accent">Price-match guarantee</p>
                <p className="font-bake-display mt-2 text-[18px] font-medium text-cocoa">
                  Received a lower quote? Email it &mdash; we&rsquo;ll beat it by{' '}
                  <span className="bake-display-italic text-rose-accent">5%</span>.
                </p>
                <p className="bake-body-sm mt-2 text-cocoa-soft">
                  Our promise: best corporate cupcake value in Australia, without ever compromising on
                  quality.
                </p>
              </div>

              <div className="mt-10 space-y-5">
                {[
                  ['Quote in', '24 hours'],
                  ['Mock-ups in', '48 hours'],
                  ['Bulk lead time', '5 working days'],
                  ['Rush orders', '15% surcharge'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between border-b border-line pb-3">
                    <p className="bake-caption text-taupe">{k}</p>
                    <p className="font-bake-display text-[16px] font-medium text-cocoa">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-7">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-line bg-cream p-10"
                >
                  <span className="bake-caption text-rose-accent">Quote request received</span>
                  <h3 className="font-bake-display mt-3 text-[28px] font-medium leading-tight text-cocoa">
                    Your brief is with our corporate team.
                  </h3>
                  <p className="bake-body mt-5 max-w-[52ch]">
                    You&rsquo;ll hear back within one working day with pricing and a mock-up if you
                    asked for custom branding. In the meantime, our existing client work lives on
                    our Instagram.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/" className="bake-btn">
                      Back to home <span aria-hidden>→</span>
                    </Link>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="bake-btn bake-btn-ghost"
                    >
                      Send another enquiry
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-line bg-cream p-8 md:p-10"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Your name" required>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Company" required>
                      <input
                        type="text"
                        required
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Work email" required>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Event date">
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Cupcake quantity" required>
                      <input
                        type="number"
                        min={50}
                        required
                        placeholder="e.g. 250"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="Brief — flavours, branding, delivery venues" required>
                      <textarea
                        rows={5}
                        required
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="bake-input resize-y"
                      />
                    </Field>
                  </div>

                  {error && (
                    <p className="mt-5 rounded-md border border-rose-accent/30 bg-rose px-4 py-3 text-[14px] text-cocoa">
                      {error}
                    </p>
                  )}

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bake-btn bake-btn-rose disabled:opacity-60"
                    >
                      {isSubmitting ? 'Sending…' : 'Send quote request'} <span aria-hidden>→</span>
                    </button>
                    <p className="bake-caption text-taupe">
                      24h response · NDA-friendly · no spam, ever
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA STRIP ─── */}
      <section className="bg-cocoa py-20 text-ivory md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-8">
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
                Ready when you are
              </p>
              <h2 className="bake-display-lg mt-5 text-ivory">
                Let&rsquo;s plan your{' '}
                <span className="bake-display-italic text-rose-deep">next office moment.</span>
              </h2>
              <p className="bake-body mt-4 max-w-[58ch] text-cream-deep/85">
                From a 50-box thank-you to a 5,000-box annual gifting drive — our corporate team
                will get back to you within 24 hours, on weekends too.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 md:col-span-4 md:justify-end">
              <Link href="#quote" className="bake-btn bake-btn-rose">
                Get a quote <span aria-hidden>→</span>
              </Link>
              <a
                href="mailto:corporate@cupcakedesires.com"
                className="font-bake-body text-[14px] font-medium text-ivory underline underline-offset-4 decoration-rose-deep transition-colors hover:text-rose-deep"
              >
                corporate@cupcakedesires.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Inline input style — referenced as .bake-input above */}
      <style jsx>{`
        :global(.bake-input) {
          font-family: var(--font-bake-body);
          font-size: 15px;
          color: var(--color-cocoa);
          background-color: #fff;
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        :global(.bake-input::placeholder) {
          color: var(--color-taupe);
        }
        :global(.bake-input:focus) {
          outline: none;
          border-color: var(--color-rose-accent);
          box-shadow: 0 0 0 4px rgba(217, 113, 133, 0.12);
        }
      `}</style>

      {/* ─── Sticky floating "Get a quote" pill ─── */}
      <AnimatePresence>
        {showStickyCta && !popupOpen && (
          <motion.button
            type="button"
            onClick={() => setPopupOpen(true)}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 inline-flex items-center gap-3 rounded-full border border-cocoa bg-cocoa px-5 py-3.5 text-ivory shadow-[0_18px_40px_-12px_rgba(46,31,21,0.45)] transition-colors hover:bg-rose-accent hover:border-rose-accent md:bottom-10"
            aria-label="Open quote request popup"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-deep opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-deep" />
            </span>
            <span className="font-bake-body text-[14px] font-medium">
              Get a corporate quote in 24h
            </span>
            <span aria-hidden className="text-[14px] font-medium">→</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Popup modal ─── */}
      <CorporateQuotePopup open={popupOpen} onClose={() => setPopupOpen(false)} />
    </main>
  )
}

/* ─────────────────── Small components ─────────────────── */

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="bake-caption text-cocoa-soft">
        {label}
        {required && <span className="ml-1 text-rose-accent">*</span>}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  )
}
