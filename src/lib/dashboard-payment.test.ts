import assert from 'node:assert/strict'
import { isDashboardPaidOrder } from './dashboard-payment'

for (const status of ['paid', 'in_kitchen', 'out_for_delivery', 'delivered']) {
  assert.equal(isDashboardPaidOrder({ status }), true)
  assert.equal(isDashboardPaidOrder({ status, paymentDetails: { paymentStatus: 'paid' } }), true)
  assert.equal(isDashboardPaidOrder({ status, paymentDetails: { paymentStatus: 'failed' } }), false)
  assert.equal(isDashboardPaidOrder({ status, paymentDetails: { paymentStatus: 'pending' } }), false)
}
assert.equal(isDashboardPaidOrder({ status: 'pending_payment' }), false)
assert.equal(isDashboardPaidOrder({ status: 'refunded', paymentStatus: 'paid' }), false)
assert.equal(isDashboardPaidOrder({ status: 'cancelled', paymentStatus: 'paid' }), false)
assert.equal(isDashboardPaidOrder({ paymentDetails: { paymentStatus: 'completed' } }), true)
assert.equal(isDashboardPaidOrder({ paymentDetails: { paymentStatus: 'pending' }, payment: { status: 'paid' } }), true)
assert.equal(isDashboardPaidOrder({ paymentDetails: { paymentStatus: 'refunded' }, payment: { status: 'paid' } }), false)
console.log('Dashboard payment regression checks passed')
