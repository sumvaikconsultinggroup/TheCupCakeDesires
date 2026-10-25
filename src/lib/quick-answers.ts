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
    'Yes. Every flavour has an eggless alternative, and we bake separate vegan and gluten-free ranges. Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease. For other dietary questions, please contact us before ordering.',
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
  return [
    {
      question: 'How much are corporate logo cupcakes in Melbourne?',
      answer: `Standard edible-logo cupcakes: ${range(STANDARD_CORPORATE_SIZES)} (AUD, incl. GST). Mini logo cupcakes: ${range(MINI_CORPORATE_SIZES)}.`,
    },
    {
      question: 'Do you do branded cake slices and logo cakes?',
      answer: `Yes. Branded cake slices: ${range(CORPORATE_CAKE_SLICE_SIZES)}. Logo round cakes: ${range(CORPORATE_ROUND_CAKE_SIZES)}, in Vanilla or Chocolate.`,
    },
    {
      question: 'How much notice do you need for a corporate order?',
      answer:
        'Corporate orders need longer notice, so book as early as you can and we will confirm a date. We will reply on business days.',
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
      answer: `A themed box of 12 birthday cupcakes is ${themed12}, and a mini cupcake box of 24 is ${mini24}. Single-flavour cupcakes are ${single} each, with a minimum of ${minQtyLabel}. To choose every flavour yourself, the build-your-own box starts at $66 for 12. All prices are in AUD and include GST. Delivery is typically $0 to $20 by suburb, and free on orders over $100.`,
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

/** Per-collection answers, priced from the products actually on the page. */
export function collectionQuickAnswers(
  noun: string,
  products: CollectionProduct[]
): FaqItem[] {
  if (noun === 'birthday cupcakes') {
    return birthdayCupcakesQuickAnswers(products)
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
