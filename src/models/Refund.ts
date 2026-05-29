import mongoose from 'mongoose'

const refundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      unique: true,
      required: true,
    },
    
    // Order reference
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    orderMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    
    // User information
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: String,
    userName: String,
    userPhone: String,
    
    // Payment information
    paymentGateway: {
      type: String,
      enum: ['PayU', 'Razorpay'],
      required: true,
    },
    transactionId: String, // Original payment transaction ID
    mihpayid: String, // PayU payment ID (required for PayU refunds)
    
    // Refund details
    refundAmount: {
      type: Number,
      required: true,
    },
    orderAmount: Number, // Total order amount for reference
    refundType: {
      type: String,
      enum: ['full', 'partial'],
      default: 'full',
    },
    
    // Refund status
    status: {
      type: String,
      enum: [
        'refund_initiated',    // Order cancelled, refund record created
        'pending_approval',    // Waiting for admin approval
        'approved',            // Admin approved, ready to process
        'processing',          // Refund API call in progress
        'refunded',            // Refund successful
        'failed',              // Refund failed
        'rejected',            // Admin rejected refund
      ],
      default: 'refund_initiated',
    },
    
    // PayU refund details
    payuRefundId: String, // PayU refund transaction ID
    payuRefundStatus: String, // Status from PayU
    bankRrn: String, // Bank reference number
    
    // Manual refund details (for admin-completed refunds)
    refundReferenceNumber: String, // Bank/Payment reference for completed refunds
    refundMethod: String, // How refund was processed (e.g., 'Bank Transfer', 'Original Payment Method')
    
    // Cancellation details
    cancelledBy: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    cancellationReason: String,
    cancellationDate: {
      type: Date,
      default: Date.now,
    },
    
    // Order snapshot at time of cancellation
    orderSnapshot: {
      items: [{
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
      }],
      shippingAddress: Object,
      paymentMethod: String,
      status: String,
    },
    
    // Admin actions
    approvedBy: String, // Admin who approved
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
    rejectionReason: String,
    rejectionCategory: {
      type: String,
      enum: [
        'order_shipped',
        'order_delivered',
        'invalid_request',
        'fraud_suspected',
        'policy_violation',
        'duplicate_request',
        'other',
      ],
    },
    
    // Refund processing
    refundInitiatedAt: Date, // When PayU API was called
    refundCompletedAt: Date, // When refund was successful
    
    // Timeline
    estimatedRefundDate: Date, // 3-7 business days from approval
    
    // Notifications
    userNotified: {
      type: Boolean,
      default: false,
    },
    notificationsSent: [{
      type: String,
      message: String,
      sentAt: Date,
    }],
    
    // Error tracking
    errors: [{
      message: String,
      timestamp: Date,
      details: Object,
    }],
    
    // Audit trail
    statusHistory: [{
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
      updatedBy: String,
    }],
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient queries
refundSchema.index({ status: 1, createdAt: -1 })
refundSchema.index({ userId: 1, createdAt: -1 })
refundSchema.index({ orderId: 1 })
refundSchema.index({ payuRefundId: 1 }, { sparse: true })

// Prevent duplicate refunds for same order
refundSchema.index({ orderId: 1, status: 1 })

// In development, delete the cached model to ensure schema updates are picked up
if (process.env.NODE_ENV !== 'production' && mongoose.models.Refund) {
  delete mongoose.models.Refund
}

export default mongoose.models.Refund || mongoose.model('Refund', refundSchema)
