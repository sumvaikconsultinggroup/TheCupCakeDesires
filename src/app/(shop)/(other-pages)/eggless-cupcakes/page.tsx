import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadProductsByHandles } from '@/lib/collection-products'
import { DELIVERY_ANSWER } from '@/lib/quick-answers'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Eggless Cupcakes Melbourne | The Cupcake Desire',
  description:
    'Eggless cupcakes in every flavour — red velvet, chocolate, vanilla, mocha and more — baked to order in Narre Warren and delivered across Melbourne.',
  alternates: { canonical: '/eggless-cupcakes' },
  openGraph: {
    title: 'Eggless Cupcakes Melbourne | The Cupcake Desire',
    description: 'Every flavour we bake has an eggless alternative. Delivered across Melbourne.',
    url: '/eggless-cupcakes',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
}

const HANDLES = [
  'red-velvet-3-cupcakes',
  'chocolate-chocolate-3-cupcakes',
  'vanilla-vanilla-3-cupcakes',
  'vanilla-strawberry-3-cupcakes',
  'chocolate-peppermint-3-cupcakes',
  'mocha-3-cupcakes',
  'coconut-3-cupcakes',
  'box-of-12-birthday-cupcakes',
]

export default async function EgglessCupcakesPage() {
  const products = await loadProductsByHandles(HANDLES)
  return (
    <IntentLandingPage
      path="/eggless-cupcakes"
      breadcrumb="Eggless Cupcakes"
      eyebrow="Eggless, every flavour"
      heading="Eggless cupcakes, delivered across Melbourne"
      intro={[
        'Every flavour we bake has an eggless alternative — so the whole table can share the same box, whether guests are vegetarian, avoid eggs for religious reasons or simply prefer eggless.',
        'Our cupcakes are baked to order in our Narre Warren kitchen and hand-delivered on weekdays across Melbourne Metro.',
      ]}
      products={products as any}
      productsHeading="Popular flavours to order eggless"
      sections={[
        {
          heading: 'How to order eggless',
          body: [
            'Choose any flavour or box, then tell us you want it eggless: add “eggless” in the delivery instructions at checkout, or contact us before ordering and we will confirm. It applies to our classic flavours, deluxe flavours, minis and themed boxes of 12.',
          ],
        },
        {
          heading: 'Eggless is not egg-free for allergies',
          body: [
            'Our kitchen handles eggs, dairy, wheat, soy, nuts and sesame every day. We keep eggless batches separate and use dedicated utensils, but we cannot guarantee zero cross-contact. If you have an egg allergy, please read our allergen information and contact us before ordering.',
          ],
        },
      ]}
      faqHeading="Eggless cupcakes: quick answers"
      faqs={[
        {
          question: 'Do you make eggless cupcakes in Melbourne?',
          answer:
            'Yes. Every flavour we bake has an eggless alternative, including our classic, deluxe, mini and themed cupcakes. Add “eggless” to your order notes at checkout or contact us before ordering.',
        },
        {
          question: 'Are eggless cupcakes safe for an egg allergy?',
          answer:
            'We cannot guarantee it. Eggless cupcakes are made without eggs, but our kitchen handles eggs and cross-contact is possible, so contact us before ordering if you have an allergy.',
        },
        DELIVERY_ANSWER,
      ]}
      links={[
        { href: '/vegan-cupcakes', label: 'Vegan cupcakes' },
        { href: '/gluten-free-cupcakes', label: 'Gluten-free cupcakes' },
        { href: '/allergen-info', label: 'Allergen information' },
        { href: '/collections/standard-cupcakes', label: 'Classic flavours' },
        { href: '/collections/birthday-cupcakes', label: 'Birthday cupcakes' },
      ]}
    />
  )
}
