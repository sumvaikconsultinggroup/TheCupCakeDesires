import crypto from 'crypto'

/**
 * HMAC-SHA256 signed order-access tokens.
 *
 * These back the "manage your booking" link we email to every customer. A guest
 * has no account and nothing to sign in with, so the token itself is the
 * credential: it names one order, it is signed with a server-side secret, and it
 * cannot be forged or edited to point at somebody else's order. Knowing an order
 * number is NOT enough to open one — the signature has to match too.
 *
 * Token format: base64url("<orderId>|<issuedAtSec>") + "." + base64url(hmac)
 *
 * Deliberately no expiry: the link lives in an email the customer keeps, and an
 * order that has already been delivered or cancelled is read-only anyway (the
 * cancellation rules are enforced server-side, not by the token).
 */

function getSecret(): string {
  // Falls back to the unsubscribe secret so a deployment that already has one
  // working signing key keeps working; both are HMAC secrets of the same shape.
  const secret = process.env.ORDER_ACCESS_SECRET || process.env.EMAIL_UNSUBSCRIBE_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[order-access] ORDER_ACCESS_SECRET is required. Generate with: openssl rand -hex 32')
    }
    return 'dev-only-do-not-use-in-prod'
  }
  return secret
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return Buffer.from(padded + pad, 'base64')
}

function sign(payload: string, secret: string): string {
  return b64url(crypto.createHmac('sha256', secret).update(payload).digest())
}

export function generateOrderAccessToken(orderId: string): string {
  const secret = getSecret()
  const normalised = String(orderId || '').trim()
  const issuedAtSec = Math.floor(Date.now() / 1000)
  const payload = `${normalised}|${issuedAtSec}`
  return `${b64url(payload)}.${sign(payload, secret)}`
}

export interface VerifiedOrderAccessToken {
  orderId: string
  issuedAtSec: number
}

export function verifyOrderAccessToken(token: string): VerifiedOrderAccessToken | null {
  if (!token || typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payloadEnc = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  let payload: string
  try {
    payload = b64urlDecode(payloadEnc).toString('utf8')
  } catch {
    return null
  }

  const expectedSig = sign(payload, getSecret())
  const a = Buffer.from(sig)
  const b = Buffer.from(expectedSig)
  // Length check first: timingSafeEqual throws on a length mismatch.
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  const sep = payload.indexOf('|')
  if (sep < 0) return null
  const orderId = payload.slice(0, sep)
  const issuedAtSec = Number(payload.slice(sep + 1))
  if (!orderId || !Number.isFinite(issuedAtSec)) return null
  return { orderId, issuedAtSec }
}

/** Absolute URL a customer can open to view and manage one specific order. */
export function buildOrderAccessUrl(orderId: string): string {
  // Same source the rest of the transactional emails use, so every link in a
  // given email points at the same host.
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://thecupcakedesire.com.au'
  return `${base.replace(/\/$/, '')}/my-order/${encodeURIComponent(generateOrderAccessToken(orderId))}`
}
