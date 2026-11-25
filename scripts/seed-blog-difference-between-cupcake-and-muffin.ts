/**
 * Upserts the cupcake versus muffin guide.
 * Usage: npx tsx --env-file=.env.local scripts/seed-blog-difference-between-cupcake-and-muffin.ts
 */
import mongoose from 'mongoose'
import {
  CUPCAKE_MUFFIN_POST,
  CUPCAKE_MUFFIN_SLUG,
} from '../src/data/blog-difference-between-cupcake-and-muffin'

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
  if (CUPCAKE_MUFFIN_POST.excerpt.length > 300) {
    throw new Error(`Excerpt is ${CUPCAKE_MUFFIN_POST.excerpt.length} characters`)
  }
  if ((CUPCAKE_MUFFIN_POST.seo.metaDescription || '').length > 160) {
    throw new Error('Meta description is over 160 characters')
  }
  if ((CUPCAKE_MUFFIN_POST.seo.metaTitle || '').length > 70) {
    throw new Error('Meta title is over 70 characters')
  }

  await mongoose.connect(MONGODB_URI!)
  const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema)

  const payload = {
    ...CUPCAKE_MUFFIN_POST,
    author: { ...CUPCAKE_MUFFIN_POST.author },
    publishedAt: new Date(),
  }

  const existing = await BlogPost.findOne({ slug: CUPCAKE_MUFFIN_SLUG })
  if (existing) {
    Object.assign(existing, payload)
    await existing.save()
    console.log('Updated blog post:', CUPCAKE_MUFFIN_SLUG)
  } else {
    await BlogPost.create(payload)
    console.log('Created blog post:', CUPCAKE_MUFFIN_SLUG)
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
        ...(existing ? {} : { $inc: { postCount: 1 } }),
      },
      { upsert: true }
    )
  } catch (e: any) {
    console.warn('Category upsert skipped:', e.message)
  }

  await mongoose.disconnect()
  console.log('Done. View at /blogs/difference-between-cupcake-and-muffin')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
