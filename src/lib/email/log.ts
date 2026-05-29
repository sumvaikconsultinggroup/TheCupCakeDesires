import connectDb from '@/lib/mongodb'
import EmailLog, { EmailStatus } from '@/models/EmailLog'

export interface LogEmailAttemptInput {
  recipient: string
  templateId: string
  refId?: string
  refType?: string
  providerMessageId?: string
  status: EmailStatus
  error?: string
  subject?: string
  tags?: Record<string, string>
}

export async function logEmailAttempt(input: LogEmailAttemptInput): Promise<void> {
  try {
    await connectDb()
    await EmailLog.create({
      recipient: input.recipient.trim().toLowerCase(),
      templateId: input.templateId,
      refId: input.refId,
      refType: input.refType,
      providerMessageId: input.providerMessageId,
      status: input.status,
      error: input.error,
      subject: input.subject,
      tags: input.tags,
      sentAt: new Date(),
    })
  } catch (err) {
    // Logging must never break send flow.
    // eslint-disable-next-line no-console
    console.error('[email] failed to write EmailLog:', err)
  }
}
