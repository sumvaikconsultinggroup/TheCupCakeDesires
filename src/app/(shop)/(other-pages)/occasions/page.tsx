import JsonLd from '@/components/SE0/JsonLd'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { OCCASION_LINKS } from '@/data/occasion-links'
import { COLLECTION_SEO } from '@/data/collection-seo'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Occasion Cupcakes Melbourne | The Cupcake Desire',
  description:
    'Birthday, wedding, baby, Christmas and more — themed cupcake boxes baked to order and delivered across Melbourne on weekdays.',
  alternates: { canonical: '/occasions' },
  openGraph: {
    title: 'Occasion Cupcakes Melbourne | The Cupcake Desire',
    description:
      'Themed cupcake boxes for birthdays, weddings, babies and the holidays. Delivered across Melbourne.',
    url: '/occasions',
    type: 'website',
  },
}

export default function OccasionsPage() {
  const crumbs = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Occasions', url: `${siteConfig.url}/occasions` },
  ])

  return (
    <>
      <JsonLd data={crumbs} />
      <main className="bake-canvas">
        <section className="bg-cream py-14 md:py-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Themed boxes
            </p>
            <h1 className="bake-display-lg mt-5 max-w-[18ch]">Occasion cupcakes, delivered in Melbourne</h1>
            <p className="bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft">
              Each occasion has its own box of 12, hand-frosted to order in Narre Warren. Order before noon for
              delivery the next weekday. Eggless, vegan and gluten-free options are available.
            </p>
          </div>
        </section>
        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto grid max-w-[1100px] gap-4 px-6 sm:grid-cols-2 md:px-10">
            {OCCASION_LINKS.map((link) => {
              const handle = link.href.replace('/collections/', '')
              const blurb = COLLECTION_SEO[handle]?.intro[0]
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-line bg-cream px-5 py-5 transition-colors hover:border-rose-accent"
                >
                  <h2 className="font-bake-display text-[22px] font-medium text-cocoa">{link.label}</h2>
                  {blurb && <p className="bake-body-sm mt-2 text-cocoa-soft">{blurb}</p>}
                </Link>
              )
            })}
          </div>
        </section>
        <RelatedGuides path="/occasions" />
      </main>
    </>
  )
}
