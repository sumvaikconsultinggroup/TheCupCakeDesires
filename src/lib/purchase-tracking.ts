/**
 * Purchase conversion tracking for the order confirmation page.
 *
 * Sends one `purchase` per order to:
 *  - GTM (GTM-NFS6S4XF) as a GA4-ecommerce `dataLayer` event, so a Google Ads
 *    "Purchase - Online Order" conversion tag can fire on Custom Event = purchase
 *    and read ecommerce.value / ecommerce.transaction_id / ecommerce.currency.
 *  - GA4 (G-XDGY2JLJST) via gtag, so the purchase key event can be imported into
 *    Google Ads if preferred.
 *  - Google Ads (AW-17516368707) directly via gtag once
 *    NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL is set.
 *
 * transaction_id lets Google de-duplicate, and a localStorage guard stops
 * refreshes / revisits of the confirmation URL from re-sending the event.
 */

// Google Ads account tag. Configured on the existing gtag.js (loaded for GA4)
// rather than a second <script>, per Google's one-tag-per-page guidance.
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17516368707'
const GOOGLE_ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL

const PAID_STATUSES = ['paid', 'in_kitchen', 'out_for_delivery', 'delivered']
const SENT_KEY_PREFIX = 'purchase_tracked_'

export interface TrackableOrder {
  id: string
  orderId: string
  totalAmount: number
  taxes?: number
  shipping?: number
  discount?: number
  status: string
  items: Array<{ productId?: string; name: string; quantity: number; price: number }>
  paymentDetails?: { paymentStatus?: string }
}

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

export function isOrderPaid(order: TrackableOrder) {
  return order.paymentDetails?.paymentStatus === 'paid' || PAID_STATUSES.includes(order.status)
}

function alreadySent(transactionId: string) {
  try {
    return window.localStorage.getItem(SENT_KEY_PREFIX + transactionId) === '1'
  } catch {
    return false
  }
}

function markSent(transactionId: string) {
  try {
    window.localStorage.setItem(SENT_KEY_PREFIX + transactionId, '1')
  } catch {
    /* storage blocked — transaction_id still de-duplicates on Google's side */
  }
}

export function trackPurchase(order: TrackableOrder) {
  if (typeof window === 'undefined' || !isOrderPaid(order)) return

  const transactionId = order.orderId || order.id
  const value = Number(order.totalAmount) || 0
  if (!transactionId || value <= 0 || alreadySent(transactionId)) return

  const ecommerce = {
    transaction_id: transactionId,
    value,
    currency: 'AUD',
    tax: Number(order.taxes) || 0,
    shipping: Number(order.shipping) || 0,
    ...(order.discount ? { discount: Number(order.discount) } : {}),
    items: order.items.map((item) => ({
      item_id: item.productId || item.name,
      item_name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
    })),
  }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event: 'purchase', ecommerce })

  const gtag: Gtag =
    window.gtag ||
    function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }

  gtag('event', 'purchase', ecommerce)

  if (GOOGLE_ADS_ID && GOOGLE_ADS_PURCHASE_LABEL) {
    gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      value,
      currency: 'AUD',
      transaction_id: transactionId,
    })
  }

  markSent(transactionId)
}
