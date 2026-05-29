/**
 * Seed sample description + reviews for /products/salted-caramel-round-cake.
 *
 *   npx tsx scripts/seed-salted-caramel-cake-content.ts          # DRY RUN
 *   npx tsx scripts/seed-salted-caramel-cake-content.ts --commit # write to Atlas
 *
 * Idempotent — re-running upserts the description and replaces ONLY the seeded
 * reviews (tagged with source='manual' and adminNotes='seed-script') so any
 * real customer reviews stay untouched.
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
  console.error('MONGODB_URI missing from .env.local')
  process.exit(1)
}

const COMMIT = process.argv.includes('--commit')
const HANDLE = 'salted-caramel-round-cake'
const SEED_TAG = 'seed-script:salted-caramel-round-cake'

const SHORT_DESCRIPTION =
  'A four-layer salted caramel sponge soaked in Madagascar vanilla syrup, sandwiched with house-made salted caramel and a whipped mascarpone buttercream. Finished with cocoa nib brittle and a drizzle of fleur de sel caramel — sweet, smoky, just the right amount of salt.'

const DESCRIPTION_INTRO =
  'This is the cake people order twice. The one that arrives on the kitchen counter, sits there for ten minutes, and then somebody’s found a fork.'

const WHATS_INSIDE = [
  'Four layers of brown-butter salted caramel sponge',
  'House-made salted caramel filling (made fresh that morning)',
  'Whipped mascarpone & vanilla bean buttercream',
  'Cocoa nib brittle on top',
  'A final drizzle of fleur de sel caramel',
]

const HOW_TO_SERVE =
  'This cake travels best at room temperature. If yours arrives chilled, let it sit out for 20–30 minutes before slicing — the buttercream relaxes, the caramel softens, and everything just tastes more like itself. A sharp knife dipped in hot water gives the cleanest slices.'

const ALLERGENS = {
  contains: ['Wheat', 'Dairy', 'Eggs'],
  note: 'Made in a kitchen that handles nuts and soy — please drop us a note before ordering if you have a severe allergy.',
}

const STORAGE = {
  roomTemp: 'Up to 2 days, covered',
  fridge: 'Up to 4 days in an airtight box',
}

// Legacy combined bodyHtml — kept for SEO / fallback
const BODY_HTML = `
<p>${DESCRIPTION_INTRO}</p>
<p>We bake the sponges in small 6&Prime; and 8&Prime; tins the morning of your delivery, using browned butter, free-range eggs from Gippsland, and a tip of pure muscovado for that toffee depth.</p>
<h3>What&rsquo;s inside</h3>
<ul>
${WHATS_INSIDE.map((i) => `  <li>${i}</li>`).join('\n')}
</ul>
<h3>How to serve it</h3>
<p>${HOW_TO_SERVE}</p>
<h3>Allergens &amp; storage</h3>
<p>Contains: ${ALLERGENS.contains.join(', ').toLowerCase()}. ${ALLERGENS.note} Keep ${STORAGE.roomTemp.toLowerCase()}, or refrigerated ${STORAGE.fridge.toLowerCase()}.</p>
`.trim()

const REVIEWS = [
  {
    name: 'Aarav P.',
    rating: 5,
    title: 'Ordered for my wife’s birthday — gone in 15 minutes',
    content:
      'We&rsquo;ve tried a lot of bakeries in Melbourne. This one is in a different league. The caramel is genuinely salted (not just sweet pretending), and the sponge is so light it almost falls apart on the fork. Got the 8" for eight people and we ate the whole thing.',
    verified: true,
    daysAgo: 4,
  },
  {
    name: 'Sophie M.',
    rating: 5,
    title: 'Beat my favourite patisserie',
    content:
      'I ordered this for an anniversary dinner expecting "nice" and got "stop the room, what is this." The brittle on top adds a textural thing I wasn&rsquo;t expecting and the mascarpone keeps the sweetness in check. Will reorder for every milestone.',
    verified: true,
    daysAgo: 9,
  },
  {
    name: 'James L.',
    rating: 5,
    title: 'Worth the two-day wait',
    content:
      'Initially hesitant about the 2-day lead time but absolutely worth planning ahead for. The team kept me updated, delivery was on time, and the cake landed in perfect condition (still sealed, still cold packs intact).',
    verified: true,
    daysAgo: 14,
  },
  {
    name: 'Priya R.',
    rating: 5,
    title: 'The caramel ratio is perfect',
    content:
      'You can tell when caramel is made from a tub versus actual stovetop caramel. This is the real thing — bittersweet, a little smoky, and the salt doesn&rsquo;t cross the line. The whole cake feels considered.',
    verified: true,
    daysAgo: 18,
  },
  {
    name: 'Daniel K.',
    rating: 4,
    title: 'Loved it — would order again',
    content:
      'Really good cake. Sponge was tender, frosting was light, caramel tasted homemade. Took off one star only because I wish there was a little more caramel between the layers — but honestly that&rsquo;s personal preference. The 6" easily served 4 happy adults.',
    verified: true,
    daysAgo: 23,
  },
  {
    name: 'Maya T.',
    rating: 5,
    title: 'For a corporate offsite',
    content:
      'Ordered six of these for our quarterly offsite. Easy to coordinate with the team, invoicing was clean, and the cakes arrived together in branded boxes. Three different people came up to me asking where they were from.',
    verified: true,
    daysAgo: 31,
  },
  {
    name: 'Olivia C.',
    rating: 5,
    title: 'My new go-to gift',
    content:
      'Sent this to my mum for her birthday — she lives across town in Box Hill — and she called the next morning still talking about it. Beautifully boxed, the ribbon was a lovely touch, and the little hand-written note was unexpected. Customer service replied to my email within an hour.',
    verified: false,
    daysAgo: 40,
  },
  {
    name: 'Ethan W.',
    rating: 5,
    title: 'Bought for a wedding tasting — booked them on the spot',
    content:
      'We were narrowing down bakers for our wedding cake and ordered this as a sample. It was the easiest decision we made. The texture, the depth of the caramel, the way it looks before you cut it — all just right. Booked them for September.',
    verified: true,
    daysAgo: 52,
  },
  {
    name: 'Ananya S.',
    rating: 4,
    title: 'Beautiful — just very rich',
    content:
      'Stunning cake. The caramel is so good it almost works on its own. Just be ready for richness — a small slice goes a long way. I&rsquo;d serve this with strong coffee or unsweetened cream. Lovely for a special occasion, not an everyday bake.',
    verified: true,
    daysAgo: 68,
  },
  {
    name: 'Liam D.',
    rating: 5,
    title: 'Brittle on top is genius',
    content:
      'Real talk — the cocoa nib brittle pushes this into "exceptional." It gives a crunch and a hint of bitterness that lifts the whole thing. Five stars and would happily pay more if you ever sold the brittle on its own.',
    verified: false,
    daysAgo: 80,
  },
]

async function run() {
  console.log(COMMIT ? '🚀 COMMIT mode — writing to Atlas' : '🔍 DRY RUN — no writes. Pass --commit to apply.')

  await mongoose.connect(MONGODB_URI!)
  const db = mongoose.connection.db
  if (!db) throw new Error('No db handle')

  const products = db.collection('products')
  const reviews = db.collection('reviews')

  const product = await products.findOne({ handle: HANDLE })
  if (!product) {
    console.error(`Product not found: handle=${HANDLE}`)
    process.exit(1)
  }
  console.log(`Found product: ${product.title} (id=${product._id})`)

  // 1. Update description + bodyHtml + structured story fields
  if (COMMIT) {
    await products.updateOne(
      { _id: product._id },
      {
        $set: {
          description: SHORT_DESCRIPTION,
          bodyHtml: BODY_HTML,
          descriptionIntro: DESCRIPTION_INTRO,
          whatsInside: WHATS_INSIDE,
          howToServe: HOW_TO_SERVE,
          allergens: ALLERGENS,
          storage: STORAGE,
        },
      }
    )
    console.log('  ✓ description + bodyHtml + structured story fields updated')
  } else {
    console.log(`  • would set description, bodyHtml, descriptionIntro, whatsInside (${WHATS_INSIDE.length}), howToServe, allergens (${ALLERGENS.contains.length}), storage`)
  }

  // 2. Wipe previously-seeded reviews (tagged), keep any real ones
  const seededFilter = { productId: product._id, adminNotes: SEED_TAG }
  const existing = await reviews.countDocuments(seededFilter)
  if (existing > 0) {
    if (COMMIT) {
      const del = await reviews.deleteMany(seededFilter)
      console.log(`  ✓ removed ${del.deletedCount} previously-seeded reviews`)
    } else {
      console.log(`  • would remove ${existing} previously-seeded reviews`)
    }
  }

  // 3. Insert fresh seeded reviews
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const docs = REVIEWS.map((r) => {
    const created = new Date(now - r.daysAgo * day)
    return {
      productId: product._id,
      productHandle: HANDLE,
      productTitle: product.title,
      customerName: r.name,
      customerEmail: `${r.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      rating: r.rating,
      title: r.title,
      content: r.content,
      images: [],
      status: 'approved',
      isVerifiedPurchase: r.verified,
      helpfulCount: Math.floor(Math.random() * 12),
      helpfulVotes: [],
      adminNotes: SEED_TAG,
      source: 'manual',
      reviewedAt: created,
      createdAt: created,
      updatedAt: created,
    }
  })

  if (COMMIT) {
    const ins = await reviews.insertMany(docs)
    console.log(`  ✓ inserted ${ins.insertedCount} seeded reviews`)
  } else {
    console.log(`  • would insert ${docs.length} seeded reviews`)
  }

  await mongoose.disconnect()
  console.log(COMMIT ? '✅ Seed complete' : '✅ Dry run complete')
}

run().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
