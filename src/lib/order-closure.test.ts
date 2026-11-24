import assert from 'node:assert/strict'
import { isCakePauseDate, isKitchenClosedDate, isOrderingClosed, KITCHEN_CLOSURE_MESSAGE } from './order-closure'

assert.equal(isKitchenClosedDate('2026-12-15'), false)
assert.equal(isKitchenClosedDate('2026-12-16'), true)
assert.equal(isKitchenClosedDate('2026-12-17'), true)
assert.equal(isKitchenClosedDate('2026-12-31'), true)
assert.equal(isKitchenClosedDate('2027-01-10'), true)
assert.equal(isKitchenClosedDate('2027-01-11'), false)
assert.equal(isKitchenClosedDate('2027-12-16'), false)
assert.equal(isKitchenClosedDate(''), false)
assert.equal(isKitchenClosedDate('16-12-2026'), false)

assert.equal(isCakePauseDate('2026-12-01'), false)
assert.equal(isCakePauseDate('2026-12-02'), true)
assert.equal(isCakePauseDate('2026-12-15'), true)
assert.equal(isCakePauseDate('2026-12-16'), false)

assert.equal(isOrderingClosed({ todayISO: '2026-11-24', deliveryDate: '2026-12-20' }), true)
assert.equal(isOrderingClosed({ todayISO: '2026-12-20', deliveryDate: '2027-01-15' }), true)
assert.equal(isOrderingClosed({ todayISO: '2026-11-24', deliveryDate: '2026-12-15' }), false)
assert.equal(isOrderingClosed({ todayISO: '2027-01-11', deliveryDate: '2027-01-12' }), false)

assert.equal(KITCHEN_CLOSURE_MESSAGE.includes('16 December 2026'), true)
assert.equal(KITCHEN_CLOSURE_MESSAGE.includes('10 January 2027'), true)

console.log('order closure checks passed')
