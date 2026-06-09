import { Document, Schema, Types, model, models } from 'mongoose'

/**
 * One-time-passcode for admin-account-sensitive actions.
 * Used for password reset and (owner-only) email change.
 *
 * Security model:
 *  - `codeHash` is a SHA-256 of `code + adminId + JWT_SECRET` so a DB leak
 *    alone is not enough to brute-force codes.
 *  - 10-minute TTL via Mongo's TTL index (Mongo cleans expired docs every 60s).
 *  - Max 5 verify attempts; after that the doc is considered locked.
 *  - One active OTP per (adminId, purpose). Re-requesting overwrites the prior.
 */

export type AdminOtpPurpose = 'password_reset' | 'email_change'

export interface IAdminOtp extends Document {
  adminId: Types.ObjectId
  purpose: AdminOtpPurpose
  codeHash: string
  /** For email_change purpose only — the new email to set after verification. */
  newEmail?: string
  attempts: number
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const AdminOtpSchema = new Schema<IAdminOtp>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['password_reset', 'email_change'],
      required: true,
    },
    codeHash: { type: String, required: true },
    newEmail: { type: String },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true, versionKey: false }
)

// Only one active OTP per (admin, purpose) at any time.
AdminOtpSchema.index({ adminId: 1, purpose: 1 }, { unique: true })

const AdminOtp = models?.AdminOtp || model<IAdminOtp>('AdminOtp', AdminOtpSchema)

export default AdminOtp
