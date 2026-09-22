import JsonLd from '@/components/SE0/JsonLd'
import PolicyShell, { PolicySection } from '@/components/policy/PolicyShell'

const sections: PolicySection[] = [
  {
    id: 'intro',
    label: 'Overview',
    body: (
      <>
        <p>
          We bake to order from our kitchen in Narre Warren and deliver fresh cakes and
          cupcakes across <strong>Melbourne Metro</strong>. This page explains how ordering,
          lead time, and delivery work for standard retail orders.
        </p>
        <p>
          We are an <strong>online bakery kitchen</strong> — there is no walk-in storefront.
          Order online or get in touch if you need help with a custom or corporate box.
        </p>
      </>
    ),
  },
  {
    id: 'lead-time',
    label: 'How ordering and lead time work',
    body: (
      <>
        <p>
          Every cake and cupcake is <strong>freshly baked</strong>. We work to a{' '}
          <strong>minimum 24-hour fresh-bake floor</strong>, with a clear{' '}
          <strong>order cut-off</strong> so you know the earliest delivery day:
        </p>
        <ul>
          <li>
            <strong>Order placed before 12:00 noon</strong> → we can deliver the{' '}
            <strong>next day after 2:00 pm</strong> (subject to delivery days below).
          </li>
          <li>
            <strong>Order placed after 12:00 noon</strong> → the earliest delivery is the{' '}
            <strong>day after next</strong> (subject to delivery days below).
          </li>
        </ul>
        <p>
          Same-day baking and dispatch is <strong>not</strong> our default. If you are unsure
          whether your date is achievable, email or call before checkout.
        </p>
        <p>
          Larger, highly custom, wedding, or corporate orders may need{' '}
          <strong>longer notice</strong> so we can plan baking, branding, and multi-drop
          logistics. If your order is complex, contact us when you book and we&rsquo;ll
          confirm a realistic timeline.
        </p>
      </>
    ),
  },
  {
    id: 'where-we-deliver',
    label: 'Where we deliver (standard)',
    body: (
      <>
        <p>
          For standard orders we deliver to <strong>Melbourne metropolitan areas</strong> from
          our Narre Warren kitchen.
        </p>
        <p>
          If your suburb is outside our usual Metro zone, contact us for a personalised quote
          — we will tell you honestly what we can do.
        </p>
        <p>
          This page does <strong>not</strong> offer Australia-wide or multi-city consumer
          delivery. Arranged corporate logistics (if needed) are handled case-by-case via our
          Corporate channel — not as a blanket shipping promise on every order.
        </p>
      </>
    ),
  },
  {
    id: 'delivery-days',
    label: 'Delivery days',
    body: (
      <>
        <p>
          We deliver on <strong>weekdays only</strong>. We do <strong>not</strong> deliver on
          Saturdays, Sundays, or public holidays.
        </p>
        <p>
          If your occasion falls on a Saturday, you can order for{' '}
          <strong>Friday delivery</strong> so your box is ready for the weekend.
        </p>
        <p>Public holidays follow the same rule as weekends — no delivery that day.</p>
      </>
    ),
  },
  {
    id: 'fees-and-timing',
    label: 'Delivery window, fees, and timing',
    body: (
      <>
        <p>
          Deliveries are generally made between <strong>9:00 am and 3:00 pm</strong>. Next-day
          orders placed before noon are available <strong>after 2:00 pm</strong> the following
          day (see cut-off above).
        </p>
        <p>
          Delivery fees typically range from <strong>$0 to $20</strong> depending on location.
          Outside our usual Metro zone, ask us for a quote.
        </p>
        <p>
          We do <strong>not</strong> guarantee a specific timed slot. For timed events, many
          customers prefer delivery the business day before. Call us if you need to discuss
          timing.
        </p>
      </>
    ),
  },
  {
    id: 'tracking',
    label: 'Tracking and updates',
    body: (
      <>
        <p>
          We don&rsquo;t offer live tracking for cupcake deliveries. If you need an estimated
          arrival window on the day, call us and we&rsquo;ll help with the best update we can.
        </p>
        <p>
          You&rsquo;ll receive order confirmation when your order is placed. If there is a
          significant delay that affects your delivery date, we will contact you by email or
          phone.
        </p>
      </>
    ),
  },
  {
    id: 'no-one-home',
    label: 'If no one is home',
    body: (
      <p>
        If we cannot reach anyone on the first delivery attempt, the order may be left safely
        at the premises. Please make sure the delivery address and phone number are correct,
        and that someone can receive perishable goods where needed.
      </p>
    ),
  },
  {
    id: 'freshness',
    label: 'Freshness',
    body: (
      <p>
        Cupcakes are at their best on the day of delivery. If kept at room temperature or in
        the fridge, they typically stay enjoyable for up to about four days — we still
        encourage you to enjoy them as fresh as possible.
      </p>
    ),
  },
  {
    id: 'allergens',
    label: 'Allergens and dietary orders',
    body: (
      <>
        <p>
          Our kitchen handles eggs, dairy, gluten, soy, and nuts. We offer dietary options
          (including vegan, eggless, and gluten-free ranges as listed), but we{' '}
          <strong>cannot guarantee zero cross-contact</strong>. If you have a severe allergy,
          please contact us before ordering, and read our allergen information.
        </p>
        <p>
          →{' '}
          <a href="/allergen-info">
            Allergens &amp; ingredients
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'damages',
    label: 'Damages, remakes, and refunds',
    body: (
      <>
        <p>
          Because everything is bake-to-order and perishable, cancellations, remakes, and
          refunds follow our bakery refund policy — not a generic &ldquo;file a claim with
          the parcel carrier&rdquo; process.
        </p>
        <p>
          If something arrives damaged, melted, or incorrect, contact us promptly with your
          order number and photos. We&rsquo;ll sort a remake, credit, or refund as set out on
          the refund page.
        </p>
        <p>
          →{' '}
          <a href="/refund-policy">
            Refunds &amp; cancellations
          </a>
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    body: (
      <>
        <p>
          <strong>The Cupcake Desire</strong>
          <br />
          Kitchen: 352 Princes Hwy, Narre Warren VIC 3805
          <br />
          Online orders only — no walk-in store
        </p>
        <p>
          Phone: <strong>03 9705 0051</strong>
          <br />
          Email: <strong>info@thecupcakedesire.com.au</strong>
        </p>
        <p>
          Still unsure whether we can deliver to your suburb or date? Message us before you
          order — we&rsquo;d rather confirm than guess.
        </p>
      </>
    ),
  },
]

export default function ShippingPolicyPage() {
  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <JsonLd />
      <PolicyShell
        eyebrow="Delivery policy"
        title="Delivery policy"
        titleAccent="Melbourne Metro."
        intro="We bake fresh and deliver across greater Melbourne. Here's how lead time, delivery days, and fees work for a kitchen that makes everything to order."
        lastUpdated={today}
        sections={sections}
      />
    </>
  )
}
