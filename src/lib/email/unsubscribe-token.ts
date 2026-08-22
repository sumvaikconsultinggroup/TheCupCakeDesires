import crypto from 'crypto'

/**
 * HMAC-SHA256 signed unsubscribe tokens.
 *
 * Token format: base64url("<email>|<issuedAtSec>") + "." + base64url(hmac)
 * Tokens never expire by design (industry norm for unsub links).
 */

function getSecret(): string {
  const secret =
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.ORDER_ACCESS_SECRET ||
    process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[email] EMAIL_UNSUBSCRIBE_SECRET (or ORDER_ACCESS_SECRET) is required. Generate with: openssl rand -hex 32'
      )
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

export function generateUnsubscribeToken(email: string): string {
  const secret = getSecret()
  const normalised = email.trim().toLowerCase()
  const issuedAtSec = Math.floor(Date.now() / 1000)
  const payload = `${normalised}|${issuedAtSec}`
  const payloadEnc = b64url(payload)
  const sig = sign(payload, secret)
  return `${payloadEnc}.${sig}`
}

export interface VerifiedUnsubscribeToken {
  email: string
  issuedAtSec: number
}

export function verifyUnsubscribeToken(token: string): VerifiedUnsubscribeToken | null {
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
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  const sep = payload.indexOf('|')
  if (sep < 0) return null
  const email = payload.slice(0, sep)
  const issuedAtSec = Number(payload.slice(sep + 1))
  if (!email || !Number.isFinite(issuedAtSec)) return null
  return { email, issuedAtSec }
}

/**
 * Build the absolute URL a recipient can click to unsubscribe.
 */
export function buildUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.STORE_URL || 'https://gibbonnutrition.com'
  const token = generateUnsubscribeToken(email)
  return `${base.replace(/\/$/, '')}/api/email/unsubscribe?token=${encodeURIComponent(token)}`
}
