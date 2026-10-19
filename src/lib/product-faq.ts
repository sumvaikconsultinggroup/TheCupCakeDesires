import { descriptiveProductTitle } from '@/lib/seo-title'
import { DELIVERY_FEE_EXTENDED, DELIVERY_FEE_NEAR } from '@/utils/deliveryZones'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqProduct {
  title: string
  handle: string
  productCategory?: string
  variants?: { price?: number; option1Value?: string; title?: string }[]
  allowLogoUpload?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
}

const aud = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`

/**
 * Product FAQs built only from facts the site already states (delivery zones,
 * shipping / refund / allergen policies, the product's own prices), so the
 * visible answers and the FAQPage schema stay accurate for search and AI answers.
 */
export function buildProductFaq(product: FaqProduct): FaqItem[] {
  const name = descriptiveProductTitle(product.title, product.handle, product.productCategory)
  const handle = product.handle.toLowerCase()
  if (handle.startsWith('gift-voucher')) {
    return [
      {
        question: `How does a ${name} work?`,
        answer:
          'Gift vouchers are redeemable on any order at thecupcakedesire.com.au for delivery across Melbourne Metro. Enter the voucher code at checkout.',
      },
    ]
  }

  const prices = (product.variants || []).map((v) => Number(v.price)).filter((p) => p > 0)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0
  const faqs: FaqItem[] = []

  if (min > 0) {
    faqs.push({
      question: `How much is ${name}?`,
      answer:
        min === max
          ? `${name} is ${aud(min)} AUD, including GST.`
          : `${name} ranges from ${aud(min)} to ${aud(max)} AUD (including GST), depending on the option you choose.`,
    })
  }

  faqs.push({
    question: `Can I get ${name} delivered in Melbourne?`,
    answer: `Yes. We hand-deliver across Melbourne Metro on weekdays from our Narre Warren kitchen. Order before 12 noon for delivery the next weekday after 2pm; orders after noon arrive the day after next. Delivery is ${aud(DELIVERY_FEE_NEAR)} or ${aud(DELIVERY_FEE_EXTENDED)} depending on your suburb. We don't deliver on weekends or public holidays.`,
  })

  if (product.allowLogoUpload) {
    faqs.push({
      question: `Can you put our company logo on ${name}?`,
      answer:
        'Yes. Upload your logo on this page when you order and we print it as an edible logo. Larger corporate orders may need longer notice — contact us and we will confirm a realistic timeline.',
    })
  }

  faqs.push({
    question: `How long does ${name} stay fresh?`,
    answer:
      "Everything is baked to order and is at its best on the day of delivery. Kept in a sealed box at room temperature or in the fridge, it typically stays enjoyable for up to about four days.",
  })

  faqs.push({
    question: `Is ${name} available eggless, vegan or gluten-free?`,
    answer: `Every flavour we bake has an eggless alternative, and we have separate vegan and gluten-free ranges${
      product.isVegan ? ' (this item is vegan)' : product.isGlutenFree ? ' (this item is gluten-free)' : ''
    }. Our kitchen handles wheat, eggs, dairy, soy, nuts and sesame, so we cannot guarantee zero cross-contact — please contact us before ordering if you have a severe allergy.`,
  })

  return faqs
}
