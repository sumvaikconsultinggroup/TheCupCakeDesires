import JsonLd from '@/components/SE0/JsonLd'
import QuickAnswers from '@/components/seo/QuickAnswers'
import { DELIVERY_ANSWER } from '@/lib/quick-answers'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { SUBURB_PAGES } from '@/lib/suburb-pages'
import { DELIVERY_FEE_EXTENDED, DELIVERY_FEE_NEAR, FREE_DELIVERY_THRESHOLD } from '@/utils/deliveryZones'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cupcake Delivery Melbourne – Suburbs & Fees | The Cupcake Desire',
  description: `Every Melbourne suburb we deliver cupcakes to, with fees: $${DELIVERY_FEE_NEAR} near zone, $${DELIVERY_FEE_EXTENDED} extended, free over $${FREE_DELIVERY_THRESHOLD}. Weekday hand delivery.`,
  alternates: { canonical: '/cupcake-delivery' },
  openGraph: {
    title: 'Cupcake Delivery Melbourne – Suburbs & Fees',
    description: 'Every suburb we deliver cupcakes to, with delivery fees and lead times.',
    url: '/cupcake-delivery',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
}

const ZONES = [
  { zone: 'near' as const, title: `Near zone — $${DELIVERY_FEE_NEAR}`, note: 'Closer suburbs around our Narre Warren kitchen.' },
  { zone: 'extended' as const, title: `Extended zone — $${DELIVERY_FEE_EXTENDED}`, note: 'Further suburbs, including inner Melbourne and the CBD.' },
]

export default function CupcakeDeliveryHub() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: 'Home', url: siteConfig.url },
          { name: 'Cupcake delivery', url: `${siteConfig.url}/cupcake-delivery` },
        ])}
      />
      <main className="bake-canvas">
        <section className="bg-cream py-14 md:py-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              {SUBURB_PAGES.length} suburbs
            </p>
            <h1 className="bake-display-lg mt-5 max-w-[22ch]">Cupcake delivery across Melbourne</h1>
            <p className="bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft">
              We bake to order in Narre Warren and hand-deliver on weekdays to the suburbs below. Delivery is free
              on orders of ${FREE_DELIVERY_THRESHOLD} or more. Order before 12 noon for delivery the next weekday.
              Not on the list? Contact us for a quote.
            </p>
          </div>
        </section>

        {ZONES.map(({ zone, title, note }) => (
          <section key={zone} className="border-t border-line bg-ivory py-12 md:py-16">
            <div className="mx-auto max-w-[1100px] px-6 md:px-10">
              <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">{title}</h2>
              <p className="bake-body mt-2 text-cocoa-soft">{note}</p>
              <ul className="mt-6 columns-2 gap-8 text-[15px] md:columns-3 lg:columns-4">
                {SUBURB_PAGES.filter((s) => s.zone === zone).map((s) => (
                  <li key={s.slug} className="mb-2 break-inside-avoid">
                    <Link href={`/cupcake-delivery/${s.slug}`} className="text-cocoa hover:text-rose-accent">
                      {s.name} <span className="text-taupe">{s.postcode}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <QuickAnswers
          heading="Melbourne cupcake delivery: quick answers"
          items={[
            DELIVERY_ANSWER,
            {
              question: 'Do you deliver outside these suburbs?',
              answer:
                'Standard orders go to the suburbs listed here. If yours is not listed, contact us before ordering and we will tell you honestly what we can do.',
            },
          ]}
        />
      </main>
    </>
  )
}
