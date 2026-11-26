import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadProductsByHandles } from '@/lib/collection-products'
import { DELIVERY_ANSWER } from '@/lib/quick-answers'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Eggless Cupcakes Melbourne | The Cupcake Desire',
  description:
    'Eggless cupcakes in every flavour (red velvet, chocolate, vanilla, mocha and more), baked to order in Narre Warren and delivered across Melbourne. The egg is replaced by oil and water.',
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
        'Every flavour we bake has an eggless alternative, so the whole table can share one box, whether guests are vegetarian, avoid eggs for religious reasons or simply prefer eggless. The egg is replaced by oil and water. Cupcakes are baked to order in our Narre Warren kitchen and hand delivered on weekdays across Melbourne Metro.',
      ]}
      products={products as any}
      productsHeading="Popular flavours to order eggless"
      sections={[
        {
          heading: 'How eggless is made',
          body: [
            'For eggless cupcakes, the egg is replaced by oil and water. You get the same tender crumb and rich frosting without egg in the batter.',
          ],
        },
        {
          heading: 'How to order eggless',
          body: [
            'Choose any flavour or box, then tell us you want it eggless: add “eggless” in the delivery instructions at checkout, or contact us before ordering and we will confirm. It applies to our classic flavours, deluxe flavours, minis and themed boxes of 12.',
          ],
        },
        {
          heading: 'Eggless is not egg-free for allergies',
          body: [
            'Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.',
          ],
        },
      ]}
      faqHeading="Eggless cupcakes: quick answers"
      faqs={[
        {
          question: 'Do you make eggless cupcakes in Melbourne?',
          answer:
            'Yes. Every flavour we bake has an eggless alternative, including our classic, deluxe, mini and themed cupcakes, and the egg is replaced by oil and water. We bake to order in Narre Warren and hand deliver across Melbourne Metro on weekdays. Add "eggless" to your delivery instructions at checkout, or contact us before ordering.',
        },
        {
          question: 'Which cupcake flavours can be made eggless?',
          answer:
            'All of them. Popular eggless choices include red velvet, chocolate, vanilla, vanilla strawberry, chocolate peppermint, mocha and coconut. The eggless option also covers our deluxe flavours, mini cupcakes and themed boxes of 12, such as birthday boxes. Pick any flavour or box on the site, then ask for it eggless when you order.',
        },
        {
          question: 'How do I order eggless cupcakes?',
          answer:
            'Choose any flavour or box online, then type "eggless" in the delivery instructions at checkout. If you would rather check first, contact us before ordering and we will confirm. Order by 12 noon for next weekday delivery across Melbourne Metro, generally between 9am and 3pm. We deliver on weekdays only, not weekends or public holidays.',
        },
        {
          question: 'What do you use instead of egg, and do eggless cupcakes taste different?',
          answer:
            'We replace the egg with oil and water. Only the egg in the batter changes, and every cupcake is still baked to order and frosted with soft buttercream. Because every flavour has an eggless version, guests who avoid eggs can enjoy the same box as everyone else.',
        },
        {
          question: 'Are eggless cupcakes the same as vegan cupcakes?',
          answer:
            'No. Eggless means we leave out the egg only. If you need cupcakes with no animal products, choose our dedicated vegan range at /vegan-cupcakes instead. Both are baked in the same shared kitchen, so neither is suitable for severe allergies. If you are unsure which suits your guests, contact us before ordering and we will help.',
        },
        {
          question: 'Are your eggless cupcakes safe for an egg allergy?',
          answer:
            'No. Eggless is a recipe choice, not an allergy guarantee. Our kitchen is shared and also handles nuts, gluten, dairy, eggs, soy and sesame, so our cupcakes are not suitable for severe allergies or coeliac disease. For allergy questions, see our allergens and ingredients page or contact us before ordering.',
        },
        {
          question: 'Can I order eggless cupcakes for a birthday or an office event?',
          answer:
            'Yes. Themed boxes of 12, such as our Box of 12 Birthday Cupcakes at $66, can be made eggless, and so can corporate and logo orders through our corporate page. Add "eggless" to your delivery instructions, and for larger office orders send us your date and numbers when you book.',
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
