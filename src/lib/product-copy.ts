/**
 * Product copy and image alts used when the catalogue text is missing or too thin
 * to rank. A long admin description is left as written.
 */

const DELIVERY =
  'Baked to order in our Narre Warren kitchen and hand-delivered on weekdays across Melbourne Metro. Order before noon for the next weekday.'

type Flavour = {
  name: string
  /** What the bake is, in one clause. */
  detail: string
  dietary?: string
}

const FLAVOURS: Record<string, Flavour> = {
  'red-velvet': {
    name: 'Red velvet',
    detail: 'cocoa-vanilla sponge with a red velvet crumb and cream-cheese buttercream',
  },
  'chocolate-chocolate': {
    name: 'Chocolate chocolate',
    detail: 'chocolate sponge with chocolate buttercream',
  },
  'chocolate-vanilla': {
    name: 'Chocolate vanilla',
    detail: 'chocolate sponge with vanilla buttercream',
  },
  'chocolate-peppermint': {
    name: 'Chocolate peppermint',
    detail: 'chocolate sponge with peppermint buttercream',
  },
  'vanilla-vanilla': {
    name: 'Vanilla vanilla',
    detail: 'vanilla sponge with vanilla buttercream',
  },
  'vanilla-chocolate': {
    name: 'Vanilla chocolate',
    detail: 'vanilla sponge with chocolate buttercream',
  },
  'vanilla-strawberry': {
    name: 'Vanilla strawberry',
    detail: 'vanilla sponge with strawberry buttercream',
  },
  coconut: {
    name: 'Coconut',
    detail: 'coconut sponge with coconut buttercream',
  },
  mocha: {
    name: 'Mocha',
    detail: 'coffee-chocolate sponge with mocha buttercream',
  },
  'salted-caramel': {
    name: 'Salted caramel',
    detail: 'vanilla sponge with salted caramel buttercream, finished with sea salt',
  },
  'hazelnut-heaven': {
    name: 'Hazelnut Heaven',
    detail: 'chocolate sponge with chocolate-hazelnut buttercream',
    dietary: 'Contains hazelnut. Our kitchen handles nuts.',
  },
  'cookies-n-cream': {
    name: 'Cookies and cream',
    detail: 'chocolate sponge with cookies-and-cream buttercream and crushed cookie',
  },
  'cookies-and-cream': {
    name: 'Cookies and cream',
    detail: 'chocolate sponge with cookies-and-cream buttercream and crushed cookie',
  },
  'cookies-cream': {
    name: 'Cookies and cream',
    detail: 'cookies-and-cream cake with cream-cheese icing and crushed cookie',
  },
  'rocky-road': {
    name: 'Rocky road',
    detail: 'chocolate sponge topped with marshmallow, coconut and chocolate',
  },
  'molten-chocolate': {
    name: 'Molten chocolate',
    detail: 'chocolate sponge with a chocolate ganache finish',
  },
  'm-n-m': {
    name: 'M&M',
    detail: 'chocolate cupcakes finished with candy-coated chocolates',
  },
  'vegan-chocolate-vanilla': {
    name: 'Vegan chocolate vanilla',
    detail: 'chocolate sponge and vanilla frosting made without egg or dairy',
    dietary: 'This one is vegan and gluten-free.',
  },
  'gluten-free-red-velvet': {
    name: 'Gluten-free red velvet',
    detail: 'red velvet sponge and cream-cheese style frosting baked without gluten',
    dietary: 'This one is gluten-free.',
  },
}

const OCCASION_NOTES: { test: RegExp; note: string; category: string }[] = [
  {
    test: /gender-reveal/,
    category: 'Gender Reveal Cupcakes',
    note: 'Pink and blue swirled frosting hides a coloured centre that reveals the baby’s gender at the first bite.',
  },
  {
    test: /baby-girl/,
    category: 'Baby Girl Cupcakes',
    note: 'Finished with pink baby-shower decorations. The box is assorted flavours.',
  },
  {
    test: /baby-boy/,
    category: 'Baby Boy Cupcakes',
    note: 'Finished with blue baby-shower decorations. The box is assorted flavours.',
  },
  {
    test: /baby-neutral/,
    category: 'Baby Neutral Cupcakes',
    note: 'Pink and blue baby-shower decorations in one box, for showers where the colour is a surprise.',
  },
  {
    test: /birthday/,
    category: 'Birthday Cupcakes',
    note: 'Colourful birthday decorations on an assorted box of 12.',
  },
  {
    test: /anniversary/,
    category: 'Anniversary Cupcakes',
    note: 'A box of 12 for a partner, parents or friends marking a year.',
  },
  {
    test: /valentine/,
    category: "Valentine's Day Cupcakes",
    note: 'Heart toppers on an assorted box, for a doorstep or a desk.',
  },
  {
    test: /i-love/,
    category: 'I Love U Cupcakes',
    note: 'The message is on the cupcakes. Assorted flavours in a box of 12.',
  },
  {
    test: /mother/,
    category: "Mother's Day Cupcakes",
    note: 'A Mother’s Day box of 12, assorted flavours, delivered to Mum.',
  },
  {
    test: /father/,
    category: "Father's Day Cupcakes",
    note: 'A Father’s Day box of 12, assorted flavours.',
  },
  {
    test: /christmas/,
    category: 'Christmas Cupcakes',
    note: 'Festive decorations on an assorted box for the office party, lunch or a gift.',
  },
  {
    test: /easter/,
    category: 'Easter Cupcakes',
    note: 'Easter decorations on an assorted box of 12.',
  },
  {
    test: /diwali/,
    category: 'Diwali Cupcakes',
    note: 'A Diwali box of 12. Every flavour has an eggless alternative.',
  },
  {
    test: /australia-day/,
    category: 'Australia Day Cupcakes',
    note: 'Australia Day decorations on an assorted box of 12.',
  },
  {
    test: /sorry/,
    category: 'Sorry Cupcakes',
    note: 'An apology box of hand-frosted cupcakes, assorted flavours.',
  },
  {
    test: /thank/,
    category: 'Thank U Cupcakes',
    note: 'A thank-you box for a teacher, client or friend. Assorted flavours.',
  },
  {
    test: /wedding-cupcake-tier/,
    category: 'Wedding Cupcakes',
    note: 'A wedding cupcake tier is quoted to your guest count, colours and flavours. Send the date and numbers and we reply with a price.',
  },
  {
    test: /wedding/,
    category: 'Wedding Cupcakes',
    note: 'Wedding cupcakes in a box of 12, assorted flavours, with room to match your colours.',
  },
  {
    test: /womens-day|women-s-day/,
    category: 'Corporate',
    note: 'A Women’s Day box of 12 for the office, assorted flavours.',
  },
  {
    test: /ruok|r-u-ok/,
    category: 'Corporate',
    note: 'R U OK? Day cupcakes with yellow and white buttercream for a workplace morning tea.',
  },
  {
    test: /pink-ribbon/,
    category: 'Corporate',
    note: 'Pink Ribbon Day cupcakes, boxed for an office fundraiser or morning tea.',
  },
  {
    test: /anzac/,
    category: 'Corporate',
    note: 'Anzac Day cupcakes in a box of 12 for a workplace morning tea.',
  },
  {
    test: /pride/,
    category: 'Corporate',
    note: 'Pride Day cupcakes in a box of 12 for the office.',
  },
  {
    test: /afl/,
    category: 'Corporate',
    note: 'AFL cupcakes in team colours, boxed for a workplace watch-along or client event.',
  },
]

const CATEGORY_RULES: { test: RegExp; category: string }[] = [
  { test: /gift-voucher/, category: 'Gift Vouchers' },
  { test: /macaron/, category: 'Macarons' },
  { test: /slice/, category: 'Cake Slices' },
  { test: /dress-cake/, category: 'Dress Cakes' },
  { test: /deluxe-giant/, category: 'Deluxe Giant Cupcakes' },
  { test: /giant-cupcake/, category: 'Giant Cupcakes' },
  { test: /round-cake|custom-birthday-cake/, category: 'Cakes' },
  { test: /mini/, category: 'Mini Cupcakes' },
  {
    test: /vegan|gluten-free|salted-caramel-3|hazelnut|cookies-n-cream|rocky-road-3|molten-chocolate-3|m-n-m/,
    category: 'Deluxe Cupcakes',
  },
]

function plain(html?: string) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncateAtWord(text: string, maxLen: number) {
  const t = text.trim()
  if (t.length <= maxLen) return t
  const slice = t.slice(0, maxLen)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 40 ? slice.slice(0, lastSpace) : slice).trim()
}

const THIN =
  /yummylicious|stuffed up|oopps|please send us an email|please contact us to get your made to order|complete the enquiry form|^\d+\s*x\s+|assorted flavours\.?$/i

export function isThinCopy(html?: string) {
  const text = plain(html)
  if (text.length < 80) return true
  // Only replace short catalogue blurbs. A long admin description stays.
  if (text.length < 220 && THIN.test(text)) return true
  return false
}

function usefulCategory(category?: string) {
  const c = (category || '').trim()
  if (!c) return false
  return !/^(uncategorized|uncategorised|products?|other|cupcake boxes|themed boxes)$/i.test(c)
}

function matchFlavour(handle: string): Flavour | null {
  const keys = Object.keys(FLAVOURS).sort((a, b) => b.length - a.length)
  const hit = keys.find((key) => handle.includes(key))
  return hit ? FLAVOURS[hit] : null
}

function inferCategory(handle: string, title: string, category?: string) {
  if (usefulCategory(category)) return category!.trim()
  const hay = `${handle} ${title}`.toLowerCase()
  const occasion = OCCASION_NOTES.find((row) => row.test.test(hay))
  if (occasion) return occasion.category
  const rule = CATEGORY_RULES.find((row) => row.test.test(hay))
  if (rule) return rule.category
  if (/-3-cupcakes|standard-cupcake/.test(hay)) return 'Standard Cupcakes'
  return 'Cupcakes'
}

function paragraphs(parts: string[]) {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p}</p>`)
    .join('')
}

function buildStory(handle: string, title: string, category: string) {
  const hay = handle.toLowerCase()
  const flavour = matchFlavour(hay)
  const occasion = OCCASION_NOTES.find((row) => row.test.test(hay))
  const name = title.trim()

  if (hay.startsWith('gift-voucher') || hay.includes('gift-voucher')) {
    return {
      body: paragraphs([
        `${name} is redeemable on cupcakes, cakes and macarons at The Cupcake Desire.`,
        'The recipient chooses the flavours. Delivery is across Melbourne Metro on weekdays.',
      ]),
      meta: truncateAtWord(
        `${name} for The Cupcake Desire. Redeem on cupcakes, cakes and macarons delivered across Melbourne.`,
        155
      ),
    }
  }

  if (/wedding-cupcake-tier|custom-birthday-cake/.test(hay)) {
    return {
      body: paragraphs([
        occasion?.note || `${name} is made to your brief.`,
        'Tell us the date, guest count and flavours. We quote from the Narre Warren kitchen and deliver on a weekday across Melbourne Metro. Cakes need three days’ notice. Weddings need about a week.',
      ]),
      meta: truncateAtWord(
        `${name} from The Cupcake Desire in Melbourne. Send your date and guest count for a quote. Weekday delivery.`,
        155
      ),
    }
  }

  if (hay.includes('dress-cake')) {
    return {
      body: paragraphs([
        `${name} is a doll cake in a buttercream gown, baked in vanilla or chocolate.`,
        `Cakes need three days’ notice. ${DELIVERY}`,
      ]),
      meta: truncateAtWord(
        `${name} — a princess dress cake in vanilla or chocolate. Baked to order and delivered across Melbourne.`,
        155
      ),
    }
  }

  if (hay.includes('giant-cupcake')) {
    const deluxe = hay.includes('deluxe')
    return {
      body: paragraphs([
        `${name} is one show-stopping cupcake that serves about 20${flavour ? `, with ${flavour.detail}` : ''}.`,
        `${deluxe ? 'Finished with the deluxe toppings from that flavour. ' : ''}${flavour?.dietary ? `${flavour.dietary} ` : ''}Eggless versions are available. ${DELIVERY}`,
      ]),
      meta: truncateAtWord(
        `${name} serves about 20. A cake alternative, baked to order and delivered across Melbourne.`,
        155
      ),
    }
  }

  if (hay.includes('round-cake')) {
    return {
      body: paragraphs([
        `${name}${flavour ? `: ${flavour.detail}` : ''}. Available in 6 inch and 8 inch.`,
        `Cakes need three days’ notice, and eggless versions are available. ${DELIVERY}`,
      ]),
      meta: truncateAtWord(
        `${name} in 6" and 8". ${flavour ? flavour.detail.charAt(0).toUpperCase() + flavour.detail.slice(1) + '. ' : ''}Baked to order, delivered across Melbourne.`,
        155
      ),
    }
  }

  if (hay.includes('macaron')) {
    return {
      body: paragraphs([
        `${name}: crisp shells and a soft centre, boxed by the dozen.`,
        `Our kitchen handles nuts, including almond meal. ${DELIVERY}`,
      ]),
      meta: truncateAtWord(
        `${name}, boxed by the dozen. Delivered on weekdays across Melbourne from our Narre Warren kitchen.`,
        155
      ),
    }
  }

  if (hay.includes('slice')) {
    return {
      body: paragraphs([
        `${name}, baked for catering boxes of 12, 36, 50 or 100.`,
        DELIVERY,
      ]),
      meta: truncateAtWord(
        `${name} for catering. Boxes of 12, 36, 50 and 100, delivered across Melbourne.`,
        155
      ),
    }
  }

  if (hay.includes('mini')) {
    return {
      body: paragraphs([
        `${name}: two dozen bite-sized cupcakes${flavour ? ` (${flavour.detail})` : ''}.`,
        `Useful for parties and meetings where everyone wants a taste. Every flavour has an eggless alternative. ${DELIVERY}`,
      ]),
      meta: truncateAtWord(
        `${name} in a box of 24. Bite-sized, baked to order and delivered across Melbourne.`,
        155
      ),
    }
  }

  if (occasion) {
    return {
      body: paragraphs([
        `${name}. ${occasion.note}`,
        `Every flavour has an eggless alternative, and we bake separate vegan and gluten-free ranges. ${DELIVERY}`,
      ]),
      meta: truncateAtWord(`${name}. ${occasion.note} Weekday Melbourne delivery.`, 155),
    }
  }

  if (flavour && /-3-cupcakes|cupcakes/.test(hay)) {
    return {
      body: paragraphs([
        `${flavour.name} cupcakes: ${flavour.detail}. Sold in threes, so you can order one flavour or mix several.`,
        `${flavour.dietary ? `${flavour.dietary} ` : 'Every flavour has an eggless alternative. '}${DELIVERY}`,
      ]),
      meta: truncateAtWord(
        `${flavour.name} cupcakes — ${flavour.detail}. Sold in threes, baked to order and delivered across Melbourne.`,
        155
      ),
    }
  }

  return {
    body: paragraphs([
      `${name} from The Cupcake Desire, hand-frosted to order in ${category.toLowerCase()}.`,
      `Every flavour has an eggless alternative. ${DELIVERY}`,
    ]),
    meta: truncateAtWord(
      `${name}. Hand-frosted to order in Narre Warren and delivered across Melbourne on weekdays.`,
      155
    ),
  }
}

export type ProductImage = { src: string; altText?: string; position?: number; variantId?: string }

export function imageAlt(title: string, index: number, existing?: string) {
  const alt = (existing || '').trim()
  const name = title.trim() || 'Cupcake'
  if (alt && alt.toLowerCase() !== name.toLowerCase() && alt.length > name.length + 12) return alt
  if (index === 0) return `${name} — hand-frosted by The Cupcake Desire, Melbourne`
  if (index === 1) return `Close-up of ${name}`
  return `${name}, photo ${index + 1}`
}

export type SeoProduct = {
  handle: string
  title: string
  productCategory?: string
  bodyHtml?: string
  description?: string
  seo?: { description?: string; title?: string }
  images?: ProductImage[]
}

export function enrichProductSeo<T extends SeoProduct>(product: T): T & {
  bodyHtml: string
  metaDescription: string
  productCategory: string
} {
  const handle = product.handle || ''
  const title = product.title || 'Cupcakes'
  const productCategory = inferCategory(handle, title, product.productCategory)
  const story = buildStory(handle, title, productCategory)
  const existingBody = product.bodyHtml || product.description || ''
  const bodyHtml = isThinCopy(existingBody) ? story.body : existingBody
  const adminMeta = plain(product.seo?.description)
  const metaDescription =
    adminMeta.length >= 70 && !/best price/i.test(adminMeta) ? truncateAtWord(adminMeta, 160) : story.meta
  const images = (product.images || []).map((img, index) => ({
    ...img,
    altText: imageAlt(title, index, img.altText),
  }))

  return {
    ...product,
    productCategory,
    bodyHtml,
    metaDescription,
    images,
  }
}

export function exploreLinks(product: { handle?: string; title?: string; productCategory?: string }) {
  const category = inferCategory(product.handle || '', product.title || '', product.productCategory)
  const handle = (product.handle || '').toLowerCase()
  const slug = category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const categoryHref =
    slug === 'corporate'
      ? '/corporate'
      : slug === 'gift-vouchers'
        ? '/gift-voucher'
        : `/collections/${slug}`

  const base = [
    { href: categoryHref, eyebrow: 'Category', label: category, blurb: 'The rest of this range.' },
  ]

  if (/cake|slice|dress|giant/.test(handle) && !/cupcake/.test(handle)) {
    return [
      ...base,
      { href: '/collections/cakes', eyebrow: 'Cakes', label: 'Round cakes', blurb: '6 inch and 8 inch, baked to order.' },
      { href: '/collections/giant-cupcakes', eyebrow: 'Format', label: 'Giant cupcakes', blurb: 'One cupcake that serves about 20.' },
      { href: '/custom-dress-cake', eyebrow: 'Custom', label: 'Dress cakes', blurb: 'A buttercream gown for a birthday.' },
      { href: '/cupcake-delivery', eyebrow: 'Delivery', label: 'Melbourne suburbs', blurb: 'Weekday hand delivery and fees.' },
      { href: '/blogs', eyebrow: 'Read', label: 'Stories from the kitchen', blurb: 'How to choose and when to order.' },
    ]
  }

  if (handle.includes('giant-cupcake')) {
    return [
      ...base,
      {
        href: '/collections/giant-cupcakes',
        eyebrow: 'Format',
        label: 'Giant cupcakes',
        blurb: 'One cupcake that serves about 20.',
      },
      {
        href: '/collections/deluxe-giant-cupcakes',
        eyebrow: 'Deluxe',
        label: 'Deluxe giants',
        blurb: 'Salted caramel, hazelnut, molten chocolate, cookies and cream.',
      },
      { href: '/collections/cakes', eyebrow: 'Cakes', label: 'Round cakes', blurb: '6 inch and 8 inch, when you want slices.' },
      { href: '/cupcake-delivery', eyebrow: 'Delivery', label: 'Melbourne suburbs', blurb: 'Weekday hand delivery and fees.' },
    ]
  }

  if (handle.includes('macaron')) {
    return [
      ...base,
      { href: '/collections/macarons', eyebrow: 'Shop', label: 'All macarons', blurb: 'Salted caramel, strawberry, chocolate, assorted.' },
      { href: '/collections/cake-slices', eyebrow: 'Also', label: 'Cake slices', blurb: 'Catering boxes for the same table.' },
      { href: '/collections/all-cupcakes', eyebrow: 'Cupcakes', label: 'Cupcakes', blurb: 'Add a box to the same order.' },
      { href: '/cupcake-delivery', eyebrow: 'Delivery', label: 'Melbourne suburbs', blurb: 'Weekday hand delivery and fees.' },
    ]
  }

  if (handle.includes('mini')) {
    return [
      ...base,
      { href: '/collections/mini-cupcakes', eyebrow: 'Format', label: 'Mini cupcakes', blurb: 'Boxes of 24.' },
      { href: '/corporate/mini', eyebrow: 'Corporate', label: 'Branded minis', blurb: 'Bite-size with an edible logo.' },
      { href: '/cupcake-catering', eyebrow: 'Events', label: 'Cupcake catering', blurb: 'Offices, morning teas and parties.' },
      { href: '/eggless-cupcakes', eyebrow: 'Diet', label: 'Eggless cupcakes', blurb: 'Every flavour has an eggless version.' },
      { href: '/cupcake-delivery', eyebrow: 'Delivery', label: 'Melbourne suburbs', blurb: 'Weekday hand delivery and fees.' },
    ]
  }

  const occasion = /birthday|wedding|anniversary|baby|gender|valentine|love|mother|father|christmas|easter|diwali|australia|sorry|thank|pride|anzac|ribbon|ruok|afl|womens/.test(
    handle
  )

  if (occasion) {
    return [
      ...base,
      { href: '/occasions', eyebrow: 'More dates', label: 'All occasions', blurb: 'Birthday, wedding, Christmas and the rest.' },
      { href: '/cupcake-builder', eyebrow: 'Custom', label: 'Build a box', blurb: 'Choose every flavour and add a message.' },
      { href: '/collections/mini-cupcakes', eyebrow: 'Format', label: 'Mini cupcakes', blurb: 'A box of 24 when the group is larger.' },
      { href: '/eggless-cupcakes', eyebrow: 'Diet', label: 'Eggless cupcakes', blurb: 'Every flavour has an eggless version.' },
      { href: '/vegan-cupcakes', eyebrow: 'Diet', label: 'Vegan cupcakes', blurb: 'A separate vegan range.' },
      { href: '/cupcake-delivery', eyebrow: 'Delivery', label: 'Melbourne suburbs', blurb: 'Weekday hand delivery and fees.' },
      { href: '/blogs', eyebrow: 'Read', label: 'Stories from the kitchen', blurb: 'How to choose and when to order.' },
    ]
  }

  return [
    ...base,
    { href: '/collections/standard-cupcakes', eyebrow: 'Range', label: 'Classic flavours', blurb: 'Red velvet, chocolate, vanilla, mocha, coconut.' },
    { href: '/collections/deluxe-cupcakes', eyebrow: 'Richer', label: 'Deluxe cupcakes', blurb: 'Salted caramel, rocky road, hazelnut and more.' },
    { href: '/collections/mini-cupcakes', eyebrow: 'Format', label: 'Mini cupcakes', blurb: 'Boxes of 24.' },
    { href: '/eggless-cupcakes', eyebrow: 'Diet', label: 'Eggless cupcakes', blurb: 'Every flavour has an eggless version.' },
    { href: '/vegan-cupcakes', eyebrow: 'Diet', label: 'Vegan cupcakes', blurb: 'A separate vegan range.' },
    { href: '/gluten-free-cupcakes', eyebrow: 'Diet', label: 'Gluten-free cupcakes', blurb: 'Baked as their own range.' },
    { href: '/cupcake-builder', eyebrow: 'Custom', label: 'Build a box', blurb: 'Choose every flavour and add a message.' },
    { href: '/cupcake-delivery', eyebrow: 'Delivery', label: 'Melbourne suburbs', blurb: 'Weekday hand delivery and fees.' },
  ]
}
