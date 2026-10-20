import { generateFAQSchema } from '@/lib/seo'
import type { FaqItem } from '@/lib/product-faq'
import Link from 'next/link'

export type QuickAnswerItem = FaqItem & {
  links?: { href: string; label: string }[]
}

/**
 * Answer-first Q&A rendered in the server HTML (unlike the admin FAQ widgets,
 * which load in the browser), with matching FAQPage JSON-LD, so search and
 * AI answer engines can quote prices, delivery rules and options directly.
 */
export default function QuickAnswers({
  items,
  eyebrow = 'Quick answers',
  heading,
  emitSchema = true,
}: {
  items: QuickAnswerItem[]
  eyebrow?: string
  heading: string
  /** Set false on noindex pages to avoid FAQ rich-result noise. */
  emitSchema?: boolean
}) {
  if (items.length === 0) return null

  const schemaItems: FaqItem[] = items.map(({ question, answer }) => ({ question, answer }))

  return (
    <section className="border-t border-line bg-ivory py-14 md:py-20">
      {emitSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ '@context': 'https://schema.org', ...generateFAQSchema(schemaItems) }),
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
              {f.links && f.links.length > 0 ? (
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
                  {f.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="font-medium text-rose-accent underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
