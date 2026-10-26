import JsonLd from '@/components/SE0/JsonLd'
import QuickAnswers from '@/components/seo/QuickAnswers'
import { CUPCAKE_DELIVERY_QA } from '@/data/cupcake-delivery-qa'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { SUBURB_PAGES } from '@/lib/suburb-pages'
import { DELIVERY_FEE_EXTENDED, DELIVERY_FEE_NEAR } from '@/utils/deliveryZones'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cupcake Delivery Melbourne | Metro Suburbs and Fees',
  description: 'Melbourne Metro cupcake delivery, weekdays only. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. $0 to $20 by suburb, free over $100.',
  alternates: { canonical: '/cupcake-delivery' },
  openGraph: {
    title: 'Cupcake Delivery Melbourne | Metro Suburbs and Fees',
    description: 'Melbourne Metro cupcake delivery, weekdays only. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. $0 to $20 by suburb, free over $100.',
    url: '/cupcake-delivery',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cupcake Delivery Melbourne | Metro Suburbs and Fees',
    description: 'Melbourne Metro cupcake delivery, weekdays only. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. $0 to $20 by suburb, free over $100.',
  },
}

const ZONES = [
  {
    zone: 'near' as const,
    title: `Near zone: $${DELIVERY_FEE_NEAR}`,
    note: 'Closer suburbs around our Narre Warren kitchen.',
  },
  {
    zone: 'extended' as const,
    title: `Extended zone: $${DELIVERY_FEE_EXTENDED}`,
    note: 'Further suburbs, including inner Melbourne and the CBD.',
  },
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
      <div className="bake-canvas">
        <section className="bg-cream py-14 md:py-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              {SUBURB_PAGES.length} suburbs
            </p>
            <h1 className="bake-display-lg mt-5 max-w-[22ch]">Cupcake delivery across Melbourne Metro</h1>
            <p className="bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft">
              We hand-deliver cupcakes across Melbourne Metro on weekdays from our kitchen in Narre Warren.
              Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote.
            </p>
            <p className="bake-body mt-5 max-w-[62ch] text-cocoa-soft">
              Deliveries generally arrive between 9am and 3pm, with no guaranteed timed slot. Weddings, corporate
              runs and custom builds need longer notice, so contact us when you book. For the full rules on cut-offs
              and fees, read the{' '}
              <Link href="/shipping-policy" className="text-rose-accent underline-offset-4 hover:underline">
                delivery policy
              </Link>
              . Use the suburb pages below for your postcode fee, or start with the{' '}
              <Link href="/cupcake-builder" className="text-rose-accent underline-offset-4 hover:underline">
                cupcake builder
              </Link>{' '}
              if you already know what you want.
            </p>
          </div>
        </section>

        {ZONES.map(({ zone, title, note }) => (
          <section key={zone} className="border-t border-line bg-ivory py-12 md:py-16">
            <div className="mx-auto max-w-[1100px] px-6 md:px-10">
              <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
                {title}
              </h2>
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

        <QuickAnswers heading="Melbourne cupcake delivery: quick answers" items={CUPCAKE_DELIVERY_QA} />
      </div>
    </>
  )
}
