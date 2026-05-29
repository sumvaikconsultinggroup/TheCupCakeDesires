import mongoose, { Document, Schema } from 'mongoose'

export interface IHomeBanner extends Document {
  title: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  image: {
    desktop: string
    mobile?: string
    alt: string
  }
  overlay?: {
    enabled: boolean
    color: string
    opacity: number
  }
  textPosition: 'left' | 'center' | 'right'
  textColor: string
  badge?: string
  story?: {
    type: 'youtube' | 'video'
    url: string
  }
  order: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

const HomeBannerSchema = new Schema<IHomeBanner>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    buttonText: { type: String, trim: true },
    buttonLink: { type: String, trim: true },
    secondaryButtonText: { type: String, trim: true },
    secondaryButtonLink: { type: String, trim: true },
    image: {
      desktop: { type: String, required: true },
      mobile: { type: String },
      alt: { type: String, default: '' }
    },
    overlay: {
      enabled: { type: Boolean, default: true },
      color: { type: String, default: '#000000' },
      opacity: { type: Number, default: 0.4, min: 0, max: 1 }
    },
    textPosition: { 
      type: String, 
      enum: ['left', 'center', 'right'], 
      default: 'left' 
    },
    textColor: { type: String, default: '#ffffff' },
    badge: { type: String, trim: true },
    story: {
      type: { type: String, enum: ['youtube', 'video'], default: 'youtube' },
      url: { type: String, trim: true }
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  { timestamps: true }
)

HomeBannerSchema.index({ order: 1, isActive: 1 })

export default mongoose.models.HomeBanner || mongoose.model<IHomeBanner>('HomeBanner', HomeBannerSchema)
