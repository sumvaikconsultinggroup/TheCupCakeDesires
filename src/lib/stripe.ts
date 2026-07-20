/**
 * Stripe SDK singleton + configuration helpers.
 *
 * Required env vars (set these in .env.local — see .env.example):
 *   STRIPE_SECRET_KEY                 — sk_test_... or sk_live_...
 *   STRIPE_WEBHOOK_SECRET             — whsec_... (from `stripe listen` or the Dashboard)
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_test_... or pk_live_... (browser-exposed)
 *
 * If env vars are missing, `stripe` is null and `isStripeConfigured()` returns false.
 * Routes/components should guard on this so the app doesn't crash before
 * keys are supplied — we want to "just add env and start working smoothly".
 */

import Stripe from 'stripe'

const SECRET = process.env.STRIPE_SECRET_KEY
const PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

export const stripe: Stripe | null = SECRET
  ? new Stripe(SECRET, {
      // Let the SDK use its bundled default API version. Pinning to a specific
      // string requires casting because Stripe SDK upgrades narrow the literal
      // type, and the bundled default is what the rest of the SDK is typed for.
      typescript: true,
      appInfo: {
        name: 'The Cupcake Desire',
        version: '1.0.0',
      },
    })
  : null

export function isStripeConfigured(): boolean {
  return Boolean(SECRET && PUBLISHABLE)
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(WEBHOOK_SECRET)
}

export function getStripePublishableKey(): string | null {
  return PUBLISHABLE ?? null
}

export function getStripeWebhookSecret(): string | null {
  return WEBHOOK_SECRET ?? null
}

/**
 * Test mode is derived from the key prefix — we don't store this in the DB
 * because the source of truth is whichever key the operator has provided.
 */
export function isStripeTestMode(): boolean {
  return SECRET?.startsWith('sk_test_') ?? true
}

/** Throws if Stripe isn't configured — for use inside API routes. */
export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      'Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local.'
    )
  }
  return stripe
}

/**
 * Convert a dollar amount (e.g. 65) into the smallest currency unit Stripe expects.
 * AUD has 2 decimal places, so multiply by 100 → 6500 cents.
 */
export function toStripeAmount(amountInDollars: number): number {
  return Math.round(amountInDollars * 100)
}

/** Inverse of toStripeAmount — 6500 → 65.00 */
export function fromStripeAmount(amountInCents: number): number {
  return amountInCents / 100
}
