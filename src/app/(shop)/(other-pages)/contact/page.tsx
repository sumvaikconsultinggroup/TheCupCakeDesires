'use client'

import JsonLd from '@/components/SE0/JsonLd'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

type Topic = '' | 'custom' | 'wedding' | 'corporate' | 'allergens' | 'order' | 'other'

const TOPIC_VALUES: Topic[] = ['custom', 'wedding', 'corporate', 'allergens', 'order', 'other']

const reasons = [
  {
    name: 'Custom orders',
    body: 'Birthday boxes, custom flavours, edible logos, themed icing — tell us your vision and we&rsquo;ll cost it.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12 V 22 H 4 V 12" />
        <path d="M22 7 H 2 V 12 H 22 V 7 Z" />
        <path d="M12 22 V 7" />
        <path d="M12 7 H 7.5 a 2.5 2.5 0 0 1 0 -5 C 11 2, 12 7, 12 7 Z" />
        <path d="M12 7 H 16.5 a 2.5 2.5 0 0 0 0 -5 C 13 2, 12 7, 12 7 Z" />
      </svg>
    ),
  },
  {
    name: 'Weddings & events',
    body: 'Cupcake towers, branded packaging, multi-venue delivery for 50 to 5,000 guests.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22 V 18" />
        <path d="M9 18 H 15" />
        <path d="M6 18 V 12 a 6 6 0 0 1 12 0 V 18 Z" />
        <path d="M8 12 a 4 4 0 0 1 8 0" />
        <path d="M12 5 V 2" />
        <path d="M12 5 H 14" />
      </svg>
    ),
  },
  {
    name: 'Corporate gifting',
    body: 'Volume orders, custom branding, and dedicated account support.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="14" rx="1.5" />
        <path d="M3 13 H 21" />
        <path d="M8 7 V 4 H 16 V 7" />
      </svg>
    ),
  },
  {
    name: 'Allergens & diet',
    body: 'Eggless, vegan, nut-free questions — we&rsquo;ll walk you through what we can do safely.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 5 C 11 5, 6 10, 6 17 C 6 19, 8 20, 10 19 C 16 16, 19 11, 19 5 Z" />
        <path d="M6 18 L 3 21" />
      </svg>
    ),
  },
]

export default function ContactPage() {
  return (
    <Suspense fallback={<main className="bake-canvas min-h-[50vh]" />}>
      <ContactPageInner />
    </Suspense>
  )
}

function ContactPageInner() {
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '' as Topic,
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Prefill from ?topic=corporate&subject=… (e.g. Corporate Event 500+ enquiry)
  useEffect(() => {
    const topicRaw = (searchParams.get('topic') || '').toLowerCase()
    const topic = TOPIC_VALUES.includes(topicRaw as Topic) ? (topicRaw as Topic) : ''
    const subjectNote = searchParams.get('subject') || ''
    if (!topic && !subjectNote) return
    setFormData((prev) => ({
      ...prev,
      subject: topic || prev.subject,
      message:
        prev.message ||
        (subjectNote
          ? `${subjectNote}\n\nPlease tell us quantity, flavour, date, and delivery suburb.`
          : prev.message),
    }))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsSubmitted(true)
        setFormData({ name: '', email: '', phone: '', subject: '' as Topic, message: '' })
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bake-canvas">
      <JsonLd />

      {/* ─── Hero ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16 md:items-end">
            <div className="md:col-span-8">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Get in touch
              </p>
              <h1 className="bake-display-xl mt-6 max-w-[18ch]">
                Say hello.
                <br />
                <span className="bake-display-italic text-rose-accent">
                  A human reads every email.
                </span>
              </h1>
              <p className="bake-body-lg mt-7 max-w-[58ch]">
                Custom orders, wedding tastings, corporate gifting, allergen questions, or just a
                kind word — drop us a line and we&rsquo;ll get back to you straight away.
              </p>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-2xl border border-line bg-ivory p-6">
                <p className="bake-caption text-taupe">Our kitchen</p>
                <h3 className="font-bake-display mt-2 text-[22px] font-medium text-cocoa">
                  Narre Warren, Melbourne
                </h3>
                <address className="bake-body-sm mt-3 not-italic">
                  352 Princes Hwy,
                  <br />
                  Narre Warren, Victoria 3805
                </address>
                <p className="bake-caption mt-4 text-taupe">
                  Online orders only — we don&rsquo;t run a walk-in store.
                </p>
                <p className="bake-caption mt-2 text-rose-accent">
                  Next-day on a single box · 2 days on larger orders · 3 days for cakes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick contact cards ─── */}
      <section className="bg-ivory py-16 md:py-20">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              {
                title: 'Call us',
                detail: '03 970 500 51',
                href: 'tel:+61397050051',
                caption: '7 days support',
              },
              {
                title: 'Email',
                detail: 'info@thecupcakedesire.com.au',
                href: 'mailto:info@thecupcakedesire.com.au',
                caption: 'Instant reply',
              },
              {
                title: 'WhatsApp',
                detail: 'Quick replies',
                href: 'https://api.whatsapp.com/send/?phone=61470286842&text&type=phone_number&app_absent=0',
                caption: 'We reply right away',
                external: true,
              },
              {
                title: 'Instagram',
                detail: '@thecupcakedesire',
                href: 'https://www.instagram.com/thecupcakedesire/',
                caption: 'Daily bakes & behind the scenes',
                external: true,
              },
            ].map((c) => (
              <Link
                key={c.title}
                href={c.href}
                {...(c.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="group block rounded-2xl border border-line bg-ivory px-6 py-6 pr-8 transition-all hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_18px_40px_-20px_rgba(46,31,21,0.2)]"
              >
                <p className="bake-caption text-taupe">{c.title}</p>
                <p className="font-bake-display mt-2 break-words text-[18px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
                  {c.detail}
                </p>
                <p className="bake-body-sm mt-3 text-taupe">{c.caption}</p>
                <span
                  aria-hidden
                  className="mt-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-cocoa transition-all group-hover:border-rose-accent group-hover:bg-rose-accent group-hover:text-white"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Form + info split ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            {/* LEFT — what we can help with + image */}
            <aside className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                What we can help with
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                Four common{' '}
                <span className="bake-display-italic text-rose-accent">reasons people write.</span>
              </h2>

              <ul className="mt-10 space-y-6">
                {reasons.map((r) => (
                  <li key={r.name} className="flex items-start gap-4">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent">
                      {r.icon}
                    </span>
                    <div>
                      <p className="font-bake-display text-[18px] font-medium text-cocoa">
                        {r.name}
                      </p>
                      <p
                        className="bake-body-sm mt-1"
                        dangerouslySetInnerHTML={{ __html: r.body }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 hidden md:block">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-line bg-cream-deep shadow-[0_18px_36px_-22px_rgba(46,31,21,0.25)]">
                  <Image
                    src="/images/AboutUs.webp"
                    alt="Inside the Narre Warren kitchen — frosting in progress"
                    fill
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </aside>

            {/* RIGHT — form */}
            <div className="md:col-span-7">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl border border-line bg-ivory p-10"
                >
                  <span className="bake-caption text-rose-accent">Note received</span>
                  <h3 className="font-bake-display mt-3 text-[32px] font-medium leading-tight text-cocoa">
                    Your message is on its way to the kitchen.
                  </h3>
                  <p className="bake-body mt-5 max-w-[52ch]">
                    A human will reply as soon as we can. In the meantime, why not browse
                    today&rsquo;s board or peek at our latest stories?
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/collections/all" className="bake-btn">
                      Shop today&rsquo;s batch <span aria-hidden>→</span>
                    </Link>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="bake-btn bake-btn-ghost"
                    >
                      Send another message
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-line bg-ivory p-8 md:p-10"
                >
                  <p className="bake-eyebrow">
                    <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                    Write to us
                  </p>
                  <h3 className="font-bake-display mt-5 text-[28px] font-medium leading-tight text-cocoa md:text-[32px]">
                    Tell us what&rsquo;s on your mind.
                  </h3>

                  <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Your name" required>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Your email" required>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Phone (optional)">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bake-input"
                      />
                    </Field>
                    <Field label="Topic">
                      <select
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value as Topic })
                        }
                        className="bake-input cursor-pointer appearance-none"
                      >
                        <option value="">Pick a topic</option>
                        <option value="custom">Custom order</option>
                        <option value="wedding">Wedding / event</option>
                        <option value="corporate">Corporate gifting</option>
                        <option value="allergens">Allergens / diet</option>
                        <option value="order">Existing order</option>
                        <option value="other">Something else</option>
                      </select>
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="Your message" required>
                      <textarea
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
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
                      {isSubmitting ? 'Sending…' : 'Send message'} <span aria-hidden>→</span>
                    </button>
                    <p className="bake-caption text-taupe">
                      We aim for an instant reply · we never share your email
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Find the kitchen — embedded map + planning card ─── */}
      <section className="bg-ivory pt-16 pb-20 md:pt-24 md:pb-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
            {/* Map */}
            <div className="md:col-span-7">
              <div className="relative overflow-hidden rounded-3xl border border-line bg-cream-deep shadow-[0_24px_50px_-30px_rgba(46,31,21,0.25)]">
                {/* Map iframe — colour-graded to sit with the cream palette */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d805190.2367181787!2d144.4098633!3d-37.970726!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642cae6898e9f%3A0x2caa0bf7c11ff240!2sThe%20Cupcake%20Desire%20(Narre%20Warren)%20-%20Branded%20%26%20Corporate%20logo%20Cupcakes!5e0!3m2!1sen!2sin!4v1780052713334!5m2!1sen!2sin"
                  title="The Cupcake Desire — Narre Warren kitchen"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  style={{ filter: 'sepia(0.18) saturate(0.82) contrast(0.95)' }}
                  className="block h-[460px] w-full border-0"
                />

                {/* Warm overlay so Google's brights blend into the bake palette */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 mix-blend-multiply"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 45%, transparent 0%, rgba(248, 234, 210, 0.18) 70%, rgba(248, 234, 210, 0.32) 100%)',
                  }}
                />

                {/* Top-left chip — open in Google */}
                <a
                  href="https://www.google.com/maps/place/The+Cupcake+Desire+(Narre+Warren)+-+Branded+%26+Corporate+logo+Cupcakes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-line bg-ivory/95 px-3.5 py-1.5 text-[12px] font-medium text-cocoa shadow-[0_8px_20px_-10px_rgba(46,31,21,0.3)] backdrop-blur transition-all hover:border-rose-accent hover:text-rose-accent"
                >
                  Open in Google Maps
                  <span aria-hidden>↗</span>
                </a>

                {/* Floating kitchen card — bottom-left */}
                <div className="absolute bottom-5 left-5 right-5 max-w-[300px] rounded-2xl border border-line bg-ivory/95 p-4 shadow-[0_18px_40px_-18px_rgba(46,31,21,0.35)] backdrop-blur md:right-auto">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-accent opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-accent" />
                    </span>
                    <p className="bake-caption text-rose-accent">Our kitchen</p>
                  </div>
                  <p className="font-bake-display mt-2 text-[15px] font-medium leading-snug text-cocoa">
                    352 Princes Hwy
                    <br />
                    Narre Warren VIC 3805
                  </p>
                  <p className="bake-caption mt-2 text-taupe">
                    Approximately 45&nbsp;min from Melbourne CBD
                  </p>
                </div>
              </div>
              <p className="bake-caption mt-4 text-taupe">
                <span className="inline-block h-px w-6 align-middle bg-rose-accent mr-2" />
                Kitchen address only — please don&rsquo;t drop in unannounced.
              </p>
            </div>

            {/* Planning card */}
            <div className="md:col-span-5">
              <div className="flex h-full flex-col justify-between rounded-3xl border border-line bg-cream p-8 md:p-10">
                <div>
                  <p className="bake-eyebrow">
                    <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                    Planning ahead
                  </p>
                  <h2 className="bake-display-md mt-5 max-w-[16ch] font-medium">
                    Big day on the calendar?{' '}
                    <span className="bake-display-italic text-rose-accent">Lock the date.</span>
                  </h2>
                  <p className="bake-body mt-5 max-w-[42ch] text-cocoa-soft">
                    We&rsquo;re a bake-to-order kitchen, so every order needs at least 3 days&rsquo;
                    notice — wedding and corporate boxes usually take a week. Send us the brief
                    early and we&rsquo;ll save your spot on the tray.
                  </p>
                </div>

                <div className="mt-8 border-t border-line pt-6">
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="bake-caption text-taupe">Address</span>
                      <span className="font-bake-display text-right text-[14px] font-medium text-cocoa">
                        352 Princes Hwy
                        <br />
                        Narre Warren VIC 3805
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 pt-2">
                      <span className="bake-caption text-taupe">Support</span>
                      <a
                        href="mailto:info@thecupcakedesire.com.au"
                        className="font-bake-body text-[13px] font-medium text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors hover:text-rose-accent"
                      >
                        info@thecupcakedesire.com.au
                      </a>
                    </div>
                  </div>
                  <Link href="/corporate" className="bake-btn mt-6 w-full justify-center">
                    Plan a custom event <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ teaser ─── */}
      <section className="bg-cocoa py-20 text-ivory md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-deep mr-3" />
                Looking for a quick answer?
              </p>
              <h2 className="bake-display-lg mt-5 text-ivory">
                Most questions are answered in{' '}
                <span className="bake-display-italic text-rose-deep">our FAQ.</span>
              </h2>
              <p className="bake-body mt-4 max-w-[52ch] text-cream-deep/85">
                Freshness, delivery zones, allergens, custom orders — we&rsquo;ve answered the
                things people ask us most.
              </p>
            </div>
            <div className="md:col-span-5 md:text-right">
              <Link href="/#faq" className="bake-btn bake-btn-rose">
                Read the FAQ <span aria-hidden>→</span>
              </Link>
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
