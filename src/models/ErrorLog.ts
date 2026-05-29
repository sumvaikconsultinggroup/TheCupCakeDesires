import mongoose from 'mongoose'
import { Schema, Document, Model } from 'mongoose'

export interface IErrorLog extends Document {
  errorId: string
  level: 'error' | 'warning' | 'info' | 'critical'
  message: string
  stack?: string
  component?: string
  route?: string
  userId?: string
  userEmail?: string
  userAgent?: string
  ipAddress?: string
  requestMethod?: string
  requestUrl?: string
  requestBody?: Record<string, any>
  responseStatus?: number
  environment: 'development' | 'production' | 'staging'
  context?: Record<string, any>
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  resolvedNote?: string
  createdAt: Date
  updatedAt: Date
}

const ErrorLogSchema = new Schema<IErrorLog>(
  {
    errorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['error', 'warning', 'info', 'critical'],
      required: true,
      default: 'error',
      index: true,
    },
    message: {
      type: String,
      required: true,
      index: true,
    },
    stack: {
      type: String,
    },
    component: {
      type: String,
      index: true,
    },
    route: {
      type: String,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    requestMethod: {
      type: String,
    },
    requestUrl: {
      type: String,
    },
    requestBody: {
      type: Schema.Types.Mixed,
    },
    responseStatus: {
      type: Number,
    },
    environment: {
      type: String,
      enum: ['development', 'production', 'staging'],
      required: true,
      default: 'production',
      index: true,
    },
    context: {
      type: Schema.Types.Mixed,
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
    resolvedNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient querying
ErrorLogSchema.index({ createdAt: -1 })
ErrorLogSchema.index({ level: 1, resolved: 1 })
ErrorLogSchema.index({ component: 1, createdAt: -1 })
ErrorLogSchema.index({ route: 1, createdAt: -1 })

// Prevent model re-compilation during hot reload
// In development, delete the cached model to ensure schema updates are picked up
if (process.env.NODE_ENV !== 'production' && mongoose.models && mongoose.models.ErrorLog) {
  delete mongoose.models.ErrorLog
}

// Safely get or create the model
let ErrorLog: Model<IErrorLog>
try {
  if (mongoose.models && mongoose.models.ErrorLog) {
    ErrorLog = mongoose.models.ErrorLog as Model<IErrorLog>
  } else {
    ErrorLog = mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema)
  }
} catch (error) {
  // Fallback: create model directly if models object doesn't exist
  ErrorLog = mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema)
}

export default ErrorLog
