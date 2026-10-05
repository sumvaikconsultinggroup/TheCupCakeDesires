import { generateFAQSchema } from '@/lib/seo'
import type { FaqItem } from '@/lib/product-faq'

/**
 * Answer-first Q&A rendered in the server HTML (unlike the admin FAQ widgets,
 * which load in the browser), with matching FAQPage JSON-LD — so search and
 * AI answer engines can quote prices, delivery rules and options directly.
 *
 * Set emitSchema=false to render the visible FAQ without FAQPage JSON-LD
 * (e.g. for noindex pages where duplicated FAQ schema is a risk).
 */
export default function QuickAnswers({
  items,
  eyebrow = 'Quick answers',
  heading,
  emitSchema = true,
}: {
  items: FaqItem[]
  eyebrow?: string
  heading: string
  /** Emit FAQPage JSON-LD schema. Default true; set false for noindex pages. */
  emitSchema?: boolean
}) {
  if (items.length === 0) return null
  return (
    <section className="border-t border-line bg-ivory py-14 md:py-20">
      {emitSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ '@context': 'https://schema.org', ...generateFAQSchema(items) }),
          }}
        />
      )}
      <div className="mx-auto max-w-[900px] px-6 md:px-10">
        <p className="bake-eyebrow">
          <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
          {eyebrow}
        </p>
        <h2 className="bake-display-lg mt-5">{heading}</h2>
        <dl className="mt-10 divide-y divide-line border-y border-line">
          {items.map((f) => (
            <div key={f.question} className="py-5">
              <dt className="text-[17px] font-medium text-cocoa">{f.question}</dt>
              <dd className="bake-body mt-2 text-cocoa-soft">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
