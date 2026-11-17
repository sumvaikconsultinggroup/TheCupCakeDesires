import JsonLd from '@/components/SE0/JsonLd'
import QuickAnswers from '@/components/seo/QuickAnswers'
import RichParagraph from '@/components/seo/RichParagraph'
import { CUPCAKE_DELIVERY_QA } from '@/data/cupcake-delivery-qa'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { SUBURB_PAGES } from '@/lib/suburb-pages'
import { DELIVERY_FEE_EXTENDED, DELIVERY_FEE_NEAR } from '@/utils/deliveryZones'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cupcake Delivery Melbourne | Next Weekday, Metro Suburbs',
  description: 'Cupcake delivery across Melbourne Metro on weekdays. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. $0 to $20 by suburb, free over $100.',
  alternates: { canonical: '/cupcake-delivery' },
  openGraph: {
    title: 'Cupcake Delivery Melbourne | Next Weekday, Metro Suburbs',
    description: 'Cupcake delivery across Melbourne Metro on weekdays. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. $0 to $20 by suburb, free over $100.',
    url: '/cupcake-delivery',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cupcake Delivery Melbourne | Next Weekday, Metro Suburbs',
    description: 'Cupcake delivery across Melbourne Metro on weekdays. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. $0 to $20 by suburb, free over $100.',
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
              The Cupcake Desire delivers cupcakes across Melbourne Metro, Monday to Friday. Each box is baked to order in our Narre Warren kitchen and hand delivered, generally 9am to 3pm. Order by 12 noon for next-weekday delivery. Fees are $0 to $20, depending on your suburb, and addresses outside Metro are by quote.
            </p>
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

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Where we deliver across Melbourne Metro
            </h2>
            <RichParagraph
              text="Our delivery area is Melbourne Metro, including the CBD and inner suburbs. We hand deliver on our own weekday route from Narre Warren, so the suburbs on this page are grouped into two fee zones, Near and Extended. If your address sits outside Metro, ask us for a quote before you order. We do not ship interstate."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              How ordering and the cut-off work
            </h2>
            <RichParagraph
              text="Order by 12 noon for next-weekday delivery. Orders placed after noon miss the next weekday run, so the earliest delivery is the weekday after that. Deliveries generally arrive between 9am and 3pm, and we cannot promise a set time, so if your event starts early, choose delivery the weekday before."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
            <RichParagraph
              text="We do not deliver on Saturdays, Sundays or public holidays, and we do not offer same-day delivery. Our page on [why there is no same-day cupcake delivery](/melbourne/same-day-cupcake-delivery) explains what next weekday means in practice, and the [delivery policy](/shipping-policy) sets out the full rules."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Delivery fees by suburb
            </h2>
            <RichParagraph
              text="Fees are $0 to $20, set by suburb. Suburbs closer to our kitchen sit in the Near zone, and suburbs further out, including inner Melbourne and the CBD, sit in the Extended zone. Each suburb page shows the fee for its postcode, so check yours before you order. If your suburb is not listed, contact us for a quote first."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Cakes and custom orders need more notice
            </h2>
            <RichParagraph
              text="Cupcake boxes follow the timing above, but cakes take longer. Cakes need 3 days' notice. Weddings, corporate runs and custom builds need longer notice, so contact us when you book. For photo, message or flavour designs, start with our [custom cupcakes](/custom-cupcakes-melbourne) and tell us your delivery date when you enquire."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Vegan, eggless and gluten-free delivery
            </h2>
            <RichParagraph
              text="Every flavour comes in an eggless version, we bake a vegan range, and gluten-free options are available. All of them travel on the same weekday route as the rest of our boxes. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. Browse [vegan cupcakes](/vegan-cupcakes), [eggless cupcakes](/eggless-cupcakes) or [gluten-free cupcakes](/gluten-free-cupcakes)."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Office and corporate delivery
            </h2>
            <RichParagraph
              text="We deliver to offices across Melbourne Metro on weekdays, to one address or to several venues in the same order. Standard and mini logo cupcakes and cake slices are on our [corporate cupcakes](/corporate) page. Bigger or multi-venue orders take longer to plan, so send us your numbers and venues when you enquire and we will confirm a date."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Find your suburb
            </h2>
            <RichParagraph
              text="Start with your suburb page for its delivery fee. Suburb pages include [Glen Waverley](/cupcake-delivery/glen-waverley), [Berwick](/cupcake-delivery/berwick), [Cranbourne](/cupcake-delivery/cranbourne), [Narre Warren](/cupcake-delivery/narre-warren), [Clayton](/cupcake-delivery/clayton), [Hawthorn](/cupcake-delivery/hawthorn), [Brighton](/cupcake-delivery/brighton), [Burwood](/cupcake-delivery/burwood), [Box Hill](/cupcake-delivery/box-hill), [South Yarra](/cupcake-delivery/south-yarra) and the [Melbourne CBD](/cupcake-delivery/melbourne). The full list of suburbs and postcodes follows below."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Melbourne cupcake and cake guides
            </h2>
            <RichParagraph
              text="Not sure what to order? Our [Melbourne guides](/melbourne) cover [cupcakes near you](/melbourne/cupcakes-near-me), [birthday cakes](/melbourne/birthday-cakes), [kids birthday cakes](/melbourne/kids-birthday-cakes) and [custom cakes](/melbourne/custom-cakes), and say plainly what we do and do not offer."
              className="bake-body mt-4 max-w-[62ch] text-cocoa-soft"
            />
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
