import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadCollectionGrid } from '@/lib/collection-products'
import connectDb from '@/lib/mongodb'
import { DIETARY_ANSWER } from '@/lib/quick-answers'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { getSuburbPage, sameZoneSuburbs, SUBURB_NOTES, SUBURB_PAGES, type SuburbPage } from '@/lib/suburb-pages'
import { siteConfig } from '@/lib/seo'
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

/**
 * Per-suburb flag controlling indexability. Suburb pages are noindex by default
 * (doorway risk), but can be re-enabled here once genuinely unique local content
 * is added. Key is the suburb slug, value true means indexable.
 */
const INDEXABLE_SUBURBS: Record<string, boolean> = {
  // Example: 'hawthorn': true, when it has unique local content
}

function isSuburbIndexable(page: SuburbPage): boolean {
  return INDEXABLE_SUBURBS[page.slug] === true
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getSuburbPage((await params).suburb)
  if (!page) return {}
  const title = `Cupcake Delivery ${page.name} ${page.postcode} | The Cupcake Desire`
  const description = `Hand-frosted cupcakes, cakes and macarons delivered to ${page.name} (${page.postcode}), Melbourne Metro. ${aud(page.fee)} delivery. Order by noon for next weekday after 2pm.`
  const path = `/cupcake-delivery/${page.slug}`
  const indexable = isSuburbIndexable(page)
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
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
      ? 'Near zone'
      : 'Extended zone'
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
          ? `Our kitchen is here in ${page.name}, Melbourne Metro. We are an online-only bakery with no walk-in store, so every order is baked fresh and hand-delivered — including to ${page.name} (${page.postcode}).`
          : `We bake cupcakes, cakes and macarons to order in our Narre Warren kitchen and hand-deliver them to ${page.name} (${page.postcode}), Melbourne Metro.`,
        `Delivery to ${page.name} is ${aud(page.fee)}. Order before 12 noon for delivery the next weekday after 2pm; orders after noon arrive the day after next.`,
        ...(localNote ? [localNote] : []),
      ]}
      facts={[
        { label: 'Postcode', value: page.postcode },
        { label: 'Delivery zone', value: zoneLabel },
        { label: 'Delivery fee', value: aud(page.fee) },
        { label: 'Earliest delivery', value: 'Next weekday after 2pm when ordered before noon; day after next when ordered after noon' },
        { label: 'Delivery days', value: 'Weekdays only — no weekends or public holidays' },
        { label: 'Lead time', value: 'Every order needs at least 24 hours; larger or custom orders need longer notice' },
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
          answer: `Yes. ${page.name} (${page.postcode}) is in our ${page.zone === 'near' ? 'near' : 'extended'} delivery zone in Melbourne Metro. We hand-deliver on weekdays from our kitchen in Narre Warren.`,
        },
        {
          question: `How much is cupcake delivery to ${page.name}?`,
          answer: `Delivery to ${page.postcode} is ${aud(page.fee)}.`,
        },
        {
          question: `How soon can I get cupcakes delivered in ${page.name}?`,
          answer:
            'Order before 12 noon for delivery the next weekday after 2pm; orders placed after noon arrive the day after next. We do not deliver on weekends or public holidays, and larger or custom orders need more notice.',
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
            description: `Delivery fee to ${page.postcode}`,
          },
        },
      ]}
      emitFaqSchema={false}
    />
  )
}
