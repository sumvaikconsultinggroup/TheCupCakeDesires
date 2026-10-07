import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadCollectionGrid } from '@/lib/collection-products'
import connectDb from '@/lib/mongodb'
import { DIETARY_ANSWER } from '@/lib/quick-answers'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { getSuburbPage, sameZoneSuburbs, SUBURB_NOTES, SUBURB_PAGES } from '@/lib/suburb-pages'
import { siteConfig } from '@/lib/seo'
import { FREE_DELIVERY_THRESHOLD } from '@/utils/deliveryZones'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

// One page per serviceable postcode in utils/deliveryZones.ts — nothing else.
export const dynamicParams = false
export const revalidate = 3600

export function generateStaticParams() {
  return SUBURB_PAGES.map((s) => ({ suburb: s.slug }))
}

type Props = { params: Promise<{ suburb: string }> }

const aud = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getSuburbPage((await params).suburb)
  if (!page) return {}
  const title = `Cupcake Delivery ${page.name} ${page.postcode} | The Cupcake Desire`
  const description = `Hand-frosted cupcakes, cakes and macarons delivered to ${page.name} (${page.postcode}). ${aud(page.fee)} delivery, free over ${aud(FREE_DELIVERY_THRESHOLD)}. Order by noon for next weekday.`
  const path = `/cupcake-delivery/${page.slug}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'website', images: [DEFAULT_OG_IMAGE] },
  }
}

export default async function SuburbDeliveryPage({ params }: Props) {
  const page = getSuburbPage((await params).suburb)
  if (!page) notFound()

  await connectDb()
  // Bestsellers, falling back to the cupcake catalogue if that collection is empty.
  let { products } = await loadCollectionGrid('bestsellers').catch(() => ({ products: [] as any[] }))
  if (!products.length) {
    ;({ products } = await loadCollectionGrid('all-cupcakes').catch(() => ({ products: [] as any[] })))
  }
  const isHome = page.postcode === '3805'
  const zoneLabel =
    page.zone === 'near'
      ? 'Near zone (within about 25 km of our Narre Warren kitchen)'
      : 'Extended zone (about 26–50 km from our Narre Warren kitchen)'
  const path = `/cupcake-delivery/${page.slug}`
  const nearby = sameZoneSuburbs(page)
  const localNote = SUBURB_NOTES[page.slug]

  return (
    <IntentLandingPage
      path={path}
      parent={{ name: 'Cupcake delivery', path: '/cupcake-delivery' }}
      breadcrumb={page.name}
      eyebrow={`Delivering to ${page.postcode}`}
      heading={`Cupcake delivery in ${page.name}`}
      intro={[
        isHome
          ? `Our kitchen is here in ${page.name}. We are an online-only bakery with no walk-in store, so every order is baked fresh and hand-delivered — including to ${page.name} (${page.postcode}).`
          : `We bake cupcakes, cakes and macarons to order in our Narre Warren kitchen and hand-deliver them to ${page.name} (${page.postcode}).`,
        `Delivery to ${page.name} is ${aud(page.fee)}, and free on orders of ${aud(FREE_DELIVERY_THRESHOLD)} or more. Order before 12 noon for delivery the next weekday.`,
        ...(localNote ? [localNote] : []),
      ]}
      facts={[
        { label: 'Postcode', value: page.postcode },
        { label: 'Delivery zone', value: zoneLabel },
        { label: 'Delivery fee', value: `${aud(page.fee)} (free from ${aud(FREE_DELIVERY_THRESHOLD)})` },
        { label: 'Earliest delivery', value: 'Next weekday when ordered before noon; day after next when ordered after noon' },
        { label: 'Delivery days', value: 'Weekdays only — no weekends or public holidays' },
        { label: 'Larger orders', value: 'At least 2 days’ notice; cakes 3 days; weddings & corporate about a week' },
      ]}
      products={products.slice(0, 8) as any}
      productsHeading={`Popular cupcakes delivered to ${page.name}`}
      sections={[
        {
          heading: `Ordering for an office or event in ${page.name}?`,
          body: [
            `We deliver edible-logo corporate cupcakes, mini cupcake boxes, cake slice catering boxes and giant cupcakes to ${page.name}. For larger or multi-drop orders, contact us with your date and numbers and we will confirm a realistic timeline.`,
          ],
        },
      ]}
      faqHeading={`Cupcake delivery to ${page.name}: quick answers`}
      faqs={[
        {
          question: `Do you deliver cupcakes to ${page.name}?`,
          answer: `Yes. ${page.name} (${page.postcode}) is in our ${page.zone === 'near' ? 'near' : 'extended'} delivery zone. We hand-deliver on weekdays from our kitchen in Narre Warren.`,
        },
        {
          question: `How much is cupcake delivery to ${page.name}?`,
          answer: `Delivery to ${page.postcode} is ${aud(page.fee)}. It is free on orders of ${aud(FREE_DELIVERY_THRESHOLD)} or more.`,
        },
        {
          question: `How soon can I get cupcakes delivered in ${page.name}?`,
          answer:
            'Order before 12 noon for delivery the next weekday; orders placed after noon arrive the day after next. We do not deliver on weekends or public holidays, and larger or custom orders need more notice.',
        },
        DIETARY_ANSWER,
      ]}
      linksHeading={`We also deliver near ${page.name}`}
      links={[
        ...nearby.map((s) => ({ href: `/cupcake-delivery/${s.slug}`, label: `${s.name} ${s.postcode}` })),
        { href: '/cupcake-delivery', label: 'All delivery suburbs' },
      ]}
      schema={[
        {
          '@type': 'Service',
          '@id': `${siteConfig.url}${path}#service`,
          name: `Cupcake delivery to ${page.name}`,
          serviceType: 'Cupcake and cake delivery',
          provider: { '@id': `${siteConfig.url}/#business` },
          areaServed: {
            '@type': 'Place',
            name: `${page.name}, VIC ${page.postcode}`,
            address: { '@type': 'PostalAddress', postalCode: page.postcode, addressRegion: 'VIC', addressCountry: 'AU' },
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'AUD',
            price: String(page.fee),
            description: `Delivery fee to ${page.postcode}; free on orders of ${aud(FREE_DELIVERY_THRESHOLD)} or more`,
          },
        },
      ]}
    />
  )
}
