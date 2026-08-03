import mongoose, { Document, Schema } from 'mongoose'
import type { MegaMenuSlug } from '@/types/mega-menu'

const linkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    collectionHandle: { type: String },
  },
  { _id: false }
)

const columnSchema = new Schema(
  {
    heading: { type: String, required: true },
    links: { type: [linkSchema], default: [] },
  },
  { _id: false }
)

const featuredSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    href: { type: String, required: true },
    image: { type: String, required: true },
    badge: { type: String },
    collectionHandle: { type: String },
  },
  { _id: false }
)

export interface IMegaMenuConfig extends Document {
  slug: MegaMenuSlug
  label: string
  href: string
  layout: 'columns-featured' | 'product-list'
  columnLayout?: 2 | 3 | 4
  description: string
  columns: {
    heading: string
    links: { label: string; href: string; collectionHandle?: string }[]
  }[]
  featured: {
    title: string
    subtitle: string
    href: string
    image: string
    badge?: string
    collectionHandle?: string
  }[]
  heroImage?: string
  heroImageAlt?: string
  isActive: boolean
  position: number
  createdAt: Date
  updatedAt: Date
}

const MegaMenuConfigSchema = new Schema<IMegaMenuConfig>(
  {
    slug: {
      type: String,
      enum: ['event', 'cupcakes', 'cakes', 'macarons'],
      required: true,
      unique: true,
    },
    label: { type: String, required: true },
    href: { type: String, required: true },
    layout: {
      type: String,
      enum: ['columns-featured', 'product-list'],
      required: true,
    },
    columnLayout: { type: Number, enum: [2, 3, 4] },
    description: { type: String, default: '' },
    columns: { type: [columnSchema], default: [] },
    featured: { type: [featuredSchema], default: [] },
    heroImage: { type: String },
    heroImageAlt: { type: String },
    isActive: { type: Boolean, default: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.MegaMenuConfig ||
  mongoose.model<IMegaMenuConfig>('MegaMenuConfig', MegaMenuConfigSchema)
