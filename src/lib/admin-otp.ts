import crypto from 'crypto'

import { sendEmail } from '@/lib/email/send'
import { AdminOtpEmail } from '@/emails/templates/AdminOtpEmail'
import AdminOtp, { AdminOtpPurpose } from '@/models/AdminOtp'

const TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

function pepper(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET not set')
  return s
}

function hashCode(code: string, adminId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${code}|${adminId}|${pepper()}`)
    .digest('hex')
}

function generateCode(): string {
  // 6-digit numeric. crypto.randomInt for unbiased range.
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

/**
 * Issue an OTP for an admin. Overwrites any previous unused OTP for the same
 * (admin, purpose). Returns the plain code so the caller can send it via email.
 */
export async function issueOtp(opts: {
  adminId: string
  purpose: AdminOtpPurpose
  newEmail?: string
}): Promise<string> {
  const code = generateCode()
  const codeHash = hashCode(code, opts.adminId)
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000)

  await AdminOtp.findOneAndUpdate(
    { adminId: opts.adminId, purpose: opts.purpose },
    {
      $set: {
        codeHash,
        newEmail: opts.newEmail,
        attempts: 0,
        expiresAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return code
}

export interface VerifyOtpResult {
  ok: boolean
  /** Reason for failure (only when ok === false). */
  reason?: 'not_found' | 'expired' | 'locked' | 'invalid'
  /** Hydrated record on success — exposes newEmail for email_change purpose. */
  record?: { newEmail?: string }
}

/**
 * Validate an OTP. Atomically increments attempts on a bad guess and deletes
 * the doc on success or after MAX_ATTEMPTS so a code can't be reused.
 */
export async function verifyOtp(opts: {
  adminId: string
  purpose: AdminOtpPurpose
  code: string
}): Promise<VerifyOtpResult> {
  const otp = await AdminOtp.findOne({
    adminId: opts.adminId,
    purpose: opts.purpose,
  })

  if (!otp) return { ok: false, reason: 'not_found' }
  if (otp.expiresAt.getTime() < Date.now()) {
    await AdminOtp.deleteOne({ _id: otp._id })
    return { ok: false, reason: 'expired' }
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await AdminOtp.deleteOne({ _id: otp._id })
    return { ok: false, reason: 'locked' }
  }

  const guess = hashCode(opts.code, opts.adminId)
  if (guess !== otp.codeHash) {
    otp.attempts += 1
    await otp.save()
    if (otp.attempts >= MAX_ATTEMPTS) {
      await AdminOtp.deleteOne({ _id: otp._id })
      return { ok: false, reason: 'locked' }
    }
    return { ok: false, reason: 'invalid' }
  }

  const { newEmail } = otp
  await AdminOtp.deleteOne({ _id: otp._id })
  return { ok: true, record: { newEmail } }
}

const PURPOSE_LABELS: Record<AdminOtpPurpose, string> = {
  password_reset: 'reset your password',
  email_change: 'change your account email',
}

const PURPOSE_SUBJECTS: Record<AdminOtpPurpose, string> = {
  password_reset: 'Your password reset code',
  email_change: 'Your email-change verification code',
}

/**
 * High-level convenience: issue an OTP and email it in one go.
 * Returns true if the email was queued, false if delivery was skipped.
 */
export async function issueAndSendOtp(opts: {
  adminId: string
  purpose: AdminOtpPurpose
  /** Where to deliver the code. */
  recipientEmail: string
  /** Friendly name used in the email greeting. */
  adminName: string
  /** Required for email_change so we can persist the target. */
  newEmail?: string
}): Promise<{ success: boolean; message?: string }> {
  const code = await issueOtp({
    adminId: opts.adminId,
    purpose: opts.purpose,
    newEmail: opts.newEmail,
  })

  const result = await sendEmail({
    to: opts.recipientEmail,
    subject: PURPOSE_SUBJECTS[opts.purpose],
    react: AdminOtpEmail({
      recipientEmail: opts.recipientEmail,
      adminName: opts.adminName,
      code,
      purposeLabel: PURPOSE_LABELS[opts.purpose],
      expiresInMinutes: TTL_MINUTES,
    }),
    templateId: `admin-otp-${opts.purpose}`,
    tags: [{ name: 'purpose', value: opts.purpose }],
    skipSuppressionCheck: true, // transactional account security — never suppress
  })

  if (result.success) return { success: true }
  return { success: false, message: result.error || 'Email could not be sent' }
}

export const ADMIN_OTP_TTL_MINUTES = TTL_MINUTES
export const ADMIN_OTP_MAX_ATTEMPTS = MAX_ATTEMPTS
