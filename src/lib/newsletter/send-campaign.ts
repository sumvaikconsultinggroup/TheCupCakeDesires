import * as React from 'react'

import { MarketingBroadcastEmail } from '@/emails/templates/MarketingBroadcastEmail'
import { buildUnsubscribeUrl } from '@/lib/email/unsubscribe-token'
import { sendEmail, type SendEmailInput } from '@/lib/email/send'
import { isSuppressed } from '@/lib/email/suppression'
import connectDb from '@/lib/mongodb'
import NewsletterCampaign from '@/models/NewsletterCampaign'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'

export interface CampaignAttachment {
  filename: string
  content: Buffer
}

export interface SendCampaignInput {
  subject: string
  previewText?: string
  bodyHtml: string
  attachments?: CampaignAttachment[]
  sentByEmail: string
}

export interface SendCampaignResult {
  success: boolean
  recipientCount: number
  successCount: number
  failedCount: number
  skippedCount: number
  error?: string
}

const BATCH_SIZE = 5

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)
  }
  return results
}

export async function sendNewsletterCampaign(input: SendCampaignInput): Promise<SendCampaignResult> {
  const subject = input.subject.trim()
  const bodyHtml = input.bodyHtml.trim()

  if (!subject || !bodyHtml) {
    return {
      success: false,
      recipientCount: 0,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      error: 'Subject and message body are required.',
    }
  }

  await connectDb()

  const subscribers = await NewsletterSubscriber.find({ status: 'active' })
    .select('email')
    .lean()

  const emails = subscribers.map((s) => s.email).filter(Boolean)
  const preview = input.previewText?.trim() || subject

  const attachmentPayload: SendEmailInput['attachments'] = input.attachments?.map((file) => ({
    filename: file.filename,
    content: file.content,
  }))

  let successCount = 0
  let failedCount = 0
  let skippedCount = 0

  await mapWithConcurrency(emails, BATCH_SIZE, async (email) => {
    if (await isSuppressed(email)) {
      skippedCount += 1
      return
    }

    const unsubscribeUrl = buildUnsubscribeUrl(email)
    const headers = {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }

    const result = await sendEmail({
      to: email,
      subject,
      react: React.createElement(MarketingBroadcastEmail, {
        recipientEmail: email,
        preview,
        bodyHtml,
      }),
      templateId: 'newsletter-campaign',
      refType: 'newsletter-campaign',
      tags: [{ name: 'category', value: 'newsletter_campaign' }],
      attachments: attachmentPayload,
      headers,
    })

    if (result.skipped) {
      skippedCount += 1
    } else if (result.success) {
      successCount += 1
    } else {
      failedCount += 1
    }
  })

  await NewsletterCampaign.create({
    subject,
    previewText: preview,
    bodyHtml,
    attachmentNames: input.attachments?.map((a) => a.filename) || [],
    recipientCount: emails.length,
    successCount,
    failedCount,
    skippedCount,
    sentByEmail: input.sentByEmail,
    sentAt: new Date(),
  })

  return {
    success: failedCount === 0,
    recipientCount: emails.length,
    successCount,
    failedCount,
    skippedCount,
  }
}
