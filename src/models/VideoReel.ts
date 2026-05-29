import mongoose, { Document, Schema } from 'mongoose'

// Product tag interface for video tagging
export interface IProductTag {
  productId: string
  productHandle: string
  productName: string
  productPrice: number
  productImage: string
  position?: {
    x: number  // percentage from left
    y: number  // percentage from top
  }
}

export interface IVideoReel extends Document {
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number  // in seconds
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:5'
  products: IProductTag[]  // Tagged products
  influencer?: {
    name: string
    handle?: string
    avatarUrl?: string
    profileUrl?: string
  }
  stats: {
    views: number
    likes: number
    shares: number
  }
  tags: string[]
  category?: string
  isActive: boolean
  isFeatured: boolean
  displayOrder: number
  autoPlay: boolean
  showOnHomepage: boolean
  scheduledAt?: Date
  expiresAt?: Date
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

const ProductTagSchema = new Schema({
  productId: { type: String, required: true },
  productHandle: { type: String, required: true },
  productName: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productImage: { type: String },
  position: {
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
  },
}, { _id: false })

const VideoReelSchema = new Schema<IVideoReel>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  duration: {
    type: Number,
  },
  aspectRatio: {
    type: String,
    enum: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  products: [ProductTagSchema],
  influencer: {
    name: { type: String },
    handle: { type: String },
    avatarUrl: { type: String },
    profileUrl: { type: String },
  },
  stats: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  tags: [{ type: String }],
  category: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  autoPlay: {
    type: Boolean,
    default: false,
  },
  showOnHomepage: {
    type: Boolean,
    default: true,
  },
  scheduledAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
  createdBy: {
    type: String,
  },
}, {
  timestamps: true,
})

// Indexes for efficient queries
VideoReelSchema.index({ isActive: 1, showOnHomepage: 1, displayOrder: 1 })
VideoReelSchema.index({ isFeatured: 1 })
VideoReelSchema.index({ 'products.productId': 1 })
VideoReelSchema.index({ tags: 1 })
VideoReelSchema.index({ category: 1 })
VideoReelSchema.index({ createdAt: -1 })

export default mongoose.models.VideoReel || mongoose.model<IVideoReel>('VideoReel', VideoReelSchema)
