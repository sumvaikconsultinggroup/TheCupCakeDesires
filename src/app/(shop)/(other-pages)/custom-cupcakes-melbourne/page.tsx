import JsonLd from '@/components/SE0/JsonLd'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 3600

const PATH = '/custom-cupcakes-melbourne'

const TITLE = 'Custom Cupcakes Melbourne | Photos, Messages and Flavours'
const DESCRIPTION =
  'Custom cupcakes for Melbourne Metro. Choose every flavour, add a message or print photos on edible discs. Order by 12 noon for next-weekday delivery.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PATH,
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
}

const FAQS = [
  {
    question: 'Can I put a photo on cupcakes in Melbourne?',
    answer:
      'Yes. Choose Custom Picture Cupcakes, upload the picture or pictures you want, and we print them on edible discs mixed across the box. Pick a box of 12 in vanilla, chocolate or a mix of both, or a box of 24 minis. Larger or custom orders need longer notice, so order as early as you can.',
  },
  {
    question: 'Can I choose every flavour in my box?',
    answer:
      'Yes. The build-your-own box lets you pick each flavour and mix in cake slices, with at least 3 of any one flavour. Boxes come in 12, 30, 50, 200 or 500, at one price per box. You can also add a message of up to 120 characters before you check out.',
  },
  {
    question: 'Are custom cupcakes available eggless, vegan or gluten-free?',
    answer:
      'Every flavour comes in an eggless version, we have a vegan range, and gluten-free options are available. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
  },
  {
    question: 'When will my custom cupcakes arrive?',
    answer:
      'Order by 12 noon for next-weekday delivery. We hand-deliver across Melbourne Metro on weekdays, generally between 9am and 3pm. There is no weekend or public-holiday delivery, so pick Friday for a weekend party. Larger or custom orders need longer notice, so tell us your date when you order.',
  },
  {
    question: 'Can you put our company logo on custom cupcakes?',
    answer:
      'Yes. Logo cupcakes are covered on our branded cupcakes page, which explains how we print your logo on edible discs. For office orders, bulk quantities or a quote, use the corporate cupcakes page, where you can upload up to 4 logos and also order mini cupcakes and cake slices.',
  },
] as const

const linkClass = 'text-rose-accent underline-offset-2 hover:underline'

export default function CustomCupcakesMelbournePage() {
  const faqSchema = generateFAQSchema([...FAQS])
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Custom cupcakes', url: `${siteConfig.url}${PATH}` },
  ])

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <main className="bake-canvas">
        <section className="bg-cream py-14 md:py-20">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
              Custom cupcakes Melbourne
            </p>
            <h1 className="bake-display-lg mt-5 max-w-[22ch]">
              Custom cupcakes in Melbourne, made your way
            </h1>
            <p className="bake-body-lg mt-5 max-w-[62ch] text-cocoa-soft">
              Yes, you can order custom cupcakes in Melbourne from The Cupcake Desire. Build your own
              box and choose every flavour, add a short message, or upload photos that we print on
              edible discs. Each box is baked to order and hand-delivered across Melbourne Metro on
              weekdays. Order by 12 noon for next-weekday delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cupcake-builder" className="bake-btn bake-btn-rose">
                Build your box
              </Link>
              <Link
                href="/products/box-of-12-custom-pic-cupcakes"
                className="bake-btn bake-btn-ghost"
              >
                Custom Picture Cupcakes
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              What can you customise on a box of cupcakes?
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              There are two ways to make a box your own, and a third route if the design is a company
              logo.
            </p>
            <ul className="bake-body mt-6 list-disc space-y-4 pl-5 text-cocoa-soft">
              <li>
                <strong>Choose the flavours and the message.</strong> Our{' '}
                <Link href="/cupcake-builder" className={linkClass}>
                  build-your-own box
                </Link>{' '}
                lets you mix cupcakes and cake slices, with at least 3 of any flavour you pick. Write
                a message of up to 120 characters before you check out. Boxes come in 12, 30, 50, 200
                or 500, at one price per box.
              </li>
              <li>
                <strong>Print a photo.</strong> With{' '}
                <Link href="/products/box-of-12-custom-pic-cupcakes" className={linkClass}>
                  Custom Picture Cupcakes
                </Link>{' '}
                you upload the picture or pictures you want, and we print them on edible discs spread
                across the box. Pick a box of 12 in vanilla, chocolate or a mix of both, or a box of
                24 minis.
              </li>
              <li>
                <strong>Add a business logo.</strong> Logo orders sit on our{' '}
                <Link href="/branded-cupcakes-melbourne" className={linkClass}>
                  branded cupcakes
                </Link>{' '}
                page, and office or bulk orders go through{' '}
                <Link href="/corporate" className={linkClass}>
                  corporate cupcakes
                </Link>
                .
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-line bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              How do photo cupcakes work?
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              Choose the box size and flavour on the Custom Picture Cupcakes page, then upload your
              image as a PNG, JPG or WEBP file of up to 4MB. A picture of a person or a character
              works well. We print each picture on an edible disc, place the discs on hand-frosted
              buttercream and mix them through the box so every guest gets one.
            </p>
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Which flavours can you pick?
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              The build-your-own box currently offers Vanilla, Chocolate, Red Velvet, Chocolate
              Vanilla, Chocolate Peppermint, Vanilla Chocolate, Vanilla Strawberry, Coconut, Mocha,
              Salted Caramel, Hazelnut Heaven, Cookies n Cream, Rocky Road, Molten Chocolate and M n
              M. Hazelnut Heaven and Rocky Road contain nuts. You can fill a box with one flavour or
              split it across several.
            </p>
          </div>
        </section>

        <section className="border-t border-line bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Can custom cupcakes be eggless, vegan or gluten-free?
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              Every flavour comes in an{' '}
              <Link href="/eggless-cupcakes" className={linkClass}>
                eggless version
              </Link>
              , and you can ask for it in your order notes. We also have a{' '}
              <Link href="/vegan-cupcakes" className={linkClass}>
                vegan range
              </Link>{' '}
              and{' '}
              <Link href="/gluten-free-cupcakes" className={linkClass}>
                gluten-free options
              </Link>
              . Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs,
              soy and sesame, so it is not suitable for severe allergies or coeliac disease. Read our{' '}
              <Link href="/allergen-info" className={linkClass}>
                allergen information
              </Link>{' '}
              before you order.
            </p>
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              How much notice do custom cupcakes need?
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              Order by 12 noon for next-weekday delivery. We hand-deliver on weekdays only,
              generally between 9am and 3pm, with no weekend or public-holiday delivery, so choose
              Friday for a weekend party. Larger or custom orders need longer notice, so send us your
              date early. Delivery costs $0 to $20 depending on your suburb, and it is free over
              $100. See{' '}
              <Link href="/cupcake-delivery" className={linkClass}>
                cupcake delivery
              </Link>{' '}
              for areas and fees.
            </p>
          </div>
        </section>

        <section className="border-t border-line bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              What does a custom box cost?
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              A build-your-own box is $66 for 12, $150 for 30, $225 for 50, $800 for 200 or $1,750 for
              500. Custom Picture Cupcakes run from $66 to $84 depending on the option you pick. All
              prices are in AUD and include GST. For more than 500 cupcakes, ask us for a quote.
            </p>
          </div>
        </section>

        <section className="border-t border-line bg-ivory py-14 md:py-20">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="bake-display-lg">Custom cupcakes: your questions</h2>
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {FAQS.map((faq) => (
                <div key={faq.question} className="py-5">
                  <dt className="text-[17px] font-medium text-cocoa">
                    <h3 className="text-[17px] font-medium text-cocoa">{faq.question}</h3>
                  </dt>
                  <dd className="bake-body mt-2 text-cocoa-soft">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-line bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-[900px] px-6 md:px-10">
            <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
              Start your custom box
            </h2>
            <p className="bake-body mt-4 text-cocoa-soft">
              Pick your flavours in the{' '}
              <Link href="/cupcake-builder" className={linkClass}>
                box builder
              </Link>
              , or upload your photo on{' '}
              <Link href="/products/box-of-12-custom-pic-cupcakes" className={linkClass}>
                Custom Picture Cupcakes
              </Link>
              . Questions about a design or a date?{' '}
              <Link href="/contact" className={linkClass}>
                Contact us
              </Link>{' '}
              and a person will reply on business days.
            </p>
            <p className="bake-body mt-4 text-cocoa-soft">
              Want a whole cake instead? See{' '}
              <Link href="/melbourne/custom-cakes" className={linkClass}>
                Custom cakes
              </Link>
              . Cakes need 3 days&apos; notice.
            </p>
          </div>
        </section>

        <RelatedGuides path={PATH} />
      </main>
    </>
  )
}
