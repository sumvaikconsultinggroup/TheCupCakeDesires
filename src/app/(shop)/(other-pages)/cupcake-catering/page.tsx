import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadProductsByHandles } from '@/lib/collection-products'
import { corporateQuickAnswers, DELIVERY_ANSWER } from '@/lib/quick-answers'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Cupcake Catering Melbourne | Events & Offices',
  description:
    'Cupcake and dessert catering for Melbourne offices and events — mini cupcake boxes, cake slice boxes up to 100, giant cupcakes and logo cupcakes.',
  alternates: { canonical: '/cupcake-catering' },
  openGraph: {
    title: 'Cupcake Catering Melbourne | The Cupcake Desire',
    description: 'Cupcakes, minis and cake slices for offices and events, delivered across Melbourne.',
    url: '/cupcake-catering',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
}

const HANDLES = [
  'mini-cupcake-box-24-assorted',
  'mix-slice',
  'mix-box-of-12',
  'corporate-cupcakes',
  'mini-corporate-cupcakes',
  'corporate-cake-slices',
  'giant-cupcake-red-velvet',
  'vegan-box-of-12',
]

export default async function CupcakeCateringPage() {
  const products = await loadProductsByHandles(HANDLES)
  const [pricing] = corporateQuickAnswers()
  return (
    <IntentLandingPage
      path="/cupcake-catering"
      breadcrumb="Cupcake Catering"
      eyebrow="Offices & events"
      heading="Cupcake catering for Melbourne offices and events"
      intro={[
        'Feeding a meeting, launch, morning tea or party? We cater with mini cupcake boxes of 24, cake slice catering boxes of 12 to 100, boxes of 12 full-size cupcakes, giant cupcakes that serve about 20, and branded cupcakes and slices with your logo.',
        'Everything is baked to order in our Narre Warren kitchen and hand-delivered on weekdays across Melbourne Metro.',
      ]}
      products={products as any}
      productsHeading="Catering favourites"
      sections={[
        {
          heading: 'How much to order',
          body: [
            'As a rule of thumb, plan one full-size cupcake or two to three minis per guest for a morning tea, and a little more when the dessert table is the main event. Cake slices suit grab-and-go meetings. A giant cupcake makes an easy centrepiece for a birthday or milestone.',
          ],
        },
        {
          heading: 'Lead times for larger orders',
          body: [
            'A single box can be delivered as soon as the next weekday if you order before noon. Larger orders need at least two days’ notice, and weddings and corporate events typically need about a week — contact us with your date and numbers and we will confirm a realistic timeline.',
          ],
        },
        {
          heading: 'Dietary needs',
          body: [
            'Every flavour has an eggless alternative, and we bake vegan and gluten-free ranges, so you can cater for mixed groups in one order. Our kitchen handles common allergens, so please tell us about severe allergies before ordering.',
          ],
        },
      ]}
      faqHeading="Cupcake catering: quick answers"
      faqs={[
        {
          question: 'Do you cater cupcakes for events in Melbourne?',
          answer:
            'Yes — mini cupcake boxes of 24, cake slice boxes of 12, 36, 50 or 100, boxes of 12 cupcakes, giant cupcakes and logo-branded cupcakes, delivered on weekdays across Melbourne Metro.',
        },
        pricing,
        DELIVERY_ANSWER,
      ]}
      links={[
        { href: '/corporate', label: 'Corporate cupcakes' },
        { href: '/collections/cake-slices', label: 'Cake slice boxes' },
        { href: '/collections/mini-cupcakes', label: 'Mini cupcakes' },
        { href: '/collections/giant-cupcakes', label: 'Giant cupcakes' },
        { href: '/collections/wedding-cupcakes', label: 'Wedding cupcakes' },
      ]}
    />
  )
}
