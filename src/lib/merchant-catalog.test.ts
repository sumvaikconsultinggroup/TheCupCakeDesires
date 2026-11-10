/**
 * Run with: pnpm test:merchant-feed
 */
import assert from 'node:assert/strict'
import {
  compactPostcodes,
  formatMerchantPrice,
  googleProductCategoryFor,
  GPC_CAKES,
  GPC_CUPCAKES,
  isMerchantCake,
  isMerchantFeedExcluded,
  isMerchantOfferExcluded,
  MERCHANT_EXCLUDED_HANDLES,
  merchantAbsoluteImageUrls,
  merchantHandlingTime,
  merchantShippingRate,
  merchantShippingRows,
  minimumPayablePrice,
  productsToMerchantItems,
  renderGoogleMerchantRss,
} from './merchant-catalog'
import { generateProductSchema } from './seo'
import { DELIVERY_FEE_EXTENDED, DELIVERY_FEE_NEAR, FREE_DELIVERY_THRESHOLD } from '../utils/deliveryZones'

function threePack(handle: string, unit: number) {
  return {
    handle,
    title: 'Standard Cupcake Box of 3',
    bodyHtml: '<p>Hand frosted cupcakes. Minimum order 3.</p>',
    productCategory: 'Standard Cupcakes',
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
    variants: [
      { option1Value: '6 inch', sku: 'CCD-CAKE-CC-6', price: 60, inventoryQty: 10 },
      { option1Value: '8 inch', sku: 'CCD-CAKE-CC-8', price: 80, inventoryQty: 10 },
    ],
    images: [{ src: 'https://res.cloudinary.com/demo/image/upload/cake.jpg' }],
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
    productCategory: 'Standard Cupcakes',
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

  assert.deepEqual(merchantHandlingTime(true), { min: 3, max: 3 })
  assert.deepEqual(merchantHandlingTime(false), { min: 0, max: 1 })
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
  assert.equal(packItems[0].minHandlingTime, 0)
  assert.equal(packItems[0].maxHandlingTime, 1)
  assert.equal(packItems[0].itemGroupId, undefined)

  const flavouredThreePack = productsToMerchantItems([
    {
      handle: 'standard-cupcake-box-3',
      title: 'Standard Cupcake Box',
      bodyHtml: '<p>Minimum order 3.</p>',
      productCategory: 'Standard Cupcakes',
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
  assert.ok(cakeItems[0].title.includes('6 inch'))
  assert.ok(cakeItems[1].title.includes('8 inch'))

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
  const schema = generateProductSchema(pack)
  assert.equal(schema.offers?.price, '15')
  assert.equal(Number(schema.offers?.price), packItems[0].price)
  assert.ok(typeof schema.image[0] === 'string' && schema.image[0].startsWith('https://'))
  assert.equal(schema.offers?.shippingDetails?.shippingDestination?.addressCountry, 'AU')
  assert.ok(Array.isArray(schema.offers?.shippingDetails?.shippingDestination?.postalCode))
  assert.equal(schema.offers?.shippingDetails?.shippingDestination?.addressRegion, undefined)
  assert.equal(schema.offers?.shippingDetails?.deliveryTime?.handlingTime?.minValue, 0)
  assert.equal(schema.offers?.shippingDetails?.shippingRate?.minValue, DELIVERY_FEE_NEAR)

  const cakeSchema = generateProductSchema(cakeProduct())
  assert.equal(Number(cakeSchema.offers?.price), 60)
  assert.equal(Number(cakeSchema.offers?.lowPrice), 60)
  assert.equal(Number(cakeSchema.offers?.highPrice), 80)
  assert.equal(cakeSchema.offers?.shippingDetails?.deliveryTime?.handlingTime?.minValue, 3)
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

  console.log('merchant-catalog tests passed')
}

main()
