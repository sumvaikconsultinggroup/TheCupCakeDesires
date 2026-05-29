import mongoose from 'mongoose'

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    coverImage: {
      type: String,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      trim: true,
      default: 'General',
    },

    author: {
      type: String,
      required: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    views: {
      type: Number,
      default: 0,
    },

    metaTitle: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // SEO
    seo: {
      metaTitle: { type: String, maxlength: 70 },
      metaDescription: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
      canonicalUrl: { type: String },
      ogImage: { type: String },
      robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
        noarchive: { type: Boolean, default: false },
        nosnippet: { type: Boolean, default: false },
        noimageindex: { type: Boolean, default: false }
      }
    }
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  }
)

// Auto-generate slug
blogSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }
  next()
})

// Prevent model overwrite when hot reloading in Next.js
export default mongoose.models.Blog || mongoose.model('Blog', blogSchema)
