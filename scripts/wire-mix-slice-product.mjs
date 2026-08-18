/**
 * Create/upsert "Mix Slice" in the standard cake-slices collection.
 * Same Size tiers/prices as other slices; image from public/images/cake-slice/mix-slice.jpeg
 *
 * Run: node --env-file=.env.local scripts/wire-mix-slice-product.mjs
 */
import mongoose from 'mongoose'

const HANDLE = 'mix-slice'
const IMAGE_SRC = '/images/cake-slice/mix-slice.jpeg'

const SIZES = [
  { option1Value: 'Box of 12', price: 84, sku: 'CCD-SLICE-MIX-12' },
  { option1Value: 'Box of 36', price: 234, sku: 'CCD-SLICE-MIX-36' },
  { option1Value: 'Box of 50', price: 300, sku: 'CCD-SLICE-MIX-50' },
  { option1Value: 'Box of 100', price: 550, sku: 'CCD-SLICE-MIX-100' },
]

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const products = mongoose.connection.collection('products')
  const collections = mongoose.connection.collection('collections')

  const variants = SIZES.map((s) => ({
    _id: new mongoose.Types.ObjectId(),
    option1Value: s.option1Value,
    option2Value: '',
    option3Value: '',
    sku: s.sku,
    grams: 0,
    inventoryQty: 200,
    inventoryPolicy: 'continue',
    price: s.price,
    compareAtPrice: null,
    requiresShipping: true,
    taxable: true,
    barcode: '',
    weightUnit: 'kg',
    costPerItem: 0,
  }))

  const doc = {
    handle: HANDLE,
    title: 'Mix Slice',
    bodyHtml:
      '<p>Assorted mix of our standard size cake slices in one catering box — a little of every flavour. Same box prices as our single-flavour slices.</p><p>Standard size cake slices.</p>',
    vendor: 'The Cupcake Desire',
    productCategory: 'Standard size cake slices',
    tags: ['cake-slice', 'slice', 'catering', 'mix', 'platter'],
    options: [
      {
        name: 'Size',
        values: SIZES.map((s) => s.option1Value),
      },
    ],
    variants,
    images: [
      {
        src: IMAGE_SRC,
        position: 0,
        altText: 'Assorted mix cake slices',
      },
    ],
    published: true,
    status: 'active',
    isDeleted: false,
    allowLogoUpload: false,
    currency: 'AUD',
    minOrderQty: 1,
    giftCard: false,
    updatedAt: new Date(),
  }

  const existing = await products.findOne({ handle: HANDLE })
  if (existing) {
    await products.updateOne(
      { _id: existing._id },
      {
        $set: doc,
        $unset: { deletedAt: '' },
      }
    )
    console.log(`✓ updated ${HANDLE}`)
  } else {
    await products.insertOne({ ...doc, createdAt: new Date() })
    console.log(`✓ created ${HANDLE}`)
  }

  const col = await collections.findOne({ handle: 'cake-slices' })
  if (col) {
    const handles = Array.isArray(col.productHandles) ? [...col.productHandles] : []
    if (!handles.includes(HANDLE)) {
      handles.push(HANDLE)
      await collections.updateOne(
        { _id: col._id },
        { $set: { productHandles: handles, updatedAt: new Date() } }
      )
      console.log('✓ added mix-slice to cake-slices collection')
    } else {
      console.log('✓ mix-slice already in cake-slices collection')
    }
  } else {
    console.warn('⚠ cake-slices collection not found — product created anyway')
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
