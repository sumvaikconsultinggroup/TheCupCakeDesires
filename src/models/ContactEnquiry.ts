import mongoose, { Document, Schema, model, models } from 'mongoose'

export interface IContactEnquiry extends Document {
  name: string
  email: string
  phone?: string
  company?: string
  date?: string
  quantity?: string
  subject: string
  message: string
  source?: string
  emailToInfoStatus: 'pending' | 'sent' | 'failed'
  emailAckStatus: 'pending' | 'sent' | 'failed' | 'skipped'
  emailError?: string
}

const ContactEnquirySchema = new Schema<IContactEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    date: { type: String, trim: true },
    quantity: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    source: { type: String, trim: true },
    emailToInfoStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    emailAckStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'skipped'],
      default: 'pending',
    },
    emailError: { type: String },
  },
  { timestamps: true }
)

ContactEnquirySchema.index({ createdAt: -1 })
ContactEnquirySchema.index({ email: 1, createdAt: -1 })

export default models.ContactEnquiry || model<IContactEnquiry>('ContactEnquiry', ContactEnquirySchema)
