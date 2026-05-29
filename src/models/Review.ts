import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  productHandle: string
  productTitle: string
  
  // Customer Info
  customerName: string
  customerEmail: string
  
  // Review Content
  rating: number
  title: string
  content: string
  
  // Media
  images: string[]
  
  // Status & Verification
  status: 'pending' | 'approved' | 'rejected'
  isVerifiedPurchase: boolean
  orderId?: string
  
  // Engagement
  helpfulCount: number
  helpfulVotes: string[] // Array of user IDs/IPs who voted helpful
  
  // Admin
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  
  // Source
  source: 'website' | 'import' | 'manual'
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productHandle: { type: String, required: true, index: true },
    productTitle: { type: String, required: true },
    
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 2000 },
    
    images: [{ type: String }],
    
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    isVerifiedPurchase: { type: Boolean, default: false },
    orderId: { type: String },
    
    helpfulCount: { type: Number, default: 0 },
    helpfulVotes: [{ type: String }],
    
    adminNotes: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    
    source: {
      type: String,
      enum: ['website', 'import', 'manual'],
      default: 'website'
    }
  },
  { timestamps: true }
)

// Indexes for efficient queries
ReviewSchema.index({ productId: 1, status: 1 })
ReviewSchema.index({ productHandle: 1, status: 1 })
ReviewSchema.index({ customerEmail: 1 })
ReviewSchema.index({ status: 1, createdAt: -1 })
ReviewSchema.index({ rating: 1 })

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
