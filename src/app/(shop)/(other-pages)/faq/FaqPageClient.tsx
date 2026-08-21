'use client'

import FaqAccordionList from '@/components/FAQ/FaqAccordionList'
import { FAQ_PAGE_SECTIONS } from '@/data/faq-page-content'

export default function FaqPageClient() {
  return (
    <main className="bake-canvas">
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[920px] px-6 md:px-10">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Help centre
          </p>
          <h1 className="bake-display-xl mt-6 max-w-[16ch]">FAQ</h1>
          <p className="bake-body-lg mt-6 max-w-[55ch] text-cocoa-soft">
            Answers to common questions about ordering, freshness, custom cupcakes, and delivery
            across Melbourne.
          </p>
          <p className="bake-body mt-5 max-w-[55ch] text-cocoa-soft">
            Still stuck? Email{' '}
            <a
              href="mailto:info@thecupcakedesire.com.au"
              className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
            >
              info@thecupcakedesire.com.au
            </a>{' '}
            or call{' '}
            <a
              href="tel:+61397050051"
              className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent"
            >
              03 9705 0051
            </a>
            .
          </p>
        </div>
      </section>

      {FAQ_PAGE_SECTIONS.map((section, sectionIndex) => (
        <section
          key={section.id}
          className={sectionIndex % 2 === 0 ? 'py-16 md:py-24' : 'bg-cream py-16 md:py-24'}
        >
          <div className="mx-auto max-w-[920px] px-6 md:px-10">
            <h2 className="bake-display-lg max-w-[28ch]">{section.title}</h2>
            <FaqAccordionList
              className="mt-10"
              items={section.items.map((item, index) => ({
                _id: `${section.id}-${index}`,
                question: item.question,
                answer: item.answer,
              }))}
            />
          </div>
        </section>
      ))}
    </main>
  )
}
