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

export interface IShiprocketSettings {
  enabled: boolean
  email: string
  password: string
  channelId?: number
  pickupLocationId?: number
  defaultCourierId?: number
  autoManifest: boolean
  autoLabel: boolean
  testMode: boolean
}

export interface IPaymentSettings extends Document {
  storeId: string

  stripe: IStripeSettings
  shiprocket: IShiprocketSettings

  defaultCurrency: string // always 'AUD'
  taxRate: number
  taxInclusive: boolean

  freeShippingThreshold: number
  defaultShippingCost: number

  // Pickup address (for Shiprocket / couriers)
  pickupAddress: {
    name: string
    phone: string
    email: string
    address: string
    address2?: string
    city: string
    state: string
    pincode: string
    country: string
  }

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
    statementDescriptor: { type: String, default: 'CUPCAKE DESIRES' },
  },
  { _id: false }
)

const ShiprocketSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    email: { type: String, default: '' },
    password: { type: String, default: '' },
    channelId: Number,
    pickupLocationId: Number,
    defaultCourierId: Number,
    autoManifest: { type: Boolean, default: false },
    autoLabel: { type: Boolean, default: true },
    testMode: { type: Boolean, default: true },
  },
  { _id: false }
)

const PickupAddressSchema = new Schema(
  {
    name: { type: String, default: 'CupCake Desires' },
    phone: { type: String, default: '' },
    email: { type: String, default: 'hello@cupcakedesires.com' },
    address: { type: String, default: '352 Princes Hwy' },
    address2: String,
    city: { type: String, default: 'Narre Warren' },
    state: { type: String, default: 'VIC' },
    pincode: { type: String, default: '3805' },
    country: { type: String, default: 'Australia' },
  },
  { _id: false }
)

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    storeId: { type: String, required: true, unique: true, index: true },

    stripe: { type: StripeSettingsSchema, default: () => ({}) },
    shiprocket: { type: ShiprocketSettingsSchema, default: () => ({}) },

    defaultCurrency: { type: String, default: 'AUD' },
    taxRate: { type: Number, default: 10 }, // AU GST
    taxInclusive: { type: Boolean, default: true },

    freeShippingThreshold: { type: Number, default: 99 },
    defaultShippingCost: { type: Number, default: 9.95 },

    pickupAddress: { type: PickupAddressSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false }
)

const PaymentSettings =
  models?.PaymentSettings || model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema)

export default PaymentSettings
