import JsonLd from '@/components/SE0/JsonLd'
import PolicyShell, { PolicySection } from '@/components/policy/PolicyShell'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy · The Cupcake Desire',
  description:
    'How The Cupcake Desire collects, uses, and protects your information — written in plain English and compliant with Australian Privacy Principles.',
  alternates: { canonical: '/privacy-policy' },
}

const sections: PolicySection[] = [
  {
    id: 'our-promise',
    label: 'Our promise',
    body: (
      <>
        <p>
          We use your information to bake your order, deliver it to your door, and stay in
          touch the way you want us to. We don&rsquo;t sell your data. We don&rsquo;t
          retarget you across the internet. There&rsquo;s no agency on retainer harvesting
          your behaviour.
        </p>
        <p>
          This policy explains exactly what we collect, why, who else sees it, and how you
          can ask us to remove it. It follows the{' '}
          <a
            href="https://www.oaic.gov.au/privacy/australian-privacy-principles"
            target="_blank"
            rel="noopener noreferrer"
          >
            Australian Privacy Principles
          </a>{' '}
          and applies to all visitors and customers of cupcakedesires.com.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    label: 'What we collect',
    body: (
      <>
        <p>
          We collect only what we need to take an order and run the bakery. Specifically:
        </p>
        <ul>
          <li>
            <strong>Identity:</strong> name, optional date of birth (for birthday treats).
          </li>
          <li>
            <strong>Contact:</strong> email address, phone number, delivery and billing
            addresses.
          </li>
          <li>
            <strong>Order details:</strong> what you bought, when, dietary preferences,
            delivery notes.
          </li>
          <li>
            <strong>Payment:</strong> we never see your card details &mdash; payments are
            handled by our payment processor and only a transaction reference is stored.
          </li>
          <li>
            <strong>Account &amp; login:</strong> if you sign in, your account is managed by
            our authentication provider (see &ldquo;Third parties&rdquo; below).
          </li>
          <li>
            <strong>Site usage:</strong> anonymised page views and aggregated browser data
            via privacy-respecting analytics. No individual profiles.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    label: 'How we use it',
    body: (
      <>
        <p>We use your information to:</p>
        <ul>
          <li>Fulfil the order you placed &mdash; baking, packing, delivering.</li>
          <li>Send transactional emails (order confirmation, dispatch, delivery).</li>
          <li>Respond to your questions when you write to us.</li>
          <li>
            Send the weekly bakery letter <em>only if you opt in</em> &mdash; one click to
            unsubscribe at any time, no hard feelings.
          </li>
          <li>
            Improve the site &mdash; understanding which pages are useful and which need
            fixing, in aggregate, never tied to you personally.
          </li>
          <li>
            Comply with Australian tax and consumer law (e.g. retaining invoices for the
            required period).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-parties',
    label: 'Third parties we work with',
    body: (
      <>
        <p>
          A handful of trusted providers help us run the site and process orders. They each
          see only the data they need:
        </p>
        <ul>
          <li>
            <strong>Clerk</strong> &mdash; handles sign-up, sign-in and account management.
            Sees: name and email.
          </li>
          <li>
            <strong>MongoDB Atlas</strong> &mdash; the database where orders and account
            details live. Encrypted at rest.
          </li>
          <li>
            <strong>Stripe / EFTPOS / Apple Pay / Google Pay</strong> &mdash; payments. They
            see card details directly; we don&rsquo;t.
          </li>
          <li>
            <strong>Resend</strong> &mdash; sends transactional emails. Sees: your email and
            the email contents.
          </li>
          <li>
            <strong>Couriers</strong> &mdash; sees the delivery address and phone number on
            the date of delivery.
          </li>
          <li>
            <strong>Cloudinary</strong> &mdash; hosts review and product photos. Doesn&rsquo;t
            see your personal details.
          </li>
        </ul>
        <p>
          We never share your data for marketing or sell it to anyone. If a provider
          changes, we&rsquo;ll update this list.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    label: 'Cookies and tracking',
    body: (
      <>
        <p>
          We use the smallest set of cookies we can get away with. These cover:
        </p>
        <ul>
          <li>
            <strong>Essential</strong> &mdash; keeping you signed in, remembering your cart,
            running the checkout. These can&rsquo;t be turned off without breaking the site.
          </li>
          <li>
            <strong>Analytics</strong> &mdash; aggregated page-view counts so we know what
            people read. No individual profile or behavioural retargeting.
          </li>
        </ul>
        <p>
          We don&rsquo;t use Facebook Pixel, TikTok pixel, or any other ad-network tracker.
          Your browser&rsquo;s &ldquo;Do Not Track&rdquo; signal is respected.
        </p>
      </>
    ),
  },
  {
    id: 'how-long',
    label: 'How long we keep it',
    body: (
      <ul>
        <li>
          <strong>Account data:</strong> kept while your account is active. Delete your
          account and we wipe it within 30 days, save for what we&rsquo;re legally required
          to keep.
        </li>
        <li>
          <strong>Order records:</strong> retained for 7 years to meet Australian tax and
          warranty obligations.
        </li>
        <li>
          <strong>Newsletter consent:</strong> kept until you unsubscribe.
        </li>
        <li>
          <strong>Contact-form messages:</strong> retained for 2 years for our records,
          then deleted.
        </li>
      </ul>
    ),
  },
  {
    id: 'your-rights',
    label: 'Your rights',
    body: (
      <>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>
            <strong>Access</strong> the personal information we hold about you.
          </li>
          <li>
            <strong>Correct</strong> it if anything is wrong.
          </li>
          <li>
            <strong>Delete</strong> your account and the data tied to it (within legal
            retention limits).
          </li>
          <li>
            <strong>Withdraw</strong> consent for marketing emails at any time.
          </li>
          <li>
            <strong>Complain</strong> to the{' '}
            <a
              href="https://www.oaic.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Office of the Australian Information Commissioner
            </a>{' '}
            if you think we&rsquo;ve mishandled something.
          </li>
        </ul>
        <p>
          To exercise any of these, write to{' '}
          <a href="mailto:info@thecupcakedesire.com.au">info@thecupcakedesire.com.au</a> with the
          email address linked to your account. We&rsquo;ll respond within 14 days.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    label: 'How we keep it safe',
    body: (
      <ul>
        <li>All traffic to and from the site is encrypted (HTTPS).</li>
        <li>The database is encrypted at rest.</li>
        <li>Card details never touch our servers &mdash; payment processing is tokenised.</li>
        <li>Access to customer data is limited to bakery staff who need it for orders.</li>
        <li>
          We review access logs regularly. If we ever experience a notifiable data breach,
          we will tell you and the regulator as required under Australian law.
        </li>
      </ul>
    ),
  },
  {
    id: 'children',
    label: 'Children',
    body: (
      <p>
        The site isn&rsquo;t aimed at children under 16. We don&rsquo;t knowingly collect
        information from anyone in that age group. If you think we&rsquo;ve collected
        information from a child without parental consent, let us know and we&rsquo;ll
        remove it.
      </p>
    ),
  },
  {
    id: 'changes',
    label: 'Changes to this policy',
    body: (
      <p>
        We may update this policy from time to time. Material changes will be flagged at the
        top of the page for at least 30 days and, where the law requires it, notified by
        email to anyone affected.
      </p>
    ),
  },
  {
    id: 'contact',
    label: 'Get in touch',
    body: (
      <p>
        Questions about your data, or about this policy, go to{' '}
        <a href="mailto:info@thecupcakedesire.com.au">info@thecupcakedesire.com.au</a>. A human reads
        every email &mdash; we&rsquo;ll get back to you within a working day.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  const today = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <>
      <JsonLd />
      <PolicyShell
        eyebrow="Privacy policy"
        title="What we collect,"
        titleAccent="and what we don&rsquo;t."
        intro="A short list of data, a smaller list of who sees it, and a promise that we won&rsquo;t sell or trade any of it. Written for people, not lawyers."
        lastUpdated={today}
        sections={sections}
      />
    </>
  )
}
