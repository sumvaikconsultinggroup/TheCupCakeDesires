/**
 * Upsert Corporate + Mini Corporate + Corporate Cake Slice products
 * (Size × Flavour + logo upload).
 * Run: node --env-file=.env.local scripts/wire-corporate-page-products.mjs
 */
import mongoose from 'mongoose'

const CUPCAKE_FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both']
const STANDARD_CUPCAKE_FLAVOURS = CUPCAKE_FLAVOURS
const MINI_CUPCAKE_FLAVOURS = CUPCAKE_FLAVOURS

const CAKE_SLICE_FLAVOURS = [
  'White Chocolate Tim Tam',
  'Chocolate Caramel Mars',
  'Chocolate Caramel Tim Tam',
  'Rocky Road',
  'Lemon',
  'Carrot Cake',
  'Raspberry Jelly Cheesecake',
  'Toffee Honeycomb Golden Gaytime',
  'Mix',
]

const PRODUCTS = [
  {
    handle: 'corporate-cupcakes',
    title: 'Corporate Cupcakes',
    bodyHtml:
      '<p>Branded corporate cupcakes for offices and events. Choose your box size and Vanilla, Chocolate, or Mix of Both — upload your logo for edible toppers.</p>',
    productCategory: 'Corporate',
    tags: ['corporate', 'branded', 'logo'],
    flavours: STANDARD_CUPCAKE_FLAVOURS,
    images: [
      { src: '/images/corporate-2.png', position: 0, altText: 'Corporate cupcakes' },
      { src: '/images/corporate-3.png', position: 1, altText: 'Branded corporate cupcakes' },
      { src: '/images/corporate-4.png', position: 2, altText: 'Hand-frosted corporate cupcakes' },
    ],
    sizes: [
      { qty: 12, option1Value: 'Box of 12', price: 66 },
      { qty: 30, option1Value: 'Box of 30', price: 150 },
      { qty: 50, option1Value: 'Box of 50', price: 240 },
      { qty: 100, option1Value: 'Box of 100', price: 450 },
      { qty: 200, option1Value: 'Box of 200', price: 840 },
      { qty: 300, option1Value: 'Box of 300', price: 1200 },
      { qty: 500, option1Value: 'Box of 500', price: 1750 },
    ],
  },
  {
    handle: 'mini-corporate-cupcakes',
    title: 'Mini Corporate Cupcakes',
    bodyHtml:
      '<p>Bite-size branded minis for standing receptions and networking events. Choose your pack size and Vanilla, Chocolate, or Mix of Both — upload your logo for edible toppers.</p>',
    productCategory: 'Corporate',
    tags: ['corporate', 'mini', 'branded', 'logo'],
    flavours: MINI_CUPCAKE_FLAVOURS,
    images: [
      {
        src: '/images/mini-coporate-cakes/1000051692.jpeg',
        position: 0,
        altText: 'Mini corporate cupcakes',
      },
      {
        src: '/images/mini-coporate-cakes/branded-minis.jpeg',
        position: 1,
        altText: 'Branded mini corporate cupcakes',
      },
      {
        src: '/images/mini-coporate-cakes/1000051698.jpeg',
        position: 2,
        altText: 'Branded mini corporate cupcakes',
      },
    ],
    sizes: [
      { qty: 24, option1Value: 'Box of 24', price: 84 },
      { qty: 100, option1Value: 'Box of 100', price: 330 },
      { qty: 300, option1Value: 'Box of 300', price: 900 },
      { qty: 500, option1Value: 'Box of 500', price: 1400 },
    ],
  },
  {
    handle: 'corporate-cake-slices',
    title: 'Corporate Cake Slices',
    bodyHtml:
      '<p>Standard size cake slices with edible logo toppers for offices and events. Choose your box size and a single flavour, or Mix for all flavours in one box — upload your logo at checkout. Pricing: Box of 12 $48, Box of 36 $136, Box of 50 $175, Box of 100 $300.</p>',
    productCategory: 'Corporate',
    tags: ['corporate', 'cake-slices', 'branded', 'logo'],
    flavours: CAKE_SLICE_FLAVOURS,
    images: [
      {
        src: '/images/cake-slice/white-chocolate-with-tim-tam.png',
        position: 0,
        altText: 'White chocolate Tim Tam cake slice',
      },
      {
        src: '/images/cake-slice/chocolate-caramel-with-mars.png',
        position: 1,
        altText: 'Chocolate caramel Mars cake slice',
      },
      {
        src: '/images/cake-slice/lemon-slice.png',
        position: 2,
        altText: 'Lemon cake slice',
      },
      {
        src: '/images/cake-slice/rocky-road.png',
        position: 3,
        altText: 'Rocky road cake slice',
      },
      {
        src: '/images/cake-slice/carrot.png',
        position: 4,
        altText: 'Carrot cake slice',
      },
      {
        src: '/images/cake-slice/raspberry-jelly-cheesecake.png',
        position: 5,
        altText: 'Raspberry jelly cheesecake slice',
      },
      {
        src: '/images/cake-slice/chocolate-caramel-with-tim-tam.png',
        position: 6,
        altText: 'Chocolate caramel Tim Tam cake slice',
      },
      {
        src: '/images/cake-slice/toffee-honeycomb-with-golden-gaytime.png',
        position: 7,
        altText: 'Toffee honeycomb Golden Gaytime cake slice',
      },
    ],
    sizes: [
      { qty: 12, option1Value: 'Box of 12', price: 48 },
      { qty: 36, option1Value: 'Box of 36', price: 136 },
      { qty: 50, option1Value: 'Box of 50', price: 175 },
      { qty: 100, option1Value: 'Box of 100', price: 300 },
    ],
  },
  {
    handle: 'corporate-round-cake',
    title: 'Corporate Logo Cakes',
    bodyHtml:
      '<p>A branded logo cake for offices and events. Choose 6 inch ($70), 8 inch ($90) or 10 inch ($110), Vanilla or Chocolate. Upload one logo — we print it on the cake and match the buttercream trim to your brand.</p>',
    productCategory: 'Corporate',
    tags: ['corporate', 'round-cake', 'logo-cakes', 'branded', 'logo'],
    flavours: ['Vanilla', 'Chocolate'],
    images: [
      {
        src: '/images/corporate-round-cake.png',
        position: 0,
        altText: 'Corporate logo cake with edible logo and matching trim',
      },
    ],
    sizes: [
      { qty: 6, option1Value: '6 inch', price: 70 },
      { qty: 8, option1Value: '8 inch', price: 90 },
      { qty: 10, option1Value: '10 inch', price: 110 },
    ],
  },
]

function buildVariants(handle, sizes, flavours) {
  const slug = handle.replace(/-cupcakes$/, '').replace(/-cake-slices$/, '-slices')
  const variants = []
  for (const tier of sizes) {
    for (const flavour of flavours) {
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

  for (const p of PRODUCTS) {
    const existing = await col.findOne({ handle: p.handle })
    const flavours = p.flavours || CUPCAKE_FLAVOURS
    const variants = buildVariants(p.handle, p.sizes, flavours)
    const options = [
      { name: 'Size', values: p.sizes.map((s) => s.option1Value) },
      { name: 'Flavour', values: [...flavours] },
    ]
    const doc = {
      handle: p.handle,
      title: p.title,
      bodyHtml: p.bodyHtml,
      vendor: 'The Cupcake Desire',
      productCategory: p.productCategory,
      tags: p.tags,
      options,
      variants,
      images: p.images,
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
      console.log(`✓ updated ${p.handle} → ${variants.length} variants`)
    } else {
      await col.insertOne({ ...doc, createdAt: new Date() })
      console.log(`✓ created ${p.handle} → ${variants.length} variants`)
    }
  }

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
