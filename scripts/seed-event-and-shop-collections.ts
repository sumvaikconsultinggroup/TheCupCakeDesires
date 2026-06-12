/**
 * Seed CupCake Desires event + shop mega-menu collections.
 *
 *   pnpm tsx scripts/seed-event-and-shop-collections.ts
 *   pnpm tsx scripts/seed-event-and-shop-collections.ts --dry
 *   pnpm tsx scripts/seed-event-and-shop-collections.ts --reset
 *
 * Idempotent — upserts by handle. Each event collection links to its themed
 * Box-of-12 product plus the universal cupcake boxes so customers always see
 * stock even when an event box is sold out. Shop collections map straight to
 * their productCategory.
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

import Product from '../src/models/product.model'
import Collection from '../src/models/collection.model'

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry')
const RESET = argv.includes('--reset')

/* ─────────────────────── Universal fallback handles ─────────────────────── */
/*  These show up in every event collection so the page never looks empty.    */
const UNIVERSAL = [
  'standard-cupcake-box-3',
  'deluxe-cupcake-box-3',
  'mini-cupcake-box-24',
]

/* ─────────────────────── Event collection definitions ─────────────────────── */
interface EventDef {
  handle: string
  title: string
  description: string
  productHandles: string[]
  image: string // Unsplash banner image
}

const EVENT_COLLECTIONS: EventDef[] = [
  {
    handle: 'australia-day-cupcakes',
    title: 'Australia Day Cupcakes',
    description: 'Green and gold cupcakes hand-piped for January 26th — perfect for backyard BBQs and beach gatherings.',
    productHandles: ['box-of-12-australia-day-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?w=1200&q=80',
  },
  {
    handle: 'valentines-day-cupcakes',
    title: "Valentine's Day Cupcakes",
    description: 'Rose petal, raspberry and dark chocolate cupcakes wrapped in a love-letter box — same-day delivery to most Melbourne suburbs.',
    productHandles: ['box-of-12-valentines-day-cupcakes', 'box-of-12-i-love-you-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=1400&q=80',
  },
  {
    handle: 'easter-cupcakes',
    title: 'Easter Cupcakes',
    description: 'Pastel buttercream, mini eggs and bunny toppers — a sweet centrepiece for your Easter brunch.',
    productHandles: ['box-of-12-easter-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1521967906867-14ec9d64bee8?w=1200&q=80',
  },
  {
    handle: 'mothers-day-cupcakes',
    title: "Mother's Day Cupcakes",
    description: 'Floral piped buttercream in soft pinks and creams — gift-boxed and ready for that Sunday brunch.',
    productHandles: ['box-of-12-mothers-day-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=1200&q=80',
  },
  {
    handle: 'fathers-day-cupcakes',
    title: "Father's Day Cupcakes",
    description: 'Whisky caramel, salted chocolate and coffee-finished cupcakes for the dad who deserves more than another tie.',
    productHandles: ['box-of-12-fathers-day-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=1200&q=80',
  },
  {
    handle: 'diwali-cupcakes',
    title: 'Diwali Cupcakes',
    description: 'Cardamom rose, gulab jamun and saffron pistachio — festival flavours in a gift box ready for Diwali gatherings.',
    productHandles: ['box-of-12-diwali-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1604608672516-f1b9b1d1f1e6?w=1200&q=80',
  },
  {
    handle: 'christmas-cupcakes',
    title: 'Christmas Cupcakes',
    description: 'Gingerbread, peppermint chocolate and snowy vanilla — boxes designed to land under the tree.',
    productHandles: ['box-of-12-christmas-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&q=80',
  },
  {
    handle: 'baby-girl-cupcakes',
    title: 'Baby Girl Cupcakes',
    description: 'Soft pink rosettes, edible pearls and sweet ruffles for baby showers and welcome-home parties.',
    productHandles: ['box-of-12-baby-girl-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1530648672449-81f6c723e2f1?w=1200&q=80',
  },
  {
    handle: 'baby-boy-cupcakes',
    title: 'Baby Boy Cupcakes',
    description: 'Powder blue buttercream and tiny baby toppers — the easy way to celebrate a new arrival.',
    productHandles: ['box-of-12-baby-boy-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1561622539-a6c4d4d3aab6?w=1200&q=80',
  },
  {
    handle: 'baby-neutral-cupcakes',
    title: 'Baby Neutral Cupcakes',
    description: 'Buttercream in soft sage, cream and gold — gender-neutral baby cupcakes for showers and arrivals.',
    productHandles: ['box-of-12-baby-neutral-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=1200&q=80',
  },
  {
    handle: 'gender-reveal-cupcakes',
    title: 'Gender Reveal Cupcakes',
    description: 'Pink-or-blue filled centres — bite in, find out. A photogenic moment for the big announcement.',
    productHandles: ['box-of-12-gender-reveal-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=1200&q=80',
  },
  {
    handle: 'anniversary-cupcakes',
    title: 'Anniversary Cupcakes',
    description: 'Champagne buttercream, rose gold accents — a quiet little celebration when flowers feel too obvious.',
    productHandles: ['box-of-12-anniversary-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    handle: 'birthday-cupcakes',
    title: 'Birthday Cupcakes',
    description: 'Bright sprinkles, candy toppers and birthday-sized smiles — our most-ordered themed box.',
    productHandles: ['box-of-12-birthday-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=80',
  },
  {
    handle: 'i-love-u-cupcakes',
    title: 'I Love U Cupcakes',
    description: 'Heart toppers, blush buttercream and a little message inside the lid — say it in cupcake form.',
    productHandles: ['box-of-12-i-love-you-cupcakes', 'box-of-12-valentines-day-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&q=80',
  },
  {
    handle: 'sorry-cupcakes',
    title: 'Sorry Cupcakes',
    description: 'A sweeter way to apologise — assorted flavours and a hand-written note in every box.',
    productHandles: ['box-of-12-sorry-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=1200&q=80',
  },
  {
    handle: 'thank-u-cupcakes',
    title: 'Thank U Cupcakes',
    description: 'For neighbours, teachers, coworkers — a small thank-you in twelve perfect bites.',
    productHandles: ['box-of-12-thank-you-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1599785209795-bd8e3cf5d40e?w=1200&q=80',
  },
  {
    handle: 'wedding-cupcakes',
    title: 'Wedding Cupcakes',
    description: 'Tiered cupcake towers and bridal-shower boxes — custom colours and flavours, designed with your day in mind.',
    productHandles: ['box-of-12-wedding-cupcakes', ...UNIVERSAL],
    image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=1200&q=80',
  },
]

/* ─────────────────────── Shop mega-menu collections ─────────────────────── */
/*  These are productCategory-driven — we resolve product handles at run time.  */
interface ShopDef {
  handle: string
  title: string
  description: string
  categoryFilter: string | { $in: string[] }
  image: string
}

const SHOP_COLLECTIONS: ShopDef[] = [
  {
    handle: 'standard-cupcakes',
    title: 'Standard Cupcakes',
    description: 'Our everyday range — classic flavours, hand-frosted, ready for any reason.',
    categoryFilter: 'Cupcake Boxes', // narrowed below to standard handle
    image: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1200&q=80',
  },
  {
    handle: 'deluxe-cupcakes',
    title: 'Deluxe Cupcakes',
    description: 'Premium flavours, bigger swirls, finished with ganache, brittle and gold leaf.',
    categoryFilter: 'Cupcake Boxes',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&q=80',
  },
  {
    handle: 'mini-cupcakes',
    title: 'Mini Cupcakes',
    description: 'Bite-sized cupcakes by the box of 24 — perfect for parties, events and dessert grazing.',
    categoryFilter: 'Cupcake Boxes',
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=1200&q=80',
  },
  {
    handle: 'macarons',
    title: 'Macarons',
    description: 'Almond-meal shells with silky ganache centres — sold by the box of 12.',
    categoryFilter: 'Macarons',
    image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=1200&q=80',
  },
  {
    handle: 'cakes',
    title: 'Cakes',
    description: '6-inch and 8-inch layered cakes — baked the morning of delivery, never before.',
    categoryFilter: { $in: ['Cakes', 'Custom Cakes'] },
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=80',
  },
  {
    handle: 'gift-voucher',
    title: 'Gift Voucher',
    description: 'Let them pick. Redeemable on the entire bakery range — sent by email.',
    categoryFilter: 'Gift Voucher',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=1200&q=80',
  },
]

/* ─────────────────────── Default display settings ─────────────────────── */
const defaultDisplaySettings = {
  locations: [] as string[],
  priority: 5,
  showOnMobile: true,
  showOnDesktop: true,
  layoutStyle: 'grid' as const,
  itemsPerRow: 4,
  maxItems: 12,
  showTitle: true,
  showDescription: true,
  showProductCount: true,
}

/* ─────────────────────── Main ─────────────────────── */
async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('✘ MONGODB_URI is not set in .env.local')
    process.exit(1)
  }

  console.log(
    `\n  CupCake Desires · event + shop collection seed${DRY ? '  (--dry)' : ''}${
      RESET ? '  (--reset)' : ''
    }\n`
  )

  await mongoose.connect(uri)
  console.log('  ✓ Connected to MongoDB\n')

  /* Fetch all live products so we can resolve handles + categories. */
  const allProducts = await Product.find({ isDeleted: false, published: true })
    .select('handle title productCategory')
    .lean()
  const existingHandles = new Set(allProducts.map((p: any) => p.handle))
  console.log(`  Found ${allProducts.length} live products in DB\n`)

  /* Build event collection docs — strip missing handles, keep universals. */
  const eventDocs = EVENT_COLLECTIONS.map((c) => {
    const productHandles = Array.from(new Set(c.productHandles)).filter((h) =>
      existingHandles.has(h)
    )
    return {
      handle: c.handle,
      title: c.title,
      description: c.description,
      image: c.image,
      bannerImage: c.image,
      thumbnailImage: c.image,
      productHandles,
      collectionType: 'manual' as const,
      conditionMatch: 'all' as const,
      sortOrder: 'manual' as const,
      isFeatured: false,
      featuredOrder: 0,
      published: true,
      publishedAt: new Date(),
      isDeleted: false,
      displaySettings: { ...defaultDisplaySettings },
      seo: {
        title: `${c.title} | CupCake Desires Melbourne`,
        description: c.description,
        robots: { index: true, follow: true, noarchive: false, nosnippet: false, noimageindex: false },
      },
    }
  })

  /* Build shop collection docs — resolve productHandles by category. */
  const shopDocs = SHOP_COLLECTIONS.map((c) => {
    let productHandles: string[] = []

    if (c.handle === 'standard-cupcakes') {
      productHandles = allProducts
        .filter((p: any) => p.handle === 'standard-cupcake-box-3')
        .map((p: any) => p.handle)
    } else if (c.handle === 'deluxe-cupcakes') {
      productHandles = allProducts
        .filter(
          (p: any) =>
            p.handle === 'deluxe-cupcake-box-3' ||
            /(^vegan-|^gluten-?free-)/i.test(p.handle) &&
              p.productCategory === 'Cupcake Boxes'
        )
        .map((p: any) => p.handle)
    } else if (c.handle === 'mini-cupcakes') {
      productHandles = allProducts
        .filter((p: any) => /mini/i.test(p.handle))
        .map((p: any) => p.handle)
    } else {
      const filterFn = (p: any): boolean => {
        if (typeof c.categoryFilter === 'string') {
          return p.productCategory === c.categoryFilter
        }
        return (c.categoryFilter as { $in: string[] }).$in.includes(p.productCategory)
      }
      productHandles = allProducts.filter(filterFn).map((p: any) => p.handle)
    }

    return {
      handle: c.handle,
      title: c.title,
      description: c.description,
      image: c.image,
      bannerImage: c.image,
      thumbnailImage: c.image,
      productHandles,
      collectionType: 'manual' as const,
      conditionMatch: 'all' as const,
      sortOrder: 'manual' as const,
      isFeatured: true,
      featuredOrder: SHOP_COLLECTIONS.indexOf(c),
      published: true,
      publishedAt: new Date(),
      isDeleted: false,
      displaySettings: { ...defaultDisplaySettings, priority: 8 },
      seo: {
        title: `${c.title} | CupCake Desires Melbourne`,
        description: c.description,
        robots: { index: true, follow: true, noarchive: false, nosnippet: false, noimageindex: false },
      },
    }
  })

  const all = [...eventDocs, ...shopDocs]

  if (DRY) {
    console.log('  --dry: not writing to DB.\n')
    console.log('  Event collections:')
    for (const c of eventDocs) {
      console.log(
        `    • ${c.handle.padEnd(28)} → ${c.productHandles.length} product${
          c.productHandles.length === 1 ? '' : 's'
        }`
      )
    }
    console.log('\n  Shop collections:')
    for (const c of shopDocs) {
      console.log(
        `    • ${c.handle.padEnd(28)} → ${c.productHandles.length} product${
          c.productHandles.length === 1 ? '' : 's'
        }`
      )
    }
    await mongoose.disconnect()
    console.log('\n  Done (dry run).\n')
    return
  }

  if (RESET) {
    console.log('  --reset: removing previously seeded docs …')
    const del = await Collection.deleteMany({
      handle: { $in: all.map((c) => c.handle) },
    })
    console.log(`    removed ${del.deletedCount} collections\n`)
  }

  console.log('  Upserting event collections …')
  for (const c of eventDocs) {
    await Collection.findOneAndUpdate({ handle: c.handle }, c, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
    console.log(
      `    ✓ ${c.handle.padEnd(28)} ${String(c.productHandles.length).padStart(2)} products`
    )
  }

  console.log('\n  Upserting shop collections …')
  for (const c of shopDocs) {
    await Collection.findOneAndUpdate({ handle: c.handle }, c, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
    console.log(
      `    ✓ ${c.handle.padEnd(28)} ${String(c.productHandles.length).padStart(2)} products`
    )
  }

  await mongoose.disconnect()
  console.log(
    `\n  Done. ${eventDocs.length} event collections · ${shopDocs.length} shop collections.\n`
  )
}

main().catch(async (err) => {
  console.error('\n✘ seed failed:', err)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})
