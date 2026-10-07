import { NextRequest, NextResponse } from 'next/server'

import {
  MAX_MESSAGE_LENGTH,
  alertTeam,
  clientIpHash,
  generateUniqueCode,
  hashSecret,
  newVisitorToken,
  toPublicConversation,
} from '@/lib/live-chat/service'
import connectDb from '@/lib/mongodb'
import LiveChatConversation from '@/models/LiveChatConversation'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NEW_CHATS_PER_HOUR = 5

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/** Starts a website live chat and alerts the team on WhatsApp. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = str(body?.name, 120)
    const email = str(body?.email, 200).toLowerCase()
    const phone = str(body?.phone, 40)
    const company = str(body?.company, 160)
    const message = str(body?.message, MAX_MESSAGE_LENGTH)
    const pageUrl = str(body?.pageUrl, 500)

    if (!name) {
      return NextResponse.json({ success: false, error: 'Please tell us your name.' }, { status: 400 })
    }
    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'Add an email or phone so we can reach you if you leave the page.' },
        { status: 400 }
      )
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ success: false, error: 'Please type a message.' }, { status: 400 })
    }

    await connectDb()

    const ipHash = clientIpHash(req.headers)
    if (ipHash) {
      const recent = await LiveChatConversation.countDocuments({
        ipHash,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      })
      if (recent >= MAX_NEW_CHATS_PER_HOUR) {
        return NextResponse.json(
          { success: false, error: 'Too many new chats from this connection. Please try again later.' },
          { status: 429 }
        )
      }
    }

    const token = newVisitorToken()
    const now = new Date()
    const conv = await LiveChatConversation.create({
      code: await generateUniqueCode(),
      visitorTokenHash: hashSecret(token),
      name,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      pageUrl: pageUrl || undefined,
      ipHash,
      messages: [{ from: 'customer', text: message, via: 'web', createdAt: now }],
      unreadForTeam: 1,
      lastCustomerMessageAt: now,
      lastCustomerSeenAt: now,
    })

    await alertTeam(conv, message, true)

    return NextResponse.json({
      success: true,
      token,
      conversation: toPublicConversation(conv),
    })
  } catch (err) {
    console.error('[live-chat] start failed:', err)
    return NextResponse.json({ success: false, error: 'Could not start the chat. Please try again.' }, { status: 500 })
  }
}
