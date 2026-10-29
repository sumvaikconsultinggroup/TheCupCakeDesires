import IntentLandingPage from '@/components/seo/IntentLandingPage'
import { loadProductsByHandles } from '@/lib/collection-products'
import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 300

const PAGE_TITLE = 'Vegan Cupcakes Melbourne | Baked to Order, Delivered'
const PAGE_DESCRIPTION =
  'Vegan cupcakes made with oat milk and plant butter, baked to order and hand delivered across Melbourne Metro on weekdays. Made in a shared kitchen.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/vegan-cupcakes' },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: '/vegan-cupcakes',
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function VeganCupcakesPage() {
  const products = await loadProductsByHandles(['vegan-box-of-12', 'vegan-chocolate-vanilla-3-cupcakes'])

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Vegan cupcakes',
    url: absoluteUrl('/vegan-cupcakes'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p: { title: string; handle: string }, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: absoluteUrl(`/products/${p.handle}`),
      })),
    },
  }

  return (
    <IntentLandingPage
      path="/vegan-cupcakes"
      breadcrumb="Vegan Cupcakes"
      eyebrow="Plant-based · Melbourne"
      heading="Vegan cupcakes, delivered across Melbourne"
      intro={[
        'We bake vegan cupcakes to order in our Narre Warren kitchen with oat milk and plant butter, no eggs and no animal products, and hand deliver them across Melbourne Metro on weekdays. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
        <div
          key="suit"
          className="mt-5 max-w-[62ch] rounded-2xl border border-line bg-ivory p-6 text-[15px] text-cocoa-soft"
        >
          <p className="font-medium text-cocoa">Who our vegan cupcakes suit</p>
          <p className="mt-3">
            Good for: vegan guests, people who avoid dairy or eggs by choice, and mixed groups who want
            one cupcake everyone can eat.
          </p>
          <p className="mt-2">
            Not suitable for: severe allergies, including severe dairy, egg, nut, soy or sesame
            allergies, or coeliac disease. Some vegan frostings use soy.
          </p>
          <p className="mt-2">
            Not sure? Read our <Link href="/allergen-info">allergen information</Link> or call us on{' '}
            <a href="tel:+61397050051">03 9705 0051</a>.
          </p>
        </div>,
      ]}
      primaryCta={{ href: '#shop-vegan', label: 'Shop vegan cupcakes' }}
      secondaryCta={{ href: '/cupcake-delivery', label: 'Check delivery to your suburb' }}
      products={products as any}
      productsHeading="Shop vegan cupcakes"
      productsId="shop-vegan"
      productsIntro="Buy them by the cupcake or by the box. You'll find sizes and prices on each product."
      sections={[
        {
          heading: 'Vegan cupcake flavours you can order',
          body: [
            "There's vanilla and there's chocolate. Mix both in one box, or order chocolate vanilla by the cupcake. Every vegan cupcake is baked to order and hand-frosted.",
          ],
          table: {
            columns: ['Flavour', 'What it is', 'Order'],
            rows: [
              [
                'Vanilla',
                'Vegan vanilla cupcakes, hand-frosted',
                '[Vegan cupcake box](/products/vegan-box-of-12)',
              ],
              [
                'Chocolate, or a mix of both',
                'Vegan chocolate cupcakes, or vanilla and chocolate together',
                'Vegan cupcake box (same product)',
              ],
              [
                'Chocolate vanilla',
                'Made with oat milk and plant butter, sold by the cupcake',
                '[Vegan chocolate vanilla cupcakes](/products/vegan-chocolate-vanilla-3-cupcakes)',
              ],
            ],
          },
        },
        {
          heading: 'How we bake our vegan range',
          body: [
            "Our vegan cupcakes have their own recipes. They aren't regular cupcakes with one ingredient swapped out. We use oat milk and plant butter instead of dairy and leave out eggs, so there are no animal products in the recipe. We bake every order in our Narre Warren kitchen and hand-frost it like the rest of our cupcakes. Vegan guests get the same treat as everyone else.",
            'Some vegan frostings use soy. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
          ],
        },
        {
          heading: 'Is vegan the same as eggless, dairy-free or gluten-free?',
          body: [
            "Vegan cupcakes leave out eggs, dairy and every other animal product, so our vegan cupcakes are dairy-free and egg-free by recipe. Our [eggless cupcakes in every flavour](/eggless-cupcakes) skip the eggs but still contain dairy, so they aren't vegan. In those, oil and water stand in for the egg, which suits guests who avoid eggs by choice. We also bake [gluten-free cupcakes](/gluten-free-cupcakes) as their own range.",
          ],
          table: {
            columns: ['Need', 'Order', 'Note'],
            rows: [
              ['No animal products, or no dairy', 'Our vegan range (this page)', 'Shared kitchen'],
              ['No eggs, dairy is fine', 'Eggless version of any flavour', 'Not for egg allergy'],
              ['Avoiding gluten', 'Gluten-free range', 'Not for coeliac disease'],
              ['Vegan and gluten-free together', 'On request', 'Shared kitchen'],
            ],
          },
        },
        {
          heading: 'Vegan cupcakes for birthdays, offices and mixed groups',
          body: [
            'Put a vegan box next to a regular box and nobody at the table has to miss out. For a party, pair our vegan range with [birthday cupcakes delivered in Melbourne](/collections/birthday-cupcakes). For work, see our [corporate cupcake orders](/corporate) and mention vegan guests when you enquire. Need branding? Logos and edible prints are available on request. Larger or custom orders need longer notice, so tell us your date when you order. Need a whole cake instead? Just call us on 03 9705 0051 to check what we can bake for your date.',
          ],
        },
        {
          heading: 'How to order vegan cupcakes',
          body: [],
          steps: [
            'Choose your vegan cupcakes above.',
            'Add a regular, eggless or gluten-free box if your group needs it.',
            'Pick a weekday delivery date at checkout. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
            "Add delivery notes, such as reception, a gate code or who's receiving.",
          ],
          bodyAfter: [
            'Planning a big event? Larger or custom orders need longer notice, so call us on 03 9705 0051 first.',
          ],
        },
        {
          heading: 'Vegan cupcake delivery in Melbourne',
          body: [
            "We're online only and hand deliver from our Narre Warren kitchen across Melbourne Metro on weekdays, including the CBD and inner suburbs. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. We deliver on weekdays, so for weekend occasions choose Friday delivery. There is no delivery on public holidays. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. [Check your suburb and delivery fee](/cupcake-delivery). If we cannot reach anyone on the first delivery attempt, the order may be left at the premises.",
          ],
        },
      ]}
      faqHeading="Vegan cupcake questions"
      faqs={[
        {
          question: 'Do you make vegan cupcakes in Melbourne?',
          answer:
            'Yes. We bake vegan vanilla, chocolate and chocolate vanilla cupcakes to order in Narre Warren and hand deliver them across Melbourne Metro on weekdays.',
        },
        {
          question: 'What are your vegan cupcakes made with?',
          answer:
            'Oat milk and plant butter instead of dairy, with no eggs and no animal products. Some vegan frostings use soy.',
        },
        {
          question: 'Are your vegan cupcakes dairy-free and egg-free?',
          answer:
            'Yes, by recipe. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
        },
        {
          question: 'Are your vegan cupcakes suitable for nut allergies?',
          answer:
            "No. We don't offer a nut-free range. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.",
        },
        {
          question: 'Can I get vegan cupcakes that are also gluten-free?',
          answer:
            'Vegan and gluten-free together is on request. We bake gluten-free cupcakes as their own range, and everything is made in our shared kitchen, so they are not suitable for coeliac disease.',
        },
        {
          question: 'Is eggless the same as vegan?',
          answer:
            'No. Eggless cupcakes skip the eggs but still contain dairy. Vegan cupcakes leave out eggs, dairy and all animal products.',
        },
        {
          question: 'How much notice do you need?',
          answer:
            'Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Larger or custom orders need longer notice, so tell us your date when you order.',
        },
        {
          question: 'Do you deliver vegan cupcakes across Melbourne?',
          answer:
            'Yes. We hand deliver across Melbourne Metro. We deliver on weekdays, so for weekend occasions choose Friday delivery. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote.',
        },
        {
          question: "What happens if nobody's home?",
          answer:
            'If we cannot reach anyone on the first delivery attempt, the order may be left at the premises. Add any delivery notes at checkout.',
        },
      ]}
      outro={
        <section className="border-t border-line bg-ivory py-14 text-center md:py-16">
          <div className="mx-auto max-w-[720px] px-6 md:px-10">
            <p className="bake-body-lg text-cocoa">
              Ready to order? Choose your vegan cupcakes and a weekday delivery date.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="#shop-vegan" className="bake-btn bake-btn-rose">
                Shop vegan cupcakes
              </Link>
              <a href="tel:+61397050051" className="bake-btn bake-btn-ghost">
                Call 03 9705 0051
              </a>
            </div>
            <p className="bake-body mt-5 text-cocoa-soft">
              Questions? <Link href="/contact">Contact us</Link>.
            </p>
          </div>
        </section>
      }
      links={[
        { href: '/eggless-cupcakes', label: 'Eggless cupcakes' },
        { href: '/gluten-free-cupcakes', label: 'Gluten-free cupcakes' },
        { href: '/corporate', label: 'Corporate cupcakes' },
        { href: '/allergen-info', label: 'Allergen information' },
        { href: '/cupcake-delivery', label: 'Cupcake delivery suburbs and fees' },
      ]}
      schema={[collectionSchema]}
    />
  )
}
