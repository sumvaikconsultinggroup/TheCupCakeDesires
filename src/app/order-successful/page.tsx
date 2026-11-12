import PurchaseConversion from '@/components/PurchaseConversion'
import { isStripeConfigured, requireStripe } from '@/lib/stripe'

import OrderSuccessfulClient from './OrderSuccessfulClient'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Stripe success_url already includes session_id={CHECKOUT_SESSION_ID}.
 * When payment is confirmed, fire Google Ads + GA4 with the real amount_total
 * and the Stripe session id as transaction_id (refresh-safe).
 */
async function loadPaidStripeConversion(sessionId: string | undefined) {
  if (!sessionId || !isStripeConfigured()) return null
  try {
    const session = await requireStripe().checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') return null
    const total = (session.amount_total ?? 0) / 100
    if (!(total > 0)) return null
    return {
      orderId: session.id,
      total,
      currency: (session.currency ?? 'aud').toUpperCase(),
    }
  } catch (err) {
    console.error('order-successful: could not load Stripe session for conversion', err)
    return null
  }
}

export default async function OrderSuccessfulPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const raw = params.session_id
  const sessionId = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined

  const conversion = await loadPaidStripeConversion(sessionId)

  return (
    <>
      {conversion ? (
        <PurchaseConversion
          orderId={conversion.orderId}
          total={conversion.total}
          currency={conversion.currency}
        />
      ) : null}
      <OrderSuccessfulClient stripeConversionHandled={Boolean(conversion)} />
    </>
  )
}
