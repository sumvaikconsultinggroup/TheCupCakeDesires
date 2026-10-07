import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'

import { requireLiveChatAdmin } from '@/lib/live-chat/admin-auth'
import { MAX_MESSAGE_LENGTH, addTeamReply, closeConversation } from '@/lib/live-chat/service'
import connectDb from '@/lib/mongodb'
import LiveChatConversation from '@/models/LiveChatConversation'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

function serialize(c: any) {
  return {
    id: String(c._id),
    code: c.code,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    pageUrl: c.pageUrl,
    status: c.status,
    whatsappDeliveryFailed: Boolean(c.whatsappDeliveryFailed),
    lastCustomerSeenAt: c.lastCustomerSeenAt,
    createdAt: c.createdAt,
    messages: (c.messages || []).map((m: any) => ({
      id: String(m._id),
      from: m.from,
      text: m.text,
      via: m.via,
      authorName: m.authorName,
      createdAt: m.createdAt,
    })),
  }
}

const notFound = () => NextResponse.json({ success: false, message: 'Chat not found' }, { status: 404 })

/** Full conversation; opening it clears the unread badge. */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireLiveChatAdmin()
  if (auth.error) return auth.error
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return notFound()

  await connectDb()
  const conv = await LiveChatConversation.findByIdAndUpdate(
    id,
    { $set: { unreadForTeam: 0 } },
    { new: true }
  ).lean()
  if (!conv) return notFound()
  return NextResponse.json({ success: true, conversation: serialize(conv) })
}

/** Reply from the admin panel (backup to replying on WhatsApp). */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireLiveChatAdmin()
  if (auth.error) return auth.error
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return notFound()

  const body = await req.json().catch(() => ({}))
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
  if (!text) {
    return NextResponse.json({ success: false, message: 'Reply cannot be empty' }, { status: 400 })
  }

  await connectDb()
  const updated = await addTeamReply(id, text, 'admin_panel', { authorName: auth.user.name })
  if (!updated) return notFound()
  return NextResponse.json({ success: true, conversation: serialize(updated.toObject()) })
}

/** Close or reopen a chat. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireLiveChatAdmin()
  if (auth.error) return auth.error
  const { id } = await params
  if (!mongoose.isValidObjectId(id)) return notFound()

  const body = await req.json().catch(() => ({}))
  await connectDb()

  const updated =
    body?.action === 'close'
      ? await closeConversation(id, auth.user.name)
      : body?.action === 'reopen'
        ? await LiveChatConversation.findByIdAndUpdate(id, { $set: { status: 'open' } }, { new: true })
        : undefined

  if (updated === undefined) {
    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 })
  }
  if (!updated) return notFound()
  return NextResponse.json({ success: true, conversation: serialize(updated.toObject()) })
}
