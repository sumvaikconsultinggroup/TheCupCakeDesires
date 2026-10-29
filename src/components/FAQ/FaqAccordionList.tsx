'use client'

import { useState } from 'react'
import type { PageFaqItem } from '@/hooks/usePageFaqs'

type FaqAccordionListProps = {
  items: PageFaqItem[]
  variant?: 'plus' | 'chevron'
  className?: string
}

export default function FaqAccordionList({
  items,
  variant = 'plus',
  className = '',
}: FaqAccordionListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!items.length) return null

  return (
    <ul className={`divide-y divide-line border-y border-line ${className}`}>
      {items.map((f, i) => {
        const isOpen = openIndex === i
        const answerId = `faq-answer-${f._id}`
        const questionId = `faq-question-${f._id}`
        return (
          <li key={f._id}>
            <button
              type="button"
              id={questionId}
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-rose-accent"
            >
              <span className="font-bake-display text-[18px] font-medium text-cocoa md:text-[20px]">
                {f.question}
              </span>
              {variant === 'plus' ? (
                <span
                  aria-hidden
                  className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-cocoa transition-transform ${
                    isOpen ? 'rotate-45 border-rose-accent bg-rose-accent text-white' : ''
                  }`}
                >
                  +
                </span>
              ) : (
                <span
                  aria-hidden
                  className={`mt-1 text-cocoa-soft transition-transform ${isOpen ? 'rotate-180 text-rose-accent' : ''}`}
                >
                  ▾
                </span>
              )}
            </button>
            <div
              id={answerId}
              role="region"
              aria-labelledby={questionId}
              hidden={!isOpen}
              className="overflow-hidden"
            >
              <p
                className="bake-body-sm pb-6 pr-10 text-cocoa-soft"
                dangerouslySetInnerHTML={{ __html: f.answer }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
