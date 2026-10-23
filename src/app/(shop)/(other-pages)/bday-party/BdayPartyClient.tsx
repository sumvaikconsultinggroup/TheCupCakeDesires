'use client'

import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { CakeProductCard, type Product } from '@/components/HomePage/_shared'
import { usePageFaqs } from '@/hooks/usePageFaqs'
import type { BdayPartyCakeProduct } from '@/lib/bday-party-server'
import Link from 'next/link'
import { useState } from 'react'

const SHARED_KITCHEN =
  'Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.'

/** Below-the-fold interactive sections only — ATF hero lives in BdayPartyHero (RSC). */
export default function BdayPartyClient({ cakeProducts }: { cakeProducts: BdayPartyCakeProduct[] }) {
  const { faqs, loading: faqsLoading } = usePageFaqs('bday-party')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    headcount: '12',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const cakeCount = cakeProducts.length
  const cakeCountLabel = cakeCount === 1 ? 'One cake' : `${cakeCount} cakes`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const message = [
      'Birthday cupcakes delivery enquiry',
      `Preferred delivery date: ${form.date}`,
      `Guest count (approx): ${form.headcount}`,
      '',
      form.notes.trim() || '(No additional notes)',
    ].join('\n')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          date: form.date,
          quantity: form.headcount,
          subject: `Birthday cupcakes enquiry · ${form.date || 'date TBD'}`,
          message,
        }),
      })

      if (!res.ok) {
        setError('Could not send your request. Please try again or email info@thecupcakedesire.com.au.')
        return
      }

      setSubmitted(true)
      setForm({
        name: '',
        email: '',
        phone: '',
        date: '',
        headcount: '12',
        notes: '',
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                How it works
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                Order online.{' '}
                <span className="bake-display-italic text-rose-accent">We deliver.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[42ch]">
                Pick a birthday box or cake, choose your weekday delivery date, and we bake fresh for
                that morning. Free delivery on orders over $100.
              </p>
            </div>

            <div className="md:col-span-7">
              <ol className="space-y-6">
                {[
                  [
                    '01',
                    'Choose cupcakes or a cake',
                    'Browse birthday cupcakes, build a custom box, or add a round cake. Cakes need 3 days’ notice.',
                  ],
                  [
                    '02',
                    'Tell us any dietary needs',
                    'Every flavour has an eggless option. Vegan and gluten free ranges are available too.',
                  ],
                  [
                    '03',
                    'Weekday delivery to your party',
                    'We deliver across Melbourne Metro on weekdays between 9am and 3pm. Order for Friday if the party is on Saturday.',
                  ],
                ].map(([n, title, body]) => (
                  <li key={n} className="flex gap-5 border-b border-line pb-6 last:border-0 last:pb-0">
                    <span className="font-bake-display text-[22px] font-medium text-rose-accent">{n}</span>
                    <div>
                      <h3 className="font-bake-display text-[20px] font-medium text-cocoa">{title}</h3>
                      <p className="bake-body mt-2 max-w-[48ch]">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Birthday cakes
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[20ch]">
                {cakeCount > 0 ? (
                  <>
                    {cakeCountLabel}{' '}
                    <span className="bake-display-italic text-rose-accent">to order.</span>
                  </>
                ) : (
                  <>
                    Cakes{' '}
                    <span className="bake-display-italic text-rose-accent">to order.</span>
                  </>
                )}
              </h2>
            </div>
            <p className="bake-body max-w-[42ch]">
              {cakeCount > 0
                ? `Round cakes and custom tiers baked to order for your birthday table. Cakes need 3 days’ notice. Eggless and vegan options available. ${SHARED_KITCHEN}`
                : `Round cakes and custom tiers can be ordered for delivery. Cakes need 3 days’ notice. ${SHARED_KITCHEN}`}
            </p>
          </div>

          {cakeCount > 0 ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cakeProducts.map((product, i) => (
                <CakeProductCard
                  key={product._id}
                  product={product as Product}
                  index={i}
                  badge={product.isVegan ? 'Vegan' : product.isEggless ? 'Eggless' : undefined}
                  badgeTone={product.isVegan ? 'mint' : product.isEggless ? 'gold' : 'rose'}
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-line bg-cream px-8 py-12 text-center">
              <p className="bake-body text-cocoa-soft">
                Our cake menu is being refreshed. Browse cakes online or contact us for a custom order.
              </p>
              <Link href="/collections/cakes" className="bake-btn bake-btn-ghost mt-6 inline-flex">
                Browse cakes <span aria-hidden>→</span>
              </Link>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/collections/birthday-cupcakes"
              className="font-bake-body inline-flex items-center text-[14px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent hover:text-cocoa"
            >
              Birthday cupcakes <span aria-hidden className="ml-1">→</span>
            </Link>
            <Link
              href="/collections/cakes"
              className="font-bake-body inline-flex items-center text-[14px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent hover:text-cocoa"
            >
              See all cakes <span aria-hidden className="ml-1">→</span>
            </Link>
            <Link
              href="/cupcake-builder"
              className="font-bake-body inline-flex items-center text-[14px] font-medium text-cocoa-soft underline underline-offset-4 decoration-rose-accent hover:text-cocoa"
            >
              Build a custom box <span aria-hidden className="ml-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="enquire" className="bg-cocoa py-20 text-ivory md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow text-rose-deep">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Larger orders
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch] text-ivory">
                Planning a bigger{' '}
                <span className="bake-display-italic text-rose-accent">birthday table?</span>
              </h2>
              <p className="bake-body-lg mt-6 max-w-[42ch] text-cream-deep/85">
                Tell us the date, guest count and flavours. We will reply with options for delivery
                only. We do not host parties at the kitchen.
              </p>

              <div className="mt-10 space-y-6">
                <div>
                  <p className="bake-caption text-cream-deep/70">Kitchen (online orders only)</p>
                  <p className="font-bake-display mt-2 text-[18px] text-ivory">
                    352 Princes Hwy, Narre Warren, Melbourne
                  </p>
                </div>
                <div>
                  <p className="bake-caption text-cream-deep/70">Phone</p>
                  <a
                    href="tel:+61397050051"
                    className="font-bake-display mt-2 inline-block text-[22px] text-ivory underline underline-offset-4 decoration-rose-accent hover:text-rose-deep"
                  >
                    03 9705 0051
                  </a>
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
                    We will get back to you as soon as we can.
                  </h3>
                  <p className="bake-body mt-4 max-w-[48ch] text-cream-deep/85">
                    Watch for a reply from{' '}
                    <span className="text-ivory">info@thecupcakedesire.com.au</span>.
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
                      label="Your name"
                      value={form.name}
                      onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                      required
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) => setForm((f) => ({ ...f, email: v }))}
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
                      label="Preferred delivery date"
                      type="date"
                      value={form.date}
                      onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                      required
                    />
                    <Field
                      label="Guest count (approx)"
                      type="number"
                      value={form.headcount}
                      onChange={(v) => setForm((f) => ({ ...f, headcount: v }))}
                      required
                    />
                  </div>

                  <div className="mt-5">
                    <label className="block">
                      <span className="bake-caption text-cream-deep/70">
                        Theme, flavours, or other notes
                      </span>
                      <textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        className="mt-2 block w-full rounded-xl border border-cream-deep/25 bg-transparent px-4 py-3 text-ivory placeholder:text-cream-deep/40 focus:border-rose-accent focus:outline-none"
                        placeholder="Turning 7, dinosaur theme, box of 24"
                      />
                    </label>
                    <p className="bake-body-sm mt-3 text-cream-deep/80">{SHARED_KITCHEN}</p>
                  </div>

                  {error ? (
                    <p
                      className="mt-5 rounded-xl border border-rose-accent/40 bg-rose-accent/10 px-4 py-3 text-sm text-rose-deep"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <div className="mt-7 flex flex-wrap items-center justify-end gap-4">
                    <button type="submit" className="bake-btn bake-btn-rose" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending…' : 'Send enquiry'} <span aria-hidden>→</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {!faqsLoading && faqs.length > 0 && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="grid gap-12 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5">
                <p className="bake-eyebrow">
                  <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                  Quick answers
                </p>
                <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                  Birthday cupcakes{' '}
                  <span className="bake-display-italic text-rose-accent">FAQs.</span>
                </h2>
                <p className="bake-body mt-6 max-w-[40ch]">
                  More questions? Email{' '}
                  <a
                    href="mailto:info@thecupcakedesire.com.au"
                    className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
                  >
                    info@thecupcakedesire.com.au
                  </a>
                  .
                </p>
              </div>

              <div className="md:col-span-7">
                <FaqAccordionList items={faqs} />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-rose px-8 py-16 text-center md:px-16 md:py-24">
            <span
              aria-hidden
              className="font-bake-display pointer-events-none absolute -right-8 -bottom-12 text-[220px] leading-none font-medium text-rose-deep/40 md:text-[280px]"
            >
              ✻
            </span>

            <p className="bake-eyebrow inline-flex items-center">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Ready to order
              <span className="inline-block h-px w-8 align-middle bg-rose-accent ml-3" />
            </p>
            <h2 className="bake-display-xl relative mx-auto mt-5 max-w-[18ch]">
              Birthday cupcakes{' '}
              <span className="bake-display-italic text-rose-accent">delivered.</span>
            </h2>
            <p className="bake-body-lg relative mx-auto mt-6 max-w-[52ch]">
              Shop a birthday box online, or enquire about a larger delivery for your party. Free
              delivery on orders over $100.
            </p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/collections/birthday-cupcakes" className="bake-btn">
                Shop birthday cupcakes <span aria-hidden>→</span>
              </Link>
              <a href="tel:+61397050051" className="bake-btn bake-btn-ghost">
                Call 03 9705 0051
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

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
