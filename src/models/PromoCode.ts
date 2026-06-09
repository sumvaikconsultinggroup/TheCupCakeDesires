import { Document, Schema, model, models } from 'mongoose'

export interface IPromoCode extends Document {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  usageLimit?: number
  usageCount: number
  startsAt?: Date
  expiresAt?: Date
  isActive: boolean
  appliesTo: 'all' | 'products'
  productIds?: string[]
  allowedEmails?: string[]
  sourceOrderId?: string
  sourceType?: 'pending_reminder_5' | 'pending_reminder_10'
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    appliesTo: { type: String, enum: ['all', 'products'], default: 'all' },
    productIds: [{ type: String }],
    allowedEmails: [{ type: String, lowercase: true, trim: true }],
    sourceOrderId: { type: String },
    sourceType: { type: String, enum: ['pending_reminder_5', 'pending_reminder_10'] },
  },
  { timestamps: true }
)

const PromoCode = models.PromoCode || model<IPromoCode>('PromoCode', PromoCodeSchema)

export default PromoCode