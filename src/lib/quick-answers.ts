import {
  CORPORATE_CAKE_SLICE_SIZES,
  CORPORATE_ROUND_CAKE_SIZES,
  MINI_CORPORATE_SIZES,
  STANDARD_CORPORATE_SIZES,
} from '@/lib/corporate-pages'
import type { FaqItem } from '@/lib/product-faq'
import {
  DELIVERY_FEE_EXTENDED,
  DELIVERY_FEE_NEAR,
  FREE_DELIVERY_THRESHOLD,
} from '@/utils/deliveryZones'

const aud = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`

export const DELIVERY_ANSWER: FaqItem = {
  question: 'Do you deliver cupcakes across Melbourne?',
  answer: `Yes — we hand-deliver across Melbourne Metro on weekdays from our kitchen in Narre Warren. Order before 12 noon for delivery the next weekday after 2pm; orders after noon arrive the day after next. Delivery is ${aud(DELIVERY_FEE_NEAR)} or ${aud(DELIVERY_FEE_EXTENDED)} depending on your suburb, and free on orders of ${aud(FREE_DELIVERY_THRESHOLD)} or more. No weekend or public-holiday delivery.`,
}

export const DIETARY_ANSWER: FaqItem = {
  question: 'Do you make eggless, vegan and gluten-free cupcakes?',
  answer:
    'Yes. Every flavour has an eggless alternative, and we bake separate vegan and gluten-free ranges. Our kitchen also handles wheat, dairy, soy, nuts and sesame, so we cannot guarantee zero cross-contact for severe allergies.',
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
          ? ` A box of 12 cupcakes is ${Math.min(...box12) === Math.max(...box12) ? aud(box12[0]) : `${aud(Math.min(...box12))}–${aud(Math.max(...box12))}`} depending on the flavours.`
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
        'Every order is baked fresh with a minimum 24-hour lead time. Larger, highly custom or multi-drop corporate orders need longer — contact us when you book and we will confirm a realistic timeline. We aim to send quotes within 24 hours.',
    },
    DELIVERY_ANSWER,
    DIETARY_ANSWER,
  ]
}

/** Per-collection answers, priced from the products actually on the page. */
export function collectionQuickAnswers(
  noun: string,
  products: (PricedProduct & { handle?: string; minOrderQty?: number })[]
): FaqItem[] {
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
