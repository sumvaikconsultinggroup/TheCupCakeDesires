/**
 * Upsert each Deluxe flavour as its own product (same as Standard: $5 each,
 * minimum order 3 / $15) and pin them on the deluxe-cupcakes collection.
 * Images come from public/images/cupcake-builder.
 *
 * Run: node --env-file=.env.local scripts/wire-deluxe-3pack-products.mjs
 */
import mongoose from 'mongoose'

const UNIT_PRICE = 5
const MIN_ORDER_QTY = 3

const PRODUCTS = [
  {
    handle: 'cookies-n-cream-3-cupcakes',
    title: 'Cookies N Cream',
    flavour: 'Cookies n Cream',
    image: '/images/cupcake-builder/cookies-n-cream.jpg',
    sku: 'CCD-DLX3-CNC',
    bodyHtml:
      '<p>Cookies n Cream cupcakes — vanilla sponge, cookies-and-cream frosting, crushed cookie finish. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'flavour-cookies-n-cream'],
    isVegan: false,
    isGlutenFree: false,
    isEggless: false,
  },
  {
    handle: 'gluten-free-red-velvet-3-cupcakes',
    title: 'Gluten Free Red Velvet',
    flavour: 'Gluten Free Red Velvet',
    image: '/images/cupcake-builder/gluten-free-red-velvet.jpg',
    sku: 'CCD-DLX-3-GFRV',
    bodyHtml:
      '<p>Gluten-free Red Velvet cupcakes, baked to order. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'gluten-free', 'eggless'],
    isVegan: false,
    isGlutenFree: true,
    isEggless: false,
  },
  {
    handle: 'hazelnut-heaven-3-cupcakes',
    title: 'Hazelnut Heaven',
    flavour: 'Hazelnut Heaven',
    image: '/images/cupcake-builder/hazelnut-heaven.jpg',
    sku: 'CCD-DLX3-HH',
    bodyHtml:
      '<p>Hazelnut Heaven cupcakes — hazelnut sponge with a rich hazelnut buttercream. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'flavour-hazelnut-heaven'],
    isVegan: false,
    isGlutenFree: false,
    isEggless: false,
  },
  {
    handle: 'm-n-m-3-cupcakes',
    title: 'M N M',
    flavour: 'M n M',
    image: '/images/cupcake-builder/m-n-m.jpg',
    sku: 'CCD-DLX3-MNM',
    bodyHtml: '<p>M n M cupcakes — chocolate sponge piled with M&amp;M’s. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'flavour-m-n-m'],
    isVegan: false,
    isGlutenFree: false,
    isEggless: false,
  },
  {
    handle: 'molten-chocolate-3-cupcakes',
    title: 'Molten Chocolate',
    flavour: 'Molten Chocolate',
    image: '/images/cupcake-builder/molten-chocolate.jpg',
    sku: 'CCD-DLX3-MC',
    bodyHtml:
      '<p>Molten Chocolate cupcakes — dark chocolate sponge, vanilla swirl, ganache drip and chocolate shavings. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'flavour-molten-chocolate'],
    isVegan: false,
    isGlutenFree: false,
    isEggless: false,
  },
  {
    handle: 'rocky-road-3-cupcakes',
    title: 'Rocky Road',
    flavour: 'Rocky Road',
    image: '/images/cupcake-builder/rocky-road.jpg',
    sku: 'CCD-DLX3-RR',
    bodyHtml:
      '<p>Rocky Road cupcakes — chocolate sponge topped with marshmallow, coconut and chocolate drizzle. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'flavour-rocky-road'],
    isVegan: false,
    isGlutenFree: false,
    isEggless: false,
  },
  {
    handle: 'salted-caramel-3-cupcakes',
    title: 'Salted Caramel',
    flavour: 'Salted Caramel',
    image: '/images/cupcake-builder/salted-caramel.jpg',
    sku: 'CCD-DLX3-SC',
    bodyHtml:
      '<p>Salted Caramel cupcakes — caramel sponge, salted caramel buttercream, popcorn and caramel drizzle. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'flavour-salted-caramel'],
    isVegan: false,
    isGlutenFree: false,
    isEggless: false,
  },
  {
    handle: 'vegan-chocolate-vanilla-3-cupcakes',
    title: 'Vegan Chocolate Vanilla',
    flavour: 'Vegan Chocolate Vanilla',
    image: '/images/cupcake-builder/vegan-chocolate-vanilla.jpg',
    sku: 'CCD-DLX-3-VCV',
    bodyHtml:
      '<p>Vegan &amp; gluten-free Chocolate Vanilla cupcakes, made with oat milk and plant butter. $5 each, minimum order 3.</p>',
    tags: ['box-of-3', 'deluxe', 'vegan', 'eggless'],
    isVegan: true,
    isGlutenFree: false,
    isEggless: true,
  },
]

function productDoc(item, existing) {
  const variantId = existing?.variants?.[0]?._id || new mongoose.Types.ObjectId()
  return {
    handle: item.handle,
    title: item.title,
    bodyHtml: item.bodyHtml,
    vendor: 'The Cupcake Desire',
    productCategory: 'Cupcake Boxes',
    tags: item.tags,
    options: [],
    variants: [
      {
        _id: variantId,
        option1Value: 'Default',
        option2Value: '',
        option3Value: '',
        sku: item.sku,
        grams: 0,
        inventoryQty: existing?.variants?.[0]?.inventoryQty ?? 40,
        inventoryPolicy: 'deny',
        price: UNIT_PRICE,
        compareAtPrice: null,
        requiresShipping: true,
        taxable: true,
        barcode: '',
        image: item.image,
        weightUnit: 'kg',
        costPerItem: 0,
      },
    ],
    images: [
      {
        src: item.image,
        position: 0,
        altText: item.title,
      },
    ],
    flavours: [item.flavour],
    isEggless: item.isEggless,
    isVegan: item.isVegan,
    isGlutenFree: item.isGlutenFree,
    currency: 'AUD',
    minOrderQty: MIN_ORDER_QTY,
    giftCard: false,
    published: true,
    status: 'active',
    isDeleted: false,
    seo: {
      title: `${item.title} | The Cupcake Desire`,
      description: `${item.flavour} cupcakes — $5 each, minimum order 3 ($15). Baked to order in our Narre Warren kitchen.`,
      robots: {
        index: true,
        follow: true,
        noarchive: false,
        nosnippet: false,
        noimageindex: false,
      },
    },
    updatedAt: new Date(),
  }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI missing')
    process.exit(1)
  }
  await mongoose.connect(uri)
  const products = mongoose.connection.collection('products')
  const collections = mongoose.connection.collection('collections')

  const handles = []
  for (const item of PRODUCTS) {
    const existing = await products.findOne({ handle: item.handle })
    const doc = productDoc(item, existing)
    if (existing) {
      await products.updateOne(
        { _id: existing._id },
        { $set: doc, $unset: { deletedAt: '' } }
      )
      console.log(`✓ updated ${item.handle}`)
    } else {
      await products.insertOne({ ...doc, createdAt: new Date() })
      console.log(`✓ created ${item.handle}`)
    }
    handles.push(item.handle)
  }

  const box = await products.findOne({ handle: 'deluxe-cupcake-box-3' })
  if (box) {
    const variants = (box.variants || []).map((v) => ({ ...v, price: UNIT_PRICE }))
    await products.updateOne(
      { _id: box._id },
      {
        $set: {
          minOrderQty: MIN_ORDER_QTY,
          variants,
          productCategory: 'Cupcake Boxes',
          updatedAt: new Date(),
        },
      }
    )
    console.log('✓ updated deluxe-cupcake-box-3 to $5 each / min 3')
    handles.unshift('deluxe-cupcake-box-3')
  }

  const col = await collections.findOne({ handle: 'deluxe-cupcakes' })
  if (col) {
    await collections.updateOne(
      { _id: col._id },
      { $set: { productHandles: handles, updatedAt: new Date() } }
    )
    console.log(`✓ deluxe-cupcakes collection now has ${handles.length} products`)
  } else {
    console.warn('⚠ deluxe-cupcakes collection not found — products created anyway')
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
