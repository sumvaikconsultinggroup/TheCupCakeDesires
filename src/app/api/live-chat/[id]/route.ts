import crypto from 'crypto'
import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'

import {
  MAX_MESSAGE_LENGTH,
  alertTeam,
  appendMessage,
  hashSecret,
  toPublicConversation,
} from '@/lib/live-chat/service'
import connectDb from '@/lib/mongodb'
import LiveChatConversation, { type ILiveChatMessage } from '@/models/LiveChatConversation'

export const dynamic = 'force-dynamic'

const MAX_MESSAGES_PER_MINUTE = 10

type Params = { params: Promise<{ id: string }> }

async function loadForVisitor(req: NextRequest, id: string) {
  const token = req.headers.get('x-chat-token') || ''
  if (!token || !mongoose.isValidObjectId(id)) return null
  await connectDb()
  const conv = await LiveChatConversation.findById(id).select('+visitorTokenHash')
  if (!conv) return null
  const expected = Buffer.from(conv.visitorTokenHash, 'hex')
  const received = Buffer.from(hashSecret(token), 'hex')
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null
  return conv
}

const notFound = () =>
  NextResponse.json({ success: false, error: 'Chat not found.' }, { status: 404 })

/** Widget polling: returns messages newer than `after` and marks the customer as present. */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const conv = await loadForVisitor(req, id)
    if (!conv) return notFound()

    const afterParam = req.nextUrl.searchParams.get('after')
    const after = afterParam ? new Date(afterParam) : undefined
    await LiveChatConversation.updateOne({ _id: conv._id }, { $set: { lastCustomerSeenAt: new Date() } })

    return NextResponse.json({
      success: true,
      conversation: toPublicConversation(conv, after && !isNaN(after.getTime()) ? after : undefined),
    })
  } catch (err) {
    console.error('[live-chat] poll failed:', err)
    return NextResponse.json({ success: false, error: 'Could not load the chat.' }, { status: 500 })
  }
}

/** Customer sends a follow-up message. */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const conv = await loadForVisitor(req, id)
    if (!conv) return notFound()

    const body = await req.json().catch(() => ({}))
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
    if (!text) {
      return NextResponse.json({ success: false, error: 'Please type a message.' }, { status: 400 })
    }

    const minuteAgo = Date.now() - 60 * 1000
    const recentCount = (conv.messages as ILiveChatMessage[]).filter(
      (m) => m.from === 'customer' && new Date(m.createdAt).getTime() > minuteAgo
    ).length
    if (recentCount >= MAX_MESSAGES_PER_MINUTE) {
      return NextResponse.json(
        { success: false, error: 'You are sending messages too quickly. Please wait a moment.' },
        { status: 429 }
      )
    }

    const now = new Date()
    const updated = await appendMessage(
      String(conv._id),
      { from: 'customer', text, via: 'web' },
      {
        set: { status: 'open', lastCustomerMessageAt: now, lastCustomerSeenAt: now },
        inc: { unreadForTeam: 1 },
      }
    )
    if (!updated) return notFound()

    await alertTeam(updated, text, conv.status === 'closed')

    const sent = updated.messages[updated.messages.length - 1]
    return NextResponse.json({
      success: true,
      message: {
        id: String(sent._id),
        from: sent.from,
        text: sent.text,
        createdAt: new Date(sent.createdAt).toISOString(),
      },
    })
  } catch (err) {
    console.error('[live-chat] send failed:', err)
    return NextResponse.json({ success: false, error: 'Message not sent. Please try again.' }, { status: 500 })
  }
}
