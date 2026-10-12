import mongoose, { Document, Schema } from 'mongoose'
import type { MegaMenuFeaturedCard, MegaMenuLink, MegaMenuSlug } from '@/types/mega-menu'

const LINK_TYPES = ['collection', 'product', 'custom']

const linkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    type: { type: String, enum: LINK_TYPES },
    collectionHandle: { type: String },
    productHandle: { type: String },
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
    type: { type: String, enum: LINK_TYPES },
    collectionHandle: { type: String },
    productHandle: { type: String },
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
  columns: { heading: string; links: MegaMenuLink[] }[]
  featured: MegaMenuFeaturedCard[]
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
