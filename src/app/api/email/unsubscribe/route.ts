import { NextRequest, NextResponse } from 'next/server'

import { addSuppression } from '@/lib/email/suppression'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'
import { markNewsletterUnsubscribed } from '@/lib/newsletter/subscribe'

export const runtime = 'nodejs'

function htmlPage(opts: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.title}</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; padding:0; background:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color:#0F172A; }
  .wrap { max-width: 520px; margin: 64px auto; padding: 32px 24px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; }
  .brand { background:#1B198F; color:#fff; padding:16px 24px; border-radius:8px 8px 0 0; margin:-32px -24px 24px; }
  h1 { margin: 0 0 12px; font-size: 24px; line-height: 32px; }
  p { margin: 0 0 12px; font-size: 16px; line-height: 26px; color:#475569; }
  a { color:#1B198F; }
  .muted { color:#94A3B8; font-size: 13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><strong>CupCake Desires</strong></div>
    <h1>${opts.title}</h1>
    ${opts.body}
    <p class="muted">If this was a mistake, contact <a href="mailto:hello@cupcakedesires.com">hello@cupcakedesires.com</a> and we'll re-subscribe you.</p>
  </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const source = url.searchParams.get('source') || 'email-footer'

  if (!token) {
    return new NextResponse(
      htmlPage({
        title: 'Invalid unsubscribe link',
        body: '<p>This unsubscribe link is missing its token. Please use the link from your email.</p>',
      }),
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }

  const verified = verifyUnsubscribeToken(token)
  if (!verified) {
    return new NextResponse(
      htmlPage({
        title: 'Link expired or invalid',
        body: '<p>We could not verify this unsubscribe link. The link may have been altered.</p>',
      }),
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }

  try {
    await addSuppression(verified.email, 'unsubscribe', source)
    await markNewsletterUnsubscribed(verified.email)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[email] unsubscribe write failed:', err)
    return new NextResponse(
      htmlPage({
        title: 'Something went wrong',
        body: '<p>We could not record your preference right now. Please try again in a moment.</p>',
      }),
      { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }

  const escaped = verified.email.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return new NextResponse(
    htmlPage({
      title: "You've been unsubscribed",
      body: `<p>We've removed <strong>${escaped}</strong> from non-essential emails.</p>
                   <p>Order receipts and shipping updates for any active orders will still be delivered, since they're transactional.</p>`,
    }),
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

/**
 * RFC 8058 one-click unsubscribe — Gmail/Outlook POST when the
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header is set.
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
