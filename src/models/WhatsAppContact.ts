import { Document, Schema, model, models } from 'mongoose'

/**
 * Tracks when a team member last messaged the WhatsApp bot number. Meta only
 * allows free-form messages within 24 h of that; outside it we must send an
 * approved template instead.
 */
export interface IWhatsAppContact extends Document {
  waId: string
  lastInboundAt?: Date
}

const WhatsAppContactSchema = new Schema<IWhatsAppContact>(
  {
    waId: { type: String, required: true, unique: true, trim: true },
    lastInboundAt: Date,
  },
  { timestamps: true }
)

export default models.WhatsAppContact ||
  model<IWhatsAppContact>('WhatsAppContact', WhatsAppContactSchema)
