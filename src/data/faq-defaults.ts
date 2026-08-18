import type { FaqPageId } from '@/lib/faq-pages'

/** Starter FAQ content — seeded into MongoDB so admin and storefront stay in sync. */
export const DEFAULT_FAQ_CATEGORIES = [
  { name: 'Freshness', order: 0 },
  { name: 'Diet', order: 1 },
  { name: 'Delivery', order: 2 },
  { name: 'Custom Orders', order: 3 },
] as const

type DefaultFaq = {
  page: FaqPageId
  pageRef?: string
  category?: string
  order: number
  question: string
  answer: string
}

export const DEFAULT_FAQS: DefaultFaq[] = [
  {
    page: 'homepage',
    category: 'Freshness',
    order: 0,
    question: 'How fresh are the cupcakes?',
    answer:
      'Every box is baked to order and hand-frosted with soft buttercream — never sat on a shelf. They stay lovely for 48 hours in an airtight box at room temperature.',
  },
  {
    page: 'homepage',
    category: 'Diet',
    order: 0,
    question: 'Do you have eggless and vegan options?',
    answer:
      'Yes — every flavour on the menu has an eggless version, and we have a dedicated vegan range made with oat milk, plant butter, and real chocolate. Look for the badges on each product.',
  },
  {
    page: 'homepage',
    category: 'Delivery',
    order: 0,
    question: 'How long do orders take, and where do you deliver?',
    answer:
      'We&rsquo;re a bake-to-order kitchen, so every order needs at least 2 days&rsquo; notice — we don&rsquo;t do same-day or next-day. Delivery covers Melbourne metro; weddings and event orders ship Victoria-wide on request. Larger custom builds may need a week, especially around peak weekends.',
  },
  {
    page: 'homepage',
    category: 'Delivery',
    order: 1,
    question: 'Do you have a shop I can walk into?',
    answer:
      'No — we&rsquo;re an online-only kitchen. We don&rsquo;t run a storefront, so every order comes through the website (or a custom-event enquiry) and arrives by courier on the day you choose.',
  },
  {
    page: 'homepage',
    category: 'Custom Orders',
    order: 0,
    question: 'Can I customise a box for a wedding, event, or corporate gift?',
    answer:
      'Absolutely — this is our favourite kind of order. We&rsquo;ve done boxes of 6 to 6,000 with custom flavours, branded packaging, even edible logos. Send the brief and we&rsquo;ll cost it together. Most event orders need a week&rsquo;s notice; tight turnarounds are sometimes possible — ask us.',
  },
  {
    page: 'homepage',
    category: 'Diet',
    order: 1,
    question: 'What if I have a food allergy?',
    answer:
      'Every product page lists the full allergens. Our kitchen handles eggs, dairy, gluten, soy, and nuts — cross-contact is possible. If you have a severe allergy, drop us a note before ordering.',
  },
  {
    page: 'corporate',
    order: 0,
    question: 'How much lead time do you need for a corporate order?',
    answer:
      'Up to 100 standard cupcakes — 48 hours. 100–500 cupcakes — 72 hours. 500+ with custom edible branding — 5 working days. Rush orders are possible for an extra 15% charge.',
  },
  {
    page: 'corporate',
    order: 1,
    question: 'Do you offer GST invoices and Net-30 billing?',
    answer:
      'Yes. Every corporate order includes a GST-compliant invoice. We offer Net-15 by default, and Net-30 for clients with an established relationship or signed MSA.',
  },
  {
    page: 'corporate',
    order: 2,
    question: 'Can you brand the cupcakes with our company logo?',
    answer:
      'Yes — edible-ink logos printed on rice paper, embedded into the frosting. We can also do custom-coloured icing, branded packaging, and printed note cards inside each box.',
  },
  {
    page: 'corporate',
    order: 3,
    question: 'Which cities do you deliver to?',
    answer:
      'Melbourne metro is our home turf. We cover Victoria-wide for event runs by refrigerated courier — let us know your venue and we&rsquo;ll route it. Interstate gifting is possible on bigger lead times.',
  },
  {
    page: 'corporate',
    order: 4,
    question: 'How much notice do you need for an event order?',
    answer:
      'Every order needs at least 2 days&rsquo; notice, but event boxes — weddings, conferences, multi-venue corporate runs — usually take 5 to 7 days from brief to delivery. We&rsquo;re a bake-to-order kitchen with no walk-in store, so locking the date early matters.',
  },
  {
    page: 'corporate',
    order: 5,
    question: 'Can you handle multi-venue deliveries on the same day?',
    answer:
      'Yes — once the order is booked. Our largest single-day run was 22 venues across Melbourne. Multi-venue logistics are managed by your dedicated corporate coordinator.',
  },
  {
    page: 'corporate',
    order: 6,
    question: 'Do you have eggless and vegan options at scale?',
    answer:
      'Every flavour on our menu has an eggless version, and we have a dedicated vegan range. No minimum order limits or surcharges for dietary options.',
  },
  {
    page: 'bday-party',
    order: 0,
    question: 'Where do parties happen?',
    answer:
      'In our studio kitchen at 352 Princes Hwy, Narre Warren. We can also bring a roving frosting bar to your venue — ask about our off-site pack.',
  },
  {
    page: 'bday-party',
    order: 1,
    question: 'Can parents stay?',
    answer:
      'Yes, two parents per family are welcome. We keep a little coffee corner at the back so the room stays the kids&rsquo;.',
  },
  {
    page: 'bday-party',
    order: 2,
    question: 'How far in advance should we book?',
    answer:
      'Saturdays book 4 — 6 weeks out, weekdays usually 10 days. A 30% deposit holds your slot; the balance is due 48 hours before.',
  },
  {
    page: 'bday-party',
    order: 3,
    question: 'Eggless, vegan, nut-free?',
    answer:
      'All three. Tell us when you book and we ring-fence ingredients on the morning of your party.',
  },
  {
    page: 'bday-party',
    order: 4,
    question: 'What if a guest cancels?',
    answer:
      'Headcount can flex by 2 either side up to 24 hours before. Beyond that we hold the original count for ingredients.',
  },
  {
    page: 'bday-party',
    order: 5,
    question: 'Do you do grown-up birthdays?',
    answer:
      'Absolutely. The Confetti Confection pack scales to adults — we swap the sprinkle wall for a drizzle &amp; gold-leaf bar.',
  },
  {
    page: 'gift-voucher',
    order: 0,
    question: 'How long is a voucher valid?',
    answer:
      'Vouchers are valid for 12 months from the date of purchase. The expiry date is printed on the digital certificate.',
  },
  {
    page: 'gift-voucher',
    order: 1,
    question: 'Can the recipient choose their own flavours?',
    answer:
      'Yes — the voucher covers a dollar amount or a box size. They pick flavours and delivery date when they redeem online.',
  },
  {
    page: 'gift-voucher',
    order: 2,
    question: 'Do you send the voucher directly to the recipient?',
    answer:
      'You can email it to yourself to print, or schedule it to arrive in their inbox on a specific date with a personal message.',
  },
]
