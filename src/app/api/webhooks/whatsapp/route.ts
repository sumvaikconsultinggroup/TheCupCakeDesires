import { NextRequest, NextResponse } from 'next/server'

import { processWhatsAppWebhook } from '@/lib/live-chat/service'
import { verifyWhatsAppSignature } from '@/lib/live-chat/whatsapp'
import connectDb from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/** Meta's one-time webhook verification handshake. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim()
  if (
    verifyToken &&
    params.get('hub.mode') === 'subscribe' &&
    params.get('hub.verify_token') === verifyToken
  ) {
    return new NextResponse(params.get('hub.challenge') || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

/** Team replies and delivery statuses from the WhatsApp Cloud API. */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!verifyWhatsAppSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    await connectDb()
    await processWhatsAppWebhook(payload)
  } catch (err) {
    // Always 200 after a valid signature so Meta doesn't retry-storm a bad payload.
    console.error('[whatsapp webhook] processing failed:', err)
  }
  return NextResponse.json({ received: true })
}
