import { Document, Schema, model, models } from 'mongoose'

/* ------------------------------- Review Types ------------------------------ */

export interface IReview {
  star: number
  reviewerName: string
  reviewDescription: string
  image?: string
  helpfulVotes?: string[]
  helpfulCount?: number
  userId?: string
  isApproved?: boolean
}

/* ------------------------------- Variant Types ------------------------------ */
export interface IVariant {
  option1Value: string
  option2Value?: string
  option3Value?: string
  sku?: string
  grams?: number
  inventoryQty?: number
  inventoryPolicy?: 'deny' | 'continue'
  price: number
  compareAtPrice?: number
  requiresShipping?: boolean
  taxable?: boolean
  barcode?: string
  image?: string
  weightUnit?: string
  taxCode?: string
  costPerItem?: number
}

/* ------------------------------- Product Types ------------------------------ */
export interface IProduct extends Document {
  handle: string
  title: string
  bodyHtml?: string
  vendor?: string
  productCategory?: string
  type?: string
  tags?: string[]
  published?: boolean
  options?: { name: string; values: string[] }[]
  variants?: IVariant[]
  images?: { src: string; position?: number; altText?: string }[]
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
  giftCard?: boolean
  ratingCount?: number
  status?: 'active' | 'draft' | 'archived'
  reviews?: IReview[]
  isDeleted?: boolean
  ingredients?: string
  howToUse?: string
  faq?: { question: string; answer: string }[]
  hsn?: string
  // Bakery-specific fields
  flavours?: string[]
  isEggless?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
  currency?: string
}

/* ------------------------------- Variant Schema ------------------------------ */
const variantSchema = new Schema<IVariant>(
  {
    option1Value: { type: String, required: true },
    option2Value: String,
    option3Value: String,
    sku: String,
    grams: Number,
    inventoryQty: { type: Number, default: 0 },
    inventoryPolicy: {
      type: String,
      enum: ['deny', 'continue'],
      default: 'deny',
    },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    requiresShipping: { type: Boolean, default: true },
    taxable: { type: Boolean, default: true },
    barcode: String,
    image: String,
    weightUnit: { type: String, default: 'kg' },
    taxCode: String,
    costPerItem: Number,
  },
  { _id: true }
)

/* ------------------------------- Review Schema ------------------------------ */
const reviewSchema = new Schema<IReview>(
  {
    star: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewerName: { type: String, required: true },
    reviewDescription: { type: String, required: true },
    image: String,
    helpfulVotes: [{ type: String }],
    helpfulCount: { type: Number, default: 0 },
    userId: { type: String },
    isApproved: { type: Boolean, default: false },
  },
  { _id: true, versionKey: false, timestamps: true }
)

/* ------------------------------- Product Schema ------------------------------ */
const productSchema = new Schema<IProduct>(
  {
    handle: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    bodyHtml: String,
    vendor: String,
    productCategory: String,
    type: String,
    tags: [String],
    published: { type: Boolean, default: true },

    options: [{ name: String, values: [String] }],
    variants: [variantSchema],

    images: [
      {
        src: String,
        position: Number,
        altText: String,
        variantId: String, // Add this field to associate image with variant
      },
    ],

    seo: {
      title: String,
      description: String,
      robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
        noarchive: { type: Boolean, default: false },
        nosnippet: { type: Boolean, default: false },
        noimageindex: { type: Boolean, default: false },
      },
      canonical: String,
    },

    giftCard: { type: Boolean, default: false },
    ratingCount: Number,
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },

    reviews: [reviewSchema],
    isDeleted: { type: Boolean, default: false },
    ingredients: String,
    howToUse: String,
    faq: [{ question: String, answer: String }],
    hsn: { type: String, trim: true },

    /* ----- Bakery-specific fields ----- */
    flavours: { type: [String], default: [] },
    isEggless: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    currency: { type: String, default: 'AUD' },
  },
  { timestamps: true, versionKey: false }
)

/* ------------------------------- Indexes ------------------------------ */
productSchema.index({ vendor: 1 })
productSchema.index({ status: 1 })
productSchema.index({ published: 1 })

/* ------------------------------- Model Export ------------------------------ */
const Product = models?.Product || model<IProduct>('Product', productSchema)

export default Product
