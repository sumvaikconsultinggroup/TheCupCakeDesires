import mongoose, { Schema, Document } from 'mongoose'

export interface IPageSEO extends Document {
  pageId: string // unique identifier like 'home', 'about', 'contact', etc.
  pageName: string
  path: string
  robots: {
    index: boolean
    follow: boolean
    noarchive?: boolean
    nosnippet?: boolean
    noimageindex?: boolean
  }
  canonical?: string
  createdAt: Date
  updatedAt: Date
}

const PageSEOSchema = new Schema<IPageSEO>(
  {
    pageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pageName: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
      noarchive: { type: Boolean, default: false },
      nosnippet: { type: Boolean, default: false },
      noimageindex: { type: Boolean, default: false },
    },
    canonical: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

const PageSEO = mongoose.models.PageSEO || mongoose.model<IPageSEO>('PageSEO', PageSEOSchema)

export default PageSEO
