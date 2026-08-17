/**
 * Add Vanilla / Chocolate flavour to every Dress Cakes product.
 * Replaces the placeholder "Option: Standard" with Flavour variants at the same price.
 *
 * Run: node --env-file=.env.local scripts/wire-dress-cake-flavours.mjs
 */
import mongoose from 'mongoose'

const FLAVOURS = ['Vanilla', 'Chocolate']

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const ObjectId = mongoose.Types.ObjectId
  const col = mongoose.connection.collection('products')

  const docs = await col
    .find({
      isDeleted: { $ne: true },
      $or: [
        { productCategory: /^Dress Cakes$/i },
        { handle: /dress-cake/i },
        { title: /dress cake/i },
      ],
    })
    .toArray()

  if (!docs.length) {
    console.warn('No dress cake products found')
    await mongoose.disconnect()
    return
  }

  for (const doc of docs) {
    const base = (doc.variants && doc.variants[0]) || {}
    const price = typeof base.price === 'number' ? base.price : 150
    const inventoryQty =
      typeof base.inventoryQty === 'number' && base.inventoryQty > 0 ? base.inventoryQty : 50
    const inventoryPolicy = base.inventoryPolicy || 'continue'
    const image = base.image || undefined
    const slug = String(doc.handle || 'dress-cake')
      .replace(/-dress-cake$/, '')
      .slice(0, 20)

    const variants = FLAVOURS.map((flavour) => ({
      _id: new ObjectId(),
      option1Value: flavour,
      option2Value: '',
      option3Value: '',
      price,
      compareAtPrice: base.compareAtPrice ?? null,
      inventoryQty,
      inventoryPolicy,
      sku: `CCD-DRESS-${slug}-${flavour.slice(0, 3)}`
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, '')
        .slice(0, 40),
      requiresShipping: true,
      taxable: true,
      barcode: '',
      grams: base.grams || 0,
      weightUnit: base.weightUnit || 'kg',
      costPerItem: base.costPerItem || 0,
      ...(image ? { image } : {}),
    }))

    const options = [{ name: 'Flavour', values: [...FLAVOURS] }]

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          options,
          variants,
          flavours: [...FLAVOURS],
          updatedAt: new Date(),
        },
      }
    )

    console.log(
      `✓ ${doc.handle} →`,
      variants.map((v) => `${v.option1Value}=$${v.price} (${v._id})`).join(', ')
    )
  }

  await mongoose.disconnect()
  console.log(`Done. Updated ${docs.length} dress cake products.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
