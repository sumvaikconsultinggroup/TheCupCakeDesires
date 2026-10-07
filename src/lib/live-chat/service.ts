import crypto from 'crypto'
import * as React from 'react'

import { brand } from '@/emails/components/tokens'
import { LiveChatReplyEmail } from '@/emails/templates/LiveChatReplyEmail'
import { sendEmail } from '@/lib/email/send'
import LiveChatConversation, {
  type ILiveChatConversation,
  type LiveChatAuthor,
  type LiveChatChannel,
} from '@/models/LiveChatConversation'
import WhatsAppContact from '@/models/WhatsAppContact'

import {
  digitsOnly,
  getWhatsAppConfig,
  isTeamNumber,
  sendWhatsAppReaction,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  type WhatsAppConfig,
} from './whatsapp'

export const MAX_MESSAGE_LENGTH = 2000
const MAX_STORED_MESSAGES = 500
/** Meta's service window is 24 h; leave a margin so we never send a text that bounces. */
const SERVICE_WINDOW_MS = 23.5 * 60 * 60 * 1000
/** If the widget hasn't polled for this long, the customer has likely left the page. */
const CUSTOMER_AWAY_MS = 45 * 1000
const REPLY_EMAIL_COOLDOWN_MS = 10 * 60 * 1000
/** WhatsApp error: more than 24 h since the recipient last messaged the business number. */
const WA_ERROR_OUTSIDE_WINDOW = 131047

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_PREFIX_RE = /^#([A-Z0-9]{4})\b[\s:,-]*/i

export function hashSecret(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function newVisitorToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

function randomCode(): string {
  const bytes = crypto.randomBytes(4)
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = randomCode()
    if (!(await LiveChatConversation.exists({ code }))) return code
  }
  throw new Error('Could not allocate a chat code')
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || brand.siteUrl).replace(/\/$/, '')
}

function teamInbox(): string {
  return (
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.RESEND_REPLY_TO?.trim() ||
    brand.supportEmail
  )
}

export interface PublicLiveChatMessage {
  id: string
  from: LiveChatAuthor
  text: string
  createdAt: string
}

export interface PublicLiveChatConversation {
  id: string
  code: string
  name: string
  status: 'open' | 'closed'
  messages: PublicLiveChatMessage[]
}

export function toPublicConversation(
  conv: Pick<ILiveChatConversation, '_id' | 'code' | 'name' | 'status' | 'messages'>,
  after?: Date
): PublicLiveChatConversation {
  const messages = (conv.messages || [])
    .filter((m) => !after || new Date(m.createdAt).getTime() > after.getTime())
    .map((m) => ({
      id: String(m._id),
      from: m.from,
      text: m.text,
      createdAt: new Date(m.createdAt).toISOString(),
    }))
  return {
    id: String(conv._id),
    code: conv.code,
    name: conv.name,
    status: conv.status,
    messages,
  }
}

/** Appends a message atomically, keeping the stored history bounded. */
export async function appendMessage(
  conversationId: string,
  message: { from: LiveChatAuthor; text: string; via: LiveChatChannel; authorName?: string },
  extra: { set?: Record<string, unknown>; inc?: Record<string, number>; addWaIds?: string[] } = {}
) {
  const now = new Date()
  const update: Record<string, unknown> = {
    $push: {
      messages: {
        $each: [{ ...message, text: message.text.slice(0, 4000), createdAt: now }],
        $slice: -MAX_STORED_MESSAGES,
      },
    },
  }
  if (extra.set) update.$set = extra.set
  if (extra.inc) update.$inc = extra.inc
  if (extra.addWaIds?.length) update.$addToSet = { waMessageIds: { $each: extra.addWaIds } }

  return LiveChatConversation.findByIdAndUpdate(conversationId, update, { new: true })
}

/* ─────────────────────────── Team alerts (outbound) ─────────────────────────── */

function contactLine(conv: ILiveChatConversation): string {
  return [conv.email, conv.phone].filter(Boolean).join(' · ')
}

function firstAlertText(conv: ILiveChatConversation, text: string): string {
  const who = [conv.name, conv.company].filter(Boolean).join(' · ')
  const lines = [`New website chat #${conv.code}`, who]
  const contact = contactLine(conv)
  if (contact) lines.push(contact)
  if (conv.pageUrl) lines.push(`Page: ${conv.pageUrl}`)
  lines.push('', text, '', `Reply to this message to answer ${conv.name.split(/\s+/)[0]}.`)
  return lines.join('\n')
}

function followUpAlertText(conv: ILiveChatConversation, text: string): string {
  return `#${conv.code} ${conv.name.split(/\s+/)[0]}:\n${text}`
}

function templateParams(conv: ILiveChatConversation, text: string): string[] {
  const contact = contactLine(conv)
  return [`#${conv.code} ${conv.name}${contact ? ` (${contact})` : ''}`, text]
}

async function isWithinServiceWindow(waId: string): Promise<boolean> {
  const contact = await WhatsAppContact.findOne({ waId: digitsOnly(waId) }).lean<{ lastInboundAt?: Date }>()
  return Boolean(contact?.lastInboundAt && Date.now() - new Date(contact.lastInboundAt).getTime() < SERVICE_WINDOW_MS)
}

async function sendAlertTo(
  config: WhatsAppConfig,
  number: string,
  conv: ILiveChatConversation,
  text: string,
  isFirst: boolean
) {
  const body = isFirst ? firstAlertText(conv, text) : followUpAlertText(conv, text)
  if (await isWithinServiceWindow(number)) {
    return sendWhatsAppText(config, number, body)
  }
  if (config.templateName) {
    return sendWhatsAppTemplate(config, number, templateParams(conv, text))
  }
  // No template yet: try plain text. Meta may still reject it asynchronously,
  // which the status webhook turns into an email fallback.
  return sendWhatsAppText(config, number, body)
}

async function emailTeamFallback(conv: ILiveChatConversation, text: string, reason: string) {
  const adminUrl = `${siteUrl()}/admin/customers/live-chat?c=${conv._id}`
  const contact = contactLine(conv)
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  await sendEmail({
    to: teamInbox(),
    subject: `[Live chat] #${conv.code} ${conv.name} sent a message`,
    templateId: 'live-chat-team-fallback',
    skipSuppressionCheck: true,
    refId: String(conv._id),
    refType: 'live_chat',
    ...(conv.email ? { replyTo: conv.email } : {}),
    html: `<p><strong>${escape(conv.name)}</strong>${contact ? ` (${escape(contact)})` : ''} wrote on the website chat:</p>
<blockquote style="white-space:pre-wrap">${escape(text)}</blockquote>
<p><a href="${adminUrl}">Reply from the admin panel</a></p>
<p style="color:#8b7359;font-size:12px">Sent by email because WhatsApp delivery was unavailable (${escape(reason)}).</p>`,
    text: `${conv.name}${contact ? ` (${contact})` : ''} wrote on the website chat:\n\n${text}\n\nReply: ${adminUrl}`,
  }).catch((err) => console.error('[live-chat] team email fallback failed:', err))
}

/**
 * Notifies every team WhatsApp number about a customer message. Falls back to
 * email when WhatsApp isn't configured or every send fails, so no lead is lost.
 */
export async function alertTeam(conv: ILiveChatConversation, text: string, isFirst: boolean) {
  const config = getWhatsAppConfig()
  if (!config) {
    await emailTeamFallback(conv, text, 'WhatsApp not configured')
    return
  }

  const results = await Promise.all(
    config.teamNumbers.map((n) => sendAlertTo(config, n, conv, text, isFirst))
  )
  const ids = results.map((r) => r.messageId).filter((id): id is string => Boolean(id))
  const failed = results.filter((r) => !r.ok)
  failed.forEach((r) => console.error('[live-chat] WhatsApp alert failed:', r.errorCode, r.error))

  await LiveChatConversation.updateOne(
    { _id: conv._id },
    {
      $set: { whatsappDeliveryFailed: ids.length === 0 },
      ...(ids.length ? { $addToSet: { waMessageIds: { $each: ids } } } : {}),
    }
  )

  if (ids.length === 0) {
    await emailTeamFallback(conv, text, failed[0]?.error || 'send failed')
  }
}

/* ─────────────────────────── Team replies (inbound) ─────────────────────────── */

async function maybeEmailCustomer(conv: ILiveChatConversation, reply: string) {
  if (!conv.email) return
  const seen = conv.lastCustomerSeenAt ? new Date(conv.lastCustomerSeenAt).getTime() : 0
  if (Date.now() - seen < CUSTOMER_AWAY_MS) return
  const lastEmail = conv.lastReplyEmailAt ? new Date(conv.lastReplyEmailAt).getTime() : 0
  if (Date.now() - lastEmail < REPLY_EMAIL_COOLDOWN_MS) return

  await LiveChatConversation.updateOne({ _id: conv._id }, { $set: { lastReplyEmailAt: new Date() } })
  const res = await sendEmail({
    to: conv.email,
    subject: 'You have a reply from The Cupcake Desire',
    templateId: 'live-chat-reply',
    replyTo: teamInbox(),
    skipSuppressionCheck: true,
    refId: String(conv._id),
    refType: 'live_chat',
    react: React.createElement(LiveChatReplyEmail, {
      name: conv.name,
      recipientEmail: conv.email,
      reply,
      chatUrl: `${siteUrl()}/?livechat=1`,
    }),
  })
  if (!res.success) console.error('[live-chat] reply email failed:', res.error)
}

/** Records a team reply (from WhatsApp or the admin panel) and emails the customer if they've left. */
export async function addTeamReply(
  conversationId: string,
  text: string,
  via: LiveChatChannel,
  opts: { authorName?: string; waMessageId?: string } = {}
) {
  const updated = await appendMessage(
    conversationId,
    { from: 'team', text, via, authorName: opts.authorName },
    {
      set: { lastTeamMessageAt: new Date(), unreadForTeam: 0, status: 'open' },
      addWaIds: opts.waMessageId ? [opts.waMessageId] : undefined,
    }
  )
  if (updated) await maybeEmailCustomer(updated, text)
  return updated
}

export async function closeConversation(conversationId: string, closedBy: string) {
  return appendMessage(
    conversationId,
    {
      from: 'system',
      text: 'This chat has been closed by our team. Send a new message any time to reopen it.',
      via: 'admin_panel',
      authorName: closedBy,
    },
    { set: { status: 'closed', unreadForTeam: 0 } }
  )
}

const HELP_TEXT =
  'To answer a website customer, swipe-reply to their message, or start your message with their chat code, e.g. "#K7QF Hi Sarah…". Reply "/close" to a chat to close it.'

interface WaInboundMessage {
  id: string
  from: string
  type: string
  text?: { body?: string }
  button?: { text?: string }
  context?: { id?: string }
}

interface WaStatus {
  id: string
  status: string
  recipient_id: string
  errors?: Array<{ code?: number; title?: string }>
}

async function handleTeamMessage(config: WhatsAppConfig, msg: WaInboundMessage) {
  const waId = digitsOnly(msg.from)
  await WhatsAppContact.updateOne(
    { waId },
    { $set: { lastInboundAt: new Date() } },
    { upsert: true }
  )

  if (await LiveChatConversation.exists({ waMessageIds: msg.id })) return

  let text = (msg.type === 'text' ? msg.text?.body : msg.type === 'button' ? msg.button?.text : '') || ''
  text = text.trim()
  if (!text) {
    await sendWhatsAppText(config, waId, 'Only text replies can be sent to website customers.', msg.id)
    return
  }

  let conv: ILiveChatConversation | null = null
  if (msg.context?.id) {
    conv = await LiveChatConversation.findOne({ waMessageIds: msg.context.id })
  }
  const prefix = text.match(CODE_PREFIX_RE)
  if (!conv && prefix) {
    conv = await LiveChatConversation.findOne({ code: prefix[1].toUpperCase() })
    if (conv) text = text.slice(prefix[0].length).trim()
  }

  if (!conv) {
    await sendWhatsAppText(config, waId, HELP_TEXT, msg.id)
    return
  }

  if (/^\/?close( chat)?$/i.test(text)) {
    await closeConversation(String(conv._id), `WhatsApp +${waId}`)
    await LiveChatConversation.updateOne({ _id: conv._id }, { $addToSet: { waMessageIds: msg.id } })
    await sendWhatsAppText(config, waId, `Chat #${conv.code} with ${conv.name} is now closed.`, msg.id)
    return
  }
  if (!text) {
    await sendWhatsAppText(config, waId, HELP_TEXT, msg.id)
    return
  }

  await addTeamReply(String(conv._id), text.slice(0, MAX_MESSAGE_LENGTH), 'whatsapp', {
    authorName: `+${waId}`,
    waMessageId: msg.id,
  })
  await sendWhatsAppReaction(config, waId, msg.id, '✅')
}

/** An alert bounced because the team member's 24 h window had closed — resend as a template. */
async function handleFailedStatus(config: WhatsAppConfig, status: WaStatus) {
  const code = status.errors?.[0]?.code
  console.error('[live-chat] WhatsApp delivery failed:', code, status.errors?.[0]?.title)

  const conv = await LiveChatConversation.findOne({ waMessageIds: status.id })
  if (!conv) return
  const lastCustomer = [...conv.messages].reverse().find((m) => m.from === 'customer')
  const text = lastCustomer?.text || '(new message)'

  if (code === WA_ERROR_OUTSIDE_WINDOW && config.templateName) {
    const res = await sendWhatsAppTemplate(config, status.recipient_id, templateParams(conv, text))
    if (res.ok && res.messageId) {
      await LiveChatConversation.updateOne(
        { _id: conv._id },
        { $addToSet: { waMessageIds: res.messageId }, $set: { whatsappDeliveryFailed: false } }
      )
      return
    }
  }

  await LiveChatConversation.updateOne({ _id: conv._id }, { $set: { whatsappDeliveryFailed: true } })
  await emailTeamFallback(conv, text, status.errors?.[0]?.title || `WhatsApp error ${code}`)
}

export async function processWhatsAppWebhook(payload: any) {
  const config = getWhatsAppConfig()
  if (!config) return

  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      const value = change?.value || {}
      for (const status of (value.statuses || []) as WaStatus[]) {
        if (status.status === 'failed') {
          await handleFailedStatus(config, status).catch((e) =>
            console.error('[live-chat] failed-status handling error:', e)
          )
        }
      }
      for (const msg of (value.messages || []) as WaInboundMessage[]) {
        if (!isTeamNumber(msg.from, config)) continue
        await handleTeamMessage(config, msg).catch((e) =>
          console.error('[live-chat] inbound handling error:', e)
        )
      }
    }
  }
}

export function clientIpHash(headers: Headers): string | undefined {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim()
  return ip ? hashSecret(`live-chat:${ip}`) : undefined
}
