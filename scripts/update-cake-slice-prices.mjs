/**
 * Update all Cake Slices products to the new catering box prices.
 * Run: node --env-file=.env.local scripts/update-cake-slice-prices.mjs
 */
import mongoose from 'mongoose'

const PRICE_BY_SIZE = {
  'Box of 12': 84,
  'Box of 36': 234,
  'Box of 50': 300,
  'Box of 100': 550,
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const col = mongoose.connection.collection('products')
  const filter = {
    isDeleted: { $ne: true },
    // Keep corporate logo slices on the older price tier.
    handle: { $ne: 'corporate-cake-slices' },
    productCategory: { $nin: ['Corporate'] },
    $or: [
      { productCategory: /slice/i },
      { handle: /slice/i },
    ],
  }
  const docs = await col.find(filter).toArray()
  if (!docs.length) {
    console.warn('No cake slice products found')
    await mongoose.disconnect()
    return
  }

  for (const doc of docs) {
    const variants = (doc.variants || []).map((v) => {
      const key = String(v.option1Value || '').trim()
      const next = PRICE_BY_SIZE[key]
      if (typeof next !== 'number') return v
      return {
        ...v,
        price: next,
        compareAtPrice: undefined,
      }
    })
    const options = [
      {
        name: 'Size',
        values: ['Box of 12', 'Box of 36', 'Box of 50', 'Box of 100'],
      },
    ]
    // Keep a short standard-size note in description fields without wiping custom copy.
    const note = 'Standard size cake slices.'
    let bodyHtml = doc.bodyHtml || ''
    if (!/standard size cake slices/i.test(bodyHtml)) {
      const stripped = bodyHtml.replace(/<\/?p>/gi, '').trim()
      bodyHtml = stripped
        ? `<p>${stripped}</p><p>${note}</p>`
        : `<p>${note}</p>`
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          variants,
          options,
          productCategory: 'Standard size cake slices',
          allowLogoUpload: false,
          bodyHtml,
          updatedAt: new Date(),
        },
      }
    )
    console.log(
      `✓ ${doc.handle} →`,
      variants.map((v) => `${v.option1Value}=$${v.price}`).join(', ')
    )
  }

  await mongoose.disconnect()
  console.log(`Done. Updated ${docs.length} products.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
