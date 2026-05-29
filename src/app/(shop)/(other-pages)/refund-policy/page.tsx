import JsonLd from '@/components/SE0/JsonLd'
import PolicyShell, { PolicySection } from '@/components/policy/PolicyShell'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refunds & Cancellations · CupCake Desires',
  description:
    'How cancellations, refunds, remakes, and damage claims work at CupCake Desires — written for a bake-to-order kitchen, in plain English.',
  alternates: { canonical: '/refund-policy' },
}

const sections: PolicySection[] = [
  {
    id: 'overview',
    label: 'Overview',
    body: (
      <>
        <p>
          We&rsquo;re a small bake-to-order kitchen in Narre Warren. Every cake and box leaves
          the bench the morning of your delivery, which is what makes it taste the way it does
          &mdash; and it&rsquo;s also why our refund policy reads a little different from a
          regular online shop.
        </p>
        <p>
          This policy sits alongside your rights under{' '}
          <a
            href="https://www.accc.gov.au/consumers/consumer-rights-guarantees/consumer-guarantees"
            target="_blank"
            rel="noopener noreferrer"
          >
            Australian Consumer Law
          </a>
          . Nothing here tries to take those rights away. If something we made isn&rsquo;t fit
          for purpose, doesn&rsquo;t match what was advertised, or arrives damaged, we&rsquo;ll
          remake it or refund it &mdash; that&rsquo;s the promise.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    label: 'Cancelling an order',
    body: (
      <>
        <h3>Standard orders (cupcakes &amp; cakes)</h3>
        <ul>
          <li>
            Cancel <strong>more than 48 hours before</strong> your delivery date: full refund to
            your original payment method, processed within 5 business days.
          </li>
          <li>
            Cancel <strong>24 &ndash; 48 hours before</strong> delivery: 50% refund &mdash; we
            usually have ingredients prepped by then.
          </li>
          <li>
            Cancel <strong>under 24 hours before</strong> delivery: we can&rsquo;t refund.
            Your box is already in production. We can sometimes change the delivery address or
            postpone the date by a day &mdash; ask us.
          </li>
        </ul>

        <h3>Custom event orders (weddings, corporate, branded boxes)</h3>
        <ul>
          <li>
            Up to <strong>14 days before</strong> the event: full refund minus a $25 design fee
            if we&rsquo;ve already mocked up artwork.
          </li>
          <li>
            <strong>7 &ndash; 14 days before</strong> the event: 50% refund.
          </li>
          <li>
            Under <strong>7 days</strong>: non-refundable &mdash; bespoke ingredients, packaging
            and team time are already locked in.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'damaged-or-wrong',
    label: 'If something arrives damaged or wrong',
    body: (
      <>
        <p>
          We pack every box with cold packs and custom inserts, but the world can be bumpy.
          If your order arrives damaged, melted, or contains the wrong item:
        </p>
        <ol>
          <li>
            Take a photo of the box and contents within <strong>4 hours of delivery</strong> &mdash;
            this helps us figure out where in the journey something went wrong.
          </li>
          <li>
            Email <a href="mailto:hello@cupcakedesires.com">hello@cupcakedesires.com</a> with
            your order number, the photo, and a quick description.
          </li>
          <li>
            We&rsquo;ll respond within one working day with a remake, store credit, or full
            refund &mdash; your call.
          </li>
        </ol>
        <p>
          We don&rsquo;t require you to return the affected box. Throwing it out is fine.
        </p>
      </>
    ),
  },
  {
    id: 'allergens',
    label: 'Allergens and dietary concerns',
    body: (
      <>
        <p>
          Our kitchen handles wheat, dairy, eggs, soy and nuts. We do our best with eggless,
          vegan and gluten-free options, but cross-contact is possible. If you have a severe
          allergy, please write to us before ordering so we can plan accordingly.
        </p>
        <p>
          If you receive a product that doesn&rsquo;t match the dietary labelling on the
          product page, that&rsquo;s on us &mdash; full refund or remake, no questions.
        </p>
      </>
    ),
  },
  {
    id: 'change-of-mind',
    label: 'Change of mind',
    body: (
      <p>
        Because every box is baked to your order, we don&rsquo;t offer change-of-mind refunds
        once production has started. If you change your mind <em>before</em> the production
        window kicks in (see the cancellation table above), we&rsquo;ll happily refund you in
        full.
      </p>
    ),
  },
  {
    id: 'how-refunds-work',
    label: 'How refunds are processed',
    body: (
      <>
        <p>
          Refunds go back to the original payment method &mdash; the card or wallet you used
          at checkout. You&rsquo;ll see them in your account within{' '}
          <strong>5 business days</strong>, though most cards clear within 2&ndash;3.
        </p>
        <p>
          We&rsquo;ll always send a confirmation email when the refund is initiated. If you
          haven&rsquo;t seen it in your inbox, check the spam folder first, then your bank,
          then drop us a line.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    label: 'Get in touch',
    body: (
      <p>
        Refunds and cancellations are handled directly by the bakery team at{' '}
        <a href="mailto:hello@cupcakedesires.com">hello@cupcakedesires.com</a>. We try to reply
        within one working day, Monday to Saturday.
      </p>
    ),
  },
]

export default function RefundPolicyPage() {
  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <>
      <JsonLd />
      <PolicyShell
        eyebrow="Refunds &amp; cancellations"
        title="Refunds, fairly"
        titleAccent="and simply."
        intro="No fine-print maze. Here&rsquo;s how cancellations, refunds, remakes and damage claims work for a kitchen that bakes everything to order."
        lastUpdated={today}
        sections={sections}
      />
    </>
  )
}
