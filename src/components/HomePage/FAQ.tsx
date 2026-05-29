'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface FAQCategory {
  _id: string
  name: string
}
interface FAQItem {
  _id: string
  question: string
  answer: string
  category: FAQCategory
}

const fallbackFaqs: FAQItem[] = [
  {
    _id: 'f1',
    question: 'How fresh are the cupcakes?',
    answer:
      'Every box is baked to order and hand-frosted the morning of your delivery — never sat on a shelf. They stay lovely for 48 hours in an airtight box at room temperature.',
    category: { _id: 'c1', name: 'Freshness' },
  },
  {
    _id: 'f2',
    question: 'Do you have eggless and vegan options?',
    answer:
      'Yes — every flavour on the menu has an eggless version, and we have a dedicated vegan range made with oat milk, plant butter, and real chocolate. Look for the badges on each product.',
    category: { _id: 'c2', name: 'Diet' },
  },
  {
    _id: 'f3',
    question: 'How long do orders take, and where do you deliver?',
    answer:
      'We&rsquo;re a bake-to-order kitchen, so every order needs at least 2 days&rsquo; notice — we don&rsquo;t do same-day or next-day. Delivery covers Melbourne metro; weddings and event orders ship Victoria-wide on request. Larger custom builds may need a week, especially around peak weekends.',
    category: { _id: 'c3', name: 'Delivery' },
  },
  {
    _id: 'f4',
    question: 'Do you have a shop I can walk into?',
    answer:
      'No — we&rsquo;re an online-only kitchen. We don&rsquo;t run a storefront, so every order comes through the website (or a custom-event enquiry) and arrives by courier on the day you choose.',
    category: { _id: 'c3', name: 'Delivery' },
  },
  {
    _id: 'f5',
    question: 'Can I customise a box for a wedding, event, or corporate gift?',
    answer:
      'Absolutely — this is our favourite kind of order. We&rsquo;ve done boxes of 6 to 6,000 with custom flavours, branded packaging, even edible logos. Send the brief and we&rsquo;ll cost it together. Most event orders need a week&rsquo;s notice; tight turnarounds are sometimes possible — ask us.',
    category: { _id: 'c4', name: 'Custom Orders' },
  },
  {
    _id: 'f6',
    question: 'What if I have a food allergy?',
    answer:
      'Every product page lists the full allergens. Our kitchen handles eggs, dairy, gluten, soy, and nuts — cross-contact is possible. If you have a severe allergy, drop us a note before ordering.',
    category: { _id: 'c2', name: 'Diet' },
  },
]

export default function FAQ({ className = '' }: { className?: string }) {
  const [faqs, setFaqs] = useState<FAQItem[]>(fallbackFaqs)
  const [categories, setCategories] = useState<string[]>(['All'])
  const [open, setOpen] = useState<number | null>(0)
  const [activeCat, setActiveCat] = useState('All')

  useEffect(() => {
    const f = async () => {
      try {
        const r = await fetch('/api/faqs')
        const d = await r.json()
        if (d.success && Array.isArray(d.data?.faqs) && d.data.faqs.length > 0) {
          setFaqs(d.data.faqs)
          setCategories(['All', ...d.data.categories.map((c: FAQCategory) => c.name)])
        } else {
          setCategories(['All', ...Array.from(new Set(fallbackFaqs.map((q) => q.category.name)))])
        }
      } catch {
        setCategories(['All', ...Array.from(new Set(fallbackFaqs.map((q) => q.category.name)))])
      }
    }
    f()
  }, [])

  const filtered = activeCat === 'All' ? faqs : faqs.filter((q) => q.category?.name === activeCat)

  return (
    <section className={`bg-cream py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          {/* Left — heading + filters */}
          <div className="md:col-span-5">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Frequently asked
            </p>
            <h2 className="bake-display-lg mt-5">
              Questions,{' '}
              <span className="bake-display-italic text-rose-accent">answered.</span>
            </h2>
            <p className="bake-body mt-6 max-w-[46ch]">
              Can&rsquo;t find what you need? Write to{' '}
              <a
                href="mailto:hello@cupcakedesires.com"
                className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
              >
                hello@cupcakedesires.com
              </a>{' '}
              — a human reads every email.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setActiveCat(c)
                    setOpen(0)
                  }}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    activeCat === c
                      ? 'bg-cocoa text-ivory'
                      : 'border border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Right — accordion */}
          <div className="md:col-span-7">
            <ul className="divide-y divide-line border-y border-line">
              {filtered.map((f, i) => {
                const isOpen = open === i
                return (
                  <li key={f._id}>
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-rose-accent"
                    >
                      <span className="font-bake-display text-[18px] font-medium text-cocoa md:text-[20px]">
                        {f.question}
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
                            dangerouslySetInnerHTML={{ __html: f.answer }}
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
  )
}
