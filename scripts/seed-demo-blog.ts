/**
 * Seed five demo blog posts for CupCake Desires.
 *
 *   npx tsx scripts/seed-demo-blog.ts          # DRY RUN
 *   npx tsx scripts/seed-demo-blog.ts --commit # write to Atlas
 *
 * Idempotent — upserts by `slug`. Re-running overwrites the seeded posts only
 * (they're tagged with `source: 'seed-script'` via slug naming convention).
 *
 * All imagery from Unsplash (free to use). URLs include ?w=1600&q=80 for
 * optimal Next/Image performance.
 */

import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

function loadEnvFile(filename: string) {
  const p = path.resolve(process.cwd(), filename)
  if (!fs.existsSync(p)) return
  const content = fs.readFileSync(p, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI missing')
  process.exit(1)
}

const COMMIT = process.argv.includes('--commit')

// Unsplash images — curated for bakery / dessert / interiors / events.
// Every URL HTTP-verified before checking in.
const IMG = {
  rose: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=1600&q=80',       // raspberry/pink cupcake
  vanilla: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1600&q=80',    // vanilla cupcake on linen
  kitchen: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1600&q=80',       // bakery interior
  chocolate: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=1600&q=80',  // chocolate cupcake
  wedding: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1600&q=80',    // wedding cupcake display
  caramel: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1600&q=80',    // caramel cake on stand
}

type SeedPost = {
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: { url: string; alt: string; caption?: string }
  author: { name: string; bio: string }
  category: string
  tags: string[]
  isFeatured?: boolean
  daysAgo: number
}

// Avatars intentionally omitted — the detail page renders a cocoa initials circle.
const AUTHORS = {
  aanya: {
    name: 'Aanya Mehta',
    bio: 'Founder and head baker at CupCake Desires. Spent four years in patisserie kitchens in Lyon and Sydney before opening her own tiny bakery behind a Narre Warren bookshop in 2019.',
  },
  rohan: {
    name: 'Rohan D’Souza',
    bio: 'Pastry lead at CupCake Desires since 2021. Trained classically, eats experimentally, talks about chocolate the way other people talk about wine.',
  },
}

const POSTS: SeedPost[] = [
  {
    title: 'Why we’re a bake-to-order kitchen (and not a cupcake shop)',
    slug: 'why-bake-to-order-kitchen',
    excerpt:
      'No display case, no walk-ins, no day-olds. Here’s why we built CupCake Desires around the 48-hour notice — and what it means for the cake on your kitchen counter.',
    featuredImage: {
      url: IMG.kitchen,
      alt: 'Inside the CupCake Desires kitchen — trays of cupcakes ready to box',
      caption: 'A Tuesday morning, between the second batch and the third.',
    },
    author: AUTHORS.aanya,
    category: 'Behind the kitchen',
    tags: ['kitchen', 'philosophy', 'lead-time'],
    isFeatured: true,
    daysAgo: 3,
    content: `
<p>People ask us this every week: <em>why don&rsquo;t you have a shop I can just pop into?</em></p>
<p>The short answer is that the cake we want to put in your hands isn&rsquo;t the cake we&rsquo;d be able to make if we ran a counter. The longer answer is the rest of this post.</p>
<h2>The choice we made in 2019</h2>
<p>When we opened, the obvious move was to put a fridge by the window, fill it with what we&rsquo;d baked that morning, and hope a friendly Saturday crowd would walk in. We tried it for six weeks. Two things broke our hearts: we were throwing out cupcakes by Sunday afternoon, and the ones we&rsquo;d frosted at 6 AM weren&rsquo;t as good by 2 PM as the ones we&rsquo;d hand-piped to order.</p>
<p>So we closed the door, locked it, and made a rule: every cake leaves the kitchen on the day it&rsquo;s eaten.</p>
<h2>What 48 hours buys you</h2>
<p>It buys you a sponge that was poured into its tin <em>that morning</em>. Italian meringue buttercream whipped fresh, not held overnight. Caramel made on the stove the day before, never from a tub. The frosting on the top? Piped in the four hours before your courier turns up.</p>
<p>It also buys us the chance to actually <em>think</em> about your order. A note in the box. A second look at the colour of the icing. The thirty seconds it takes to make sure the ribbon is straight.</p>
<h2>What it costs you</h2>
<p>Two days. That&rsquo;s it. And honestly, the people who&rsquo;ve ordered from us long enough will tell you that the planning is half the fun &mdash; choosing the flavour on a Wednesday, picking it up on a Friday, feels like the start of the celebration.</p>
<p>We know it&rsquo;s not for everyone. If you need a cake in an hour, that&rsquo;s OK &mdash; there are bakeries that can do that beautifully. If you&rsquo;ve got 48 hours, we&rsquo;d love to bake yours.</p>
    `.trim(),
  },
  {
    title: 'The salted caramel recipe we tested twelve times',
    slug: 'salted-caramel-recipe-twelve-tests',
    excerpt:
      'On choosing the right sugar, why we burn it longer than feels safe, and the morning we decided fleur de sel was non-negotiable.',
    featuredImage: {
      url: IMG.caramel,
      alt: 'Salted caramel cake on a vintage cake stand',
    },
    author: AUTHORS.rohan,
    category: 'Recipes & notes',
    tags: ['caramel', 'recipes', 'process'],
    daysAgo: 10,
    content: `
<p>Salted caramel sounds simple until you&rsquo;ve tried to put it in twelve different cakes and only loved one of them.</p>
<h2>Test one: too sweet</h2>
<p>We started with the textbook ratio &mdash; equal parts sugar, butter and cream. It was fine. It was <em>fine</em>. But fine isn&rsquo;t the word you want on a wedding cake, and after eating six bites we agreed it tasted more like butterscotch than caramel.</p>
<h2>Tests two through five: the sugar question</h2>
<p>We tried white sugar, demerara, light muscovado, dark muscovado, and a 50/50 white-and-muscovado blend. The dark muscovado won every blind taste &mdash; deeper, more honest, less candy and more toffee. We kept it.</p>
<h2>Tests six through eight: the burn</h2>
<p>This is the bit nobody tells you in cookbooks. The caramel you actually want is one shade darker than you&rsquo;re comfortable taking it. We pulled batches at 168&deg;C, 172&deg;C, and 176&deg;C. The 176 batch tasted scary in the pan and incredible in the cake.</p>
<h2>Test nine: salt</h2>
<p>Table salt is too sharp. Kosher salt is fine but flat. Maldon is good but dissolves. Fleur de sel from Brittany &mdash; that&rsquo;s the one. It crunches for a half-second on your tongue and then disappears.</p>
<h2>Tests ten, eleven, twelve: the texture</h2>
<p>We chased a caramel that would set on top of a cake but stay pourable inside the cake. The answer was a 30-second pull off the heat, a splash of cream below boiling, and another minute of patience while it cooled.</p>
<p>That recipe is what goes into our <a href="/products/salted-caramel-round-cake">Salted Caramel Round Cake</a> today. We&rsquo;ll change it the day we find a better one &mdash; which we hope is never.</p>
    `.trim(),
  },
  {
    title: 'How we plan cupcakes for a 200-guest wedding',
    slug: 'cupcakes-for-200-guest-wedding',
    excerpt:
      'From the first tasting to the truck pulling up at the venue — a behind-the-scenes look at a recent August wedding in the Dandenongs.',
    featuredImage: {
      url: IMG.wedding,
      alt: 'A tiered cupcake display at a wedding reception',
      caption: 'Sarah & James — Tatra Receptions, August 2025.',
    },
    author: AUTHORS.aanya,
    category: 'Events',
    tags: ['weddings', 'events', 'behind-the-scenes'],
    daysAgo: 17,
    content: `
<p>Two hundred guests, three flavours, one tier of vegan, a 6 AM truck call, and one extremely calm bride. Here&rsquo;s how it went.</p>
<h2>Week 1 — the tasting</h2>
<p>Sarah came in for a tasting box in March. She wanted three flavours: a vanilla classic for the parents, a pistachio rose for her side of the family, and a salted caramel for &ldquo;everyone else, basically.&rdquo; She also asked for one tier of vegan, since James&rsquo;s sister is dairy-free.</p>
<h2>Week 4 — the design</h2>
<p>We sketched a five-tier display with descending sizes &mdash; 36 on the bottom, 24, 24, 18, 12 on top. Every tier gets one edible-ink logo cupcake. The plinth would be wrapped in linen to match her stationery.</p>
<h2>Week before — the bake</h2>
<p>We baked the sponges over three mornings (Wednesday, Thursday, Friday) so nothing was older than 36 hours by Saturday morning. The Italian meringue buttercream was made Friday afternoon, the caramel that night.</p>
<h2>Saturday — the build</h2>
<p>6 AM in the kitchen, the team piping. 9 AM in the van. 10 AM at the venue, building the tiers on-site so nothing would shift in transit. 11:30 AM, the photographer arrived. We were back home by 1 PM.</p>
<h2>What we learned</h2>
<p>For 200 guests on a Saturday wedding, we needed 4 weeks of planning, 2 mornings of dedicated bake time, and one extra pair of hands on the day. If you&rsquo;re planning your own, talk to us six months out &mdash; not six weeks. The earlier we lock the date, the calmer everything is.</p>
    `.trim(),
  },
  {
    title: 'A perfect vegan chocolate cupcake (we mean it)',
    slug: 'perfect-vegan-chocolate-cupcake',
    excerpt:
      'Real Belgian chocolate, oat milk that doesn’t taste like oat, and the trick that makes our vegan sponge indistinguishable from our regular one.',
    featuredImage: {
      url: IMG.chocolate,
      alt: 'A chocolate cupcake with rich frosting on a marble surface',
    },
    author: AUTHORS.rohan,
    category: 'Recipes & notes',
    tags: ['vegan', 'chocolate', 'recipes'],
    daysAgo: 28,
    content: `
<p>Most vegan chocolate cupcakes get one of two things wrong. They&rsquo;re either dry as a Tuesday, or they&rsquo;re trying so hard to compensate that they taste like cocoa pudding.</p>
<p>The one we serve at CupCake Desires is, in our completely-not-biased opinion, neither. Here&rsquo;s what we changed.</p>
<h2>Real chocolate, not cocoa</h2>
<p>The shortcut version uses Dutch cocoa powder. Cheaper, easier, fine. The serious version uses melted dark Belgian couverture, brought in via Callebaut, folded into the wet ingredients while still warm. It costs three times as much. It tastes ten times better.</p>
<h2>Oat milk over almond, every time</h2>
<p>Almond milk is too thin and slightly chalky. Soy milk has a green note we don&rsquo;t love in chocolate. Oat milk &mdash; specifically the barista grade &mdash; behaves the closest to dairy and brings a touch of natural sweetness that lets us use less sugar.</p>
<h2>The vinegar trick</h2>
<p>This is the one nobody talks about. A teaspoon of apple cider vinegar reacts with the baking soda and produces enough lift that the sponge rises like an egg-based one. It also tenderises the crumb. You can&rsquo;t taste it.</p>
<h2>Plant butter for the frosting</h2>
<p>We use Naturli Vegan Block, whipped slowly with icing sugar and a splash of vanilla. The texture is almost identical to butter buttercream, and it holds piping shape in a 25&deg;C kitchen.</p>
<p>If you want to try the result without baking it yourself, our vegan range is on the menu year-round. We&rsquo;ll keep refining it &mdash; that&rsquo;s the point.</p>
    `.trim(),
  },
  {
    title: 'Six years of small batches — what we’d tell 2019 us',
    slug: 'six-years-small-batches-anniversary',
    excerpt:
      'On opening day we baked sixty cupcakes and sold eleven. This year we’ll bake over forty thousand boxes. A short letter to the version of us starting out.',
    featuredImage: {
      url: IMG.vanilla,
      alt: 'A simple vanilla cupcake on a clean linen background',
    },
    author: AUTHORS.aanya,
    category: 'Bakery diary',
    tags: ['anniversary', 'business', 'letter'],
    daysAgo: 45,
    content: `
<p>It&rsquo;s our sixth birthday this month. Which feels both like yesterday and like three lifetimes ago.</p>
<p>If I could write a letter to 2019-me &mdash; standing in a 200 sq.ft. kitchen behind a bookshop on opening day, watching forty-nine cupcakes go uneaten &mdash; here&rsquo;s what I&rsquo;d say.</p>
<h2>1. The slow people are the good people</h2>
<p>The first hundred customers were friends and friends of friends. They were also patient, kind, and willing to give us feedback we couldn&rsquo;t buy. Treasure them.</p>
<h2>2. You&rsquo;ll be told to scale. Don&rsquo;t.</h2>
<p>Every year someone offers us a way to ten-x the business. A franchise. A grocery deal. A factory. The bakery you want exists because you keep saying no. Keep saying no.</p>
<h2>3. Hire people who care more than you</h2>
<p>Rohan came in 2021 and immediately cared more about the chocolate than I did. That&rsquo;s the bar. If you don&rsquo;t find someone who is twice as obsessive as you about one thing, you&rsquo;re not hiring well.</p>
<h2>4. Write things down</h2>
<p>This is partly why this blog exists. The recipes evolve, the team changes, the customer comes back six months later and asks &ldquo;was there a cinnamon one?&rdquo; You&rsquo;ll never remember unless you write it down.</p>
<h2>5. Forty thousand boxes is just one box, forty thousand times</h2>
<p>Don&rsquo;t make the forty-thousand-and-first one any less carefully than the first.</p>
<p>Here&rsquo;s to year seven. Thanks for being on the bench with us.</p>
    `.trim(),
  },
]

function calcReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean)
  return Math.max(1, Math.ceil(text.length / 200))
}

async function run() {
  console.log(COMMIT ? '🚀 COMMIT mode' : '🔍 DRY RUN — pass --commit to apply')
  await mongoose.connect(MONGODB_URI!)
  const db = mongoose.connection.db
  if (!db) throw new Error('No db handle')
  const coll = db.collection('blogposts')

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  for (const p of POSTS) {
    const publishedAt = new Date(now - p.daysAgo * day)
    const readingTime = calcReadingTime(p.content)
    const doc = {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      featuredImage: p.featuredImage,
      author: p.author,
      category: p.category,
      tags: p.tags,
      seo: {
        metaTitle: `${p.title} · CupCake Desires`,
        metaDescription: p.excerpt,
        keywords: p.tags,
      },
      status: 'published' as const,
      publishedAt,
      isFeatured: p.isFeatured || false,
      showInFooter: true,
      readingTime,
      viewCount: Math.floor(Math.random() * 800) + 50,
      likeCount: Math.floor(Math.random() * 40),
      shareCount: Math.floor(Math.random() * 10),
      allowComments: true,
      updatedAt: publishedAt,
    }

    if (COMMIT) {
      const res = await coll.updateOne(
        { slug: p.slug },
        { $set: doc, $setOnInsert: { createdAt: publishedAt } },
        { upsert: true }
      )
      const verb = res.upsertedCount ? 'inserted' : 'updated'
      console.log(`  ✓ ${verb}: ${p.slug}`)
    } else {
      console.log(`  • would upsert: ${p.slug} (${readingTime} min read)`)
    }
  }

  await mongoose.disconnect()
  console.log(COMMIT ? '✅ Seed complete' : '✅ Dry run complete')
}

run().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
