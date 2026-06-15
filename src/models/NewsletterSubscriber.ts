import mongoose, { Document, Schema, model, models } from 'mongoose'

export type NewsletterSubscriberStatus = 'active' | 'unsubscribed'

export interface INewsletterSubscriber extends Document {
  email: string
  status: NewsletterSubscriberStatus
  source?: string
  subscribedAt: Date
  unsubscribedAt?: Date | null
  welcomeEmailSentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed'],
      default: 'active',
      index: true,
    },
    source: { type: String, default: 'homepage' },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
    welcomeEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const NewsletterSubscriber =
  (models.NewsletterSubscriber as mongoose.Model<INewsletterSubscriber>) ||
  model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema)

export default NewsletterSubscriber
