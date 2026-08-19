'use client'

import CorporateQuotePopup from '@/components/CorporateQuotePopup'
import CompaniesWorkedWithDome from '@/components/corporate/CompaniesWorkedWithDome'
import CorporateShowcaseHero from '@/components/corporate/CorporateShowcaseHero'
import CountUp from '@/components/CountUp'
import {
  MINI_CORPORATE_BULK_ENQUIRY_HREF,
  MINI_CORPORATE_FLAVOURS,
  MINI_CORPORATE_GALLERY,
  MINI_CORPORATE_HANDLE,
  MINI_CORPORATE_SIZES,
} from '@/lib/corporate-pages'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const stats: {
  value: number
  suffix: string
  format?: 'compact' | 'comma' | 'plain'
  decimals?: number
  label: string
}[] = [
  { value: 500, suffix: '+', label: 'Companies served with minis' },
  { value: 80000, suffix: '', format: 'compact', label: 'Mini cupcakes delivered / year' },
  { value: 24, suffix: 'h', label: 'Average quote turnaround' },
  { value: 4.9, suffix: ' ★', decimals: 1, label: 'Across corporate reviews' },
]

const services = [
  {
    title: 'Edible logos, mini-sized',
    body: 'Sharp edible toppers scaled for the mini top — Orbit Homes, Flight Centre, LawUno and more, printed clean.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="13" />
        <path d="M16 5 V 27" />
        <path d="M5 16 H 27" />
      </svg>
    ),
  },
  {
    title: 'Built for mingling',
    body: 'One or two bites — no plates, no forks. Perfect for standing receptions, open floors, and networking nights.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3 L 20 12 L 29 13 L 22 19 L 24 28 L 16 23 L 8 28 L 10 19 L 3 13 L 12 12 Z" />
      </svg>
    ),
  },
  {
    title: 'Vanilla or chocolate',
    body: 'Pick one flavour across the tray, or ask us to split Vanilla and Chocolate when you brief.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 5 C 16 5, 9 12, 9 22 C 9 26, 12 27, 15 25 C 22 22, 27 14, 27 5 Z" />
        <path d="M9 24 L 4 29" />
      </svg>
    ),
  },
  {
    title: 'Delivered to your venue',
    body: 'Chilled trays across Greater Melbourne. 5–7 days’ notice on event runs — book the date early.',
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
    name: 'Boardroom',
    range: '24 minis',
    price: '$84',
    per: '$3.50 / mini',
    blurb: 'Client thank-yous, small team celebrations, desk drops.',
    features: [
      'Vanilla or Chocolate',
      'Edible logo option',
      'Melbourne metro delivery',
      'Digital invoice + GST',
    ],
  },
  {
    name: 'Floor event',
    range: '100 minis',
    price: '$330',
    per: '$3.30 / mini',
    blurb: 'Open-plan celebrations, product launches, all-hands.',
    features: [
      'Vanilla or Chocolate (or split)',
      'Edible logos on each mini',
      'Branded tray presentation',
      'Dedicated coordinator',
    ],
    featured: true,
  },
  {
    name: 'Conference',
    range: '300 — 500 minis',
    price: 'From $900',
    per: 'Volume pricing',
    blurb: 'Conferences, multi-room venues, large guest lists.',
    features: [
      '300 = $900 · 500 = $1,400',
      'Logo + brand-colour frosting',
      'Multi-venue delivery available',
      'Net-30 invoicing on request',
    ],
  },
]

const steps = [
  {
    n: '01',
    title: 'Brief',
    body: 'Tell us headcount, date, Vanilla/Chocolate split, and whether you need edible logos.',
  },
  {
    n: '02',
    title: 'Design',
    body: 'We mock edible toppers to your artwork. Two rounds of revisions included.',
  },
  {
    n: '03',
    title: 'Bake',
    body: 'Minis hand-frosted with soft buttercream — same kitchen standard as our full-size boxes.',
  },
  {
    n: '04',
    title: 'Deliver',
    body: 'Chilled trays to your venue. Tracking link sent the morning of delivery.',
  },
]

const testimonials = [
  {
    quote:
      'Ordered 300 branded minis for our open-floor launch. Guests kept moving, logos stayed sharp, and we didn’t need plates anywhere.',
    name: 'Olivia Bennett',
    role: 'Director, Brand Marketing · ASX-listed Fintech',
  },
  {
    quote:
      'We run quarterly mini drops for client visits. 100-pack with our logo — always on time, always the right split of Vanilla and Chocolate.',
    name: 'James Whitmore',
    role: 'Head of Customer Success · SaaS Scaleup',
  },
  {
    quote:
      'Minis solved our standing-reception problem. People take one, keep networking, and our brand is on every napkin moment.',
    name: 'Priya Patel',
    role: 'People Operations Lead · Global Consultancy',
  },
]

const faqs = [
  {
    q: 'How many minis should I order per guest?',
    a: 'Plan 2–3 minis per person for a standing reception, or 1–2 if you’re also serving other sweets.',
  },
  {
    q: 'Can I mix Vanilla and Chocolate?',
    a: 'Yes — tell us the split in your brief (for example 50/50). We’ll confirm it on the quote.',
  },
  {
    q: 'Do minis support edible logos?',
    a: 'Yes. Logos are printed smaller for the mini top while staying crisp and readable.',
  },
  {
    q: 'What’s the lead time?',
    a: 'Most corporate mini runs need 5–7 working days. Rush slots are sometimes available — ask when you enquire.',
  },
]

export default function MiniCorporatePage() {
  const [popupOpen, setPopupOpen] = useState(false)
  const [showStickyCta, setShowStickyCta] = useState(false)
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
          subject: `Mini corporate enquiry · ${form.quantity || 'qty?'} minis for ${form.company || 'company?'}`,
        }),
      })
      if (res.ok) {
        setIsSubmitted(true)
        setForm({ name: '', company: '', email: '', phone: '', date: '', quantity: '', message: '' })
      } else {
        setError('Failed to send. Please try again or email info@thecupcakedesire.com.au.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bake-canvas">
      <CorporateShowcaseHero
        productHandle={MINI_CORPORATE_HANDLE}
        eyebrow="Corporate mini cupcakes"
        title={
          <>
            Bite-size branding for{' '}
            <span className="bake-display-italic text-rose-accent">busy events.</span>
          </>
        }
        gallery={MINI_CORPORATE_GALLERY}
        sizes={MINI_CORPORATE_SIZES}
        flavours={MINI_CORPORATE_FLAVOURS}
        defaultSizeId="24"
        priceCaption="box price"
        maxSizeLabel="500 minis"
        bulkEnquiryHref={MINI_CORPORATE_BULK_ENQUIRY_HREF}
        siblingHref="/corporate"
        siblingLabel="See standard corporate cupcakes →"
        footerNote="Edible logos · perfect for standing receptions · Melbourne delivery"
      />

      {/* ─── QUOTE FORM (second section) ─── */}
      <section id="quote" className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                Only the best for our corporate clients
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[20ch]">
                Tell us about{' '}
                <span className="bake-display-italic text-rose-accent">your minis.</span>
              </h2>

              <div className="mt-7 space-y-4">
                <p className="bake-body-lg max-w-[46ch]">
                  Upload your logo, pick a quantity (24 / 100 / 300 / 500), and share Vanilla or
                  Chocolate preferences. Our corporate team replies within 24 hours with a tailored
                  quote and edible-logo mock-up.
                </p>
                <p className="bake-body max-w-[48ch]">
                  Prefer email or phone? Reach{' '}
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
                    03 970 500 51
                  </a>{' '}
                  &mdash; we answer within an hour during business days.
                </p>
              </div>

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
                  ['Quote in', 'Instant'],
                  ['Mock-ups in', '48 hours'],
                  ['Mini lead time', '4 days'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between border-b border-line pb-3">
                    <p className="bake-caption text-taupe">{k}</p>
                    <p className="font-bake-display text-[16px] font-medium text-cocoa">{v}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-line bg-cream px-4 py-4">
                  <p className="font-bake-display text-[15px] font-medium leading-snug text-cocoa">
                    Running out of time?
                  </p>
                  <p className="bake-body-sm mt-1.5 text-cocoa-soft">
                    Call us for availability on short-notice orders —{' '}
                    <a
                      href="tel:+61397050051"
                      className="font-medium text-cocoa underline decoration-rose-accent/50 underline-offset-2 transition-colors hover:text-rose-accent"
                    >
                      03 970 500 51
                    </a>
                  </p>
                </div>
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
                    Your mini brief is with our corporate team.
                  </h3>
                  <p className="bake-body mt-5 max-w-[52ch]">
                    You&rsquo;ll hear back within one working day with pricing and a logo mock-up if
                    you asked for custom branding.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/" className="bake-btn">
                      Back to home <span aria-hidden>→</span>
                    </Link>
                    <button
                      type="button"
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
                    <Field label="Mini quantity" required>
                      <input
                        type="number"
                        min={24}
                        required
                        placeholder="e.g. 100"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="bake-input"
                      />
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="Brief — flavour split, branding, delivery venues" required>
                      <textarea
                        rows={5}
                        required
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="bake-input resize-y"
                        placeholder="e.g. 100 minis, 50/50 Vanilla & Chocolate, edible logo attached…"
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

      {/* ─── COMPANIES WE'VE WORKED WITH ─── */}
      <section className="overflow-hidden bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 text-center md:px-10">
          <p className="bake-eyebrow inline-flex items-center justify-center">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            Trusted nationwide
            <span className="ml-3 inline-block h-px w-8 align-middle bg-rose-accent" />
          </p>
          <h2 className="bake-display-lg mx-auto mt-5 max-w-[26ch]">
            Logos we&rsquo;ve baked onto{' '}
            <span className="bake-display-italic text-rose-accent">minis.</span>
          </h2>
          <p className="bake-body mx-auto mt-5 max-w-[54ch] text-cocoa-soft">
            From Orbit Homes to Flight Centre — your brand could be the next edible topper.
          </p>
        </div>

        <CompaniesWorkedWithDome />
      </section>

      {/* ─── STATS ─── */}
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

      {/* ─── EDITORIAL ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                Made for the occasion
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[22ch]">
                Impress clients with Melbourne&rsquo;s best{' '}
                <span className="bake-display-italic text-rose-accent">corporate minis.</span>
              </h2>
              <div className="mt-7 space-y-5">
                <p className="bake-body-lg max-w-[60ch]">
                  Keep guests moving without sacrificing brand presence. Our mini corporate
                  cupcakes put your logo on every bite — ideal for launches, networking floors, and
                  multi-room events where full-size boxes are too heavy-handed.
                </p>
                <p className="bake-body max-w-[62ch]">
                  Same kitchen as our standard corporate range: Madagascar vanilla, Belgian
                  chocolate, farm butter. Vanilla or Chocolate trays, edible logos, chilled delivery
                  across Greater Melbourne.
                </p>
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-cream-deep">
                <Image
                  src={MINI_CORPORATE_GALLERY[0].src}
                  alt={MINI_CORPORATE_GALLERY[0].alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY US ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:items-end md:gap-12">
            <div className="md:col-span-7">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                Why companies choose minis
              </p>
              <h2 className="bake-display-lg mt-5">
                Built for business,{' '}
                <span className="bake-display-italic text-rose-accent">sized for mingling.</span>
              </h2>
            </div>
            <p className="bake-body md:col-span-5">
              From a 24-pack desk drop to a 500-mini conference tray — same standards, same care.
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent transition-all duration-300 group-hover:border-rose-accent group-hover:bg-rose-accent group-hover:text-white">
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

      {/* ─── CUSTOMISATION ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-6"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-deep">
                <Image
                  src={MINI_CORPORATE_GALLERY[1].src}
                  alt={MINI_CORPORATE_GALLERY[1].alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </motion.div>

            <div className="md:col-span-6">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                Custom branding · edible artwork
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                Your brand, baked onto{' '}
                <span className="bake-display-italic text-rose-accent">every mini.</span>
              </h2>
              <p className="bake-body-lg mt-6 max-w-[55ch]">
                Edible-ink logos on rice paper, brand-matched frosting, and tray presentation built
                for standing events — the same customisation as our full-size corporate boxes,
                scaled for minis.
              </p>
              <ul className="mt-10 space-y-5 border-t border-line pt-8">
                {[
                  'Vector-precise edible logos on every mini',
                  'Vanilla or Chocolate (or a split tray)',
                  'Brand-matched icing colours when needed',
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

      {/* ─── PRICING TIERS ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 text-center md:mb-20">
            <p className="bake-eyebrow inline-flex items-center">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
              Mini packages
              <span className="ml-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            </p>
            <h2 className="bake-display-lg mx-auto mt-5 max-w-[22ch]">
              Clear counts,{' '}
              <span className="bake-display-italic text-rose-accent">clear prices.</span>
            </h2>
            <p className="bake-body mx-auto mt-5 max-w-[58ch]">
              24 = $84 · 100 = $330 · 300 = $900 · 500 = $1,400. Same kitchen, scaled for your
              headcount.
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
                  t.featured ? 'border-cocoa bg-cocoa text-ivory' : 'border-line bg-ivory text-cocoa'
                }`}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-rose-accent px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                    Most popular
                  </span>
                )}
                <p className={`bake-caption ${t.featured ? 'text-rose-deep' : 'text-taupe'}`}>
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
                    {t.price}
                  </span>
                  <span className={`bake-caption ${t.featured ? 'text-ivory/70' : 'text-taupe'}`}>
                    {t.per}
                  </span>
                </div>
                <p className={`bake-body-sm mt-4 ${t.featured ? 'text-ivory/80' : 'text-cocoa-soft'}`}>
                  {t.blurb}
                </p>
                <ul className="mt-8 flex-1 space-y-3 border-t border-current/15 pt-6">
                  {t.features.map((f) => (
                    <li key={f} className="bake-body-sm flex gap-2">
                      <span aria-hidden className="text-rose-accent">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setPopupOpen(true)}
                  className={`bake-btn mt-8 w-full justify-center ${
                    t.featured ? 'bg-ivory text-cocoa hover:bg-cream' : 'bake-btn-rose'
                  }`}
                >
                  Enquire <span aria-hidden>→</span>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            How it works
          </p>
          <h2 className="bake-display-lg mt-5 max-w-[18ch]">
            From brief to{' '}
            <span className="bake-display-italic text-rose-accent">bite-size boxes.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="border-t border-line pt-6">
                <p className="font-bake-display text-[14px] tracking-[0.12em] text-rose-accent">
                  {step.n}
                </p>
                <h3 className="font-bake-display mt-3 text-[22px] font-medium text-cocoa">
                  {step.title}
                </h3>
                <p className="bake-body-sm mt-3 text-cocoa-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow text-center">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            Client notes
            <span className="ml-3 inline-block h-px w-8 align-middle bg-rose-accent" />
          </p>
          <h2 className="bake-display-lg mx-auto mt-5 max-w-[20ch] text-center">
            What teams say about{' '}
            <span className="bake-display-italic text-rose-accent">our minis.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-line bg-ivory p-7">
                <blockquote className="bake-body text-cocoa-soft">
                  <span className="font-bake-display text-[28px] leading-none text-rose-accent">
                    &ldquo;
                  </span>
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-line pt-4">
                  <p className="font-bake-display text-[16px] font-medium text-cocoa">{t.name}</p>
                  <p className="bake-caption mt-1 text-taupe">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="bg-ivory py-16 md:py-20">
        <div className="mx-auto max-w-[800px] px-6 md:px-10">
          <p className="bake-eyebrow text-center">FAQ</p>
          <h2 className="bake-display-lg mt-4 text-center text-cocoa">
            Mini corporate,{' '}
            <span className="bake-display-italic text-rose-accent">answered.</span>
          </h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map((item) => (
              <FaqRow key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="border-t border-line bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-[720px] px-6 text-center md:px-10">
          <h2 className="bake-display-lg text-cocoa">
            Ready to brief your{' '}
            <span className="bake-display-italic text-rose-accent">minis?</span>
          </h2>
          <p className="bake-body mx-auto mt-4 max-w-[48ch] text-cocoa-soft">
            Send the form above, or jump straight to a quick enquiry — we reply within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#quote" className="bake-btn bake-btn-rose">
              Fill the brief <span aria-hidden>→</span>
            </a>
            <Link href="/corporate" className="bake-btn bake-btn-ghost">
              Standard corporate cupcakes
            </Link>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showStickyCta && !popupOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-5 right-5 z-40 md:bottom-8 md:right-8"
          >
            <button type="button" onClick={() => setPopupOpen(true)} className="bake-btn bake-btn-rose shadow-lg">
              Enquire about minis →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

      <CorporateQuotePopup open={popupOpen} onClose={() => setPopupOpen(false)} />
    </main>
  )
}

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

function FaqRow({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-bake-display text-[17px] font-medium text-cocoa">{question}</span>
        <span className="text-rose-accent">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="bake-body pb-5 text-cocoa-soft">{answer}</p>}
    </div>
  )
}
