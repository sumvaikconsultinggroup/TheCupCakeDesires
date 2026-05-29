import mongoose, { Document, Schema } from 'mongoose'

export type SectionType = 
  | 'hero-banner'
  | 'product-grid'
  | 'product-carousel'
  | 'category-grid'
  | 'banner-strip'
  | 'featured-collection'
  | 'testimonials'
  | 'brand-logos'
  | 'newsletter'
  | 'video-banner'
  | 'text-block'
  | 'image-gallery'
  | 'countdown-timer'
  | 'custom-html'

export interface IHomeSection extends Document {
  name: string
  type: SectionType
  title?: string
  subtitle?: string
  description?: string
  order: number
  isActive: boolean
  
  // Product Selection
  productSource: 'manual' | 'collection' | 'tag' | 'bestseller' | 'new' | 'sale'
  products?: mongoose.Types.ObjectId[]
  collectionHandle?: string
  productTag?: string
  productLimit: number
  
  // Layout Settings
  layout: {
    columns: number
    columnsTablet?: number
    columnsMobile?: number
    rows?: number
    gap?: number
    showViewAll?: boolean
    viewAllLink?: string
  }
  
  // Style Settings
  style: {
    backgroundColor?: string
    textColor?: string
    paddingTop?: number
    paddingBottom?: number
    fullWidth?: boolean
    darkMode?: boolean
  }
  
  // Banner/Image Settings (for banner types)
  banner?: {
    image: string
    mobileImage?: string
    alt?: string
    link?: string
    height?: number
  }
  
  // Video Settings
  video?: {
    url?: string
    autoplay?: boolean
    muted?: boolean
    loop?: boolean
    poster?: string
  }
  
  // Countdown Settings
  countdown?: {
    endDate?: Date
    title?: string
    buttonText?: string
    buttonLink?: string
  }
  
  // Custom HTML
  customHtml?: string
  
  // Visibility
  showOnDesktop: boolean
  showOnMobile: boolean
  startDate?: Date
  endDate?: Date
  
  createdAt: Date
  updatedAt: Date
}

const HomeSectionSchema = new Schema<IHomeSection>(
  {
    name: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      required: true,
      enum: [
        'hero-banner', 'product-grid', 'product-carousel', 'category-grid',
        'banner-strip', 'featured-collection', 'testimonials', 'brand-logos',
        'newsletter', 'video-banner', 'text-block', 'image-gallery',
        'countdown-timer', 'custom-html'
      ]
    },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    
    productSource: { 
      type: String, 
      enum: ['manual', 'collection', 'tag', 'bestseller', 'new', 'sale'],
      default: 'manual'
    },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    collectionHandle: { type: String },
    productTag: { type: String },
    productLimit: { type: Number, default: 8, min: 1, max: 50 },
    
    layout: {
      columns: { type: Number, default: 4 },
      columnsTablet: { type: Number, default: 3 },
      columnsMobile: { type: Number, default: 2 },
      rows: { type: Number, default: 1 },
      gap: { type: Number, default: 24 },
      showViewAll: { type: Boolean, default: true },
      viewAllLink: { type: String }
    },
    
    style: {
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#000000' },
      paddingTop: { type: Number, default: 60 },
      paddingBottom: { type: Number, default: 60 },
      fullWidth: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: false }
    },
    
    banner: {
      image: { type: String },
      mobileImage: { type: String },
      alt: { type: String },
      link: { type: String },
      height: { type: Number, default: 400 }
    },
    
    video: {
      url: { type: String },
      autoplay: { type: Boolean, default: true },
      muted: { type: Boolean, default: true },
      loop: { type: Boolean, default: true },
      poster: { type: String }
    },
    
    countdown: {
      endDate: { type: Date },
      title: { type: String },
      buttonText: { type: String },
      buttonLink: { type: String }
    },
    
    customHtml: { type: String },
    
    showOnDesktop: { type: Boolean, default: true },
    showOnMobile: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  { timestamps: true }
)

HomeSectionSchema.index({ order: 1, isActive: 1 })

export default mongoose.models.HomeSection || mongoose.model<IHomeSection>('HomeSection', HomeSectionSchema)
