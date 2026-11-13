import assert from 'node:assert/strict'
import { syncProductOptionValues } from './product-options'

const synced = syncProductOptionValues(
  [
    { name: 'Size', values: ['Box of 12', 'Box of 30'] },
    { name: 'Flavour', values: ['Vanilla', 'Chocolate', 'Mix of Both'] },
  ],
  [
    { option1Value: 'Box of 12', option2Value: 'Vanilla' },
    { option1Value: 'Box of 12 Gl-free & Vegan', option2Value: 'Vegan and Gluten free' },
    { option1Value: 'Box of 24 Gl-free & Vegan', option2Value: 'Vegan and Gluten free' },
  ]
)

assert.deepEqual(synced[0].values, [
  'Box of 12',
  'Box of 30',
  'Box of 12 Gl-free & Vegan',
  'Box of 24 Gl-free & Vegan',
])
assert.deepEqual(synced[1].values, [
  'Vanilla',
  'Chocolate',
  'Mix of Both',
  'Vegan and Gluten free',
])
assert.equal(synced[0].values.filter((v) => v === 'Box of 12').length, 1)

console.log('product option sync checks passed')
