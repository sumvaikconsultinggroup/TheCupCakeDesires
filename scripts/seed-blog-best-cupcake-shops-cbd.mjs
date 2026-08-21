/**
 * Upserts the "Best Cupcake Shops in Melbourne CBD" blog post.
 * Usage: node --env-file=.env.local scripts/seed-blog-best-cupcake-shops-cbd.mjs
 */
import mongoose from 'mongoose'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Load compiled/ts content via dynamic import of the data shape inline
// (keep script self-contained so it runs without tsx path issues)

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing. Run with: node --env-file=.env.local scripts/seed-blog-best-cupcake-shops-cbd.mjs')
  process.exit(1)
}

const SLUG = 'best-cupcake-shops-in-melbourne-cbd'

const post = {
  title: 'Best Cupcake Shops in Melbourne CBD',
  slug: SLUG,
  excerpt:
    'Craving something sweet in Melbourne? Discover the best cupcake shops in Melbourne CBD — from The Cupcake Desire to Joy Cupcakes — fresh frosting, gourmet flavours, and delivery-friendly treats.',
  category: 'Guides',
  tags: [
    'melbourne cbd',
    'best cupcake shops',
    'cupcake delivery melbourne',
    'corporate cupcakes',
    'melbourne desserts',
  ],
  featuredImage: {
    url: '/images/Best-Cupcakes-Shops-in-Melbourne-CBD-The-Cupcake-Desire-main.png',
    alt: 'Best cupcake shops in Melbourne CBD — The Cupcake Desire',
    caption: 'Exploring Melbourne CBD’s best cupcake bakeries',
  },
  author: {
    name: 'Rupal Mahajan',
    avatar: '/images/Rupal-Mahajan-Author-Picture.webp',
    bio: 'Rupal Mahajan is the proud owner and creative heart behind Cupcake Desire, a beloved bakery I established in 2012. What began as a simple passion for baking quickly blossomed into a thriving business built on my commitment to quality, customer service, and spreading happiness through every bite. With an unwavering dedication to crafting cupcakes that delight both the eye and the palate, I have turned my love for baking into a joyful journey—one that continues to bring smiles to my community every day. Beyond the kitchen, I also enjoy sharing meaningful insights and valuable knowledge from the baking world through my self-written blogs. Whether it’s answering the questions people often wonder about or exploring trends shaping the industry, these writings allow me to connect on a deeper, more personal level with those who appreciate the craft. Through storytelling and helpful guidance, I hope to inspire curiosity, spark creativity, and make the world of cupcakes feel a little closer to everyone who follows my journey.',
  },
  status: 'published',
  isFeatured: true,
  showInFooter: true,
  publishedAt: new Date(),
  seo: {
    metaTitle: '5+ Best Cupcake Shops in Melbourne CBD | The Cupcake Desire',
    metaDescription:
      'Looking for the best cupcake shops in Melbourne CBD? Compare The Cupcake Desire, Cupcake Queens, Little Cupcakes, Cupcake Central, Joy Cupcakes, and Ruwi’s Cakes.',
    keywords: [
      'best cupcake shops melbourne cbd',
      'cupcakes melbourne',
      'best cupcake delivery melbourne',
      'corporate cupcakes melbourne',
    ],
    canonicalUrl: '/blogs/best-cupcake-shops-in-melbourne-cbd',
    ogImage: '/images/Best-Cupcakes-Shops-in-Melbourne-CBD-The-Cupcake-Desire-main.png',
    robots: { index: true, follow: true },
  },
  content: `
<p>Craving the sweetness and something creamy, Melbourne? You’re in for a treat! The Melbourne CBD is home to some of the most delicious cupcake stores, where each bite is a complete combination of taste, creativity, and pleasure. Here are some <strong>best cupcake shops in Melbourne CBD</strong> listed below. These bakeries make desserts special, offering gourmet treats topped with homemade frosting. Whether you need a quick pick-me-up with your coffee, want to give someone a present, or want to organize a party and are looking for mouth-watering dessert ideas in Melbourne, we’ve got you covered.</p>

<p>We are going to search for the best cupcakes in Melbourne CBD that will be well worth the calories!</p>

<nav class="blog-toc" aria-label="Table of contents">
  <p>Table of contents</p>
  <ol>
    <li><a href="#the-cupcake-desire">The Cupcake Desire</a></li>
    <li><a href="#the-cupcake-queens">The Cupcake Queens</a></li>
    <li><a href="#little-cupcakes">Little Cupcakes</a></li>
    <li><a href="#cupcake-central">Cupcake Central</a></li>
    <li><a href="#joy-cupcakes">Joy Cupcakes</a></li>
    <li><a href="#ruwis-cakes">Ruwi’s Cakes</a></li>
  </ol>
</nav>

<h2>Best Cupcake Shops in Melbourne CBD</h2>

<div class="blog-shop" id="the-cupcake-desire">
  <div class="blog-shop-header">
    <img class="blog-shop-logo" src="/images/The-Cupcake-Desire-Logo.png" alt="The Cupcake Desire logo" width="64" height="64" />
    <h3>1. The Cupcake Desire</h3>
  </div>
  <p>Each bite at The Cupcake Desire is baked with love and perfection. Our cupcakes, cakes, and macarons are baked fresh on a daily basis, and only natural ingredients are used without artificial preservatives. We are renowned for our birthday and <a href="/corporate"><strong>corporate cupcakes in Melbourne</strong></a>.</p>
  <p>Our store offers more than 19 irresistible flavors, with options to customize according to the occasion, that are as addictive as they are exquisite. A single bite, and you would know why our customers cannot stop coming back to us. With a wide variety of flavors, designs, and customization options, we ensure everyone gets the best. We only use the finest quality ingredients to make sure that your bites taste fresh. The quality is something which has never been compromised, and so at The Cupcake Desire, they make sure that you get cupcakes for events which are fresh, fluffy, and full of flavour.</p>
  <p>The Cupcake Desire serves your cravings and needs with the best cupcake shop in Melbourne CBD for all occasions; be it a birthday, wedding, baby shower, or a corporate event, we serve them gracefully and delicately with a wonderful taste, quality, and service.</p>
  <p><a href="/collections/standard-cupcakes">Shop our cupcakes →</a></p>
</div>

<div class="blog-shop" id="the-cupcake-queens">
  <div class="blog-shop-header">
    <img class="blog-shop-logo" src="/images/The-Cupcake-Queens-Logo.png" alt="The Cupcake Queens logo" width="64" height="64" />
    <h3>2. The Cupcake Queens</h3>
  </div>
  <p>The Cupcake Queens is a family bakery with a popular status in the Melbourne dessert culture. They opened their first store in 2010 and currently have eight within the city, such as Williamstown, CBD, and Chadstone. Famous for their freshly baked cupcakes, they have a wide variety of flavours, including the traditional vanilla and the latest trends, so that there’s something satisfying for each taste.</p>
</div>

<div class="blog-shop" id="little-cupcakes">
  <div class="blog-shop-header">
    <img class="blog-shop-logo" src="/images/Little-Cupcakes-Logo.png" alt="Little Cupcakes logo" width="64" height="64" />
    <h3>3. Little Cupcakes</h3>
  </div>
  <p>Little Cupcakes is a treasured Melbourne-based bakery with an excellent reputation for producing fresh cupcakes, cakes, and cookies daily. They have several stores across various locations where they provide a mouth-watering number of flavours, ranging back to their traditional vanilla to their new seasonal flavours. They deliver quality and customer satisfaction, and in this respect, offer reliable delivery services to Melbourne and thus are able to enjoy their delicious desserts from the comfort of their homes.</p>
</div>

<div class="blog-shop" id="cupcake-central">
  <div class="blog-shop-header">
    <img class="blog-shop-logo" src="/images/Cupcake-Central-Logo.png" alt="Cupcake Central logo" width="64" height="64" />
    <h3>4. Cupcake Central</h3>
  </div>
  <p>Cupcake Central is a renowned bakery located in Melbourne that bakes freshly handmade cupcakes, cookies, and cakes. It has been serving dessert delights to dessert-lovers with a wide range of flavours since 2010, including vegan and gluten-free options. Besides the traditional and mini cupcakes, they have the best cupcake shops in Melbourne CBD. There are personalized cupcakes with logos, a gift box, and other delicacies such as brownies and slices. It has several outlets in Melbourne in Highpoint Shopping Center, Little Bourke Street, and so on, where anyone can easily access it.</p>
</div>

<div class="blog-shop" id="joy-cupcakes">
  <div class="blog-shop-header">
    <img class="blog-shop-logo" src="/images/Joy-Cupcakes-Logo.png" alt="Joy Cupcakes logo" width="64" height="64" />
    <h3>5. Joy Cupcakes</h3>
  </div>
  <p>Joy Cupcakes is a bakery in Melbourne, which is famous due to its artisan cupcakes made of all-natural ingredients and without artificial colours and flavours. They bake diverse flavours every day in the morning, and some of the favourable ones are salted caramel, rosewater and pistachio, strawberry shortcake, and lemon meringue. They also sell limited edition products like jam donuts and sticky date cupcakes, as well as gluten-free and vegan options. This is among the best cupcake shops in Melbourne. Cupcakes are sold in various places, such as Southern Cross Lane, CBD, and in Westfield Doncaster.</p>
</div>

<div class="blog-shop" id="ruwis-cakes">
  <div class="blog-shop-header">
    <img class="blog-shop-logo" src="/images/Ruwis-Cupcakes-Logo.png" alt="Ruwi’s Cakes logo" width="64" height="64" />
    <h3>6. Ruwi’s Cakes</h3>
  </div>
  <p>Ruwi Cakes production is a boutique bakery located in Melbourne with a reputation for artistic, flavoured, and designed cakes. The business, started by a former sports star, Ruwindi Serasinghe, has expanded to be one of the places to get quality celebration cakes, wedding cakes, and fine desserts. Based in Cranbourne West, Ruwi Cakes delivers its products to all parts of Melbourne, with most of its orders being delivered on a next-day basis.</p>
</div>

<h2>Conclusion</h2>

<p>The Melbourne CBD spoils the dessert lovers with its large variety of cupcake shops, all with their own style, tastes, and innovations. The bakeries in the city can offer you something that will quench any desire, whether it is for some birthday parties, something extravagant, or something made to order. Melt-in-your-mouth textures or rich frostings, lavish designs, each cupcake has a story of attention and its love.</p>

<p>Looking for the best cupcake shop in Melbourne CBD? One of them is <strong>The Cupcake Desire</strong>, which offers fresh, the best cupcake delivery in Melbourne, and is committed to quality.</p>

<p>Next time you find yourself in Melbourne, do yourself a favor — cupcakes here are happiness in a bite!</p>

<p><a href="/collections/all-items">Browse The Cupcake Desire menu →</a> · <a href="/contact">Contact us</a> · <a href="/corporate">Corporate cupcakes</a></p>
`.trim(),
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
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length
    this.readingTime = Math.ceil(wordCount / 200)
  }
  next()
})

async function main() {
  await mongoose.connect(MONGODB_URI)
  const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema)

  const existing = await BlogPost.findOne({ slug: SLUG })
  if (existing) {
    Object.assign(existing, post)
    await existing.save()
    console.log('Updated blog post:', SLUG)
  } else {
    await BlogPost.create(post)
    console.log('Created blog post:', SLUG)
  }

  // Ensure category exists if BlogCategory is used
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
  } catch (e) {
    console.warn('Category upsert skipped:', e.message)
  }

  await mongoose.disconnect()
  console.log('Done. View at /blogs/best-cupcake-shops-in-melbourne-cbd')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
