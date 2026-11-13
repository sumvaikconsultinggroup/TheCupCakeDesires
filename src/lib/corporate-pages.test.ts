import assert from 'node:assert/strict'
import {
  STANDARD_CORPORATE_FLAVOURS,
  STANDARD_CORPORATE_SIZES,
  buildStandardCorporateVariants,
  corporateSellPrice,
  findCorporatePageVariantIndex,
  flavoursFromProductSize,
  storefrontFlavoursForSize,
  storefrontSizesFromProduct,
} from './corporate-pages'

const variants = [
  { option1Value: 'Box of 12', option2Value: 'Vanilla', price: 66 },
  { option1Value: 'Box of 12', option2Value: 'Chocolate', price: 66 },
  { option1Value: 'Box of 12 Gl-free & Vegan', option2Value: 'Vegan and Gluten free', price: 66 },
  { option1Value: 'Box of 24 Gl-free & Vegan', option2Value: 'Vegan and Gluten free', price: 132 },
  { option1Value: 'Box of 12', option2Value: 'Mix of Both', price: 66 },
]

const sizes = storefrontSizesFromProduct(STANDARD_CORPORATE_SIZES, variants)

assert.equal(sizes.filter((s) => s.option1Value === 'Box of 12').length, 1)
assert.equal(
  sizes.some((s) => s.option1Value === 'Box of 12 Gl-free & Vegan' && s.price === 66),
  true
)
assert.equal(
  sizes.some((s) => s.option1Value === 'Box of 24 Gl-free & Vegan' && s.price === 132),
  true
)
assert.equal(sizes[sizes.length - 1].option1Value, 'Box of 24 Gl-free & Vegan')
assert.equal(STANDARD_CORPORATE_SIZES[STANDARD_CORPORATE_SIZES.length - 1].qty, 500)
assert.equal(
  buildStandardCorporateVariants().some((v) => /gl-free/i.test(v.option1Value)),
  false
)
assert.deepEqual(storefrontSizesFromProduct(STANDARD_CORPORATE_SIZES, []), [...STANDARD_CORPORATE_SIZES])

assert.deepEqual(
  [...flavoursFromProductSize('Box of 12', variants)],
  [...STANDARD_CORPORATE_FLAVOURS]
)
assert.deepEqual([...flavoursFromProductSize('Box of 12 Gl-free & Vegan', variants)], [
  'Vegan and Gluten free',
])
assert.deepEqual([...flavoursFromProductSize('Box of 24 Gl-free & Vegan', [])], [])
const configuredSizes = STANDARD_CORPORATE_SIZES.map((size) => size.option1Value)
assert.deepEqual(
  storefrontFlavoursForSize('Box of 12', STANDARD_CORPORATE_FLAVOURS, variants, configuredSizes),
  [...STANDARD_CORPORATE_FLAVOURS]
)
assert.deepEqual(
  storefrontFlavoursForSize(
    'Box of 24 Gl-free & Vegan',
    STANDARD_CORPORATE_FLAVOURS,
    variants,
    configuredSizes
  ),
  ['Vegan and Gluten free']
)
assert.deepEqual(
  storefrontFlavoursForSize(
    'Box of 12',
    STANDARD_CORPORATE_FLAVOURS,
    [...variants, { option1Value: 'Box of 12', option2Value: 'Vegan and Gluten free', price: 66 }],
    configuredSizes
  ),
  [...STANDARD_CORPORATE_FLAVOURS, 'Vegan and Gluten free']
)

assert.equal(
  corporateSellPrice(99, variants, 'Box of 24 Gl-free & Vegan', 'Vegan and Gluten free'),
  132
)
assert.equal(corporateSellPrice(66, variants, 'Box of 12', 'Vanilla'), 66)
assert.equal(corporateSellPrice(66, [], 'Box of 12', 'Vanilla'), 66)

assert.equal(
  findCorporatePageVariantIndex(variants, 'Box of 12 Gl-free & Vegan', 'Vegan and Gluten free'),
  2
)
assert.equal(findCorporatePageVariantIndex(variants, 'Box of 24 Gl-free & Vegan', 'Vanilla'), -1)

console.log('corporate storefront variant wiring checks passed')
