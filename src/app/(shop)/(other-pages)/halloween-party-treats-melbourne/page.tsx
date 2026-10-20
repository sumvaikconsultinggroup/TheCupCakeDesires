import IntentLandingPage from '@/components/seo/IntentLandingPage'
import {
  HALLOWEEN_ALLERGY_LINE,
  HALLOWEEN_PARTY_FAQS,
} from '@/data/halloween-2026'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { withBrand } from '@/lib/seo-title'
import { Metadata } from 'next'

export const revalidate = 300

const TITLE = 'Halloween Party Treats Melbourne | Cupcakes and Cakes'
const DESCRIPTION =
  'Plan Halloween party treats for kids, school or the office. Cupcakes, minis and cakes delivered across Melbourne Metro on weekdays.'

export const metadata: Metadata = {
  title: withBrand(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: '/halloween-party-treats-melbourne' },
  openGraph: {
    title: withBrand(TITLE),
    description: DESCRIPTION,
    url: '/halloween-party-treats-melbourne',
    type: 'website',
    images: ['/images/halloween/halloween-party-treats.webp', DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

export default async function HalloweenPartyTreatsPage() {
  return (
    <IntentLandingPage
      path="/halloween-party-treats-melbourne"
      breadcrumb="Halloween Party Treats"
      eyebrow="Halloween 2026"
      heading="Halloween Party Treats in Melbourne"
      intro={[
        'Planning a Halloween party at home, school or work? Here is how to choose and order cupcakes, minis and cakes so the treats arrive ready for the fun.',
      ]}
      heroImage={{
        src: '/images/halloween/halloween-party-treats.webp',
        alt: 'Halloween party treats cupcakes and cakes for Melbourne celebrations',
      }}
      products={[]}
      productsHeading="Halloween picks"
      primaryCta={{ href: '/collections/halloween-cupcakes', label: 'Shop Halloween cupcakes' }}
      secondaryCta={{ href: '/collections/halloween-cakes', label: 'Shop Halloween cakes' }}
      sections={[
        {
          heading: 'How many treats to order',
          body: [
            'Plan around one cupcake per guest, or two to three minis per guest when there is other food. Add a cake when you want a centrepiece for photos or a birthday.',
          ],
        },
        {
          heading: 'Halloween at the office',
          body: [
            'A Halloween afternoon tea is an easy team moment. Mini cupcakes work well for shared tables, and branded cupcakes can carry your logo on our [branded cupcakes](/branded-cupcakes-melbourne) page. See our [corporate options](/corporate) for larger office orders.',
          ],
        },
        {
          heading: 'Kids and school Halloween parties',
          body: [
            "Kids love bright colours and friendly characters. Check your school's food policy first, and note our allergy line below.",
          ],
        },
        {
          heading: 'Mixing dietary needs in one order',
          body: [
            `Vegan, eggless and gluten free options let you cover more guests in one order. They are made in a shared kitchen. ${HALLOWEEN_ALLERGY_LINE}`,
          ],
        },
        {
          heading: 'Delivery timing for Halloween',
          body: [
            'We are an online bakery delivering across Melbourne Metro on weekdays between 9am and 3pm. Order by noon for next-weekday delivery. Delivery fees are typically $0 to $20, depending on your suburb, and the exact fee shows at checkout. Halloween 2026 falls on a Saturday, so for a weekend party book Friday 30 October.',
          ],
        },
        {
          heading: 'Questions?',
          body: ['Call 03 9705 0051 and we will help you choose the right box for your party.'],
        },
      ]}
      faqHeading="Halloween party treats: quick answers"
      faqs={[...HALLOWEEN_PARTY_FAQS]}
      links={[
        { href: '/collections/halloween-cupcakes', label: 'Halloween cupcakes' },
        { href: '/collections/halloween-cakes', label: 'Halloween cakes' },
        { href: '/branded-cupcakes-melbourne', label: 'Branded cupcakes' },
        { href: '/corporate', label: 'Corporate options' },
        { href: '/cupcake-delivery', label: 'Cupcake delivery areas' },
        { href: '/blogs/halloween-cupcake-ideas-melbourne', label: 'Halloween cupcake ideas' },
      ]}
      linksHeading="Shop Halloween"
    />
  )
}
