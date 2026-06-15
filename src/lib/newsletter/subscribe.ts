import * as React from 'react'

import { NewsletterWelcomeEmail } from '@/emails/templates/NewsletterWelcomeEmail'
import { sendEmail } from '@/lib/email/send'
import { removeSuppression } from '@/lib/email/suppression'
import connectDb from '@/lib/mongodb'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

export interface SubscribeResult {
  success: boolean
  alreadySubscribed?: boolean
  welcomeEmailSent?: boolean
  error?: string
}

export async function subscribeToNewsletter(
  email: string,
  source = 'homepage'
): Promise<SubscribeResult> {
  const normalised = normaliseEmail(email)

  if (!isValidEmail(normalised)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  await connectDb()

  const existing = await NewsletterSubscriber.findOne({ email: normalised })
  const isResubscribe = existing?.status === 'unsubscribed'

  if (existing?.status === 'active' && existing.welcomeEmailSentAt) {
    return { success: true, alreadySubscribed: true, welcomeEmailSent: false }
  }

  await removeSuppression(normalised)

  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email: normalised },
    {
      $set: {
        email: normalised,
        status: 'active',
        source,
        subscribedAt: existing?.subscribedAt || new Date(),
        unsubscribedAt: null,
      },
    },
    { upsert: true, new: true }
  )

  const shouldSendWelcome = !subscriber.welcomeEmailSentAt || isResubscribe

  if (!shouldSendWelcome) {
    return { success: true, alreadySubscribed: true, welcomeEmailSent: false }
  }

  const sendResult = await sendEmail({
    to: normalised,
    subject: 'Welcome to The Wednesday letter — CupCake Desires',
    react: React.createElement(NewsletterWelcomeEmail, { recipientEmail: normalised }),
    templateId: 'newsletter-welcome',
    refType: 'newsletter',
    tags: [{ name: 'category', value: 'newsletter' }],
    idempotencyKey: `newsletter-welcome-${normalised}`,
  })

  if (sendResult.success) {
    await NewsletterSubscriber.updateOne(
      { email: normalised },
      { $set: { welcomeEmailSentAt: new Date() } }
    )
    return { success: true, welcomeEmailSent: true }
  }

  if (sendResult.skipped) {
    return {
      success: false,
      error: 'This email is on our unsubscribe list. Contact hello@cupcakedesires.com to re-subscribe.',
    }
  }

  return {
    success: false,
    error: sendResult.error || 'Could not send welcome email. Please try again.',
  }
}

export async function markNewsletterUnsubscribed(email: string): Promise<void> {
  await connectDb()
  const normalised = normaliseEmail(email)
  await NewsletterSubscriber.updateOne(
    { email: normalised },
    { $set: { status: 'unsubscribed', unsubscribedAt: new Date() } }
  )
}
