import {
  CORPORATE_CAKE_SLICE_SIZES,
  CORPORATE_ROUND_CAKE_SIZES,
  MINI_CORPORATE_SIZES,
  STANDARD_CORPORATE_SIZES,
} from '@/lib/corporate-pages'
import { CUPCAKE_DELIVERY_QA } from '@/data/cupcake-delivery-qa'
import type { FaqItem } from '@/lib/product-faq'

const aud = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`

/** Q1 from the signed /cupcake-delivery quick answers. */
export const DELIVERY_ANSWER: FaqItem = {
  question: CUPCAKE_DELIVERY_QA[0].question,
  answer: CUPCAKE_DELIVERY_QA[0].answer,
}

export const DIETARY_ANSWER: FaqItem = {
  question: 'Do you make eggless, vegan and gluten-free cupcakes?',
  answer:
    'Yes. Every flavour has an eggless alternative, and we bake separate vegan and gluten-free cupcake ranges. Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.',
}

interface PricedProduct {
  title: string
  variants?: { price?: number; option1Value?: string }[]
}

/** Shop-wide answers for the catalogue landing page, priced from the live grid. */
export function catalogueQuickAnswers(products: PricedProduct[]): FaqItem[] {
  const all = products.flatMap((p) =>
    (p.variants || []).map((v) => ({ price: Number(v.price) || 0, option: v.option1Value || '', title: p.title }))
  ).filter((v) => v.price > 0)
  const items: FaqItem[] = []

  if (all.length > 0) {
    const min = Math.min(...all.map((v) => v.price))
    const box12 = all.filter((v) => /\b12\b/.test(v.option) || /box of 12/i.test(v.title)).map((v) => v.price)
    items.push({
      question: 'How much do cupcakes cost at The Cupcake Desire?',
      answer:
        `Prices start from ${aud(min)} AUD including GST.` +
        (box12.length
          ? ` A box of 12 cupcakes is ${Math.min(...box12) === Math.max(...box12) ? aud(box12[0]) : `${aud(Math.min(...box12))} to ${aud(Math.max(...box12))}`} depending on the flavours.`
          : ''),
    })
  }

  items.push(DELIVERY_ANSWER, DIETARY_ANSWER, {
    question: 'Can I order cupcakes with a company logo?',
    answer: `Yes. Edible-logo corporate cupcakes start at ${aud(STANDARD_CORPORATE_SIZES[0].price)} for a ${STANDARD_CORPORATE_SIZES[0].label.toLowerCase()}, with boxes up to ${STANDARD_CORPORATE_SIZES[STANDARD_CORPORATE_SIZES.length - 1].qty}. See our corporate page for minis, cake slices and logo cakes.`,
  })
  return items
}

/** Corporate pricing answers, straight from the corporate price tables. */
export function corporateQuickAnswers(): FaqItem[] {
  const range = (sizes: readonly { label: string; price: number }[]) =>
    sizes.map((s) => `${s.label.toLowerCase()} ${aud(s.price)}`).join(', ')
  /** ['a', 'b', 'c'] -> 'a, b or c' (or 'and' when given). */
  const series = (parts: string[], last: 'or' | 'and' = 'or') =>
    parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} ${last} ${parts[parts.length - 1]}`
  const smallest = STANDARD_CORPORATE_SIZES[0]
  const largest = STANDARD_CORPORATE_SIZES[STANDARD_CORPORATE_SIZES.length - 1]
  const smallestMini = MINI_CORPORATE_SIZES[0]
  const slices = series(
    CORPORATE_CAKE_SLICE_SIZES.map((s, i) => `${i === 0 ? 'a box of ' : ''}${s.qty} for ${aud(s.price)}`)
  )
  const roundCakes = series(CORPORATE_ROUND_CAKE_SIZES.map((s) => `${s.label} ${aud(s.price)}`))
  const perCupcake = series(
    STANDARD_CORPORATE_SIZES.filter((s) => [12, 100, 300, 500].includes(s.qty)).map(
      (s) => `$${(s.price / s.qty).toFixed(2)} each in a box of ${s.qty}`
    ),
    'and'
  )
  return [
    {
      question: 'How much are corporate logo cupcakes in Melbourne?',
      answer: `Standard edible-logo cupcakes: ${range(STANDARD_CORPORATE_SIZES)} (AUD, incl. GST). Mini logo cupcakes: ${range(MINI_CORPORATE_SIZES)}.`,
    },
    {
      question: 'What is the minimum order for corporate logo cupcakes?',
      answer: `The smallest online order is a box of ${smallest.qty} edible-logo cupcakes for ${aud(smallest.price)}, or ${smallestMini.qty} mini logo cupcakes for ${aud(smallestMini.price)} (AUD, including GST). Online boxes go up to ${largest.qty} cupcakes. For larger orders, more flavours or several venues, send us a brief and we reply on business days with a tailored quote and mock-up.`,
    },
    {
      question: 'How much does each corporate cupcake cost?',
      answer: `Standard edible-logo cupcakes work out at ${perCupcake} (AUD, including GST). Melbourne Metro delivery is $0 to $20 by suburb, and free on orders over $100.`,
    },
    {
      question: 'Do you do branded cake slices and logo cakes?',
      answer: `Yes. Branded cake slices come in ${slices}. Logo round cakes are ${roundCakes}, in Vanilla or Chocolate. Prices are AUD including GST. Cakes need 3 days' notice.`,
    },
    {
      question: 'Can you put our company logo on corporate cupcakes?',
      answer:
        'Yes. The Cupcake Desire prints your company logo on edible toppers for cupcakes baked to order in our Narre Warren kitchen. Upload PNG, JPG or WEBP files (up to 4 logos) when you order. We hand-deliver across Melbourne Metro on weekdays. Order by 12 noon for next-weekday delivery, generally 9am to 3pm.',
    },
    {
      question: 'What logo file do I need for edible logo cupcakes?',
      answer:
        'Upload your logo as a PNG, JPG or WEBP file, up to 4MB, when you order online. You can add up to 4 logos, and we print each one on edible discs and mix them across your cupcakes. For custom branding or brand colours, send us a brief and we reply on business days with a digital mock-up.',
    },
    {
      question: 'Which flavours do corporate cupcakes come in?',
      answer:
        'Online corporate boxes come in Vanilla, Chocolate or Mix of Both, each topped with your edible logo, and every flavour has an eggless alternative. Bulk orders can include more flavours: up to 4 flavours for 50 to 99 cupcakes and up to 8 for 100 to 499. Send us a brief for a quote.',
    },
    {
      question: 'How much notice do you need for a corporate order?',
      answer:
        "Every order is baked to order. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Orders placed after noon miss the next weekday run, so the earliest delivery is the weekday after that. Larger, highly custom or multi-venue corporate orders need longer notice, so contact us when you book and we'll confirm a realistic timeline.",
    },
    {
      question: 'Do you deliver corporate cupcakes on weekends or to several offices?',
      answer:
        'We deliver on weekdays only, with no Saturday, Sunday or public-holiday delivery, so for a weekend event choose Friday delivery. One corporate order can be delivered to several venues across Melbourne Metro. Deliveries generally arrive between 9am and 3pm, with no guaranteed timed slot. Outside Metro delivery is by quote.',
    },
    {
      question: 'Do you make corporate Christmas cupcakes?',
      answer: `Yes. Our [Christmas corporate cupcakes page](/corporate/christmas) covers office Christmas orders: edible-logo boxes from ${smallest.qty} to ${largest.qty} in Vanilla, Chocolate or Mix of Both, with up to 4 logos. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Larger orders need longer notice, so book December dates early.`,
    },
    DELIVERY_ANSWER,
    DIETARY_ANSWER,
  ]
}

type CollectionProduct = PricedProduct & { handle?: string; minOrderQty?: number }

function priceOf(p?: CollectionProduct): number {
  return Number(p?.variants?.[0]?.price) || 0
}

/**
 * /collections/birthday-cupcakes AEO override (birthday-cupcakes-collection.md).
 * Q1 prices come from the live grid; Q2–Q7 are static. Keep free-over-$100 clause.
 */
export function birthdayCupcakesQuickAnswers(products: CollectionProduct[]): FaqItem[] {
  const themed =
    products.find((p) => p.handle === 'box-of-12-birthday-cupcakes') ||
    products.find((p) => /box-of-12-birthday/i.test(p.handle || ''))
  const mini =
    products.find((p) => p.handle === 'mini-cupcake-box-24') ||
    products.find((p) => /mini-cupcake-box-24|box-of-24.*mini|mini.*box.*24/i.test(p.handle || '')) ||
    products.find((p) => /mini cupcake box/i.test(p.title) && /\b24\b/.test(p.title))
  const isEach = (p: CollectionProduct) =>
    (p.minOrderQty || 0) > 1 || priceOf(p) > 0 && priceOf(p) <= 10
  const eachProducts = products.filter(isEach)
  const singlePrice = eachProducts.length
    ? Math.min(...eachProducts.map(priceOf).filter((n) => n > 0))
    : 0
  const minQty =
    eachProducts.find((p) => (p.minOrderQty || 0) > 1)?.minOrderQty ||
    (singlePrice > 0 ? 3 : 0)

  const themed12 = aud(priceOf(themed) || 66)
  const mini24 = aud(priceOf(mini) || 70)
  const single = aud(singlePrice || 5)
  const minQtyLabel = String(minQty || 3)

  return [
    {
      question: 'How much are birthday cupcakes in Melbourne?',
      answer: `A themed box of 12 birthday cupcakes is ${themed12}, and a mini cupcake box of 24 is ${mini24}. Single-flavour cupcakes are ${single} each, with a minimum of ${minQtyLabel}. To choose every flavour yourself, the build-your-own box starts at $66 for 12. All prices are in AUD and include GST. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote.`,
    },
    {
      question: 'Can I order birthday cupcakes for delivery tomorrow?',
      answer:
        'Yes, if tomorrow is a weekday and the address is in Melbourne Metro. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Every birthday box is baked fresh to order in our Narre Warren kitchen, so please order ahead of the noon cut-off. See [cupcake delivery in Melbourne](/cupcake-delivery) for details.',
    },
    {
      question: 'Can you deliver birthday cupcakes for a Saturday or Sunday party?',
      answer:
        'No. We deliver Monday to Friday only, with no Saturday, Sunday or public-holiday delivery anywhere in Melbourne Metro. For a weekend birthday party, order for Friday delivery instead. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. That means ordering by noon on Thursday for a Friday delivery.',
    },
    {
      question: 'Can I choose the flavours and add a birthday message?',
      answer:
        'Yes. Our [build-your-own box](/cupcake-builder) lets you mix and match cupcakes and cake slices and add a message, with one price per box: $66 for 12, $150 for 30, $225 for 50, $800 for 200 or $1,750 for 500. For more than 500, enquire and we will quote. Every box is hand-frosted with buttercream.',
    },
    {
      question: 'Do you make vegan, eggless or gluten-free birthday cupcakes?',
      answer:
        'Yes. Every flavour has an eggless option, our vegan range covers plant-based guests, and gluten-free options are available, so most guests can share the same birthday box. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease.',
    },
    {
      question: 'Are your birthday cupcakes suitable for a school or daycare party with nut rules?',
      answer:
        "No. We don't offer a nut-free range. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. For allergen details, see our [allergens and ingredients page](/allergen-info).",
    },
    {
      question: 'Can you deliver birthday cupcakes to an office for a colleague?',
      answer:
        'Yes, to any office within Melbourne Metro on weekdays, following the same noon cut-off. A themed box of 12 or a build-your-own box with a message works well for a team birthday. If you want your company logo on the cupcakes, see our [corporate cupcakes page](/corporate) for logo options, pricing and booking.',
    },
  ]
}

/**
 * /collections/wedding-cupcakes AEO override (12 Nov wedding FAQ).
 * Q1 prices come from the live grid (themed 12 / mini 24 / single); builder
 * sizes stay static. Markdown links match the birthday pattern targets.
 */
export function weddingCupcakesQuickAnswers(products: CollectionProduct[]): FaqItem[] {
  const themed =
    products.find((p) => p.handle === 'box-of-12-wedding-cupcakes') ||
    products.find((p) => /box-of-12-wedding/i.test(p.handle || ''))
  const mini =
    products.find((p) => p.handle === 'mini-cupcake-box-24') ||
    products.find((p) => /mini-cupcake-box-24|box-of-24.*mini|mini.*box.*24/i.test(p.handle || '')) ||
    products.find((p) => /mini cupcake box/i.test(p.title) && /\b24\b/.test(p.title))
  const isEach = (p: CollectionProduct) =>
    (p.minOrderQty || 0) > 1 || (priceOf(p) > 0 && priceOf(p) <= 10)
  const eachProducts = products.filter(isEach)
  const singlePrice = eachProducts.length
    ? Math.min(...eachProducts.map(priceOf).filter((n) => n > 0))
    : 0
  const minQty =
    eachProducts.find((p) => (p.minOrderQty || 0) > 1)?.minOrderQty ||
    (singlePrice > 0 ? 3 : 0)

  const themed12 = aud(priceOf(themed) || 66)
  const mini24 = aud(priceOf(mini) || 70)
  const single = aud(singlePrice || 5)
  const minQtyLabel = String(minQty || 3)

  return [
    {
      question: 'How much are wedding cupcakes in Melbourne?',
      answer: `A themed box of 12 wedding cupcakes is ${themed12} and a mini cupcake box of 24 is ${mini24}. Single flavour cupcakes are ${single} each, minimum ${minQtyLabel}. For larger weddings, the [build your own box](/cupcake-builder) is $150 for 30, $225 for 50, $800 for 200 or $1,750 for 500. All prices are in AUD and include GST.`,
    },
    {
      question: 'How many wedding cupcakes should I order?',
      answer:
        'Start from your guest count, then pick the closest box size: 30, 50, 200 or 500 in our [build your own box](/cupcake-builder), or themed boxes of 12 for a small celebration or bridal shower. For more than 500 cupcakes, enquire and we will quote. If you are unsure, send us your guest numbers and we will help.',
    },
    {
      question: 'How far ahead should I order wedding cupcakes?',
      answer:
        'As early as you can. Standard orders follow our noon cut-off: order by 12 noon for next weekday delivery, generally 9am to 3pm. Weddings need longer notice so we can plan baking and delivery, so contact us with your date and guest numbers when you book and we will confirm a realistic timeline.',
    },
    {
      question: 'Can you deliver wedding cupcakes on a Saturday or Sunday?',
      answer:
        'No. We deliver Monday to Friday only, with no Saturday, Sunday or public holiday delivery anywhere in Melbourne Metro. For a weekend wedding, choose Friday delivery and talk to us when you book about timing and how to keep the cupcakes until the day. Order by 12 noon on Thursday for Friday delivery.',
    },
    {
      question: 'Do you deliver wedding cupcakes to the venue?',
      answer:
        'Yes, from our Narre Warren kitchen to venues within [Melbourne Metro](/cupcake-delivery) on weekdays. Deliveries generally arrive between 9am and 3pm, and we cannot promise an exact time, so plan with your venue for that window. Metro delivery is $0 to $20 by suburb and free on orders over $100. Outside Metro by quote. For venues outside Melbourne Metro, ask before ordering.',
    },
    {
      question: 'Do you make vegan, eggless or gluten free wedding cupcakes?',
      answer:
        'Yes. Every flavour has an eggless option, we bake a dedicated vegan range, and gluten free options are available, so most guests can share one order. Everything is made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so it is not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.',
    },
    {
      question: 'Are your wedding cupcakes nut free?',
      answer:
        'No. We do not offer a nut free range, and we cannot call any cupcake nut free, because our shared kitchen also handles nuts, sesame, dairy, eggs, soy and gluten. If a guest needs a nut free guarantee, please choose a nut free supplier for them. For allergen details, see our [allergens and ingredients page](/allergen-info).',
    },
  ]
}

/** /collections/cakes only: no day-after-next wording; cakes need 3 days' notice. */
export function cakesQuickAnswers(products: CollectionProduct[]): FaqItem[] {
  const prices = products
    .flatMap((p) => (p.variants || []).map((v) => Number(v.price) || 0))
    .filter((n) => n > 0)
  const items: FaqItem[] = []
  if (prices.length) {
    const lo = Math.min(...prices)
    const hi = Math.max(...prices)
    items.push({
      question: 'How much are cakes?',
      answer:
        lo === hi
          ? `Cakes in this collection are ${aud(lo)}. All prices in AUD, including GST.`
          : `Cakes in this collection range from ${aud(lo)} to ${aud(hi)}. All prices in AUD, including GST.`,
    })
  }
  items.push(
    {
      question: 'Do you deliver cakes across Melbourne?',
      answer:
        "Yes. We hand deliver cakes across Melbourne Metro on weekdays from our kitchen in Narre Warren. Cakes need 3 days' notice. Delivery is generally between 9am and 3pm. Metro Melbourne delivery $0 to $20 by suburb, free over $100. Outside Metro by quote. No weekend or public holiday delivery.",
    },
    {
      question: 'Do you offer eggless, vegan or gluten free options?',
      answer:
        'For eggless, vegan or gluten free options, see our [eggless cupcakes](/eggless-cupcakes), [vegan cupcakes](/vegan-cupcakes) and [gluten free cupcakes](/gluten-free-cupcakes) ranges.',
    }
  )
  return items
}

/** Per-collection answers, priced from the products actually on the page. */
export function collectionQuickAnswers(
  noun: string,
  products: CollectionProduct[]
): FaqItem[] {
  if (noun === 'birthday cupcakes') {
    return birthdayCupcakesQuickAnswers(products)
  }
  if (noun === 'wedding cupcakes') {
    return weddingCupcakesQuickAnswers(products)
  }
  if (noun === 'cakes') {
    return cakesQuickAnswers(products)
  }

  const prices = products.flatMap((p) => (p.variants || []).map((v) => Number(v.price) || 0)).filter((n) => n > 0)
  const items: FaqItem[] = []
  if (prices.length) {
    const themed = products.find((p) => p.handle?.startsWith('box-of-12-'))
    const themedPrice = Number(themed?.variants?.[0]?.price) || 0
    // Single-flavour cupcakes are priced each (minimum 3); everything else per box/cake.
    const isEach = (p: { minOrderQty?: number; variants?: { price?: number }[] }) =>
      (p.minOrderQty || 0) > 1 || (Number(p.variants?.[0]?.price) || 0) <= 10
    const each = products.filter(isEach).flatMap((p) => (p.variants || []).map((v) => Number(v.price) || 0)).filter(Boolean)
    const boxes = products
      .filter((p) => !isEach(p) && p !== themed)
      .flatMap((p) => (p.variants || []).map((v) => Number(v.price) || 0))
      .filter(Boolean)
    const parts: string[] = []
    if (themedPrice) parts.push(`A themed box of 12 ${noun} is ${aud(themedPrice)}.`)
    if (boxes.length) {
      const lo = Math.min(...boxes)
      const hi = Math.max(...boxes)
      parts.push(
        lo === hi
          ? `${themedPrice ? 'Other boxes in this collection are' : 'Each box is'} ${aud(lo)}.`
          : `${themedPrice ? 'Other options' : 'Prices'} range from ${aud(lo)} to ${aud(hi)}.`
      )
    }
    if (each.length) parts.push(`Single-flavour cupcakes are ${aud(Math.min(...each))} each (minimum 3).`)
    items.push({ question: `How much are ${noun}?`, answer: `${parts.join(' ')} All prices in AUD, including GST.` })
  }
  items.push(DELIVERY_ANSWER, DIETARY_ANSWER)
  return items
}
