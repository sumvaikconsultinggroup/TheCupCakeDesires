'use client'

/**
 * The Cupcake Desire: send the real order total to Google Ads (and GA4) on /order-successful.
 *
 * WHERE: render this once on the /order-successful page, only after Stripe confirms payment.
 *
 * SERVER SIDE (in the /order-successful page):
 *   1. Make sure Stripe's success_url includes the session ID, e.g.
 *        success_url: '.../order-successful?session_id={CHECKOUT_SESSION_ID}'
 *   2. Read the session and render this component:
 *        const session = await stripe.checkout.sessions.retrieve(searchParams.session_id);
 *        if (session.payment_status === 'paid') {
 *          <PurchaseConversion
 *            orderId={session.id}
 *            total={(session.amount_total ?? 0) / 100}
 *            currency={(session.currency ?? 'aud').toUpperCase()}
 *          />
 *        }
 *
 * The site already loads gtag with AW-17516368707 and G-XDGY2JLJST, so nothing else needs installing.
 * transaction_id stops the same order being counted twice if the page is refreshed.
 */

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type Props = { orderId: string; total: number; currency?: string }

export default function PurchaseConversion({ orderId, total, currency = 'AUD' }: Props) {
  useEffect(() => {
    if (!window.gtag || !orderId || !(total > 0)) return

    const key = `tcd_conv_sent_${orderId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      /* storage blocked: transaction_id still de-duplicates in Google Ads */
    }

    // Google Ads purchase conversion with the real order value
    window.gtag('event', 'conversion', {
      send_to: 'AW-17516368707/yTZFCKzhv_EcEMOmuqBB',
      value: total,
      currency,
      transaction_id: orderId,
    })

    // GA4 purchase event (same order, same value)
    window.gtag('event', 'purchase', {
      send_to: 'G-XDGY2JLJST',
      transaction_id: orderId,
      value: total,
      currency,
    })
  }, [orderId, total, currency])

  return null
}
