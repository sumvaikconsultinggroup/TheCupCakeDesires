import { Document, Schema, model, models } from 'mongoose'

export type PaymentProvider = 'razorpay' | 'payu' | 'cod' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'

export interface IPayment extends Document {
  paymentId: string // Unique payment ID
  orderId: string // Reference to Order
  provider: PaymentProvider
  
  // Amount details
  amount: number
  currency: string
  amountRefunded: number
  
  // Provider-specific details
  providerPaymentId?: string // Razorpay payment_id or PayU mihpayid
  providerOrderId?: string // Razorpay order_id or PayU txnid
  providerSignature?: string // For verification
  
  // Status
  status: PaymentStatus
  statusHistory: {
    status: PaymentStatus
    timestamp: Date
    reason?: string
    providerResponse?: any
  }[]
  
  // Customer details
  customerEmail: string
  customerPhone: string
  customerName: string
  
  // Payment method details
  paymentMethod?: {
    type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi' | 'cod'
    cardNetwork?: string
    cardLast4?: string
    cardType?: string
    bankCode?: string
    bankName?: string
    walletName?: string
    upiId?: string
  }
  
  // Refund details
  refunds: {
    refundId: string
    amount: number
    status: 'pending' | 'processed' | 'failed'
    reason: string
    createdAt: Date
    processedAt?: Date
  }[]
  
  // Webhook tracking
  webhookEvents: {
    eventType: string
    eventId: string
    receivedAt: Date
    payload: any
  }[]
  
  // Metadata
  metadata?: Record<string, any>
  notes?: string
  
  // Error tracking
  errorCode?: string
  errorMessage?: string
  errorSource?: string
  
  // Timestamps
  authorizedAt?: Date
  capturedAt?: Date
  failedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi', 'cod'],
  },
  cardNetwork: String,
  cardLast4: String,
  cardType: String,
  bankCode: String,
  bankName: String,
  walletName: String,
  upiId: String,
}, { _id: false })

const StatusHistorySchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
  },
  timestamp: { type: Date, default: Date.now },
  reason: String,
  providerResponse: Schema.Types.Mixed,
}, { _id: false })

const RefundSchema = new Schema({
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
}, { _id: false })

const WebhookEventSchema = new Schema({
  eventType: { type: String, required: true },
  eventId: { type: String, required: true },
  receivedAt: { type: Date, default: Date.now },
  payload: Schema.Types.Mixed,
}, { _id: false })

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    provider: {
      type: String,
      enum: ['razorpay', 'payu', 'cod', 'bank_transfer'],
      required: true,
    },
    
    // Amount details
    amount: { type: Number, required: true },
    currency: { type: String, default: 'AUD' },
    amountRefunded: { type: Number, default: 0 },
    
    // Provider-specific
    providerPaymentId: String,
    providerOrderId: String,
    providerSignature: String,
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [StatusHistorySchema],
    
    // Customer details
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    
    // Payment method details
    paymentMethod: PaymentMethodSchema,
    
    // Refunds
    refunds: [RefundSchema],
    
    // Webhook tracking
    webhookEvents: [WebhookEventSchema],
    
    // Metadata
    metadata: Schema.Types.Mixed,
    notes: String,
    
    // Error tracking
    errorCode: String,
    errorMessage: String,
    errorSource: String,
    
    // Timestamps
    authorizedAt: Date,
    capturedAt: Date,
    failedAt: Date,
  },
  { timestamps: true, versionKey: false }
)

// Indexes for common queries
PaymentSchema.index({ status: 1 })
PaymentSchema.index({ provider: 1 })
PaymentSchema.index({ customerEmail: 1 })
PaymentSchema.index({ createdAt: -1 })
PaymentSchema.index({ providerPaymentId: 1 }, { sparse: true })
PaymentSchema.index({ providerOrderId: 1 }, { sparse: true })

const Payment = models?.Payment || model<IPayment>('Payment', PaymentSchema)

export default Payment
