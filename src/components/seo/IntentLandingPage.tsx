import { CakeProductCard, type Product } from '@/components/HomePage/_shared'
import JsonLd from '@/components/SE0/JsonLd'
import QuickAnswers from '@/components/seo/QuickAnswers'
import RelatedGuides from '@/components/seo/RelatedGuides'
import RichParagraph from '@/components/seo/RichParagraph'
import type { FaqItem } from '@/lib/product-faq'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

/** Inline [label](/path) parsing for table cells (same rules as RichParagraph). */
function RichInline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (!match) return <span key={i}>{part}</span>
        const [, label, href] = match
        const external = /^https?:\/\//i.test(href)
        if (external) {
          return (
            <a key={i} href={href} className="text-rose-accent underline-offset-2 hover:underline">
              {label}
            </a>
          )
        }
        return (
          <Link key={i} href={href} className="text-rose-accent underline-offset-2 hover:underline">
            {label}
          </Link>
        )
      })}
    </>
  )
}

export type IntentSection = {
  heading: string
  body: string[]
  steps?: string[]
  table?: { columns: string[]; rows: string[][] }
  bodyAfter?: string[]
}

/**
 * Server-rendered landing page for one search intent (e.g. "eggless cupcakes
 * Melbourne"): H1 + intro, real products, explanatory sections and
 * answer-first Q&A with FAQPage schema — all in the initial HTML. Header and
 * footer come from the (other-pages) layout.
 */
export default function IntentLandingPage({
  path,
  breadcrumb,
  eyebrow,
  heading,
  intro,
  products,
  productsHeading,
  productsIntro,
  productsId,
  sections,
  faqs,
  faqHeading,
  links,
  linksHeading,
  facts,
  parent,
  schema,
  emitFaqSchema = true,
  heroImage,
  primaryCta,
  secondaryCta,
  outro,
  introClassName,
}: {
  path: string
  breadcrumb: string
  eyebrow: string
  heading: string
  intro: (string | ReactNode)[]
  products: Product[]
  productsHeading: string
  /** Optional paragraph under the products H2. */
  productsIntro?: string
  /** Optional id on the products <section> (e.g. shop-vegan). */
  productsId?: string
  sections: IntentSection[]
  faqs: FaqItem[]
  faqHeading: string
  links: { href: string; label: string }[]
  linksHeading?: string
  /** Key facts shown as a definition list under the intro (e.g. delivery fee). */
  facts?: { label: string; value: string }[]
  /** Middle breadcrumb level, e.g. the /cupcake-delivery hub. */
  parent?: { name: string; path: string }
  /** Extra JSON-LD entities for the page (e.g. a Service). */
  schema?: Record<string, unknown>[]
  /** Pass false on noindex pages so FAQ schema is not emitted. */
  emitFaqSchema?: boolean
  heroImage?: { src: string; alt: string }
  primaryCta?: { href: string; label: string }
  secondaryCta?: { href: string; label: string }
  /** Rendered after QuickAnswers and before RelatedGuides. */
  outro?: ReactNode
  /**
   * Extra classes for string intro paragraphs (e.g. mobile min-height to
   * reserve space across Inter display:swap, same idea as the homepage hero).
   */
  introClassName?: string
}) {
  const introParagraphClass = [
    'bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft',
    introClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: siteConfig.url },
            ...(parent ? [{ name: parent.name, url: `${siteConfig.url}${parent.path}` }] : []),
            { name: breadcrumb, url: `${siteConfig.url}${path}` },
          ]),
          ...(schema || []),
        ]}
      />
      <div className="bake-canvas">
        <section className="bg-cream py-14 md:py-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              {eyebrow}
            </p>
            <h1 className="bake-display-lg mt-5 max-w-[22ch]">{heading}</h1>
            {intro.map((p, i) =>
              typeof p === 'string' ? (
                <RichParagraph key={i} text={p} className={introParagraphClass} />
              ) : (
                <div key={i} className="bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft">
                  {p}
                </div>
              )
            )}
            {heroImage && (
              <div className="mt-8 overflow-hidden rounded-2xl">
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  width={1100}
                  height={620}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            )}
            {facts && facts.length > 0 && (
              <dl className="mt-8 grid max-w-[760px] grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-line bg-ivory p-6 sm:grid-cols-2">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="bake-caption text-taupe">{f.label}</dt>
                    <dd className="mt-1 text-[15px] font-medium text-cocoa">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryCta?.href || '/cupcake-builder'} className="bake-btn bake-btn-rose">
                {primaryCta?.label || 'Build your box'}
              </Link>
              <Link href={secondaryCta?.href || '/collections/all-items'} className="bake-btn bake-btn-ghost">
                {secondaryCta?.label || 'Shop everything'}
              </Link>
            </div>
          </div>
        </section>

        {products.length > 0 && (
          <section id={productsId} className="bg-ivory py-14 md:py-20">
            <div className="mx-auto max-w-[1320px] px-6 md:px-10">
              <h2 className="bake-display-lg">{productsHeading}</h2>
              {productsIntro && (
                <RichParagraph text={productsIntro} className="bake-body mt-4 max-w-[62ch] text-cocoa-soft" />
              )}
              <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {products.map((p, i) => (
                  <CakeProductCard key={p._id} product={p} index={i} priority={i < 2} />
                ))}
              </div>
            </div>
          </section>
        )}

        {sections.map((s) => (
          <section key={s.heading} className="border-t border-line bg-cream py-12 md:py-16">
            <div className="mx-auto max-w-[900px] px-6 md:px-10">
              <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
                {s.heading}
              </h2>
              {s.body.map((p) => (
                <RichParagraph key={p.slice(0, 40)} text={p} className="bake-body mt-4 text-cocoa-soft" />
              ))}
              {s.steps && s.steps.length > 0 && (
                <ol className="bake-body mt-6 list-decimal space-y-3 pl-5 text-cocoa-soft">
                  {s.steps.map((step) => (
                    <li key={step.slice(0, 40)}>
                      <RichInline text={step} />
                    </li>
                  ))}
                </ol>
              )}
              {s.table && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-left text-[15px] text-cocoa-soft">
                    <thead>
                      <tr className="border-b border-line">
                        {s.table.columns.map((col) => (
                          <th
                            key={col}
                            className="bake-caption px-3 py-3 font-medium text-cocoa first:pl-0 last:pr-0"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-line">
                          {row.map((cell, ci) => (
                            <td key={ci} className="bake-body px-3 py-3 align-top first:pl-0 last:pr-0">
                              <RichInline text={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s.bodyAfter?.map((p) => (
                <RichParagraph key={p.slice(0, 40)} text={p} className="bake-body mt-4 text-cocoa-soft" />
              ))}
            </div>
          </section>
        ))}

        <QuickAnswers heading={faqHeading} items={faqs} emitSchema={emitFaqSchema} />
        {outro}
        <RelatedGuides path={path} />

        <section className="border-t border-line bg-cream py-12">
          {linksHeading && (
            <h2 className="mx-auto mb-5 max-w-[1100px] px-6 font-bake-display text-[22px] font-medium tracking-tight text-cocoa md:px-10 md:text-[26px]">
              {linksHeading}
            </h2>
          )}
          <div className="mx-auto flex max-w-[1100px] flex-wrap gap-2.5 px-6 md:px-10">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa hover:border-rose-accent hover:text-rose-accent"
              >
                {l.label} <span aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
