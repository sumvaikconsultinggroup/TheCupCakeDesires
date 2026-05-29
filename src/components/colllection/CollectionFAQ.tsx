'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface CollectionFAQProps {
  items: FAQItem[]
}

export default function CollectionFAQ({ items }: CollectionFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!items || items.length === 0) return null

  return (
    <div className="mt-16 border-t border-neutral-200 pt-16 dark:border-neutral-800">
      <div className="max-w-3xl">
        <h2 className="font-[family-name:var(--font-family-antonio)] text-3xl font-black uppercase mb-8 text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-[#1B198F]/30 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors"
              >
                <span className="font-bold text-neutral-900 dark:text-white sm:text-lg">
                  {item.question}
                </span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${openIndex === index ? 'bg-[#1B198F] text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                  {openIndex === index ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="border-t border-neutral-100 p-5 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                      <p className="whitespace-pre-wrap leading-relaxed">{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
