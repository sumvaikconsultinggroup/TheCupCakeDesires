/**
 * Seed CupCake Desires products + homepage collections from products.json.
 *
 *   npx tsx scripts/seed-products.ts            # full import (default)
 *   npx tsx scripts/seed-products.ts --dry      # log only, no DB writes
 *   npx tsx scripts/seed-products.ts --reset    # drop seeded docs first
 *
 * Idempotent — re-running upserts by `handle`. Safe to repeat.
 *
 * Currency stays AUD on all products (per spec).
 * Flavour names like "Vegan ..." / "Gluten Free ..." auto-flag isVegan / isGlutenFree.
 */

import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

/* Load .env.local manually (no dotenv dependency required) */
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
    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
loadEnvFile('.env.local')
loadEnvFile('.env')

import Product from '../src/models/product.model'
import Collection from '../src/models/collection.model'

/* ─────────────────────── Source row shape ─────────────────────── */
type SourceRow = {
  id: number
  type: 'simple' | 'grouped'
  name: string
  shortDescription: string
  price?: number | null
  regularPrice?: number | null
  salePrice?: number | null
  priceRange?: string
  category: string
  inStock: boolean
  image: string
  flavour: string | null
  slug: string
  variants?: { id: number; name: string; price: number; image?: string }[]
}

/* ─────────────────────── Helpers ─────────────────────── */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const initials = (s: string) =>
  s
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!)
    .join('')
    .toUpperCase()
    .slice(0, 4)

const detectVegan = (name: string) => /vegan/i.test(name)
const detectGF = (name: string) => /gluten\s*-?\s*free|gl-?free/i.test(name)
const detectEggless = (name: string) =>
  /eggless/i.test(name) || detectVegan(name) // vegan is implicitly eggless

const wrapHtml = (s: string) => (s && s.trim() ? `<p>${s.trim()}</p>` : '')

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry')
const RESET = argv.includes('--reset')

/* ─────────────────────── Consolidation ─────────────────────── */

interface BuiltProduct {
  handle: string
  title: string
  bodyHtml: string
  productCategory: string
  vendor: string
  tags: string[]
  flavours: string[]
  isEggless: boolean
  isVegan: boolean
  isGlutenFree: boolean
  giftCard: boolean
  currency: string
  status: 'active'
  published: boolean
  options: { name: string; values: string[] }[]
  variants: {
    option1Value: string
    price: number
    compareAtPrice?: number
    inventoryQty: number
    inventoryPolicy: 'deny' | 'continue'
    sku: string
    image?: string
  }[]
  images: { src: string; position: number; altText: string }[]
}

function buildProductBase(overrides: Partial<BuiltProduct>): BuiltProduct {
  return {
    handle: '',
    title: '',
    bodyHtml: '',
    productCategory: '',
    vendor: 'CupCake Desires',
    tags: [],
    flavours: [],
    isEggless: false,
    isVegan: false,
    isGlutenFree: false,
    giftCard: false,
    currency: 'AUD',
    status: 'active',
    published: true,
    options: [],
    variants: [],
    images: [],
    ...overrides,
  }
}

function consolidate(rows: SourceRow[]): BuiltProduct[] {
  const out: BuiltProduct[] = []

  /* ── A. Standard Cupcake Box (3) — merge all rows in "Standard Cupcakes" + the parent "standard-cupcakes" ── */
  const standardFlavours = rows.filter((r) => r.category === 'Standard Cupcakes')
  if (standardFlavours.length > 0) {
    const flavours = standardFlavours.map((r) => r.flavour!).filter(Boolean)
    out.push(
      buildProductBase({
        handle: 'standard-cupcake-box-3',
        title: 'Standard Cupcake Box (3)',
        bodyHtml:
          '<p>A trio of our classic, ever-loved cupcakes. Pick a single flavour or order multiple boxes for a mix.</p>',
        productCategory: 'Cupcake Boxes',
        flavours,
        tags: ['box-of-3', 'standard', ...flavours.map((f) => `flavour-${slugify(f)}`)],
        options: [{ name: 'Flavour', values: flavours }],
        variants: standardFlavours.map((r) => ({
          option1Value: r.flavour!,
          price: r.price!,
          inventoryQty: 50,
          inventoryPolicy: 'deny',
          sku: `CCD-STD-3-${initials(r.flavour!)}`,
          image: r.image,
        })),
        images: standardFlavours.map((r, i) => ({
          src: r.image,
          position: i,
          altText: `${r.flavour} cupcake — Standard Box of 3`,
        })),
      })
    )
  }

  /* ── B. Deluxe Cupcake Box (3) — non-special flavours only ── */
  const deluxeAll = rows.filter((r) => r.category === 'Deluxe Cupcakes')
  const deluxeRegular = deluxeAll.filter(
    (r) => !detectVegan(r.name) && !detectGF(r.name)
  )
  if (deluxeRegular.length > 0) {
    const flavours = deluxeRegular.map((r) => r.flavour!).filter(Boolean)
    out.push(
      buildProductBase({
        handle: 'deluxe-cupcake-box-3',
        title: 'Deluxe Cupcake Box (3)',
        bodyHtml:
          '<p>Three of our premium signature flavours — bigger, richer, finished with extras like ganache and toffee.</p>',
        productCategory: 'Cupcake Boxes',
        flavours,
        tags: ['box-of-3', 'deluxe', ...flavours.map((f) => `flavour-${slugify(f)}`)],
        options: [{ name: 'Flavour', values: flavours }],
        variants: deluxeRegular.map((r) => ({
          option1Value: r.flavour!,
          price: r.price!,
          inventoryQty: 40,
          inventoryPolicy: 'deny',
          sku: `CCD-DLX-3-${initials(r.flavour!)}`,
          image: r.image,
        })),
        images: deluxeRegular.map((r, i) => ({
          src: r.image,
          position: i,
          altText: `${r.flavour} cupcake — Deluxe Box of 3`,
        })),
      })
    )
  }

  /* ── C. Special-diet deluxe items kept as standalone products ── */
  for (const row of deluxeAll.filter(
    (r) => detectVegan(r.name) || detectGF(r.name)
  )) {
    out.push(
      buildProductBase({
        handle: row.slug,
        title: row.name,
        bodyHtml: wrapHtml(row.shortDescription),
        productCategory: 'Cupcake Boxes',
        flavours: row.flavour ? [row.flavour] : [],
        isVegan: detectVegan(row.name),
        isGlutenFree: detectGF(row.name),
        isEggless: detectEggless(row.name),
        tags: [
          'box-of-3',
          'deluxe',
          detectVegan(row.name) && 'vegan',
          detectGF(row.name) && 'gluten-free',
          'eggless',
        ].filter(Boolean) as string[],
        variants: [
          {
            option1Value: 'Default',
            price: row.price!,
            inventoryQty: 30,
            inventoryPolicy: 'deny',
            sku: `CCD-DLX-3-${initials(row.flavour || row.name)}`,
            image: row.image,
          },
        ],
        images: [{ src: row.image, position: 0, altText: row.name }],
      })
    )
  }

  /* ── D. Mini Cupcake Box (24) — merge 4 "Box of 24 ..." rows ── */
  const miniRows = rows.filter((r) => r.category === 'Mini Cupcakes')
  if (miniRows.length > 0) {
    const flavourMap: Record<string, SourceRow> = {}
    for (const r of miniRows) {
      // 21 has no flavour → "Assorted"
      const key = r.flavour ?? 'Assorted'
      flavourMap[key] = r
    }
    const flavours = Object.keys(flavourMap)
    out.push(
      buildProductBase({
        handle: 'mini-cupcake-box-24',
        title: 'Mini Cupcake Box (24)',
        bodyHtml:
          '<p>Two dozen bite-sized cupcakes — perfect for parties, gifting, or generously feeding a meeting.</p>',
        productCategory: 'Cupcake Boxes',
        flavours,
        tags: ['box-of-24', 'mini', ...flavours.map((f) => `flavour-${slugify(f)}`)],
        options: [{ name: 'Flavour', values: flavours }],
        variants: flavours.map((f) => {
          const r = flavourMap[f]
          return {
            option1Value: f,
            price: r.price!,
            inventoryQty: 30,
            inventoryPolicy: 'deny' as const,
            sku: `CCD-MINI-24-${initials(f)}`,
            image: r.image,
          }
        }),
        images: flavours.map((f, i) => ({
          src: flavourMap[f].image,
          position: i,
          altText: `${f} mini cupcakes — Box of 24`,
        })),
      })
    )
  }

  /* ── E. Macaron Box (12) — merge 5 macaron rows ── */
  const macaronRows = rows.filter((r) => r.category === 'Macarons')
  if (macaronRows.length > 0) {
    const flavours = macaronRows.map((r) => r.flavour!).filter(Boolean)
    out.push(
      buildProductBase({
        handle: 'macaron-box-12',
        title: 'Macaron Box (12)',
        bodyHtml:
          '<p>A dozen delicate French macarons in your chosen flavour. Crisp shells, soft ganache centres.</p>',
        productCategory: 'Macarons',
        flavours,
        tags: ['box-of-12', 'macarons', ...flavours.map((f) => `flavour-${slugify(f)}`)],
        options: [{ name: 'Flavour', values: flavours }],
        variants: macaronRows.map((r) => ({
          option1Value: r.flavour!,
          price: r.price!,
          inventoryQty: 30,
          inventoryPolicy: 'deny',
          sku: `CCD-MAC-12-${initials(r.flavour!)}`,
          image: r.image,
        })),
        images: macaronRows.map((r, i) => ({
          src: r.image,
          position: i,
          altText: `${r.flavour} macarons — Box of 12`,
        })),
      })
    )
  }

  /* ── F. Gift Voucher — one product per amount so they show as separate cards ── */
  const voucherRows = rows.filter((r) => r.category === 'Gift Voucher')
  const VOUCHER_IMAGES: Record<number, string> = {
    25: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=900&q=80',
    50: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=80',
    100: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&q=80',
  }
  for (const row of voucherRows) {
    const amount = Math.round(row.price!)
    out.push(
      buildProductBase({
        handle: `gift-voucher-${amount}`,
        title: `Gift Voucher · $${amount}`,
        bodyHtml: `<p>A $${amount} CupCake Desires gift voucher — redeemable on the entire bakery range. Delivered by email, never expires.</p>`,
        productCategory: 'Gift Voucher',
        giftCard: true,
        tags: ['gift-voucher', `voucher-${amount}`],
        variants: [
          {
            option1Value: 'Default',
            price: row.price!,
            inventoryQty: 9999,
            inventoryPolicy: 'continue',
            sku: `CCD-GV-${amount}`,
            image: VOUCHER_IMAGES[amount] || row.image,
          },
        ],
        images: [
          {
            src: VOUCHER_IMAGES[amount] || row.image,
            position: 0,
            altText: `CupCake Desires $${amount} Gift Voucher`,
          },
        ],
      })
    )
  }

  /* ── G. Grouped cakes — merge 6"/8" variants into the parent ── */
  const groupedCakes = rows.filter((r) => r.type === 'grouped')
  for (const cake of groupedCakes) {
    const variants = cake.variants || []
    // Sort so 6" comes before 8"
    const sortedVariants = [...variants].sort((a, b) => {
      const aSize = parseInt(a.name)
      const bSize = parseInt(b.name)
      return aSize - bSize
    })

    out.push(
      buildProductBase({
        handle: cake.slug,
        title: cake.name,
        bodyHtml: wrapHtml(cake.shortDescription),
        productCategory: 'Cakes',
        flavours: cake.flavour ? [cake.flavour] : [],
        tags: ['cake', cake.flavour && `flavour-${slugify(cake.flavour)}`].filter(
          Boolean
        ) as string[],
        options: [{ name: 'Size', values: sortedVariants.map((v) => `${parseInt(v.name)}"`) }],
        variants: sortedVariants.map((v) => {
          const size = parseInt(v.name)
          return {
            option1Value: `${size}"`,
            price: v.price,
            inventoryQty: 15,
            inventoryPolicy: 'deny',
            sku: `CCD-CAKE-${initials(cake.flavour || cake.name)}-${size}`,
            image: v.image,
          }
        }),
        images: [
          { src: cake.image, position: 0, altText: cake.name },
          ...sortedVariants.map((v, i) => ({
            src: v.image!,
            position: i + 1,
            altText: v.name,
          })),
        ],
      })
    )
  }

  /* ── H. Themed boxes ("Box of 12 X Cupcakes") — keep as 16 separate products ── */
  const themedRows = rows.filter(
    (r) =>
      r.category === 'Uncategorized' &&
      r.name.startsWith('Box of 12') &&
      r.price != null
  )
  for (const row of themedRows) {
    out.push(
      buildProductBase({
        handle: row.slug,
        title: row.name,
        bodyHtml: wrapHtml(row.shortDescription),
        productCategory: 'Themed Boxes',
        flavours: ['Assorted'],
        tags: ['box-of-12', 'themed', slugify(row.name.replace(/Box of 12 |Cupcakes/g, ''))].filter(
          Boolean
        ),
        options: [],
        variants: [
          {
            option1Value: 'Default',
            price: row.price!,
            inventoryQty: 30,
            inventoryPolicy: 'deny',
            sku: `CCD-BOX-${initials(row.name.replace(/Box of 12 |Cupcakes/g, ''))}-12`,
            image: row.image,
          },
        ],
        images: [{ src: row.image, position: 0, altText: row.name }],
      })
    )
  }

  /* ── I. Inquiry-only products (price=null) — Wedding Tier, Custom Birthday, Sorry #79, Thank U ── */
  const inquiryRows = rows.filter(
    (r) => r.type === 'simple' && (r.price === null || r.price === undefined)
  )
  for (const row of inquiryRows) {
    out.push(
      buildProductBase({
        handle: row.slug,
        title: row.name,
        bodyHtml: wrapHtml(row.shortDescription),
        productCategory: row.category === 'Cakes' ? 'Custom Cakes' : 'Custom Orders',
        tags: ['inquiry-only'],
        variants: [
          {
            option1Value: 'Default',
            price: 0,
            inventoryQty: 0,
            inventoryPolicy: 'continue',
            sku: `CCD-CUST-${initials(row.name)}`,
            image: row.image,
          },
        ],
        images: [{ src: row.image, position: 0, altText: row.name }],
      })
    )
  }

  /* ── J. Skip the orphan parent rows (id 19, 20) — handled by A and B ── */
  // (Already excluded by category filters above.)

  return out
}

/* ─────────────────────── Collection definitions ─────────────────────── */

function buildCollections(products: BuiltProduct[]) {
  const findHandle = (filter: (p: BuiltProduct) => boolean, limit = 12) =>
    products.filter(filter).slice(0, limit).map((p) => p.handle)

  return [
    {
      handle: 'bestsellers',
      title: 'Bestsellers',
      description: 'Most-loved cupcakes by our customers.',
      productHandles: [
        'standard-cupcake-box-3',
        'deluxe-cupcake-box-3',
        'mini-cupcake-box-24',
        'red-velvet-round-cake',
        'chocolate-chocolate-round-cake',
        'salted-caramel-round-cake',
        'macaron-box-12',
        'box-of-12-birthday-cupcakes',
      ].filter((h) => products.some((p) => p.handle === h)),
      displaySettings: {
        locations: ['best_seller'],
        priority: 10,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'grid' as const,
        itemsPerRow: 4,
        maxItems: 8,
        showTitle: true,
        showDescription: true,
        showProductCount: true,
      },
    },
    {
      handle: 'new-arrivals',
      title: 'New Arrivals',
      description: 'Latest additions to our menu.',
      productHandles: findHandle((p) => p.productCategory === 'Themed Boxes', 8),
      displaySettings: {
        locations: ['new_arrival'],
        priority: 9,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'grid' as const,
        itemsPerRow: 4,
        maxItems: 8,
        showTitle: true,
        showDescription: false,
        showProductCount: true,
      },
    },
    {
      handle: 'featured',
      title: 'Featured This Week',
      description: 'Hand-picked for you.',
      productHandles: [
        'red-velvet-round-cake',
        'salted-caramel-round-cake',
        'molten-chocolate-round-cake',
        'cookies-cream-round-cake',
        'macaron-box-12',
        'mini-cupcake-box-24',
        'gift-voucher-50',
        'box-of-12-anniversary-cupcakes',
      ].filter((h) => products.some((p) => p.handle === h)),
      displaySettings: {
        locations: ['featured'],
        priority: 8,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'carousel' as const,
        itemsPerRow: 4,
        maxItems: 12,
        showTitle: true,
        showDescription: true,
        showProductCount: false,
      },
    },
    {
      handle: 'flash-deals',
      title: 'Flash Deals',
      description: 'Limited-time savings.',
      productHandles: [
        'box-of-12-birthday-cupcakes',
        'box-of-12-anniversary-cupcakes',
        'box-of-12-wedding-cupcakes',
        'box-of-12-valentines-day-cupcakes',
      ].filter((h) => products.some((p) => p.handle === h)),
      displaySettings: {
        locations: ['flash_deals'],
        priority: 7,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'grid' as const,
        itemsPerRow: 4,
        maxItems: 4,
        showTitle: true,
        showDescription: false,
        showProductCount: false,
      },
    },
    {
      handle: 'trending',
      title: 'Trending',
      description: 'What customers are loving right now.',
      productHandles: [
        'box-of-12-birthday-cupcakes',
        'box-of-12-thank-you-cupcakes',
        'standard-cupcake-box-3',
        'deluxe-cupcake-box-3',
      ].filter((h) => products.some((p) => p.handle === h)),
      displaySettings: {
        locations: ['trending'],
        priority: 6,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'grid' as const,
        itemsPerRow: 4,
        maxItems: 4,
        showTitle: true,
        showDescription: false,
        showProductCount: false,
      },
    },
  ]
}

/* ─────────────────────── Main ─────────────────────── */

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('✘ MONGODB_URI is not set in .env.local')
    process.exit(1)
  }

  console.log(`\n  CupCake Desires · product seed${DRY ? '  (--dry)' : ''}${RESET ? '  (--reset)' : ''}\n`)

  const jsonPath = path.resolve(process.cwd(), 'products.json')
  if (!fs.existsSync(jsonPath)) {
    console.error(`✘ products.json not found at ${jsonPath}`)
    process.exit(1)
  }
  const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as SourceRow[]
  console.log(`  Parsed products.json …  ${rows.length} rows`)

  const products = consolidate(rows)
  console.log(`  Consolidated to       …  ${products.length} products`)

  const collections = buildCollections(products)
  console.log(`  Built collections     …  ${collections.length} collections\n`)

  if (DRY) {
    console.log('  --dry: not writing to DB. Sample output:\n')
    for (const p of products.slice(0, 3)) {
      console.log(`    • ${p.title}`)
      console.log(`        handle:    ${p.handle}`)
      console.log(`        variants:  ${p.variants.length} (${p.variants.map((v) => v.option1Value).join(' | ')})`)
      console.log(`        flavours:  [${p.flavours.join(', ')}]`)
      console.log(`        vegan:     ${p.isVegan}    GF: ${p.isGlutenFree}    eggless: ${p.isEggless}`)
      console.log('')
    }
    console.log(`  … and ${products.length - 3} more`)
    console.log(`\n  Done (dry run).`)
    process.exit(0)
  }

  await mongoose.connect(uri)
  console.log('  ✓ Connected to MongoDB\n')

  if (RESET) {
    console.log('  --reset: removing previously seeded docs …')
    const productDel = await Product.deleteMany({
      handle: { $in: products.map((p) => p.handle) },
    })
    const collectionDel = await Collection.deleteMany({
      handle: { $in: collections.map((c) => c.handle) },
    })
    console.log(`    removed ${productDel.deletedCount} products, ${collectionDel.deletedCount} collections\n`)
  }

  console.log('  Upserting products …')
  for (const p of products) {
    await Product.findOneAndUpdate({ handle: p.handle }, p, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
    console.log(
      `    ✓ ${p.title.padEnd(42, ' ')} ${String(p.variants.length).padStart(2)} variant${p.variants.length === 1 ? '' : 's'}`
    )
  }

  console.log('\n  Upserting collections …')
  for (const c of collections) {
    await Collection.findOneAndUpdate(
      { handle: c.handle },
      { ...c, published: true, publishedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    console.log(`    ✓ ${c.handle.padEnd(20, ' ')} ${String(c.productHandles.length).padStart(2)} products`)
  }

  await mongoose.disconnect()
  console.log(`\n  Done. ${products.length} products · ${collections.length} collections.\n`)
}

main().catch(async (err) => {
  console.error('\n✘ seed failed:', err)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})
