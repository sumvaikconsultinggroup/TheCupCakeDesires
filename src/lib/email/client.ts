import { Resend } from 'resend'

/**
 * Singleton Resend client.
 *
 * Lazily initialised because environment variables may not be available
 * at module load time in some Next.js build configurations. Throws in
 * production when `RESEND_API_KEY` is missing; warns in development so
 * local builds without email do not crash.
 */

let cachedClient: Resend | null = null

export function getResendClient(): Resend {
  if (cachedClient) return cachedClient

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[email] RESEND_API_KEY is not set. Configure it in Vercel project environment variables.')
    }
    // eslint-disable-next-line no-console
    console.warn('[email] RESEND_API_KEY missing. Emails will fail until it is set in .env.local.')
    cachedClient = new Resend('re_dev_placeholder_invalid')
    return cachedClient
  }

  cachedClient = new Resend(apiKey)
  return cachedClient
}

/**
 * Default sender — must match a verified domain in the Resend dashboard.
 * For CupCake Desires this is `cupcakedesires.com` (DKIM/SPF/DMARC verified).
 */
export function getDefaultFrom(): string {
  return process.env.RESEND_FROM_EMAIL || 'CupCake Desires <orders@cupcakedesires.com>'
}

export function getDefaultReplyTo(): string {
  return process.env.RESEND_REPLY_TO || 'hello@cupcakedesires.com'
}
