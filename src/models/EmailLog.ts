import mongoose, { Document, Schema, model, models } from 'mongoose'

export type EmailStatus = 'sent' | 'failed' | 'skipped_suppressed'

export interface IEmailLog extends Document {
  recipient: string
  templateId: string
  refId?: string
  refType?: string
  sentAt: Date
  providerMessageId?: string
  status: EmailStatus
  error?: string
  subject?: string
  tags?: Record<string, string>
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    recipient: { type: String, required: true, lowercase: true, trim: true },
    templateId: { type: String, required: true },
    refId: { type: String },
    refType: { type: String },
    sentAt: { type: Date, required: true, default: Date.now },
    providerMessageId: { type: String },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped_suppressed'],
      required: true,
    },
    error: { type: String },
    subject: { type: String },
    tags: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

EmailLogSchema.index({ recipient: 1, templateId: 1, refId: 1 })
EmailLogSchema.index({ sentAt: -1 })
EmailLogSchema.index({ status: 1, sentAt: -1 })

const EmailLog = (models.EmailLog as mongoose.Model<IEmailLog>) || model<IEmailLog>('EmailLog', EmailLogSchema)

export default EmailLog
