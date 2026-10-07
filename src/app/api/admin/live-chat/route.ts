import { NextRequest, NextResponse } from 'next/server'

import { requireLiveChatAdmin } from '@/lib/live-chat/admin-auth'
import { getWhatsAppConfig } from '@/lib/live-chat/whatsapp'
import connectDb from '@/lib/mongodb'
import LiveChatConversation from '@/models/LiveChatConversation'

export const dynamic = 'force-dynamic'

/** Inbox list for the admin live-chat page. */
export async function GET(req: NextRequest) {
  const auth = await requireLiveChatAdmin()
  if (auth.error) return auth.error

  try {
    await connectDb()
    const status = req.nextUrl.searchParams.get('status') || 'open'
    const filter = status === 'all' ? {} : { status: status === 'closed' ? 'closed' : 'open' }

    const [docs, openCount, unreadCount] = await Promise.all([
      LiveChatConversation.find(filter)
        .sort({ updatedAt: -1 })
        .limit(100)
        .select({ messages: { $slice: -1 }, code: 1, name: 1, email: 1, phone: 1, company: 1, status: 1, unreadForTeam: 1, whatsappDeliveryFailed: 1, updatedAt: 1, createdAt: 1 })
        .lean(),
      LiveChatConversation.countDocuments({ status: 'open' }),
      LiveChatConversation.countDocuments({ unreadForTeam: { $gt: 0 } }),
    ])

    return NextResponse.json({
      success: true,
      whatsappConfigured: Boolean(getWhatsAppConfig()),
      counts: { open: openCount, unread: unreadCount },
      conversations: docs.map((c: any) => ({
        id: String(c._id),
        code: c.code,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        status: c.status,
        unread: c.unreadForTeam || 0,
        whatsappDeliveryFailed: Boolean(c.whatsappDeliveryFailed),
        lastMessage: c.messages?.[0]
          ? { from: c.messages[0].from, text: c.messages[0].text, createdAt: c.messages[0].createdAt }
          : null,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt,
      })),
    })
  } catch (err) {
    console.error('[admin live-chat] list failed:', err)
    return NextResponse.json({ success: false, message: 'Could not load chats' }, { status: 500 })
  }
}
