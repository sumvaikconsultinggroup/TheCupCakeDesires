/**
 * Line items charged for an order. Website checkout and a phone/email
 * payment link both use this so the customer is billed `order.totalAmount`.
 */

const round2 = (n: number) => Math.round(n * 100) / 100

export interface OrderChargeSource {
  orderId?: string
  items?: Array<{ name?: string; imageUrl?: string; price?: number; quantity?: number }>
  shipping?: number
  discount?: number
  totalAmount?: number
}

export interface OrderChargeLine {
  name: string
  description?: string
  quantity: number
  unitAmount: number
  image?: string
}

export function buildOrderChargeLines(order: OrderChargeSource): OrderChargeLine[] {
  const items = Array.isArray(order.items) ? order.items : []
  const lines: OrderChargeLine[] = items.map((it) => {
    const image = typeof it.imageUrl === 'string' && it.imageUrl.startsWith('http') ? it.imageUrl : undefined
    return {
      name: it.name || 'Item',
      quantity: it.quantity || 1,
      unitAmount: it.price || 0,
      ...(image ? { image } : {}),
    }
  })

  const itemsTotal = round2(items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0))
  const shipping = round2(order.shipping || 0)
  const discount = round2(order.discount || 0)

  if (shipping > 0) {
    lines.push({
      name: 'Delivery',
      description: 'Self-delivery across Greater Melbourne',
      quantity: 1,
      unitAmount: shipping,
    })
  }

  const residual = round2((order.totalAmount || 0) - (itemsTotal + shipping - discount))
  if (residual > 0.01) {
    lines.push({
      name: 'Taxes & fees',
      description: 'Applied to the order total.',
      quantity: 1,
      unitAmount: residual,
    })
  }

  return lines
}

/**
 * Payment Links cannot attach the website's one-off coupon, and they allow
 * at most 20 lines. When the itemised lines would not charge `totalAmount`,
 * bill one line for the order total instead.
 */
export function paymentLinkChargeLines(order: OrderChargeSource): OrderChargeLine[] {
  const total = round2(order.totalAmount || 0)
  const itemised = buildOrderChargeLines(order)
  const discount = round2(order.discount || 0)
  const itemisedTotal = round2(
    itemised.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0) - discount
  )
  const usable =
    discount <= 0.01 &&
    itemised.length > 0 &&
    itemised.length <= 20 &&
    itemised.every((line) => line.unitAmount > 0 && line.quantity > 0) &&
    Math.abs(itemisedTotal - total) <= 0.01

  if (usable) return itemised
  return [
    {
      name: order.orderId ? `Order ${order.orderId}` : 'Order',
      description: 'Phone or email order from The Cupcake Desire',
      quantity: 1,
      unitAmount: total,
    },
  ]
}
