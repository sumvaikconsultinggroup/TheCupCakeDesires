/**
 * POST /api/stripe/verify-session
 *
 * Called by the order-successful page on return from Stripe Checkout. It fetches
 * the Checkout Session server-side and, if it's paid, reconciles the order the
 * SAME way the webhook does (idempotent). This guarantees the order flips to
 * "paid" even when the async webhook hasn't arrived yet (e.g. locally without
 * `stripe listen`, or before Stripe delivers the event).
 *
 * Body: { sessionId: string }
 */

import connectDb from '@/lib/mongodb'
import { isStripeConfigured, requireStripe } from '@/lib/stripe'
import { reconcileCheckoutSession } from '@/lib/stripe-reconcile'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ success: false, message: 'Stripe not configured' }, { status: 503 })
  }

  let sessionId: string | undefined
  try {
    const body = await request.json()
    sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 })
  }
  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'sessionId is required' }, { status: 400 })
  }

  const stripe = requireStripe()

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.payment_status === 'paid'

    if (paid) {
      await connectDb()
      await reconcileCheckoutSession(stripe, session)
    }

    return NextResponse.json({
      success: true,
      paid,
      orderId: (session.metadata?.orderId as string | undefined) ?? null,
    })
  } catch (error: any) {
    console.error('verify-session failed:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Could not verify session' },
      { status: 500 }
    )
  }
}
