/**
 * Upserts best vegan cakes for birthdays blog.
 * Usage: npx tsx --env-file=.env.local scripts/seed-blog-best-vegan-cakes-birthdays.ts
 */
import mongoose from 'mongoose'
import {
  VEGAN_BIRTHDAY_CAKES_POST,
  VEGAN_BIRTHDAY_CAKES_SLUG,
} from '../src/data/blog-best-vegan-cakes-melbourne-birthdays'

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
    ...VEGAN_BIRTHDAY_CAKES_POST,
    author: { ...VEGAN_BIRTHDAY_CAKES_POST.author },
    publishedAt: new Date(),
  }

  const existing = await BlogPost.findOne({ slug: VEGAN_BIRTHDAY_CAKES_SLUG })
  if (existing) {
    Object.assign(existing, payload)
    await existing.save()
    console.log('Updated blog post:', VEGAN_BIRTHDAY_CAKES_SLUG)
  } else {
    await BlogPost.create(payload)
    console.log('Created blog post:', VEGAN_BIRTHDAY_CAKES_SLUG)
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
  console.log('Done. View at /blogs/best-vegan-cakes-in-melbourne-for-birthdays')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
