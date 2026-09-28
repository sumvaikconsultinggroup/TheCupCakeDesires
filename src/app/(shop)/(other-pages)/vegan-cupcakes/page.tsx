import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadProductsByHandles } from '@/lib/collection-products'
import { DELIVERY_ANSWER } from '@/lib/quick-answers'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Vegan Cupcakes Melbourne | The Cupcake Desire',
  description:
    'Vegan cupcakes made with oat milk and plant butter — single flavours or a box of 12 — baked to order and delivered across Melbourne.',
  alternates: { canonical: '/vegan-cupcakes' },
  openGraph: {
    title: 'Vegan Cupcakes Melbourne | The Cupcake Desire',
    description: 'Plant-based cupcakes baked to order and delivered across Melbourne.',
    url: '/vegan-cupcakes',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function VeganCupcakesPage() {
  const products = await loadProductsByHandles(['vegan-box-of-12', 'vegan-chocolate-vanilla-3-cupcakes'])
  return (
    <IntentLandingPage
      path="/vegan-cupcakes"
      breadcrumb="Vegan Cupcakes"
      eyebrow="Plant-based"
      heading="Vegan cupcakes, delivered across Melbourne"
      intro={[
        'Our vegan cupcakes are made with oat milk and plant butter and hand-frosted like the rest of our range — so vegan guests get the real thing, not an afterthought.',
        'Order a box of 12 in assorted vegan flavours for a party or office, or our vegan chocolate vanilla by the cupcake (minimum 3). Everything is baked to order in Narre Warren and delivered on weekdays across Melbourne Metro.',
      ]}
      products={products as any}
      productsHeading="Vegan cupcakes to order"
      sections={[
        {
          heading: 'Vegan cakes and corporate orders',
          body: [
            'Need a whole cake? See our vegan cakes. Ordering for the office? Our corporate team can include vegan cupcakes alongside branded boxes — ask when you enquire.',
          ],
        },
        {
          heading: 'Allergens',
          body: [
            'Vegan cupcakes contain no animal products, but our kitchen also handles eggs, dairy, wheat, soy, nuts and sesame, so we cannot guarantee zero cross-contact. If you have a severe allergy, contact us before ordering.',
          ],
        },
      ]}
      faqHeading="Vegan cupcakes: quick answers"
      faqs={[
        {
          question: 'Do you deliver vegan cupcakes in Melbourne?',
          answer:
            'Yes. We bake a vegan box of 12 in assorted flavours and a vegan chocolate vanilla sold by the cupcake, delivered on weekdays across Melbourne Metro.',
        },
        {
          question: 'What are your vegan cupcakes made with?',
          answer:
            'Oat milk and plant butter instead of dairy, with no eggs. Our kitchen handles other allergens, so contact us first if you have a severe allergy.',
        },
        DELIVERY_ANSWER,
      ]}
      links={[
        { href: '/vegan-cakes', label: 'Vegan cakes' },
        { href: '/eggless-cupcakes', label: 'Eggless cupcakes' },
        { href: '/gluten-free-cupcakes', label: 'Gluten-free cupcakes' },
        { href: '/corporate', label: 'Corporate cupcakes' },
        { href: '/allergen-info', label: 'Allergen information' },
      ]}
    />
  )
}
