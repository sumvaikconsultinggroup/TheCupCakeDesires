import { render } from '@react-email/render'
import * as React from 'react'

import { getDefaultFrom, getDefaultReplyTo, getResendClient } from './client'
import { logEmailAttempt } from './log'
import { isSuppressed } from './suppression'

export interface SendEmailInput {
  /** Single recipient or list (Resend supports up to 50 per call). */
  to: string | string[]
  subject: string
  /** React Email component (preferred). */
  react: React.ReactElement
  /** Optional override for sender; defaults to RESEND_FROM_EMAIL. */
  from?: string
  /** Optional override for reply-to. */
  replyTo?: string
  /**
   * Resend "tags" — used for filtering / segment analytics in the
   * Resend dashboard. Values must match `^[a-zA-Z0-9_-]+$`.
   */
  tags?: Array<{ name: string; value: string }>
  /**
   * Idempotency key — if Resend has seen this key in the last 24 h
   * the original message is returned. Use for e.g. "cart-recovery-<cartId>-<attempt>".
   */
  idempotencyKey?: string
  /** RFC 3339 ISO timestamp; "in 1 min" relative phrasing also accepted by Resend. */
  scheduledAt?: string
  /** Tracking metadata for EmailLog.refId / refType (e.g. orderId). */
  refId?: string
  refType?: string
  /** Stable template identifier for analytics + suppression. */
  templateId: string
  /** Custom MIME headers (e.g. List-Unsubscribe). */
  headers?: Record<string, string>
  /** Skip suppression check (only for transactional flows like password reset). */
  skipSuppressionCheck?: boolean
}

export interface SendEmailResult {
  success: boolean
  providerMessageId?: string
  error?: string
  skipped?: boolean
  skippedReason?: 'suppressed' | 'no_recipient'
}

function normaliseRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to]
  return list.filter((e): e is string => typeof e === 'string' && e.length > 0).map((e) => e.trim().toLowerCase())
}

/**
 * Unified send entrypoint for ALL outgoing email at CupCake Desires.
 *
 * Flow:
 *   1. Normalise recipient(s) and validate.
 *   2. Suppression check (unless flagged transactional).
 *   3. Render React → html + plaintext via @react-email/render.
 *   4. Hand off to Resend with tags / idempotency / scheduledAt.
 *   5. Log outcome to EmailLog (never throws).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = normaliseRecipients(input.to)

  if (recipients.length === 0) {
    return { success: false, skipped: true, skippedReason: 'no_recipient' }
  }

  if (!input.skipSuppressionCheck) {
    const filtered: string[] = []
    for (const r of recipients) {
      if (await isSuppressed(r)) {
        await logEmailAttempt({
          recipient: r,
          templateId: input.templateId,
          refId: input.refId,
          refType: input.refType,
          status: 'skipped_suppressed',
          subject: input.subject,
        })
      } else {
        filtered.push(r)
      }
    }
    if (filtered.length === 0) {
      return {
        success: false,
        skipped: true,
        skippedReason: 'suppressed',
      }
    }
    recipients.length = 0
    recipients.push(...filtered)
  }

  let html: string
  let text: string
  try {
    html = await render(input.react, { pretty: false })
    text = await render(input.react, { plainText: true })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    for (const r of recipients) {
      await logEmailAttempt({
        recipient: r,
        templateId: input.templateId,
        refId: input.refId,
        refType: input.refType,
        status: 'failed',
        error: `render: ${error}`,
        subject: input.subject,
      })
    }
    return { success: false, error: `render: ${error}` }
  }

  const resend = getResendClient()
  const from = input.from || getDefaultFrom()
  const replyTo = input.replyTo || getDefaultReplyTo()

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: recipients,
        subject: input.subject,
        html,
        text,
        replyTo,
        tags: input.tags,
        scheduledAt: input.scheduledAt,
        headers: input.headers,
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
    )

    if (error) {
      const message = (error as { message?: string }).message || JSON.stringify(error)
      for (const r of recipients) {
        await logEmailAttempt({
          recipient: r,
          templateId: input.templateId,
          refId: input.refId,
          refType: input.refType,
          status: 'failed',
          error: message,
          subject: input.subject,
        })
      }
      return { success: false, error: message }
    }

    const providerMessageId = data?.id
    for (const r of recipients) {
      await logEmailAttempt({
        recipient: r,
        templateId: input.templateId,
        refId: input.refId,
        refType: input.refType,
        providerMessageId,
        status: 'sent',
        subject: input.subject,
      })
    }
    return { success: true, providerMessageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    for (const r of recipients) {
      await logEmailAttempt({
        recipient: r,
        templateId: input.templateId,
        refId: input.refId,
        refType: input.refType,
        status: 'failed',
        error: message,
        subject: input.subject,
      })
    }
    return { success: false, error: message }
  }
}
