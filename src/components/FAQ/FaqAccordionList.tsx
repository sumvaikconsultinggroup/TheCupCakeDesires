'use client'

import { AnimatePresence, motion } from 'framer-motion'
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
        return (
          <li key={f._id}>
            <button
              type="button"
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
                    className="bake-body-sm pb-6 pr-10 text-cocoa-soft"
                    dangerouslySetInnerHTML={{ __html: f.answer }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
