import Product from '@/models/product.model'
import mongoose from 'mongoose'

/** Orders in these states were paid for, so their buyers can leave a verified review. */
export const REVIEWABLE_ORDER_STATUSES = ['paid', 'in_kitchen', 'out_for_delivery', 'delivered']

export interface ReviewableItem {
  productId: string
  handle: string
  title: string
  imageUrl: string | null
}

/**
 * Resolve an order's line items to real products (items store either the
 * product's Mongo id or its handle), de-duplicated so a product that appears
 * twice in one order is reviewed once.
 */
export async function resolveReviewableItems(order: any): Promise<ReviewableItem[]> {
  const refs: string[] = Array.from(
    new Set((order.items || []).map((i: any) => String(i.productId || '').trim()).filter(Boolean))
  )
  if (refs.length === 0) return []

  const ids = refs.filter((r) => mongoose.Types.ObjectId.isValid(r) && /^[a-f0-9]{24}$/i.test(r))
  const products = (await Product.find({
    isDeleted: { $ne: true },
    $or: [{ _id: { $in: ids } }, { handle: { $in: refs } }],
  })
    .select('_id handle title images')
    .lean()) as any[]

  const imageFor = (p: any) => {
    const item = (order.items || []).find(
      (i: any) => String(i.productId) === String(p._id) || String(i.productId) === p.handle
    )
    return item?.imageUrl || p.images?.[0]?.src || null
  }

  return products.map((p) => ({
    productId: String(p._id),
    handle: p.handle,
    title: p.title,
    imageUrl: imageFor(p),
  }))
}

export function pickOrderCustomer(order: any): { name: string; email: string } {
  const c = order.customer || {}
  const u = order.user || {}
  const a = order.deliveryAddress || order.shippingAddress || {}
  const email = c.email || u.email || a.email || order.userEmail || order.billing_email || ''
  const full = (first?: string, last?: string) => [first, last].filter(Boolean).join(' ').trim()
  const name =
    c.name || full(c.firstName, c.lastName) || full(u.firstName, u.lastName) || full(a.firstName, a.lastName) || ''
  // Reviews show a first name + initial, never a full surname.
  const [first, ...rest] = (name || email.split('@')[0] || 'Verified buyer').split(/\s+/)
  const initial = rest.length ? ` ${rest[rest.length - 1][0].toUpperCase()}.` : ''
  return { name: `${first}${initial}`, email }
}
