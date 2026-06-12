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
  order?: number
  category: FAQCategory
}

export default function FAQ({ className = '' }: { className?: string }) {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<number | null>(0)
  const [activeCat, setActiveCat] = useState('All')

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/faqs?page=homepage', { cache: 'no-store' })
        const d = await r.json()
        if (d.success && Array.isArray(d.data?.faqs) && d.data.faqs.length > 0) {
          const sorted = [...d.data.faqs].sort(
            (a: FAQItem, b: FAQItem) => (a.order ?? 0) - (b.order ?? 0)
          )
          setFaqs(sorted)
          setCategories(['All', ...d.data.categories.map((c: FAQCategory) => c.name)])
        }
      } catch (error) {
        console.error('Failed to load FAQs:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return null
  }

  if (faqs.length === 0) {
    return null
  }

  const filtered =
    activeCat === 'All' ? faqs : faqs.filter((q) => q.category?.name === activeCat)

  return (
    <section className={`bg-cream py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
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
