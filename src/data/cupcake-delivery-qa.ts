import type { FaqItem } from '@/lib/product-faq'

/**
 * /cupcake-delivery Quick Answers (SEO Lead QA'd 20 Oct 2026).
 * Word for word, in this order. Owner rule: never name a 2pm arrival window.
 */
export type DeliveryQaItem = FaqItem & {
  /** Visible links rendered near the answer, outside the answer string / JSON-LD. */
  links?: { href: string; label: string }[]
}

export const CUPCAKE_DELIVERY_QA: DeliveryQaItem[] = [
  {
    question: 'Do you deliver cupcakes across Melbourne?',
    answer:
      'Yes. We hand-deliver across Melbourne Metro on weekdays from our kitchen in Narre Warren, including the CBD and inner suburbs. Order before 12 noon for delivery the next weekday after 2pm; orders after noon arrive the day after next. Delivery fees are typically $0 to $20 depending on your suburb, free on orders over $100. No weekend or public-holiday delivery.',
  },
  {
    question: 'What is the cut-off for next weekday cupcake delivery in Melbourne?',
    answer:
      'Our cut-off is 12 noon. Order before 12 noon and we deliver the next weekday. Order after noon and the earliest delivery is the day after next. Every order is baked fresh, so larger, custom or corporate orders need longer notice; contact us when you book and we will confirm a realistic date.',
  },
  {
    question: 'Can I get cupcakes delivered the same day in Melbourne?',
    answer:
      "No. We don't offer same-day delivery because every order is baked fresh to order in our Narre Warren kitchen. The earliest delivery is the next weekday for orders placed before 12 noon. Orders placed after noon arrive the day after next, and we deliver on weekdays only.",
  },
  {
    question: 'Do you deliver cupcakes on weekends or public holidays?',
    answer:
      'No. We deliver Monday to Friday only, with no Saturday, Sunday or public-holiday delivery anywhere in Melbourne Metro. If your party or event is on a Saturday, order for Friday delivery instead. Remember the noon cut-off: order before 12 noon for delivery the next weekday.',
  },
  {
    question: 'What time will my cupcakes be delivered?',
    answer:
      "Deliveries generally arrive between 9am and 3pm on weekdays when you order before noon for next weekday delivery. We can't guarantee a timed slot, because we hand-deliver our own route from Narre Warren. If your event starts at a fixed time, choose delivery the weekday before so the cupcakes are ready.",
  },
  {
    question: 'How much does cupcake delivery cost in Melbourne?',
    answer:
      "Delivery fees are typically $0 to $20, depending on how far your suburb is from our Narre Warren kitchen, and inner Melbourne and the CBD sit in our further zone. Each suburb page below shows the fee for that postcode. If your suburb isn't listed, contact us for a quote before ordering.",
  },
  {
    question: 'Do you deliver outside Melbourne Metro or interstate?',
    answer:
      "No. Standard delivery covers Melbourne Metro only, from our Narre Warren kitchen, and we don't offer interstate or Australia-wide delivery. The suburbs listed on this page are our regular areas. If your address is close to the edge of Melbourne Metro and isn't listed, contact us before ordering and we'll tell you honestly what we can do.",
  },
  {
    question: 'Can you deliver vegan, eggless or gluten-free cupcakes?',
    answer:
      "Yes. Every flavour has an eggless option, we bake a dedicated vegan range, and gluten-free options are available, all delivered on the same weekday schedule. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. We don't offer a nut-free range.",
    links: [
      { href: '/vegan-cupcakes', label: 'Vegan cupcakes' },
      { href: '/eggless-cupcakes', label: 'Eggless cupcakes' },
    ],
  },
  {
    question: 'Can you deliver cupcakes to our office or several offices?',
    answer:
      'Yes, within Melbourne Metro. We deliver corporate and logo cupcake orders to a single office or several venues across Melbourne Metro on weekdays, following the same noon cut-off. Corporate and multi-venue orders need longer notice than a single box, so see our corporate cupcakes page for logo options and how to book.',
    links: [{ href: '/corporate', label: 'Corporate cupcakes' }],
  },
]
