import mongoose, { Document, Schema, model, models } from 'mongoose'

export interface INewsletterCampaign extends Document {
  subject: string
  previewText?: string
  bodyHtml: string
  attachmentNames: string[]
  recipientCount: number
  successCount: number
  failedCount: number
  skippedCount: number
  sentByEmail: string
  sentAt: Date
  createdAt: Date
  updatedAt: Date
}

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    subject: { type: String, required: true },
    previewText: { type: String },
    bodyHtml: { type: String, required: true },
    attachmentNames: { type: [String], default: [] },
    recipientCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    sentByEmail: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

const NewsletterCampaign =
  (models.NewsletterCampaign as mongoose.Model<INewsletterCampaign>) ||
  model<INewsletterCampaign>('NewsletterCampaign', NewsletterCampaignSchema)

export default NewsletterCampaign
