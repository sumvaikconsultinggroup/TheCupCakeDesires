import assert from 'node:assert/strict'
import {
  isOfflineOrderSource,
  mergeOrderSourceFilter,
  normalizeOrderSource,
  orderSourceLabel,
  orderSourceQuery,
  websiteOrderSourceClause,
} from './order-source'
import { priceManualOrder, resolveManualVariant, validateManualOrderInput } from './manual-order'

assert.equal(normalizeOrderSource(undefined), 'online')
assert.equal(normalizeOrderSource(''), 'online')
assert.equal(normalizeOrderSource('Website'), 'online')
assert.equal(normalizeOrderSource('PHONE'), 'phone')
assert.equal(normalizeOrderSource('email'), 'email')
assert.equal(orderSourceLabel('online'), 'Online')
assert.equal(orderSourceLabel('phone'), 'Phone')
assert.equal(isOfflineOrderSource('phone'), true)
assert.equal(isOfflineOrderSource('email'), true)
assert.equal(isOfflineOrderSource(undefined), false)
assert.deepEqual(websiteOrderSourceClause(), { source: { $nin: ['phone', 'email'] } })

assert.deepEqual(orderSourceQuery('phone'), { source: 'phone' })
assert.equal(orderSourceQuery(''), null)

const online = {} as Record<string, unknown>
mergeOrderSourceFilter(online, 'online')
assert.ok(Array.isArray(online.$or))

const withSearch: Record<string, unknown> = { $or: [{ orderId: { $regex: 'abc' } }] }
mergeOrderSourceFilter(withSearch, 'online')
assert.equal(withSearch.$or, undefined)
assert.equal(Array.isArray(withSearch.$and), true)

const near = priceManualOrder([{ price: 20, quantity: 2 }], '3171')
assert.equal(near.subtotal, 40)
assert.equal(near.shipping, 9.95)
assert.equal(near.taxes, 3.64)
assert.equal(near.taxableValue, 36.36)
assert.equal(near.totalAmount, 49.95)

const free = priceManualOrder([{ price: 60, quantity: 2 }], '3000')
assert.equal(free.subtotal, 120)
assert.equal(free.shipping, 0)
assert.equal(free.totalAmount, 120)

const base = {
  source: 'phone',
  customer: {
    firstName: 'Ava',
    lastName: 'Nguyen',
    email: 'Ava@Example.com',
    phone: '0412 345 678',
  },
  address: {
    street: '1 Chapel St',
    city: 'South Yarra',
    state: 'VIC',
    postalCode: '3141',
  },
  deliveryDate: '2026-11-12',
  deliverySlot: '',
  note: 'Call back if the gate is locked',
  items: [{ productId: '507f1f77bcf86cd799439011', option1Value: '6 pack', option2Value: '', quantity: 2 }],
  paymentCollected: true,
  paymentMethod: 'cash',
}

const ok = validateManualOrderInput(base, { today: '2026-11-11' })
assert.equal(ok.ok, true)
if (ok.ok) {
  assert.equal(ok.value.customer.email, 'ava@example.com')
  assert.equal(ok.value.address.state, 'Victoria')
  assert.equal(ok.value.address.postalCode, '3141')
  assert.equal(ok.value.deliverySlot.includes('8:00'), true)
}

assert.equal(validateManualOrderInput({ ...base, source: 'online' }, { today: '2026-11-11' }).ok, false)
assert.equal(
  validateManualOrderInput({ ...base, deliveryDate: '2026-11-10' }, { today: '2026-11-11' }).ok,
  false
)
assert.equal(
  validateManualOrderInput(
    { ...base, address: { ...base.address, postalCode: '9999' } },
    { today: '2026-11-11' }
  ).ok,
  false
)
assert.equal(validateManualOrderInput({ ...base, items: [] }, { today: '2026-11-11' }).ok, false)
assert.equal(
  validateManualOrderInput(
    { ...base, customer: { ...base.customer, email: 'nope' } },
    { today: '2026-11-11' }
  ).ok,
  false
)

const emailOrder = validateManualOrderInput(
  { ...base, source: 'email', paymentCollected: false, paymentMethod: '' },
  { today: '2026-11-11' }
)
assert.equal(emailOrder.ok, true)
if (emailOrder.ok) {
  assert.equal(emailOrder.value.source, 'email')
  assert.equal(emailOrder.value.paymentCollected, false)
  assert.equal(emailOrder.value.items[0].option3Value, '')
}

const withThird = validateManualOrderInput(
  {
    ...base,
    items: [{ productId: '507f1f77bcf86cd799439011', option1Value: '6 pack', option2Value: 'Vanilla', option3Value: 'Gluten free', quantity: 1 }],
  },
  { today: '2026-11-11' }
)
assert.equal(withThird.ok, true)
if (withThird.ok) assert.equal(withThird.value.items[0].option3Value, 'Gluten free')

const catalog = [
  { option1Value: '6 pack', option2Value: 'Vanilla', option3Value: 'Standard', price: 48, inventoryPolicy: 'deny', inventoryQty: 4 },
  { option1Value: '6 pack', option2Value: 'Vanilla', option3Value: 'Gluten free', price: 52, inventoryPolicy: 'deny', inventoryQty: 2 },
]
const chosen = resolveManualVariant(
  catalog,
  { option1Value: '6 pack', option2Value: 'Vanilla', option3Value: 'Gluten free', quantity: 1 },
  'Vanilla Dozen'
)
assert.equal(chosen.ok, true)
if (chosen.ok) assert.equal(chosen.price, 52)

const oversold = resolveManualVariant(
  catalog,
  { option1Value: '6 pack', option2Value: 'Vanilla', option3Value: 'Gluten free', quantity: 3 },
  'Vanilla Dozen'
)
assert.equal(oversold.ok, false)

const keptOpen = resolveManualVariant(
  [{ option1Value: '6 pack', option2Value: '', option3Value: '', price: 40, inventoryPolicy: 'continue', inventoryQty: 0 }],
  { option1Value: '6 pack', option2Value: '', option3Value: '', quantity: 2 },
  'Vanilla Dozen'
)
assert.equal(keptOpen.ok, true)

for (const price of [0, -5, Number.NaN, '48']) {
  const bad = resolveManualVariant(
    [{ option1Value: '6 pack', option2Value: '', option3Value: '', price, inventoryPolicy: 'continue', inventoryQty: 10 }],
    { option1Value: '6 pack', option2Value: '', option3Value: '', quantity: 1 },
    'Vanilla Dozen'
  )
  assert.equal(bad.ok, false)
}

console.log('Manual order source checks passed')
