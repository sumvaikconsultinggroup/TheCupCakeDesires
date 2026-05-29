import mongoose, { Document, Schema } from 'mongoose'

export interface IBlogPost extends Document {
  // Basic Info
  title: string
  slug: string
  excerpt?: string
  content: string
  
  // Media
  featuredImage?: {
    url: string
    alt?: string
    caption?: string
  }
  
  // Author
  author: {
    name: string
    avatar?: string
    bio?: string
  }
  
  // Categorization
  category?: string
  tags?: string[]
  
  // SEO
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
    canonicalUrl?: string
    ogImage?: string
  }
  
  // Publishing
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publishedAt?: Date
  scheduledAt?: Date
  
  // Display
  isFeatured: boolean
  showInFooter: boolean
  readingTime?: number
  
  // Analytics
  viewCount: number
  likeCount: number
  shareCount: number
  
  // Settings
  allowComments: boolean
  
  createdAt: Date
  updatedAt: Date
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    // Basic Info
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    excerpt: { type: String, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    
    // Media
    featuredImage: {
      url: { type: String },
      alt: { type: String },
      caption: { type: String }
    },
    
    // Author
    author: {
      name: { type: String, required: true, default: 'Gibbon Nutrition' },
      avatar: { type: String },
      bio: { type: String }
    },
    
    // Categorization
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    
    // SEO
    seo: {
      metaTitle: { type: String, maxlength: 70 },
      metaDescription: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
      canonicalUrl: { type: String },
      ogImage: { type: String }
    },
    
    // Publishing
    status: { 
      type: String, 
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft'
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    
    // Display
    isFeatured: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: true },
    readingTime: { type: Number, default: 0 },
    
    // Analytics
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    
    // Settings
    allowComments: { type: Boolean, default: true }
  },
  { timestamps: true }
)

// Indexes
// Note: slug index already created by field definition with unique: true
BlogPostSchema.index({ status: 1, publishedAt: -1 })
BlogPostSchema.index({ category: 1 })
BlogPostSchema.index({ tags: 1 })
BlogPostSchema.index({ isFeatured: 1 })
BlogPostSchema.index({ showInFooter: 1 })

// Calculate reading time before save
BlogPostSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    this.readingTime = Math.ceil(wordCount / wordsPerMinute)
  }
  next()
})

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema)
