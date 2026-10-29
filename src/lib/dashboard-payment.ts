interface PaymentOrder {
  status?: string
  paymentStatus?: string
  paymentDetails?: { paymentStatus?: string }
  payment?: { status?: string }
}

const normalize = (value?: string) => (value || '').trim().toLowerCase()
const paid = new Set(['paid', 'success', 'successful', 'sucessfull', 'completed', 'captured'])
const excluded = new Set(['cancelled', 'refund_initiated', 'refunded', 'return_initiated', 'return_completed'])
const fulfilled = new Set(['paid', 'in_kitchen', 'out_for_delivery', 'delivered'])

export function isDashboardPaidOrder(order: PaymentOrder): boolean {
  if (excluded.has(normalize(order.status))) return false
  // Explicit payment evidence takes priority over the fulfillment lifecycle.
  const statuses = [order.paymentDetails?.paymentStatus, order.paymentStatus, order.payment?.status].map(normalize)
  if (statuses.some((status) => ['failed', 'refunded', 'cancelled'].includes(status))) return false
  if (statuses.some((status) => paid.has(status))) return true
  // Legacy records may have no payment snapshot. A pending snapshot is not proof of payment.
  return statuses.every((status) => !status) && fulfilled.has(normalize(order.status))
}
