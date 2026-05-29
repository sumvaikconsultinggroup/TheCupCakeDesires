import { Document, Schema, model, models } from 'mongoose'

// Display location types for where collections can appear
export type DisplayLocation = string

export interface IDisplaySettings {
  locations: DisplayLocation[]
  priority: number // Higher = shows first
  showOnMobile: boolean
  showOnDesktop: boolean
  startDate?: Date
  endDate?: Date
  customCss?: string
  layoutStyle: 'grid' | 'carousel'
  itemsPerRow: number
  maxItems: number
  showTitle: boolean
  showDescription: boolean
  showProductCount: boolean
  backgroundColor?: string
  textColor?: string
  category?: string
  linkText?: string
  linkUrl?: string
}

export interface ICollection extends Document {
  handle: string
  title: string
  description?: string
  contentDescription?: string // Rich text content displayed on collection page
  image?: string
  bannerImage?: string
  mobileImage?: string
  thumbnailImage?: string
  seo?: {
    title?: string
    description?: string
    robots?: {
      index: boolean
      follow: boolean
      noarchive?: boolean
      nosnippet?: boolean
      noimageindex?: boolean
    }
    canonical?: string
  }
  sortOrder?: 'manual' | 'best-selling' | 'title-asc' | 'title-desc' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc'
  // Conditions for automatic collections
  collectionType: 'manual' | 'automated'
  conditions?: {
    field: 'title' | 'type' | 'vendor' | 'tag' | 'price' | 'compare_at_price' | 'inventory_stock' | 'category'
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with' | 'contains' | 'not_contains'
    value: string
  }[]
  conditionMatch: 'all' | 'any'
  // Manual product selection
  productHandles?: string[]
  // Enhanced Display Settings
  displaySettings: IDisplaySettings
  // Linked pages for sync
  linkedPages?: string[]
  // Feature flags
  isFeatured: boolean
  featuredOrder: number
  // Display settings
  published: boolean
  publishedAt?: Date
  template?: string
  // FAQ
  faq?: {
    question: string
    answer: string
  }[]
  // Metadata
  isDeleted?: boolean
  createdAt: Date
  updatedAt: Date
}

const DisplaySettingsSchema = new Schema({
  locations: [{
    type: String
  }],
  priority: { type: Number, default: 0 },
  showOnMobile: { type: Boolean, default: true },
  showOnDesktop: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date,
  customCss: String,
  layoutStyle: { 
    type: String, 
    enum: ['grid', 'carousel'],
    default: 'grid'
  },
  itemsPerRow: { type: Number, default: 4, min: 1, max: 6 },
  maxItems: { type: Number, default: 12, min: 1, max: 50 },
  showTitle: { type: Boolean, default: true },
  showDescription: { type: Boolean, default: false },
  showProductCount: { type: Boolean, default: true },
  backgroundColor: String,
  textColor: String,
  category: String,
  linkText: String,
  linkUrl: String,
}, { _id: false })

const CollectionSchema = new Schema<ICollection>(
  {
    handle: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true,
      lowercase: true,
      trim: true
    },
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    description: String,
    contentDescription: String, // Rich text content for collection page
    image: String,
    bannerImage: String,
    mobileImage: String,
    thumbnailImage: String,
    seo: {
      title: String,
      description: String,
      robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
        noarchive: { type: Boolean, default: false },
        nosnippet: { type: Boolean, default: false },
        noimageindex: { type: Boolean, default: false }
      },
      canonical: String
    },
    sortOrder: {
      type: String,
      enum: ['manual', 'best-selling', 'title-asc', 'title-desc', 'price-asc', 'price-desc', 'date-asc', 'date-desc'],
      default: 'manual'
    },
    collectionType: {
      type: String,
      enum: ['manual', 'automated'],
      default: 'manual'
    },
    conditions: [{
      field: {
        type: String,
        enum: ['title', 'type', 'vendor', 'tag', 'price', 'compare_at_price', 'inventory_stock', 'category']
      },
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with', 'contains', 'not_contains']
      },
      value: String
    }],
    conditionMatch: {
      type: String,
      enum: ['all', 'any'],
      default: 'all'
    },
    productHandles: [String],
    // Enhanced Display Settings
    displaySettings: {
      type: DisplaySettingsSchema,
      default: () => ({
        locations: [],
        priority: 0,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'grid',
        itemsPerRow: 4,
        maxItems: 12,
        showTitle: true,
        showDescription: false,
        showProductCount: true,
      })
    },
    // Linked pages for sync
    linkedPages: [String],
    // Feature flags
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    publishedAt: Date,
    template: String,
    faq: [{
      question: String,
      answer: String
    }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

// Indexes
CollectionSchema.index({ published: 1 })
CollectionSchema.index({ 'productHandles': 1 })
CollectionSchema.index({ 'displaySettings.locations': 1 })
CollectionSchema.index({ isFeatured: 1, featuredOrder: 1 })
CollectionSchema.index({ 'displaySettings.priority': -1 })

const Collection = models?.Collection || model<ICollection>('Collection', CollectionSchema)

export default Collection
