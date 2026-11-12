import CorporateQuoteForm from '@/components/corporate/CorporateQuoteForm'
import QuickAnswers from '@/components/seo/QuickAnswers'
import RichParagraph from '@/components/seo/RichParagraph'
import {
  CHRISTMAS_CORPORATE_BRIEF,
  CHRISTMAS_CORPORATE_CTA,
  CHRISTMAS_CORPORATE_FAQS,
  CHRISTMAS_CORPORATE_H1,
  CHRISTMAS_CORPORATE_HERO_IMAGE,
  CHRISTMAS_CORPORATE_INTRO,
  CHRISTMAS_CORPORATE_OPTIONS,
  CHRISTMAS_CORPORATE_SECTIONS,
} from '@/data/christmas-corporate'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import Image from 'next/image'
import Link from 'next/link'
import JsonLd from '@/components/SE0/JsonLd'

export default function CorporateChristmasPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Corporate', url: `${siteConfig.url}/corporate` },
    { name: 'Christmas corporate cupcakes', url: `${siteConfig.url}/corporate/christmas` },
  ])

  return (
    <main className="bake-canvas">
      <JsonLd data={[breadcrumbSchema]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-cream py-14 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-rose-accent/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-12 md:gap-14 md:px-10">
          <div className="md:col-span-6">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
              Corporate Christmas
            </p>
            <h1 className="bake-display-xl mt-5 max-w-[22ch]">{CHRISTMAS_CORPORATE_H1}</h1>
            <RichParagraph
              text={CHRISTMAS_CORPORATE_INTRO}
              className="bake-body mt-6 max-w-[58ch] text-cocoa-soft"
            />
          </div>
          <div className="md:col-span-6">
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-cream-deep md:aspect-square">
              <Image
                src={CHRISTMAS_CORPORATE_HERO_IMAGE.src}
                alt={CHRISTMAS_CORPORATE_HERO_IMAGE.alt}
                title={CHRISTMAS_CORPORATE_HERO_IMAGE.alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Option cards */}
      <section className="border-t border-line bg-ivory py-14 md:py-20">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <h2 className="bake-display-lg">{CHRISTMAS_CORPORATE_OPTIONS.heading}</h2>
          <p className="bake-body mt-5 text-cocoa-soft">{CHRISTMAS_CORPORATE_OPTIONS.lead}</p>
          <ul className="mt-8 space-y-4 border-t border-line pt-6">
            {CHRISTMAS_CORPORATE_OPTIONS.items.map((item) => (
              <li key={item.href} className="bake-body text-cocoa-soft">
                <Link
                  href={item.href}
                  className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4"
                >
                  {item.label}
                </Link>
                {item.detail}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Brief + quote form */}
      <section id="quote" className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                Christmas corporate brief
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[20ch]">{CHRISTMAS_CORPORATE_BRIEF.heading}</h2>
              <p className="bake-body-lg mt-7 max-w-[46ch] text-cocoa-soft">
                {CHRISTMAS_CORPORATE_BRIEF.body}
              </p>
            </div>
            <div className="md:col-span-7">
              <CorporateQuoteForm subjectLabel="Christmas corporate enquiry" />
            </div>
          </div>
        </div>
      </section>

      {/* Content sections */}
      {CHRISTMAS_CORPORATE_SECTIONS.map((section) => (
        <section key={section.heading} className="border-t border-line bg-ivory py-12 md:py-14">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="bake-display-lg">{section.heading}</h2>
            <RichParagraph text={section.body} className="bake-body mt-5 text-cocoa-soft" />
          </div>
        </section>
      ))}

      {/* FAQ + FAQPage from same array */}
      <QuickAnswers
        eyebrow=""
        heading="Christmas corporate cupcake questions"
        items={CHRISTMAS_CORPORATE_FAQS}
      />

      {/* Closing CTA */}
      <section className="border-t border-line bg-cream py-14 md:py-16">
        <div className="mx-auto max-w-[720px] px-6 text-center md:px-10">
          <RichParagraph text={CHRISTMAS_CORPORATE_CTA} className="bake-body text-cocoa-soft" />
        </div>
      </section>
    </main>
  )
}
