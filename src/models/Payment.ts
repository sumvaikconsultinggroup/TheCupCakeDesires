import { Document, Schema, model, models } from 'mongoose'

export type PaymentProvider = 'stripe'
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'

export interface IPayment extends Document {
  paymentId: string
  orderId: string
  provider: PaymentProvider

  amount: number
  currency: string
  amountRefunded: number

  // Stripe references
  providerPaymentId?: string // Stripe PaymentIntent id (pi_...)
  providerOrderId?: string // Stripe Checkout Session id (cs_...)
  providerCustomerId?: string // Stripe customer id (cus_...)

  status: PaymentStatus
  statusHistory: {
    status: PaymentStatus
    timestamp: Date
    reason?: string
    providerResponse?: any
  }[]

  customerEmail: string
  customerPhone: string
  customerName: string

  // What kind of payment the customer used inside Stripe
  paymentMethod?: {
    type: 'card' | 'apple_pay' | 'google_pay' | 'afterpay_clearpay' | 'link'
    cardNetwork?: string
    cardLast4?: string
    cardType?: string
  }

  refunds: {
    refundId: string // Stripe refund id (re_...)
    amount: number
    status: 'pending' | 'processed' | 'failed'
    reason: string
    createdAt: Date
    processedAt?: Date
  }[]

  webhookEvents: {
    eventType: string
    eventId: string
    receivedAt: Date
    payload: any
  }[]

  metadata?: Record<string, any>
  notes?: string

  errorCode?: string
  errorMessage?: string
  errorSource?: string

  authorizedAt?: Date
  capturedAt?: Date
  failedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentMethodSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['card', 'apple_pay', 'google_pay', 'afterpay_clearpay', 'link'],
    },
    cardNetwork: String,
    cardLast4: String,
    cardType: String,
  },
  { _id: false }
)

const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
    },
    timestamp: { type: Date, default: Date.now },
    reason: String,
    providerResponse: Schema.Types.Mixed,
  },
  { _id: false }
)

const RefundSchema = new Schema(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    reason: String,
    createdAt: { type: Date, default: Date.now },
    processedAt: Date,
  },
  { _id: false }
)

const WebhookEventSchema = new Schema(
  {
    eventType: { type: String, required: true },
    eventId: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },
    payload: Schema.Types.Mixed,
  },
  { _id: false }
)

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    provider: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
      required: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'AUD' },
    amountRefunded: { type: Number, default: 0 },

    providerPaymentId: String,
    providerOrderId: String,
    providerCustomerId: String,

    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [StatusHistorySchema],

    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },

    paymentMethod: PaymentMethodSchema,
    refunds: [RefundSchema],
    webhookEvents: [WebhookEventSchema],

    metadata: Schema.Types.Mixed,
    notes: String,

    errorCode: String,
    errorMessage: String,
    errorSource: String,

    authorizedAt: Date,
    capturedAt: Date,
    failedAt: Date,
  },
  { timestamps: true, versionKey: false }
)

PaymentSchema.index({ status: 1 })
PaymentSchema.index({ customerEmail: 1 })
PaymentSchema.index({ createdAt: -1 })
PaymentSchema.index({ providerPaymentId: 1 }, { sparse: true })
PaymentSchema.index({ providerOrderId: 1 }, { sparse: true })

const Payment = models?.Payment || model<IPayment>('Payment', PaymentSchema)

export default Payment
