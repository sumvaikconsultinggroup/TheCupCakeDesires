import mongoose, { Document, Schema, model, models } from 'mongoose'

export type EmailSuppressionReason = 'unsubscribe' | 'bounce' | 'complaint' | 'manual'

export interface IEmailSuppression extends Document {
  email: string
  reason: EmailSuppressionReason
  source?: string
  createdAt: Date
  updatedAt: Date
}

const EmailSuppressionSchema = new Schema<IEmailSuppression>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['unsubscribe', 'bounce', 'complaint', 'manual'],
      required: true,
    },
    source: { type: String },
  },
  { timestamps: true }
)

const EmailSuppression =
  (models.EmailSuppression as mongoose.Model<IEmailSuppression>) ||
  model<IEmailSuppression>('EmailSuppression', EmailSuppressionSchema)

export default EmailSuppression
