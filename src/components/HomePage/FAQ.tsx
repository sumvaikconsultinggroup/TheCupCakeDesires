'use client'

import { useState } from 'react'
import type { HomepageFaqCategory, HomepageFaqItem } from '@/lib/faqs-server'

interface FAQProps {
  className?: string
  initialFaqs?: HomepageFaqItem[]
  initialCategories?: HomepageFaqCategory[]
}

export default function FAQ({
  className = '',
  initialFaqs = [],
  initialCategories = [],
}: FAQProps) {
  const faqs = [...initialFaqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const categories = ['All', ...initialCategories.map((c) => c.name)]
  const [open, setOpen] = useState<number | null>(0)
  const [activeCat, setActiveCat] = useState('All')

  if (faqs.length === 0) {
    return null
  }

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
                href="mailto:info@thecupcakedesire.com.au"
                className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
              >
                info@thecupcakedesire.com.au
              </a>
              . A human reads every email.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setActiveCat(c)
                    const first = faqs.findIndex(
                      (f) => c === 'All' || f.category?.name === c
                    )
                    setOpen(first >= 0 ? first : null)
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
            {/* Render every FAQ in the SSR HTML. Category filter only hides visually. */}
            <ul className="divide-y divide-line border-y border-line">
              {faqs.map((f, i) => {
                const matchesCat =
                  activeCat === 'All' || f.category?.name === activeCat
                const isOpen = matchesCat && open === i
                return (
                  <li key={f._id} hidden={!matchesCat}>
                    <button
                      type="button"
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
                    <div hidden={!isOpen}>
                      <p
                        className="bake-body pb-6 pr-12 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: f.answer }}
                      />
                    </div>
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
