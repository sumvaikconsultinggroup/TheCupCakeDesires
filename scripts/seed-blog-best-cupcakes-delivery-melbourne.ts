/**
 * Upserts best cupcakes for delivery Melbourne blog from PDF brief.
 * Usage: npx tsx --env-file=.env.local scripts/seed-blog-best-cupcakes-delivery-melbourne.ts
 */
import mongoose from 'mongoose'
import {
  BEST_CUPCAKES_DELIVERY_MELBOURNE_POST,
  BEST_CUPCAKES_DELIVERY_MELBOURNE_SLUG,
} from '../src/data/blog-best-cupcakes-delivery-melbourne'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI missing')
  process.exit(1)
}

const BlogPostSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    excerpt: String,
    content: String,
    featuredImage: { url: String, alt: String, caption: String },
    author: { name: String, avatar: String, bio: String },
    category: String,
    tags: [String],
    seo: mongoose.Schema.Types.Mixed,
    status: String,
    publishedAt: Date,
    isFeatured: Boolean,
    showInFooter: Boolean,
    readingTime: Number,
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    allowComments: { type: Boolean, default: true },
  },
  { timestamps: true }
)

BlogPostSchema.pre('save', function (next) {
  if (this.content) {
    const wordCount = String(this.content).replace(/<[^>]*>/g, '').split(/\s+/).length
    this.readingTime = Math.ceil(wordCount / 200)
  }
  next()
})

async function main() {
  await mongoose.connect(MONGODB_URI!)
  const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema)

  const payload = {
    ...BEST_CUPCAKES_DELIVERY_MELBOURNE_POST,
    author: { ...BEST_CUPCAKES_DELIVERY_MELBOURNE_POST.author },
    publishedAt: new Date(),
  }

  const existing = await BlogPost.findOne({ slug: BEST_CUPCAKES_DELIVERY_MELBOURNE_SLUG })
  if (existing) {
    Object.assign(existing, payload)
    await existing.save()
    console.log('Updated blog post:', BEST_CUPCAKES_DELIVERY_MELBOURNE_SLUG)
  } else {
    await BlogPost.create(payload)
    console.log('Created blog post:', BEST_CUPCAKES_DELIVERY_MELBOURNE_SLUG)
  }

  try {
    const BlogCategory =
      mongoose.models.BlogCategory ||
      mongoose.model(
        'BlogCategory',
        new mongoose.Schema({
          name: String,
          slug: { type: String, unique: true },
          postCount: { type: Number, default: 0 },
        })
      )
    await BlogCategory.findOneAndUpdate(
      { slug: 'guides' },
      {
        $setOnInsert: { name: 'Guides', slug: 'guides' },
        $inc: existing ? {} : { postCount: 1 },
      },
      { upsert: true }
    )
  } catch (e: any) {
    console.warn('Category upsert skipped:', e.message)
  }

  await mongoose.disconnect()
  console.log('Done. View at /blogs/best-cupcakes-delivery-melbourne')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
