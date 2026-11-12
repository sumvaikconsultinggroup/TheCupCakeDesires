// Homepage head-term copy ("cupcakes melbourne"). Source: GSC content 12 Nov 2026 §4.4
// Code constant on purpose: not admin-editable. Do not move into HeroSettings.center.footer.

// HOLD: awaiting Nipun's direct confirmation (26 Oct 2026). Remove this constant to drop it.
export const HOME_FEE_FREE_OVER_100: string | null = 'free over $100'
// HOLD: awaiting Nipun's direct confirmation (26 Oct 2026). Remove this constant to drop it.
export const HOME_NO_PRESERVATIVES: string | null = 'Made from scratch with no added preservatives'

export const HOME_CUTOFF = 'Order by 12 noon for next-weekday delivery.'
export const HOME_FEE = HOME_FEE_FREE_OVER_100
  ? `Metro Melbourne delivery $0 to $20 by suburb, ${HOME_FEE_FREE_OVER_100}. Outside Metro by quote.`
  : 'Metro Melbourne delivery $0 to $20 by suburb. Outside Metro by quote.'

export const HOME_INTRO = `The Cupcake Desire is an online cupcake shop and bakery for Melbourne. We bake standard, mini and giant cupcakes, cakes, slices and macarons to order in our Narre Warren kitchen, then hand-deliver them across Melbourne Metro on weekdays, with no walk-in store. ${HOME_CUTOFF} Deliveries generally arrive between 9am and 3pm. ${HOME_FEE}`

export type HeadTermLink = { text: string; href: string }
export type HeadTermSegment = string | HeadTermLink

export type HeadTermBlock = {
  h2: string
  segments: HeadTermSegment[]
  steps?: { lead: string; segments: HeadTermSegment[] }[]
  afterSteps?: HeadTermSegment[]
}

/** Section A: Cupcakes in Melbourne, baked to order (H-5) */
export const HOME_SECTION_A: HeadTermBlock = {
  h2: 'Cupcakes in Melbourne, baked to order',
  segments: [
    'Nothing here comes out of a display case. Every box is baked for your order. ',
    ...(HOME_NO_PRESERVATIVES ? [`${HOME_NO_PRESERVATIVES}. `] : []),
    'Pick from themed ',
    { text: 'birthday cupcakes', href: '/collections/birthday-cupcakes' },
    ' and other occasion boxes of 12, ',
    { text: 'mini cupcake boxes of 24', href: '/collections/mini-cupcakes' },
    ', or ',
    { text: 'build your own box', href: '/cupcake-builder' },
    '. Every flavour also comes in an ',
    { text: 'eggless version', href: '/eggless-cupcakes' },
    ', our ',
    { text: 'vegan range', href: '/vegan-cupcakes' },
    ' covers chocolate and vanilla, and ',
    { text: 'gluten-free cupcakes', href: '/gluten-free-cupcakes' },
    " come in red velvet and chocolate. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. We don't offer a nut-free range.",
  ],
}

/** Section B: Cupcake delivery across Melbourne Metro (H-7) */
export const HOME_SECTION_B: HeadTermBlock = {
  h2: 'Cupcake delivery across Melbourne Metro',
  segments: [
    "Order by 12 noon for next-weekday delivery. We deliver on weekdays, so for weekend occasions choose Friday delivery, and there is no public-holiday delivery. Cakes need 3 days' notice. Delivery areas, fees and timing are on our ",
    { text: 'cupcake delivery Melbourne', href: '/cupcake-delivery' },
    ' page.',
  ],
}

/** H-6: How do you order cupcakes in Melbourne from us? (after delivery) */
export const HOME_SECTION_HOW_TO_ORDER: HeadTermBlock = {
  h2: 'How do you order cupcakes in Melbourne from us?',
  segments: [],
  steps: [
    {
      lead: 'Choose a box.',
      segments: [
        ' Themed occasion boxes of 12, mini boxes of 24, a box you build flavour by flavour, photo cupcakes, or ',
        { text: 'corporate cupcakes', href: '/corporate' },
        ' with your logo for work.',
      ],
    },
    {
      lead: 'Pick a weekday.',
      segments: [
        " Order by 12 noon for next-weekday delivery. Cakes need 3 days' notice, and larger or custom orders need longer.",
      ],
    },
    {
      lead: 'We bake and deliver.',
      segments: [
        ' Your order is baked for that date and hand-delivered to a home, office or venue anywhere in Melbourne Metro, generally between 9am and 3pm.',
      ],
    },
  ],
  afterSteps: [
    'Because we are an online shop with no counter, there is nothing to queue for and no display cabinet. Check your suburb and fee on the ',
    { text: 'cupcake delivery Melbourne', href: '/cupcake-delivery' },
    ' page before you order.',
  ],
}

/** Section C: Custom and corporate cupcakes (H-9) */
export const HOME_SECTION_C: HeadTermBlock = {
  h2: 'Custom and corporate cupcakes',
  segments: [
    'Ordering for an office or event? We print your logo on edible discs. Upload up to 4 logos, choose Vanilla, Chocolate or Mix of Both, and order boxes from 12, from $66 a box. Custom logos and edible prints on other designs are on request. See ',
    { text: 'corporate cupcakes', href: '/corporate' },
    ' or ',
    { text: 'logo cupcakes', href: '/branded-cupcakes-melbourne' },
    ', or call us on 03 9705 0051. For a personal box, ',
    { text: 'custom cupcakes', href: '/custom-cupcakes-melbourne' },
    ' let you pick every flavour, add a message or print a photo. For a whole cake, see ',
    { text: 'Custom cakes', href: '/melbourne/custom-cakes' },
    '.',
  ],
}

export const HOME_HEAD_TERM_SECTIONS: HeadTermBlock[] = [
  HOME_SECTION_A,
  HOME_SECTION_B,
  HOME_SECTION_HOW_TO_ORDER,
  HOME_SECTION_C,
]
