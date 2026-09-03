/**
 * Upsert the AFL cupcake box (box of 12, $66, two team-logo uploads).
 * Run: node --env-file=.env.local scripts/wire-afl-cupcake-box.mjs
 */
import mongoose from 'mongoose'

const HANDLE = 'box-of-12-afl-cupcakes'
const FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both']
const SIZE = { qty: 12, option1Value: 'Box of 12', price: 66 }

function buildVariants() {
  return FLAVOURS.map((flavour) => {
    const flavourSlug = flavour
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 18)
    return {
      _id: new mongoose.Types.ObjectId(),
      option1Value: SIZE.option1Value,
      option2Value: flavour,
      price: SIZE.price,
      inventoryQty: 200,
      inventoryPolicy: 'continue',
      sku: `AFL-12-${flavourSlug}`.toUpperCase().slice(0, 40),
      requiresShipping: true,
      taxable: true,
    }
  })
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const col = mongoose.connection.collection('products')

  const existing = await col.findOne({ handle: HANDLE })
  const variants = buildVariants()
  const doc = {
    handle: HANDLE,
    title: 'AFL Cupcake Box',
    bodyHtml:
      '<p>A box of 12 cupcakes for AFL match day. Upload two team logos — we print them on edible discs and mix them across the box. Choose Vanilla, Chocolate, or Mix of Both.</p>',
    vendor: 'The Cupcake Desire',
    productCategory: 'Event',
    tags: ['event', 'afl', 'seasonal', 'box-of-12', 'themed'],
    flavours: [...FLAVOURS],
    options: [
      { name: 'Size', values: [SIZE.option1Value] },
      { name: 'Flavour', values: [...FLAVOURS] },
    ],
    variants,
    images: [
      {
        src: '/images/afl-cupcake-box.jpeg',
        position: 0,
        altText: 'Box of 12 AFL cupcakes with two team logos',
      },
    ],
    published: true,
    status: 'active',
    isDeleted: false,
    allowLogoUpload: true,
    currency: 'AUD',
    minOrderQty: 1,
    giftCard: false,
    updatedAt: new Date(),
  }

  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      {
        $set: doc,
        $unset: { deletedAt: '' },
      }
    )
    console.log(`✓ updated ${HANDLE} → ${variants.length} variants @ $${SIZE.price}`)
  } else {
    await col.insertOne({ ...doc, createdAt: new Date() })
    console.log(`✓ created ${HANDLE} → ${variants.length} variants @ $${SIZE.price}`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
