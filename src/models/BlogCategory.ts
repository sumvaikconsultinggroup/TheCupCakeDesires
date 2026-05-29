import mongoose, { Document, Schema } from 'mongoose'

export interface IBlogCategory extends Document {
  name: string
  slug: string
  description?: string
  image?: string
  color?: string
  order: number
  isActive: boolean
  postCount: number
  createdAt: Date
  updatedAt: Date
}

const BlogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    image: { type: String },
    color: { type: String, default: '#3b82f6' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    postCount: { type: Number, default: 0 }
  },
  { timestamps: true }
)

// Note: slug index already created by field definition with unique: true
BlogCategorySchema.index({ order: 1 })

export default mongoose.models.BlogCategory || mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema)
