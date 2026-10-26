// Homepage head-term copy ("cupcakes melbourne"). Source: content/drafts-20261026/humanized/homepage-head-term.md
// Code constant on purpose: not admin-editable. Do not move into HeroSettings.center.footer.

// HOLD: awaiting Nipun's direct confirmation (26 Oct 2026). Remove this constant to drop it.
export const HOME_FEE_FREE_OVER_100: string | null = 'free over $100'
// HOLD: awaiting Nipun's direct confirmation (26 Oct 2026). Remove this constant to drop it.
export const HOME_NO_PRESERVATIVES: string | null = 'Made from scratch with no added preservatives'

export const HOME_CUTOFF = 'Order by 12 noon for next-weekday delivery, generally 9am to 3pm.'
export const HOME_FEE = HOME_FEE_FREE_OVER_100
  ? `Metro Melbourne delivery $0 to $20 by suburb, ${HOME_FEE_FREE_OVER_100}. Outside Metro by quote.`
  : 'Metro Melbourne delivery $0 to $20 by suburb. Outside Metro by quote.'

export const HOME_INTRO = `We bake standard, mini and giant cupcakes, cakes, slices and macarons to order in our Narre Warren kitchen, then hand-deliver them across Melbourne Metro on weekdays. ${HOME_CUTOFF} ${HOME_FEE}`

export type HeadTermLink = { text: string; href: string }
export type HeadTermSegment = string | HeadTermLink

export type HeadTermBlock = {
  h2: string
  segments: HeadTermSegment[]
}

/** Section A: Cupcakes in Melbourne, baked to order */
export const HOME_SECTION_A: HeadTermBlock = {
  h2: 'Cupcakes in Melbourne, baked to order',
  segments: [
    'Nothing here comes out of a display case. Every box is baked for your order. ',
    ...(HOME_NO_PRESERVATIVES ? [`${HOME_NO_PRESERVATIVES}. `] : []),
    'Pick from themed ',
    { text: 'birthday cupcakes', href: '/collections/birthday-cupcakes' },
    ' and other occasion boxes of 12, mini cupcake boxes of 24, or build your own box. Every flavour also comes in an eggless version, ',
    { text: 'our vegan range', href: '/vegan-cupcakes' },
    ' covers chocolate and vanilla, and ',
    { text: 'gluten-free cupcakes', href: '/gluten-free-cupcakes' },
    " come in red velvet and chocolate. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. We don't offer a nut-free range.",
  ],
}

/** Section B: Cupcake delivery across Melbourne Metro */
export const HOME_SECTION_B: HeadTermBlock = {
  h2: 'Cupcake delivery across Melbourne Metro',
  segments: [
    "We deliver on weekdays, so for weekend occasions choose Friday delivery. There's no public-holiday delivery. Cakes need 3 days' notice. You'll find delivery areas, fees and timing on our ",
    { text: 'cupcake delivery page', href: '/cupcake-delivery' },
    '.',
  ],
}

/** Section C: Custom and corporate cupcakes */
export const HOME_SECTION_C: HeadTermBlock = {
  h2: 'Custom and corporate cupcakes',
  segments: [
    'Ordering for an office or event? We print your logo on edible discs. Upload up to 4 logos, choose Vanilla, Chocolate or Mix of Both, and order boxes from 12, from $66 a box. Custom logos and edible prints on other designs are on request. See ',
    { text: 'corporate cupcakes', href: '/corporate' },
    ' or call us on ',
    { text: '03 9705 0051', href: 'tel:+61397050051' },
    '.',
  ],
}

export const HOME_HEAD_TERM_SECTIONS: HeadTermBlock[] = [
  HOME_SECTION_A,
  HOME_SECTION_B,
  HOME_SECTION_C,
]
