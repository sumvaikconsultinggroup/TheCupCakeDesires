/**
 * End-to-end gap check for recent storefront/corporate/shipping work.
 * Run: node --env-file=.env.local scripts/audit-storefront-gaps.mjs
 */
import mongoose from 'mongoose'

const issues = []
const ok = []

function expect(cond, msg) {
  if (cond) ok.push(msg)
  else issues.push(msg)
}

function priceMap(variants) {
  const map = new Map()
  for (const v of variants || []) {
    map.set(`${v.option1Value}||${v.option2Value || ''}`, v.price)
  }
  return map
}

function assertMatrix(product, sizes, flavours, label) {
  expect(!!product, `${label}: product exists`)
  if (!product) return
  const variants = product.variants || []
  const flavList = flavours?.length ? flavours : ['']
  const expected = sizes.length * flavList.length
  expect(
    variants.length === expected,
    `${label}: ${variants.length} variants (want ${expected})`
  )
  const map = priceMap(variants)
  for (const s of sizes) {
    for (const f of flavList) {
      const key = `${s.option1Value}||${f}`
      const price = map.get(key)
      expect(price === s.price, `${label}: ${key} = $${price} (want $${s.price})`)
    }
  }
  if (flavours?.length) {
    const optionFlavour = (product.options || []).find((o) => /flavour/i.test(o.name || ''))
    for (const f of flavours) {
      expect(
        (optionFlavour?.values || []).includes(f),
        `${label}: options include flavour "${f}"`
      )
    }
  }
  expect(product.published === true || product.published === undefined, `${label}: published`)
  expect(product.status === 'active' || !product.status, `${label}: status active`)
  expect(product.isDeleted !== true, `${label}: not deleted`)
}

const CUPCAKE_FLAVOURS = ['Vanilla', 'Chocolate', 'Mix of Both']
const STANDARD_SIZES = [
  { option1Value: 'Box of 12', price: 66 },
  { option1Value: 'Box of 30', price: 150 },
  { option1Value: 'Box of 50', price: 240 },
  { option1Value: 'Box of 100', price: 450 },
  { option1Value: 'Box of 200', price: 840 },
  { option1Value: 'Box of 300', price: 1200 },
  { option1Value: 'Box of 500', price: 1750 },
]
const MINI_SIZES = [
  { option1Value: 'Box of 24', price: 84 },
  { option1Value: 'Box of 100', price: 330 },
  { option1Value: 'Box of 300', price: 900 },
  { option1Value: 'Box of 500', price: 1400 },
]
const SLICE_SIZES = [
  { option1Value: 'Box of 12', price: 84 },
  { option1Value: 'Box of 36', price: 234 },
  { option1Value: 'Box of 50', price: 300 },
  { option1Value: 'Box of 100', price: 550 },
]
const SLICE_FLAVOURS = [
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
const EVENT_HANDLES = [
  'box-of-12-womens-day-cupcakes',
  'box-of-12-ruok-day-cupcakes',
  'box-of-12-pink-ribbon-day-cupcakes',
  'box-of-12-anzac-day-cupcakes',
  'box-of-12-pride-day-cupcakes',
]
const AFL_HANDLE = 'box-of-12-afl-cupcakes'
const AFL_SIZES = [{ option1Value: 'Box of 12', price: 66 }]

await mongoose.connect(process.env.MONGODB_URI)
const products = mongoose.connection.collection('products')
const collections = mongoose.connection.collection('collections')

assertMatrix(
  await products.findOne({ handle: 'corporate-cupcakes', isDeleted: { $ne: true } }),
  STANDARD_SIZES,
  CUPCAKE_FLAVOURS,
  'corporate-cupcakes'
)
{
  const p = await products.findOne({ handle: 'corporate-cupcakes', isDeleted: { $ne: true } })
  expect(p?.allowLogoUpload === true, 'corporate-cupcakes allowLogoUpload')
}

assertMatrix(
  await products.findOne({ handle: 'mini-corporate-cupcakes', isDeleted: { $ne: true } }),
  MINI_SIZES,
  CUPCAKE_FLAVOURS,
  'mini-corporate-cupcakes'
)

assertMatrix(
  await products.findOne({ handle: 'corporate-cake-slices', isDeleted: { $ne: true } }),
  [
    { option1Value: 'Box of 12', price: 48 },
    { option1Value: 'Box of 36', price: 136 },
    { option1Value: 'Box of 50', price: 175 },
    { option1Value: 'Box of 100', price: 300 },
  ],
  SLICE_FLAVOURS,
  'corporate-cake-slices'
)
{
  const p = await products.findOne({ handle: 'corporate-cake-slices', isDeleted: { $ne: true } })
  expect(p?.allowLogoUpload === true, 'corporate-cake-slices allowLogoUpload')
}

assertMatrix(
  await products.findOne({ handle: 'corporate-round-cake', isDeleted: { $ne: true } }),
  [
    { option1Value: '6 inch', price: 70 },
    { option1Value: '8 inch', price: 90 },
    { option1Value: '10 inch', price: 110 },
  ],
  ['Vanilla', 'Chocolate'],
  'corporate-round-cake'
)
{
  const p = await products.findOne({ handle: 'corporate-round-cake', isDeleted: { $ne: true } })
  expect(p?.allowLogoUpload === true, 'corporate-round-cake allowLogoUpload')
  expect(p?.productCategory === 'Corporate', 'corporate-round-cake category Corporate')
  expect(p?.title === 'Corporate Logo Cakes', `corporate-round-cake title="${p?.title}"`)
  expect(
    String(p?.images?.[0]?.src || '').includes('corporate-round-cake'),
    `corporate-round-cake image=${p?.images?.[0]?.src}`
  )
}

for (const handle of EVENT_HANDLES) {
  assertMatrix(
    await products.findOne({ handle, isDeleted: { $ne: true } }),
    STANDARD_SIZES,
    CUPCAKE_FLAVOURS,
    handle
  )
}

{
  const p = await products.findOne({ handle: AFL_HANDLE, isDeleted: { $ne: true } })
  expect(p?.allowLogoUpload === true, 'afl cupcake box allowLogoUpload')
  assertMatrix(p, AFL_SIZES, CUPCAKE_FLAVOURS, AFL_HANDLE)
}

{
  const p = await products.findOne({ handle: 'mix-slice', isDeleted: { $ne: true } })
  expect(!!p, 'mix-slice product exists')
  expect(p?.title === 'Mix Slice', `mix-slice title="${p?.title}"`)
  expect(p?.allowLogoUpload === false, 'mix-slice no logo upload')
  expect(
    String(p?.images?.[0]?.src || '').includes('mix-slice'),
    `mix-slice image=${p?.images?.[0]?.src}`
  )
  assertMatrix(p, SLICE_SIZES, null, 'mix-slice')
  const col = await collections.findOne({ handle: 'cake-slices' })
  expect(
    (col?.productHandles || []).includes('mix-slice'),
    'cake-slices collection includes mix-slice'
  )
}

await mongoose.disconnect()

console.log(`\nOK (${ok.length})`)
for (const m of ok) console.log('  ✓', m)
console.log(`\nISSUES (${issues.length})`)
for (const m of issues) console.log('  ✗', m)
if (issues.length) {
  process.exitCode = 1
} else {
  console.log('\nAll checks passed.')
}
