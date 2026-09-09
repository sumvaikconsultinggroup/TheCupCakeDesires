import Cart from '@/models/Cart'
import AbandonedCart from '@/models/AbandonedCart'

export const CHECKOUT_STAGES = ['cart', 'checkout', 'ready_to_pay', 'payment_started'] as const
export type CheckoutStage = (typeof CHECKOUT_STAGES)[number]

const STAGE_RANK: Record<string, number> = {
  cart: 0,
  checkout: 1,
  ready_to_pay: 2,
  payment_started: 3,
}

export function nextCheckoutStage(current?: string | null, incoming?: string | null): CheckoutStage {
  const cur = current && STAGE_RANK[current] != null ? current : 'cart'
  if (!incoming || STAGE_RANK[incoming] == null) return cur as CheckoutStage
  return STAGE_RANK[incoming] >= STAGE_RANK[cur] ? (incoming as CheckoutStage) : (cur as CheckoutStage)
}

export async function markCartsPaid(identity: {
  userId?: string | null
  sessionId?: string | null
  email?: string | null
  orderId?: string | null
}) {
  const cartOr: Record<string, unknown>[] = []
  const abandonedOr: Record<string, unknown>[] = []
  if (identity.userId) {
    cartOr.push({ userId: identity.userId })
    abandonedOr.push({ userId: identity.userId })
  }
  if (identity.sessionId) {
    cartOr.push({ sessionId: identity.sessionId })
    abandonedOr.push({ guestId: identity.sessionId })
  }
  if (identity.email) {
    cartOr.push({ email: identity.email.toLowerCase() })
    abandonedOr.push({ email: identity.email.toLowerCase() })
  }
  if (identity.orderId) {
    cartOr.push({ pendingOrderId: identity.orderId })
    abandonedOr.push({ pendingOrderId: identity.orderId })
  }

  const now = new Date()
  if (cartOr.length > 0) {
    await Cart.updateMany(
      { $or: cartOr, status: { $in: ['active', 'checkout_started', 'payment_started', 'abandoned'] } },
      { $set: { status: 'converted', convertedAt: now, lastUpdated: now } }
    )
  }
  if (abandonedOr.length > 0) {
    await AbandonedCart.updateMany(
      { $or: abandonedOr, status: { $in: ['abandoned'] } },
      { $set: { status: 'recovered', lastUpdatedAt: now } }
    )
  }
}
