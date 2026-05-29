import mongoose from 'mongoose'

/**
 * Log Schema
 * Stores application logs, errors, and important events
 */
const logSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug', 'critical'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'order',
        'payment',
        'product',
        'user',
        'security',
        'api',
        'database',
        'email',
        'shipment',
        'system',
        'validation',
        'price',
      ],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userId: {
      type: String,
      index: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    requestId: {
      type: String,
      index: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    url: {
      type: String,
    },
    method: {
      type: String,
    },
    statusCode: {
      type: Number,
    },
    stack: {
      type: String,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient querying
logSchema.index({ createdAt: -1 })
logSchema.index({ level: 1, createdAt: -1 })
logSchema.index({ category: 1, createdAt: -1 })
logSchema.index({ resolved: 1, createdAt: -1 })
logSchema.index({ orderId: 1, createdAt: -1 })
logSchema.index({ userId: 1, createdAt: -1 })

// Compound index for common queries
logSchema.index({ level: 1, category: 1, createdAt: -1 })
logSchema.index({ resolved: 1, level: 1, createdAt: -1 })

// Prevent duplicate logs in development
if (process.env.NODE_ENV !== 'production') {
  if (mongoose.models.Log) {
    delete mongoose.models.Log
  }
}

export default mongoose.models.Log || mongoose.model('Log', logSchema)
