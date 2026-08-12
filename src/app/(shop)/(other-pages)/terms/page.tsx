import JsonLd from '@/components/SE0/JsonLd'
import PolicyShell, { PolicySection } from '@/components/policy/PolicyShell'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service · The Cupcake Desire',
  description:
    'The plain-language terms for using cupcakedesires.com and ordering from our Narre Warren bake-to-order kitchen.',
  alternates: { canonical: '/terms' },
}

const sections: PolicySection[] = [
  {
    id: 'who-we-are',
    label: 'Who we are',
    body: (
      <>
        <p>
          This website (<a href="https://cupcakedesires.com">cupcakedesires.com</a>) is
          operated by The Cupcake Desire, a bake-to-order kitchen at 352 Princes Hwy, Narre
          Warren, Victoria 3805. Throughout these terms &mdash; &ldquo;we&rdquo;,
          &ldquo;us&rdquo; and &ldquo;the bakery&rdquo; refer to The Cupcake Desire; &ldquo;you&rdquo;
          refers to whoever is browsing or ordering.
        </p>
        <p>
          By placing an order with us or using this website, you agree to these terms. They
          sit alongside our{' '}
          <a href="/refund-policy">refund policy</a> and{' '}
          <a href="/privacy-policy">privacy policy</a>, which together cover the practical
          stuff.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    label: 'Who can order',
    body: (
      <p>
        You need to be at least 16 years old to place an order, or have a parent or guardian
        place it on your behalf. By checking out, you confirm the payment method is yours to
        use and the delivery details belong to someone happy to receive a box of cupcakes.
      </p>
    ),
  },
  {
    id: 'orders-pricing',
    label: 'Orders and pricing',
    body: (
      <>
        <p>
          All prices are in <strong>Australian dollars</strong> and include applicable GST
          where it applies. Delivery is charged separately and shown at checkout. We try
          hard to keep product pages accurate, but in the rare case a price or description is
          wrong, we&rsquo;ll contact you before the order is processed &mdash; you can
          confirm or cancel without charge.
        </p>
        <p>
          Placing an order is an <em>offer</em> to buy. We confirm the order by sending a
          confirmation email, at which point a contract is formed. We may decline an order if
          the kitchen is at capacity, if the lead time is too tight to bake well, or if the
          delivery address is outside our serviceable area.
        </p>
      </>
    ),
  },
  {
    id: 'lead-times',
    label: 'Lead times and bake-to-order',
    body: (
      <>
        <p>
          We are <strong>online only</strong> and do not run a walk-in store. Every order is
          baked the morning of your delivery. Because of that:
        </p>
        <ul>
          <li>
            <strong>A single box</strong> on its own can be delivered as soon as the next
            day, provided the order is placed before 2pm.
          </li>
          <li>
            <strong>All other orders</strong> need a minimum of 48 hours&rsquo; notice.
          </li>
          <li>
            <strong>Cakes</strong> — including cake slices — are baked and finished to
            order and need 3 days&rsquo; notice.
          </li>
          <li>
            Orders placed after 2pm count as the following day for the purposes of these
            lead times. A mixed order takes the longest lead time that applies to it, since
            it is all baked and delivered together. We don&rsquo;t do same-day.
          </li>
          <li>
            <strong>Custom event orders</strong> (weddings, corporate, branded packaging)
            usually need 5&ndash;7 days. Larger builds (300+ cupcakes, custom artwork) can
            need longer &mdash; we&rsquo;ll always tell you up front.
          </li>
          <li>
            Delivery dates you choose at checkout are firm. Changing the date later may
            mean changing the production slot &mdash; reach out and we&rsquo;ll do our best.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'delivery',
    label: 'Delivery',
    body: (
      <>
        <p>
          We deliver across Melbourne metro and parts of Victoria for event orders. The
          checkout will only accept addresses we can reach on the date you&rsquo;ve picked.
        </p>
        <p>
          You&rsquo;re responsible for providing an accurate delivery address and making sure
          someone is available to receive the box. If a delivery fails because the address
          was wrong or nobody was there, we&rsquo;ll do our best to redeliver, but a
          remake may be needed and any associated cost is on the customer.
        </p>
        <p>
          Once the courier hands the box over to you (or a nominated person at the address),
          responsibility for the order passes to you. We&rsquo;re still here if anything is
          wrong &mdash; see the{' '}
          <a href="/refund-policy">refund policy</a>.
        </p>
      </>
    ),
  },
  {
    id: 'allergens',
    label: 'Allergens, ingredients and dietary claims',
    body: (
      <>
        <p>
          Every product page lists the principal allergens. Our kitchen handles wheat,
          dairy, eggs, soy and nuts. Eggless, vegan and gluten-free options are made with
          care but in the same kitchen, so cross-contact is possible.
        </p>
        <p>
          If you have a severe allergy, please write to us before ordering. We&rsquo;ll be
          honest about whether we can guarantee the product is safe for you.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    label: 'Cancellations and refunds',
    body: (
      <p>
        Cancellation and refund rules live on a dedicated page so they&rsquo;re easy to find:{' '}
        <a href="/refund-policy">our refund policy</a>. In short &mdash; if it&rsquo;s our
        fault, we&rsquo;ll fix it; if you&rsquo;re cancelling, the cut-off depends on how
        deep into production we are.
      </p>
    ),
  },
  {
    id: 'intellectual-property',
    label: 'Intellectual property',
    body: (
      <>
        <p>
          The bakery name, logo, recipes, photographs, illustrations, copy and the site
          design are owned by The Cupcake Desire (or used under licence). You&rsquo;re welcome
          to share product photos on social media &mdash; tag us, we love seeing them.
        </p>
        <p>
          Please don&rsquo;t reproduce site content commercially or for a competing bakery
          without asking us first. If you&rsquo;re a publication or food blog wanting to
          feature us, drop us a line &mdash; we usually say yes and can send hi-res images.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    label: 'Our liability',
    body: (
      <>
        <p>
          Nothing in these terms limits the rights you have under Australian Consumer Law.
          Our goods come with guarantees of acceptable quality and fitness for purpose, and
          you&rsquo;re entitled to a refund, replacement or repair if they fail to meet
          those guarantees in a major way.
        </p>
        <p>
          Outside of those statutory rights, our liability for any one order is limited to
          the value of that order. We&rsquo;re not liable for indirect or consequential
          losses &mdash; for example, the disappointment of having to use a different cake
          for a birthday.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    label: 'Changes to these terms',
    body: (
      <p>
        We may update these terms from time to time. The version that applies to your order
        is the one that was live when you checked out. Material changes will be flagged at
        the top of the page for at least 30 days.
      </p>
    ),
  },
  {
    id: 'contact',
    label: 'Contact &amp; jurisdiction',
    body: (
      <p>
        Reach the bakery on{' '}
        <a href="mailto:info@thecupcakedesire.com.au">info@thecupcakedesire.com.au</a>. These terms
        are governed by the laws of Victoria, Australia, and any dispute we can&rsquo;t
        resolve over email will sit with the courts in Victoria.
      </p>
    ),
  },
]

export default function TermsPage() {
  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <>
      <JsonLd />
      <PolicyShell
        eyebrow="Terms of service"
        title="The fine print,"
        titleAccent="written kindly."
        intro="Plain-language terms for ordering from The Cupcake Desire &mdash; what we promise, what we ask of you, and how the small stuff works."
        lastUpdated={today}
        sections={sections}
      />
    </>
  )
}
