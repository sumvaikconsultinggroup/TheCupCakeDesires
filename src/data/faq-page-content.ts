export type FaqPageSection = {
  id: string
  title: string
  items: { question: string; answer: string }[]
}

/** Content sourced from https://thecupcakedesire.com.au/faq/ */
export const FAQ_PAGE_SECTIONS: FaqPageSection[] = [
  {
    id: 'general',
    title: 'FAQ',
    items: [
      {
        question: 'How do I care for my cupcakes?',
        answer:
          'Our cupcakes can be kept at room temperature or in the fridge should you prefer.',
      },
      {
        question: 'How long do your cupcakes stay fresh?',
        answer:
          'If kept at room temperature or in the fridge, our cupcakes will stay fresh for up to 4 days. However, we encourage you to enjoy your cupcakes at their freshest, on the day of delivery.',
      },
      {
        question: 'How will I know my order has gone through to you?',
        answer:
          'You will receive an email receipt and order confirmation from us confirming your order has been processed within a few minutes of placing your order.',
      },
      {
        question: 'Can I purchase a gift voucher?',
        answer: 'Yes.',
      },
      {
        question: 'How do I arrange corporate or bulk orders?',
        answer:
          'Please go to our <a href="/corporate" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">corporate page</a> and complete the form. Alternatively just send us an email <a href="mailto:info@thecupcakedesire.com.au" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">info@thecupcakedesire.com.au</a> and one of our team members will give you a call to discuss your enquiry and to work out the best price for you.',
      },
      {
        question: 'How much notice do you require for orders?',
        answer: 'We require 2-days notice to complete your order.',
      },
      {
        question: 'Do you do any custom cakes and cupcakes?',
        answer:
          'Yes, we cater for themed occasions, give us a call on <a href="tel:+61397050051" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">03 9705 0051</a> or send us an email <a href="mailto:info@thecupcakedesire.com.au" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">info@thecupcakedesire.com.au</a> and we will be happy to discuss your requirements. Check our <a href="https://www.facebook.com/thecupcakedesire/" target="_blank" rel="noopener noreferrer" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">Facebook</a> and <a href="https://www.instagram.com/thecupcakedesire/" target="_blank" rel="noopener noreferrer" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">Instagram</a> pages to see some of our recent work.',
      },
      {
        question: 'Do your cupcakes contain nuts or dairy?',
        answer:
          'Some of our flavors do contain nuts and therefore our products have been made in an environment where nuts are present.',
      },
      {
        question: 'Can I get custom designed or printed cupcakes?',
        answer:
          'Yes! We can work with you to create the perfect cupcakes for your event or celebration! Get in touch with our cupcakes team on <a href="mailto:info@thecupcakedesire.com.au" class="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent">info@thecupcakedesire.com.au</a> to talk about your order.',
      },
      {
        question: 'When do I have to place my order?',
        answer:
          'You can place your order 12 months in advance but we do require minimum 3 days&rsquo; notice for any pickup and delivery orders.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery related FAQs',
    items: [
      {
        question: 'Do you offer delivery?',
        answer:
          'Yes, we do deliver cupcakes to all Metro areas in Melbourne except on Sat, Sun and Public holidays. You can place order to be delivered on Friday if your occasion is on Saturday.',
      },
      {
        question: 'When will I receive my delivery?',
        answer: 'Deliveries are generally made between 9:00am–3:00pm.',
      },
      {
        question: 'What happens if no one is available to accept a delivery?',
        answer:
          'In the event that the goods are dispatched and the recipient is not available to accept delivery, goods will be left on doorstep. Cupcakes Desire take no responsibility for goods after first attempt of delivery has been made.',
      },
      {
        question: 'Can I pay after delivery?',
        answer:
          'No. As our products are freshly baked and perishable, full payment is required before baking and dispatch.',
      },
      {
        question: 'Can I track my cupcake or cake delivery?',
        answer:
          'While we don&rsquo;t offer live tracking, you&rsquo;re welcome to call us for an estimated delivery time.',
      },
      {
        question: 'Do you offer same-day or next-day delivery?',
        answer:
          'We offer next-day delivery for orders placed before 12:00pm the day prior.',
      },
      {
        question: 'How much does delivery cost?',
        answer:
          'Delivery fees range from $0 to $20, depending on your location. For suburbs outside our delivery zone, please contact us for a personalised quote.',
      },
      {
        question: 'Do you deliver on weekends?',
        answer: 'Yes, we deliver seven days a week.',
      },
      {
        question: 'What if I don&rsquo;t receive my order on time or on the scheduled date?',
        answer:
          'This is extremely rare. However, please contact us immediately if you experience any delay so we can assist promptly.',
      },
      {
        question: 'What should I do if my order arrives damaged or in poor condition?',
        answer:
          'Please email us a photo of the order as soon as possible, and we&rsquo;ll respond quickly to resolve the issue.',
      },
      {
        question: 'Can I request a specific delivery time?',
        answer:
          'Yes, specific delivery times can be arranged upon request by calling us. An additional charge may apply.',
      },
      {
        question: 'What types of cakes and cupcakes are available for delivery?',
        answer: 'Our entire range of cakes and cupcakes is available and eligible for delivery.',
      },
      {
        question: 'What if I miss the delivery window?',
        answer:
          'Our drivers will usually call the recipient or the purchaser upon arrival to discuss the best option. If no contact can be made, the order will be left safely at the premises.',
      },
      {
        question: 'Do you offer next-day cake delivery for special occasions?',
        answer:
          'We offer freshly baked cakes with a 2–7 day pre-order period. However, custom cupcakes can often be arranged at short notice. Please contact us to discuss availability and extra charges.',
      },
    ],
  },
]

export function getAllFaqPageItems() {
  return FAQ_PAGE_SECTIONS.flatMap((section) => section.items)
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
