import { isStripeConfigured, requireStripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/integrations/payments/test
 *
 * Pings Stripe with the env-configured key. Returns the live account name +
 * dashboard mode so the admin knows env vars are wired correctly.
 */
export async function POST(_request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Stripe not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local first.',
      },
      { status: 503 }
    )
  }

  try {
    const stripe = requireStripe()
    const account = await stripe.accounts.retrieve()
    return NextResponse.json({
      success: true,
      message: `Connected to Stripe as ${account.business_profile?.name ?? account.email ?? account.id}`,
      accountId: account.id,
      country: account.country,
      defaultCurrency: account.default_currency,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    })
  } catch (error: any) {
    console.error('Stripe connection test failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Could not reach Stripe with the configured key.',
      },
      { status: 502 }
    )
  }
}
