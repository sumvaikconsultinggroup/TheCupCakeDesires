import { Document, Schema, model, models } from 'mongoose'

/**
 * Stripe is the only payment provider.
 * Secret + webhook keys live in env vars, not the database — these settings
 * are operational toggles only (enable, test mode flag, supported methods).
 */
export interface IStripeSettings {
  enabled: boolean
  testMode: boolean
  publishableKeyConfigured: boolean // derived flag; UI hint only
  webhookConfigured: boolean // derived flag; UI hint only
  supportedMethods: ('card' | 'apple_pay' | 'google_pay' | 'afterpay_clearpay' | 'link')[]
  /** Stripe statement descriptor (max 22 chars, alphanumeric + spaces). */
  statementDescriptor?: string
}

export interface IPaymentSettings extends Document {
  storeId: string

  stripe: IStripeSettings

  defaultCurrency: string // always 'AUD'
  taxRate: number
  taxInclusive: boolean

  freeShippingThreshold: number
  defaultShippingCost: number

  createdAt: Date
  updatedAt: Date
}

const StripeSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    testMode: { type: Boolean, default: true },
    publishableKeyConfigured: { type: Boolean, default: false },
    webhookConfigured: { type: Boolean, default: false },
    supportedMethods: {
      type: [
        {
          type: String,
          enum: ['card', 'apple_pay', 'google_pay', 'afterpay_clearpay', 'link'],
        },
      ],
      default: ['card', 'apple_pay', 'google_pay', 'link'],
    },
    statementDescriptor: { type: String, default: 'The Cupcake Desire' },
  },
  { _id: false }
)

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    storeId: { type: String, required: true, unique: true, index: true },

    stripe: { type: StripeSettingsSchema, default: () => ({}) },

    defaultCurrency: { type: String, default: 'AUD' },
    taxRate: { type: Number, default: 10 }, // AU GST
    taxInclusive: { type: Boolean, default: true },

    freeShippingThreshold: { type: Number, default: 99 },
    defaultShippingCost: { type: Number, default: 9.95 },
  },
  { timestamps: true, versionKey: false }
)

const PaymentSettings =
  models?.PaymentSettings || model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema)

export default PaymentSettings
