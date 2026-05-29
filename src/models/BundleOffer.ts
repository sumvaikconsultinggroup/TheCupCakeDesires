import mongoose, { Document, Schema } from 'mongoose'

// Bundle Types
export type BundleType = 
  | 'combo'           // Buy products together at discount
  | 'bogo'            // Buy One Get One (free/discounted)
  | 'quantity'        // Buy X get Y% off
  | 'tiered'          // Tiered pricing (buy more save more)
  | 'mix-match'       // Mix and match from categories
  | 'gift-with-purchase' // Free gift with purchase

export type DiscountType = 'percentage' | 'fixed' | 'free' | 'fixed-price'

export interface IBundleProduct {
  productId: mongoose.Types.ObjectId
  variantId?: string
  quantity: number
  isRequired: boolean
  isGift?: boolean
  customPrice?: number
}

export interface ITierLevel {
  minQuantity: number
  maxQuantity?: number
  discountType: DiscountType
  discountValue: number
  label?: string
}

export interface IBundleOffer extends Document {
  // Basic Info
  name: string
  internalName: string
  description?: string
  shortDescription?: string
  
  // Bundle Type & Configuration
  bundleType: BundleType
  
  // Products in Bundle
  products: IBundleProduct[]
  
  // For mix-match: categories/tags to choose from
  eligibleCategories?: string[]
  eligibleTags?: string[]
  minProducts?: number
  maxProducts?: number
  
  // Discount Configuration
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number
  
  // Tiered Pricing
  tiers?: ITierLevel[]
  
  // BOGO Configuration
  bogoConfig?: {
    buyQuantity: number
    getQuantity: number
    getDiscountType: DiscountType
    getDiscountValue: number
  }
  
  // Pricing Display
  originalPrice?: number
  bundlePrice?: number
  savingsAmount?: number
  savingsPercentage?: number
  
  // Scheduling
  isActive: boolean
  startDate?: Date
  endDate?: Date
  
  // Targeting
  targetProductIds: mongoose.Types.ObjectId[]
  targetCollections?: string[]
  showOnAllProducts?: boolean
  excludeProductIds?: mongoose.Types.ObjectId[]
  
  // Limits
  usageLimit?: number
  usageCount: number
  perCustomerLimit?: number
  minOrderValue?: number
  
  // Display Settings
  priority: number
  displayStyle: 'card' | 'banner' | 'inline' | 'popup' | 'floating'
  badgeText?: string
  badgeColor?: string
  highlightColor?: string
  
  // Media
  image?: string
  icon?: string
  
  // Labels & CTA
  ctaText?: string
  savingsLabel?: string
  urgencyText?: string
  
  // Advanced
  stackable: boolean
  autoApply: boolean
  requiresCode: boolean
  code?: string
  
  // Analytics
  viewCount: number
  clickCount: number
  conversionCount: number
  revenue: number
  
  createdAt: Date
  updatedAt: Date
}

const BundleProductSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String },
  quantity: { type: Number, default: 1, min: 1 },
  isRequired: { type: Boolean, default: true },
  isGift: { type: Boolean, default: false },
  customPrice: { type: Number }
}, { _id: false })

const TierLevelSchema = new Schema({
  minQuantity: { type: Number, required: true },
  maxQuantity: { type: Number },
  discountType: { type: String, enum: ['percentage', 'fixed', 'free', 'fixed-price'], required: true },
  discountValue: { type: Number, required: true },
  label: { type: String }
}, { _id: false })

const BundleOfferSchema = new Schema<IBundleOffer>(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    internalName: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 150 },
    
    // Bundle Type
    bundleType: { 
      type: String, 
      enum: ['combo', 'bogo', 'quantity', 'tiered', 'mix-match', 'gift-with-purchase'],
      required: true,
      default: 'combo'
    },
    
    // Products
    products: [BundleProductSchema],
    
    // Mix-match
    eligibleCategories: [{ type: String }],
    eligibleTags: [{ type: String }],
    minProducts: { type: Number, min: 1 },
    maxProducts: { type: Number },
    
    // Discount
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed', 'free', 'fixed-price'],
      required: true,
      default: 'percentage'
    },
    discountValue: { type: Number, required: true, default: 0 },
    maxDiscount: { type: Number },
    
    // Tiers
    tiers: [TierLevelSchema],
    
    // BOGO
    bogoConfig: {
      buyQuantity: { type: Number, default: 1 },
      getQuantity: { type: Number, default: 1 },
      getDiscountType: { type: String, enum: ['percentage', 'fixed', 'free', 'fixed-price'] },
      getDiscountValue: { type: Number }
    },
    
    // Pricing
    originalPrice: { type: Number },
    bundlePrice: { type: Number },
    savingsAmount: { type: Number },
    savingsPercentage: { type: Number },
    
    // Scheduling
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    
    // Targeting
    targetProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    targetCollections: [{ type: String }],
    showOnAllProducts: { type: Boolean, default: false },
    excludeProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    
    // Limits
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number },
    minOrderValue: { type: Number },
    
    // Display
    priority: { type: Number, default: 0 },
    displayStyle: { 
      type: String, 
      enum: ['card', 'banner', 'inline', 'popup', 'floating'],
      default: 'card'
    },
    badgeText: { type: String },
    badgeColor: { type: String, default: '#ef4444' },
    highlightColor: { type: String, default: '#3b82f6' },
    
    // Media
    image: { type: String },
    icon: { type: String },
    
    // Labels
    ctaText: { type: String, default: 'Add Bundle to Cart' },
    savingsLabel: { type: String, default: 'You Save' },
    urgencyText: { type: String },
    
    // Advanced
    stackable: { type: Boolean, default: false },
    autoApply: { type: Boolean, default: false },
    requiresCode: { type: Boolean, default: false },
    code: { type: String, uppercase: true, trim: true },
    
    // Analytics
    viewCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    conversionCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  { timestamps: true }
)

// Indexes
BundleOfferSchema.index({ isActive: 1, startDate: 1, endDate: 1 })
BundleOfferSchema.index({ targetProductIds: 1 })
BundleOfferSchema.index({ priority: -1 })
BundleOfferSchema.index({ code: 1 }, { sparse: true })

export default mongoose.models.BundleOffer || mongoose.model<IBundleOffer>('BundleOffer', BundleOfferSchema)
