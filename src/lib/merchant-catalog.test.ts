/**
 * Run with: pnpm test:merchant-feed
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import expectedGids94fe304e from './merchant-gids-94fe304e.json'
import idLockProducts from './merchant-feed-id-products.json'
import leadFixture from './merchant-lead-fixture.json'
import {
  compactPostcodes,
  feedPlainText,
  formatMerchantPrice,
  googleProductCategoryFor,
  GPC_CAKES,
  GPC_CUPCAKES,
  isMerchantCake,
  isMerchantFeedExcluded,
  isMerchantOfferExcluded,
  MERCHANT_EXCLUDED_HANDLES,
  MERCHANT_ID_MAX,
  merchantAbsoluteImageUrls,
  merchantFeedItemId,
  merchantHandlingDays,
  merchantShippingRate,
  merchantShippingRows,
  minimumPayablePrice,
  productsToMerchantItems,
  renderGoogleMerchantRss,
} from './merchant-catalog'
import { sha1Hex } from './sha1'
import {
  MERCHANT_FEED_PRODUCT_SELECT,
  mapMerchantFeedDocs,
  pickMerchantFeedFields,
} from './merchant-feed-query'
import { generateProductSchema } from './seo'
import { DELIVERY_FEE_EXTENDED, DELIVERY_FEE_NEAR, FREE_DELIVERY_THRESHOLD } from '../utils/deliveryZones'

function threePack(handle: string, unit: number) {
  return {
    handle,
    title: 'Standard Cupcake Box of 3',
    bodyHtml: '<p>Hand frosted cupcakes. Minimum order 3.</p>',
    productCategory: 'Cupcake Boxes',
    minOrderQty: 3,
    variants: [{ option1Value: 'Default', sku: 'CCD-STD-3-RV', price: unit, inventoryQty: 10 }],
    images: [{ src: '/images/flavours/standard.jpeg' }],
  }
}

function cakeProduct() {
  return {
    handle: 'chocolate-chocolate-round-cake',
    title: 'Chocolate Chocolate Round Cake',
    bodyHtml: '<p>Round cake. Cakes need 3 days notice.</p>',
    productCategory: 'Cakes',
    minOrderQty: 1,
    options: [{ name: 'Size', values: ['6"', '8"'] }],
    variants: [
      { option1Value: '6"', sku: 'CCD-CAKE-CC-6', price: 60, inventoryQty: 10 },
      { option1Value: '8"', sku: 'CCD-CAKE-CC-8', price: 80, inventoryQty: 10 },
    ],
    images: [{ src: 'https://res.cloudinary.com/demo/image/upload/cake.jpg' }],
  }
}

/** Lean Mongo doc as Product.find().select(MERCHANT_FEED_PRODUCT_SELECT).lean() would return. */
function roundCakeDbDoc() {
  return {
    _id: '64a0cafefeed000000000001',
    handle: 'cookies-cream-round-cake',
    title: 'Cookies and Cream Round Cake',
    bodyHtml: '<p>Round cake baked to order.</p>',
    vendor: 'The Cupcake Desire',
    productCategory: 'Cakes',
    type: 'Cakes',
    tags: ['cake'],
    options: [{ name: 'Size', values: ['6"', '8"'] }],
    variants: [
      { option1Value: '6"', sku: 'CCD-CAKE-CC-6', price: 60, inventoryQty: 10 },
      { option1Value: '8"', sku: 'CCD-CAKE-CC-8', price: 80, inventoryQty: 10 },
    ],
    images: [{ src: 'https://res.cloudinary.com/demo/image/upload/cookies-cake.jpg' }],
    seo: {},
    giftCard: false,
    minOrderQty: 1,
  }
}

function main() {
  assert.equal(minimumPayablePrice(5, 3), 15)
  assert.equal(minimumPayablePrice(5.5, 3), 16.5)
  assert.equal(minimumPayablePrice(66, 1), 66)
  assert.equal(minimumPayablePrice(0, 3), 0)
  assert.equal(minimumPayablePrice(5), 5)

  const inferredProduct = {
    handle: 'vanilla-vanilla-3-cupcakes',
    title: 'Vanilla Vanilla 3 Cupcakes',
    bodyHtml: '<p>Box of 3.</p>',
    productCategory: 'Cupcake Boxes',
    minOrderQty: 3,
    variants: [{ option1Value: 'Default', sku: 'CCD-SC3-VV', price: 5.5, inventoryQty: 10 }],
    images: [{ src: 'https://res.cloudinary.com/demo/image/upload/v.jpg' }],
  }
  const inferred = productsToMerchantItems([inferredProduct])
  assert.equal(inferred[0].price, 16.5)
  assert.equal(Number(generateProductSchema(inferredProduct).offers?.price), inferred[0].price)

  for (const handle of MERCHANT_EXCLUDED_HANDLES) {
    assert.equal(isMerchantOfferExcluded(handle), true)
    assert.equal(isMerchantFeedExcluded({ handle }), true)
  }
  assert.equal(isMerchantOfferExcluded('wedding-cupcake-tier-gold'), true)
  assert.equal(isMerchantFeedExcluded({ handle: 'gift-voucher' }), true)
  assert.equal(isMerchantFeedExcluded({ handle: 'deluxe-box-of-12' }), false)

  assert.equal(isMerchantCake({ productCategory: 'Cakes', handle: 'drip-cake' }), true)
  assert.equal(isMerchantCake({ productCategory: 'Dress Cakes', handle: 'elsa-blue-dress-cake' }), true)
  assert.equal(isMerchantCake({ productCategory: 'Standard Cupcakes', handle: 'vanilla-vanilla-3-cupcakes' }), false)
  assert.equal(isMerchantCake({ productCategory: 'Giant Cupcakes', handle: 'giant-cupcake-red-velvet' }), false)

  assert.deepEqual(merchantHandlingDays({ productCategory: 'Cakes', minOrderQty: 1 }), { min: 3, max: 3 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Cupcake Boxes', minOrderQty: 1 }), { min: 1, max: 1 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Themed Boxes', minOrderQty: 1 }), { min: 1, max: 1 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Cupcake Boxes', minOrderQty: 3 }), { min: 2, max: 2 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Giant Cupcakes', minOrderQty: 1 }), { min: 2, max: 2 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Macarons', minOrderQty: 1 }), { min: 2, max: 2 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Corporate', minOrderQty: 1 }), { min: 3, max: 3 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Event', minOrderQty: 1 }), { min: 3, max: 3 })
  assert.deepEqual(merchantHandlingDays({ productCategory: 'Standard Cupcakes', minOrderQty: 1 }), { min: 3, max: 3 })

  const dist = { 1: 0, 2: 0, 3: 0 }
  for (const row of leadFixture) {
    const days = merchantHandlingDays(row).min
    dist[days as 1 | 2 | 3] += 1
  }
  assert.equal(dist[1], 51)
  assert.equal(dist[2], 29)
  assert.equal(dist[3], 31)
  assert.equal(dist[1] + dist[2] + dist[3], 111)

  assert.equal(googleProductCategoryFor({ productCategory: 'Cakes', handle: 'drip-cake' }), GPC_CAKES)
  assert.equal(
    googleProductCategoryFor({ productCategory: 'Standard Cupcakes', handle: 'vanilla-vanilla-3-cupcakes' }),
    GPC_CUPCAKES
  )

  const images = merchantAbsoluteImageUrls([{ src: '/images/dress-cakes/elsa-blue.jpeg' }])
  assert.equal(images.length, 1)
  assert.ok(images[0].startsWith('https://'))
  assert.ok(images[0].includes('/images/dress-cakes/elsa-blue.jpeg'))

  const under = merchantShippingRate(15)
  assert.equal(under.currency, 'AUD')
  assert.equal(under.minValue, DELIVERY_FEE_NEAR)
  assert.equal(under.maxValue, DELIVERY_FEE_EXTENDED)
  const free = merchantShippingRate(FREE_DELIVERY_THRESHOLD)
  assert.equal(free.value, 0)

  const paidRows = merchantShippingRows(15)
  assert.ok(paidRows.some((row) => row.priceFormatted === formatMerchantPrice(DELIVERY_FEE_NEAR)))
  assert.ok(paidRows.some((row) => row.priceFormatted === formatMerchantPrice(DELIVERY_FEE_EXTENDED)))
  assert.ok(paidRows.every((row) => row.country === 'AU'))
  const freeRows = merchantShippingRows(150)
  assert.ok(freeRows.length > 0)
  assert.ok(freeRows.every((row) => row.priceFormatted === '0.00 AUD'))

  assert.deepEqual(compactPostcodes(['3805', '3806', '3000']), ['3000', '3805-3806'])

  const packItems = productsToMerchantItems([threePack('standard-cupcake-box-3', 5)])
  assert.equal(packItems.length, 1)
  assert.equal(packItems[0].price, 15)
  assert.equal(packItems[0].priceFormatted, '15.00 AUD')
  assert.ok(packItems[0].imageLink.startsWith('https://'))
  assert.equal(packItems[0].identifierExists, 'no')
  assert.equal(packItems[0].brand, 'The Cupcake Desire')
  assert.equal(packItems[0].minHandlingTime, 2)
  assert.equal(packItems[0].maxHandlingTime, 2)
  assert.equal(packItems[0].minTransitTime, 0)
  assert.equal(packItems[0].maxTransitTime, 1)
  assert.equal(packItems[0].itemGroupId, undefined)
  assert.equal(packItems[0].id, 'standard-cupcake-box-3')
  assert.ok(!packItems[0].id.includes('CCD-STD-3-RV'))

  const flavouredThreePack = productsToMerchantItems([
    {
      handle: 'standard-cupcake-box-3',
      title: 'Standard Cupcake Box',
      bodyHtml: '<p>Minimum order 3.</p>',
      productCategory: 'Cupcake Boxes',
      minOrderQty: 3,
      options: [{ name: 'Flavour', values: ['Red Velvet', 'Vanilla Vanilla'] }],
      variants: [
        { option1Value: 'Red Velvet', sku: 'CCD-STD-3-RV', price: 5, inventoryQty: 10 },
        { option1Value: 'Vanilla Vanilla', sku: 'CCD-STD-3-VV', price: 5, inventoryQty: 10 },
      ],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/box.jpg' }],
    },
  ])
  assert.equal(flavouredThreePack.length, 1)
  assert.equal(flavouredThreePack[0].price, 15)
  assert.equal(flavouredThreePack[0].title, 'Standard Cupcake Box')
  assert.equal(flavouredThreePack[0].flavor, undefined)
  assert.equal(flavouredThreePack[0].size, undefined)

  const deluxe = productsToMerchantItems([threePack('deluxe-cupcake-box-3', 5.5)])
  assert.equal(deluxe[0].price, 16.5)

  const cakeItems = productsToMerchantItems([cakeProduct()])
  assert.equal(cakeItems.length, 2)
  assert.equal(cakeItems[0].itemGroupId, 'chocolate-chocolate-round-cake')
  assert.equal(cakeItems[0].minHandlingTime, 3)
  assert.equal(cakeItems[1].price, 80)
  assert.equal(cakeItems[0].size, '6"')
  assert.equal(cakeItems[1].size, '8"')
  assert.equal(cakeItems[0].flavor, undefined)
  assert.ok(cakeItems[0].id.startsWith('chocolate-chocolate-round-cake__'))
  assert.ok(!cakeItems[0].id.includes('CCD-CAKE-CC'))

  const excluded = productsToMerchantItems([
    {
      handle: 'wedding-cupcake-tier',
      title: 'Wedding Cupcake Tier',
      variants: [{ price: 300, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/w.jpg' }],
    },
    {
      handle: 'custom-birthday-cake',
      title: 'Custom Birthday Cake',
      variants: [{ price: 0, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/c.jpg' }],
    },
    {
      handle: 'sorry-cupcakes-3-cupcakes',
      title: 'Sorry Cupcakes 3',
      variants: [{ price: 0, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/s.jpg' }],
    },
  ])
  assert.equal(excluded.length, 0)

  const zeroPriced = productsToMerchantItems([
    {
      handle: 'mystery-box',
      title: 'Mystery',
      variants: [{ price: 0, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/m.jpg' }],
    },
  ])
  assert.equal(zeroPriced.length, 0)

  const pack = threePack('standard-cupcake-box-3', 5)
  const schema = generateProductSchema({ ...pack, leadTimeCategory: pack.productCategory })
  assert.equal(schema.offers?.price, '15')
  assert.equal(Number(schema.offers?.price), packItems[0].price)
  assert.ok(typeof schema.image[0] === 'string' && schema.image[0].startsWith('https://'))
  const dest = schema.offers?.shippingDetails?.shippingDestination
  assert.equal(dest?.addressCountry, 'AU')
  assert.ok(Array.isArray(dest?.postalCode))
  assert.equal('addressRegion' in (dest || {}), false)
  assert.equal(schema.offers?.shippingDetails?.deliveryTime?.handlingTime?.minValue, 2)
  assert.equal(schema.offers?.shippingDetails?.deliveryTime?.handlingTime?.maxValue, 2)
  assert.equal(schema.offers?.shippingDetails?.deliveryTime?.transitTime?.minValue, 0)
  assert.equal(schema.offers?.shippingDetails?.deliveryTime?.transitTime?.maxValue, 1)
  assert.equal(schema.offers?.shippingDetails?.shippingRate?.minValue, DELIVERY_FEE_NEAR)

  const cakeSchema = generateProductSchema({ ...cakeProduct(), leadTimeCategory: 'Cakes' })
  const cakeOffers = cakeSchema.offers as { price?: string; lowPrice?: string; highPrice?: string } | undefined
  assert.equal(Number(cakeOffers?.price), 60)
  assert.equal(Number(cakeOffers?.lowPrice), 60)
  assert.equal(Number(cakeOffers?.highPrice), 80)
  assert.equal(cakeSchema.offers?.shippingDetails?.deliveryTime?.handlingTime?.minValue, 3)
  assert.equal(cakeSchema.offers?.shippingDetails?.deliveryTime?.handlingTime?.maxValue, 3)
  assert.equal(Number(cakeSchema.offers?.price), Math.min(...cakeItems.map((item) => item.price)))

  const quoteSchema = generateProductSchema({
    handle: 'wedding-cupcake-tier',
    title: 'Wedding Cupcake Tier',
    variants: [{ price: 300, sku: 'CCD-CUST-WCT', inventoryQty: 10 }],
    images: [{ src: 'https://res.cloudinary.com/demo/image/upload/w.jpg' }],
  })
  assert.equal(quoteSchema.offers, undefined)

  const xml = renderGoogleMerchantRss(packItems)
  assert.ok(xml.includes('xmlns:g="http://base.google.com/ns/1.0"'))
  assert.ok(xml.includes('<g:identifier_exists>no</g:identifier_exists>'))
  assert.ok(xml.includes('<g:price>15.00 AUD</g:price>'))
  assert.ok(xml.includes('<g:image_link>https://'))
  assert.ok(!/pickup/i.test(xml))
  assert.ok(!xml.includes('<g:price>0.00 AUD</g:price>') || packItems[0].price >= FREE_DELIVERY_THRESHOLD)

  // MF1: route query shape (mocked lean doc, not the public API mapping).
  assert.ok(MERCHANT_FEED_PRODUCT_SELECT.split(/\s+/).includes('options'))
  const extraApiFields = {
    ...roundCakeDbDoc(),
    createdAt: '2026-01-01',
    flavours: ['Cookies and Cream'],
    reviews: [],
    allowLogoUpload: false,
  }
  const selected = pickMerchantFeedFields(extraApiFields)
  assert.ok(selected.options)
  assert.equal(selected.createdAt, undefined)
  assert.equal(selected.flavours, undefined)
  assert.equal(selected.reviews, undefined)
  const mapped = mapMerchantFeedDocs([selected])
  assert.equal(mapped[0].productCategory, 'Cakes')
  const boxMapped = mapMerchantFeedDocs([
    {
      handle: 'standard-cupcake-box-3',
      title: 'Standard Cupcake Box of 3',
      bodyHtml: '<p>Minimum order 3.</p>',
      productCategory: 'Cupcake Boxes',
      minOrderQty: 3,
      variants: [{ option1Value: 'Default', sku: 'CCD-STD-3-RV', price: 5, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/box.jpg' }],
    },
  ])
  assert.equal(boxMapped[0].productCategory, 'Cupcake Boxes')
  assert.deepEqual(merchantHandlingDays(boxMapped[0]), { min: 2, max: 2 })
  const dbShapeItems = productsToMerchantItems(mapped)
  assert.equal(dbShapeItems.length, 2)
  assert.equal(dbShapeItems[0].size, '6"')
  assert.equal(dbShapeItems[1].size, '8"')
  assert.equal(dbShapeItems[0].flavor, undefined)
  assert.equal(dbShapeItems[1].flavor, undefined)
  const dbXml = renderGoogleMerchantRss(dbShapeItems)
  assert.ok(dbXml.includes('<g:size>6&quot;</g:size>') || dbXml.includes('<g:size>6"</g:size>'))
  assert.ok(!dbXml.includes('<g:flavor>6'))
  assert.ok(!dbXml.includes('<g:flavor>8'))

  const chocolate = productsToMerchantItems([cakeProduct()])
  const cookies = productsToMerchantItems(mapMerchantFeedDocs([roundCakeDbDoc()]))
  assert.equal(chocolate[0].id === cookies[0].id, false)
  assert.ok(chocolate[0].id.startsWith('chocolate-chocolate-round-cake__'))
  assert.ok(cookies[0].id.startsWith('cookies-cream-round-cake__'))

  assert.equal(feedPlainText('Small batch — baked to order'), 'Small batch, baked to order')
  assert.equal(feedPlainText('Cakes – 3 days notice'), 'Cakes, 3 days notice')
  const dashed = productsToMerchantItems([
    {
      handle: 'deluxe-box-of-12',
      title: 'Deluxe Box — 12',
      bodyHtml: '<p>Hand frosted – Metro delivery.</p>',
      productCategory: 'Cupcake Boxes',
      minOrderQty: 1,
      variants: [{ option1Value: 'Default', sku: 'CCD-BOX12-GM', price: 66, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/d.jpg' }],
    },
  ])
  assert.equal(dashed[0].title.includes('\u2014') || dashed[0].title.includes('\u2013'), false)
  assert.equal(dashed[0].description.includes('\u2014') || dashed[0].description.includes('\u2013'), false)
  assert.ok(dashed[0].title.includes(','))
  assert.equal(dashed[0].minHandlingTime, 1)

  // MF4: pure SHA-1 matches FIPS 180-1 vectors and Node crypto.
  assert.equal(sha1Hex('abc'), 'a9993e364706816aba3e25717850c26c9cd0d89d')
  assert.equal(sha1Hex(''), 'da39a3ee5e6b4b0d3255bfef95601890afd80709')
  assert.equal(sha1Hex('abc'), createHash('sha1').update('abc').digest('hex'))
  assert.equal(sha1Hex(''), createHash('sha1').update('').digest('hex'))

  // MF3: g:id must stay unique, stable, and at most 50 characters.
  function hashedId(fullKey: string, handle: string) {
    const hash = sha1Hex(fullKey).slice(0, 8)
    const suffix = `__${hash}`
    return `${handle.slice(0, MERCHANT_ID_MAX - suffix.length)}${suffix}`
  }

  const shortCakeId = merchantFeedItemId(
    'chocolate-chocolate-round-cake',
    { option1Value: '6"' },
    0,
    true
  )
  assert.equal(shortCakeId, 'chocolate-chocolate-round-cake__6')
  assert.ok(shortCakeId.length <= MERCHANT_ID_MAX)
  assert.equal(packItems[0].id, 'standard-cupcake-box-3')
  assert.equal(cakeItems[0].id, 'chocolate-chocolate-round-cake__6')
  assert.equal(cakeItems[1].id, 'chocolate-chocolate-round-cake__8')

  const longFull = 'box-of-12-pink-ribbon-day-cupcakes__box_of_100_vanilla'
  assert.ok(longFull.length > MERCHANT_ID_MAX)
  const longId = merchantFeedItemId(
    'box-of-12-pink-ribbon-day-cupcakes',
    { option1Value: 'Box of 100 Vanilla' },
    0,
    true
  )
  assert.equal(longId, hashedId(longFull, 'box-of-12-pink-ribbon-day-cupcakes'))
  assert.ok(longId.length <= MERCHANT_ID_MAX)
  assert.equal(
    merchantFeedItemId(
      'box-of-12-pink-ribbon-day-cupcakes',
      { option1Value: 'Box of 100 Vanilla' },
      0,
      true
    ),
    longId
  )

  const longGroup = productsToMerchantItems([
    {
      handle: 'box-of-12-pink-ribbon-day-cupcakes',
      title: 'Pink Ribbon Day Cupcakes',
      bodyHtml: '<p>Themed box.</p>',
      productCategory: 'Themed Boxes',
      minOrderQty: 1,
      options: [{ name: 'Size', values: ['Box of 100 Vanilla', 'Box of 12 Chocolate'] }],
      variants: [
        { option1Value: 'Box of 100 Vanilla', sku: 'PR-100-V', price: 40, inventoryQty: 10 },
        { option1Value: 'Box of 12 Chocolate', sku: 'PR-12-C', price: 66, inventoryQty: 10 },
      ],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/p.jpg' }],
    },
    {
      handle: 'corporate-cake-slices',
      title: 'Corporate Cake Slices',
      bodyHtml: '<p>Slices.</p>',
      productCategory: 'Corporate',
      minOrderQty: 1,
      options: [{ name: 'Size', values: ['Box of 20 Vanilla Vanilla', 'Box of 12 Red Velvet'] }],
      variants: [
        { option1Value: 'Box of 20 Vanilla Vanilla', sku: 'CS-20', price: 70, inventoryQty: 10 },
        { option1Value: 'Box of 12 Red Velvet', sku: 'CS-12', price: 55, inventoryQty: 10 },
      ],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/s.jpg' }],
    },
    {
      handle: 'box-of-12-custom-pic-cupcakes',
      title: 'Custom Pic Cupcakes',
      bodyHtml: '<p>Custom pic.</p>',
      productCategory: 'Themed Boxes',
      minOrderQty: 1,
      options: [{ name: 'Size', values: ['Box of 100 Vanilla'] }],
      variants: [{ option1Value: 'Box of 100 Vanilla', sku: 'PIC-100', price: 80, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/c.jpg' }],
    },
    {
      handle: 'halloween-cupcakes',
      title: 'Halloween Cupcakes',
      bodyHtml: '<p>Halloween.</p>',
      productCategory: 'Themed Boxes',
      minOrderQty: 1,
      options: [{ name: 'Size', values: ['Box of 100 Vanilla Vanilla'] }],
      variants: [{ option1Value: 'Box of 100 Vanilla Vanilla', sku: 'HAL-100', price: 80, inventoryQty: 10 }],
      images: [{ src: 'https://res.cloudinary.com/demo/image/upload/h.jpg' }],
    },
  ])
  const feedIds = [
    ...packItems,
    ...cakeItems,
    ...dbShapeItems,
    ...dashed,
    ...longGroup,
  ].map((item) => item.id)
  assert.equal(new Set(feedIds).size, feedIds.length)
  for (const id of feedIds) {
    assert.ok(id.length <= MERCHANT_ID_MAX, id)
  }
  const xmlIds = [...renderGoogleMerchantRss(longGroup).matchAll(/<g:id>([^<]+)<\/g:id>/g)].map((m) => m[1])
  assert.deepEqual(xmlIds, longGroup.map((item) => item.id))
  assert.equal(xmlIds.length, new Set(xmlIds).size)

  const lockedIds = productsToMerchantItems(mapMerchantFeedDocs(idLockProducts)).map((item) => item.id)
  assert.equal(lockedIds.length, 240)
  assert.equal(expectedGids94fe304e.length, 240)
  assert.deepEqual(lockedIds, expectedGids94fe304e)

  console.log('merchant-catalog tests passed')
  console.log('handling distribution', dist)
}

main()
