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
      'Every order is freshly baked with a minimum 24-hour lead time. Order by noon for next-weekday delivery; orders placed after noon are delivered the day after next. Delivery is weekdays only (no Sat, Sun, or public holidays) across Melbourne Metro. Order for Friday delivery if your occasion is on Saturday. Larger custom builds may need longer notice.',
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
      'Absolutely — this is our favourite kind of order. We&rsquo;ve done boxes of 6 to 6,000 with custom flavours, branded packaging, even edible logos. Send the brief and we&rsquo;ll cost it together. Event orders need longer notice; tight turnarounds are sometimes possible — ask us.',
  },
  {
    page: 'homepage',
    category: 'Diet',
    order: 1,
    question: 'What if I have a food allergy?',
    answer:
      'Every product page lists the full allergens. Made in a shared kitchen that also handles nuts, gluten, dairy and eggs, so not suitable for severe allergies. For other dietary questions, please contact us before ordering.',
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
      'Melbourne Metro is our home turf. We deliver across Melbourne Metro by refrigerated courier. Tell us your venue and we&rsquo;ll confirm coverage.',
  },
  {
    page: 'corporate',
    order: 4,
    question: 'How much notice do you need for an event order?',
    answer:
      'Every order needs at least 2 days&rsquo; notice, but event boxes — weddings, conferences, multi-venue corporate runs — need longer notice. We&rsquo;re a bake-to-order kitchen with no walk-in store, so locking the date early matters.',
  },
  {
    page: 'corporate',
    order: 5,
    question: 'Can you handle multi-venue deliveries on the same day?',
    answer:
      'Yes, once the order is booked. Multi-venue logistics across Melbourne Metro are managed by your dedicated corporate coordinator.',
  },
  {
    page: 'corporate',
    order: 6,
    question: 'Do you have eggless and vegan options at scale?',
    answer:
      'Every flavour on our menu has an eggless version, and we have a dedicated vegan range. No minimum order limits or surcharges for dietary options.',
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
