import connectDb from '@/lib/mongodb'
import EmailSuppression, { EmailSuppressionReason } from '@/models/EmailSuppression'

/**
 * Returns true if the given email is in the suppression list and we
 * should NOT send to it. Lower-cased and trimmed before lookup.
 */
export async function isSuppressed(email: string): Promise<boolean> {
  if (!email) return false
  try {
    await connectDb()
    const normalised = email.trim().toLowerCase()
    const found = await EmailSuppression.findOne({ email: normalised }).lean()
    return Boolean(found)
  } catch (err) {
    // Fail open: do not block real users if Mongo hiccups.
    // eslint-disable-next-line no-console
    console.error('[email] suppression lookup failed:', err)
    return false
  }
}

export async function addSuppression(email: string, reason: EmailSuppressionReason, source?: string): Promise<void> {
  await connectDb()
  const normalised = email.trim().toLowerCase()
  await EmailSuppression.updateOne(
    { email: normalised },
    { $set: { email: normalised, reason, source } },
    { upsert: true }
  )
}

export async function removeSuppression(email: string): Promise<void> {
  await connectDb()
  const normalised = email.trim().toLowerCase()
  await EmailSuppression.deleteOne({ email: normalised })
}
