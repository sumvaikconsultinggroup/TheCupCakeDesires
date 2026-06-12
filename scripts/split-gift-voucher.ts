/**
 * Split the consolidated `gift-voucher` product into 3 separate products
 * (`gift-voucher-25`, `gift-voucher-50`, `gift-voucher-100`) so the
 * collection page shows three cards instead of one.
 *
 *   pnpm tsx scripts/split-gift-voucher.ts
 *   pnpm tsx scripts/split-gift-voucher.ts --dry
 *
 * Idempotent — re-runnable. Skips work if the new products already exist.
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

const DRY = process.argv.includes('--dry')

const AMOUNTS = [25, 50, 100]

const VOUCHER_IMAGES: Record<number, string> = {
  25: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=900&q=80',
  50: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=80',
  100: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900&q=80',
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('✘ MONGODB_URI is not set')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log(`\n  Split gift voucher${DRY ? '  (--dry)' : ''}\n  ✓ Connected\n`)

  /* 1. Build the 3 new products */
  const newProducts = AMOUNTS.map((amount) => ({
    handle: `gift-voucher-${amount}`,
    title: `Gift Voucher · $${amount}`,
    bodyHtml: `<p>A $${amount} CupCake Desires gift voucher — redeemable on the entire bakery range. Delivered by email, never expires.</p>`,
    productCategory: 'Gift Voucher',
    vendor: 'CupCake Desires',
    type: '',
    tags: ['gift-voucher', `voucher-${amount}`],
    giftCard: true,
    published: true,
    status: 'active',
    currency: 'AUD',
    flavours: [],
    isEggless: false,
    isVegan: false,
    isGlutenFree: false,
    options: [],
    variants: [
      {
        option1Value: 'Default',
        price: amount,
        inventoryQty: 9999,
        inventoryPolicy: 'continue',
        sku: `CCD-GV-${amount}`,
        image: VOUCHER_IMAGES[amount],
      },
    ],
    images: [
      {
        src: VOUCHER_IMAGES[amount],
        position: 0,
        altText: `CupCake Desires $${amount} Gift Voucher`,
      },
    ],
    isDeleted: false,
  }))

  /* 2. Upsert them */
  console.log('  Upserting split products:')
  for (const p of newProducts) {
    if (DRY) {
      console.log(`    [dry] ${p.handle}  → $${p.variants[0].price}`)
      continue
    }
    await Product.findOneAndUpdate({ handle: p.handle }, p, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
    console.log(`    ✓ ${p.handle}`)
  }

  /* 3. Delete the old bundled gift-voucher product */
  console.log('\n  Removing legacy bundled product:')
  if (DRY) {
    const existing = await Product.findOne({ handle: 'gift-voucher' }).lean()
    console.log(`    [dry] would delete: ${existing ? 'gift-voucher (exists)' : '(not present)'}`)
  } else {
    const del = await Product.deleteOne({ handle: 'gift-voucher' })
    console.log(`    deleted: ${del.deletedCount}`)
  }

  /* 4. Update collections that referenced the old handle */
  const newHandles = newProducts.map((p) => p.handle)
  console.log('\n  Patching collection.productHandles:')
  const affected = await Collection.find({ productHandles: 'gift-voucher' }).select(
    'handle productHandles'
  )
  for (const c of affected as any[]) {
    const next = (c.productHandles || []).flatMap((h: string) =>
      h === 'gift-voucher' ? newHandles : [h]
    )
    const deduped = Array.from(new Set(next))
    if (DRY) {
      console.log(`    [dry] ${c.handle}  → ${deduped.length} handles`)
      continue
    }
    await Collection.updateOne({ _id: c._id }, { $set: { productHandles: deduped } })
    console.log(`    ✓ ${c.handle}  → ${deduped.length} handles`)
  }

  /* 5. Make sure the gift-voucher shop collection lists all 3 */
  console.log('\n  Ensuring gift-voucher collection has all 3:')
  if (!DRY) {
    await Collection.updateOne(
      { handle: 'gift-voucher' },
      { $set: { productHandles: newHandles } }
    )
  }
  console.log(`    ✓ gift-voucher collection → ${newHandles.join(', ')}`)

  await mongoose.disconnect()
  console.log('\n  Done.\n')
}

main().catch(async (err) => {
  console.error('\n✘ migration failed:', err)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})
