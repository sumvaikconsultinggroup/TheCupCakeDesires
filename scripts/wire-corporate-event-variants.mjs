/**
 * Wire Size (qty tiers) + Flavour variants onto all Corporate Event cupcake products.
 * Run: node --env-file=.env scripts/wire-corporate-event-variants.mjs
 */
import mongoose from 'mongoose'

const HANDLES = [
  'box-of-12-womens-day-cupcakes',
  'box-of-12-ruok-day-cupcakes',
  'box-of-12-pink-ribbon-day-cupcakes',
  'box-of-12-anzac-day-cupcakes',
  'box-of-12-pride-day-cupcakes',
]

const SIZE_TIERS = [
  { qty: 12, option1Value: 'Box of 12', price: 66 },
  { qty: 30, option1Value: 'Box of 30', price: 150 },
  { qty: 50, option1Value: 'Box of 50', price: 190 },
  { qty: 100, option1Value: 'Box of 100', price: 450 },
  { qty: 200, option1Value: 'Box of 200', price: 840 },
  { qty: 300, option1Value: 'Box of 300', price: 1200 },
  { qty: 500, option1Value: 'Box of 500', price: 1750 },
]

const FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both']

const OPTIONS = [
  { name: 'Size', values: SIZE_TIERS.map((t) => t.option1Value) },
  { name: 'Flavour', values: [...FLAVOURS] },
]

function buildVariants(handle) {
  const slug = handle.replace(/^box-of-12-/, '').replace(/-cupcakes$/, '')
  const variants = []
  for (const tier of SIZE_TIERS) {
    for (const flavour of FLAVOURS) {
      const flavourSlug = flavour
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 18)
      variants.push({
        _id: new mongoose.Types.ObjectId(),
        option1Value: tier.option1Value,
        option2Value: flavour,
        price: tier.price,
        inventoryQty: 200,
        inventoryPolicy: 'continue',
        sku: `${slug}-${tier.qty}-${flavourSlug}`.toUpperCase().slice(0, 40),
        requiresShipping: true,
        taxable: true,
      })
    }
  }
  return variants
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const col = mongoose.connection.collection('products')

  for (const handle of HANDLES) {
    const existing = await col.findOne({ handle, isDeleted: { $ne: true } })
    const variants = buildVariants(handle)
    const tags = new Set([...(existing?.tags || []), 'corporate-event', 'box-of-12', 'themed'])
    // Keep day-specific tags
    if (handle.includes('womens')) tags.add('womens-day')
    if (handle.includes('ruok')) tags.add('ruok-day')
    if (handle.includes('pink-ribbon')) tags.add('pink-ribbon-day')
    if (handle.includes('anzac')) tags.add('anzac-day')
    if (handle.includes('pride')) tags.add('pride-day')

    if (!existing) {
      console.warn(`⚠ Missing product ${handle} — skipping create (add in admin first)`)
      continue
    }

    const result = await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          options: OPTIONS,
          variants,
          tags: [...tags],
          published: true,
          status: 'active',
          updatedAt: new Date(),
        },
      }
    )
    console.log(`✓ ${handle} → ${variants.length} variants (matched ${result.matchedCount})`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
