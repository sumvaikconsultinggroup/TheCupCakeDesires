import crypto from 'crypto'

/**
 * Minimal WhatsApp Cloud API client used by website live chat.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

export interface WhatsAppConfig {
  accessToken: string
  phoneNumberId: string
  apiVersion: string
  teamNumbers: string[]
  templateName?: string
  templateLanguage: string
}

export interface WhatsAppSendResult {
  ok: boolean
  messageId?: string
  error?: string
  errorCode?: number
}

export function digitsOnly(value: string | undefined | null): string {
  return String(value || '').replace(/\D/g, '')
}

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  const teamNumbers = (process.env.WHATSAPP_TEAM_NUMBERS || '')
    .split(',')
    .map(digitsOnly)
    .filter(Boolean)

  if (!accessToken || !phoneNumberId || teamNumbers.length === 0) return null

  return {
    accessToken,
    phoneNumberId,
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0',
    teamNumbers,
    templateName: process.env.WHATSAPP_ALERT_TEMPLATE?.trim() || undefined,
    templateLanguage: process.env.WHATSAPP_ALERT_TEMPLATE_LANG?.trim() || 'en',
  }
}

export function isTeamNumber(waId: string, config: WhatsAppConfig): boolean {
  const id = digitsOnly(waId)
  return config.teamNumbers.includes(id)
}

async function postMessage(config: WhatsAppConfig, payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...payload }),
        cache: 'no-store',
      }
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message || `WhatsApp API ${res.status}`,
        errorCode: data?.error?.code,
      }
    }
    return { ok: true, messageId: data?.messages?.[0]?.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function sendWhatsAppText(
  config: WhatsAppConfig,
  to: string,
  body: string,
  replyToMessageId?: string
): Promise<WhatsAppSendResult> {
  return postMessage(config, {
    to: digitsOnly(to),
    type: 'text',
    text: { body: body.slice(0, 4096), preview_url: false },
    ...(replyToMessageId ? { context: { message_id: replyToMessageId } } : {}),
  })
}

export function sendWhatsAppReaction(
  config: WhatsAppConfig,
  to: string,
  messageId: string,
  emoji: string
): Promise<WhatsAppSendResult> {
  return postMessage(config, {
    to: digitsOnly(to),
    type: 'reaction',
    reaction: { message_id: messageId, emoji },
  })
}

/** Template params cannot contain newlines/tabs or 4+ consecutive spaces. */
function templateParam(value: string, max = 900): string {
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {4,}/g, '   ')
    .trim()
    .slice(0, max) || '-'
}

export function sendWhatsAppTemplate(
  config: WhatsAppConfig,
  to: string,
  params: string[]
): Promise<WhatsAppSendResult> {
  if (!config.templateName) {
    return Promise.resolve({ ok: false, error: 'WHATSAPP_ALERT_TEMPLATE not configured' })
  }
  return postMessage(config, {
    to: digitsOnly(to),
    type: 'template',
    template: {
      name: config.templateName,
      language: { code: config.templateLanguage },
      components: [
        {
          type: 'body',
          parameters: params.map((text) => ({ type: 'text', text: templateParam(text) })),
        },
      ],
    },
  })
}

/** Verifies Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET?.trim()
  if (!secret || !signatureHeader?.startsWith('sha256=')) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const received = signatureHeader.slice('sha256='.length)
  if (received.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'))
}
