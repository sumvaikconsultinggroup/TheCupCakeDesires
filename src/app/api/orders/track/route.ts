/**
 * POST /api/orders/track
 *
 * Public order tracking for guests and logged-in customers alike.
 * Auth = order ID + the email on the order (both must match), so an order ID
 * alone can't leak details. Returns only safe display fields — no full address,
 * phone, or payment identifiers.
 *
 * Body: { orderId: string, email: string }
 */

import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let orderId = ''
  let email = ''
  try {
    const body = await request.json()
    orderId = String(body?.orderId || '').trim()
    email = String(body?.email || '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  }

  if (!orderId || !email) {
    return NextResponse.json(
      { success: false, message: 'Order ID and email are required.' },
      { status: 400 }
    )
  }

  await connectDb()

  // Accept the human order code (ORD-…), with or without a leading '#',
  // or the raw Mongo _id (both appear in emails).
  const cleanId = orderId.replace(/^#/, '')
  const isObjectId = /^[a-f0-9]{24}$/i.test(cleanId)
  const query = isObjectId
    ? { $or: [{ _id: cleanId }, { orderId: cleanId }] }
    : { orderId: { $regex: `^${cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }

  const order = await Order.findOne(query)
    .select(
      'orderId status statusLogs createdAt deliveryDate deliverySlot items customer user deliveryAddress shippingAddress totalAmount'
    )
    .lean<Record<string, any>>()

  const orderEmail = (
    order?.customer?.email ||
    order?.user?.email ||
    order?.deliveryAddress?.email ||
    ''
  )
    .trim()
    .toLowerCase()

  // Same message for "not found" and "email mismatch" so the endpoint can't be
  // used to probe which order IDs exist.
  if (!order || !orderEmail || orderEmail !== email) {
    return NextResponse.json(
      {
        success: false,
        message: "We couldn't find an order matching that ID and email. Please check both and try again.",
      },
      { status: 404 }
    )
  }

  const logs: Array<{ status?: string; timestamp?: string | Date; message?: string }> =
    Array.isArray(order.statusLogs) ? order.statusLogs : []
  const stampFor = (statuses: string[]) => {
    const hit = logs.filter((l) => l.status && statuses.includes(l.status)).pop()
    return hit?.timestamp ? new Date(hit.timestamp).toISOString() : null
  }

  return NextResponse.json({
    success: true,
    order: {
      orderId: order.orderId,
      status: order.status,
      placedAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString() : null,
      deliverySlot: order.deliverySlot || null,
      suburb: order.deliveryAddress?.city || order.shippingAddress?.city || null,
      itemCount: Array.isArray(order.items)
        ? order.items.reduce((n: number, it: any) => n + (it.quantity || 0), 0)
        : 0,
      items: Array.isArray(order.items)
        ? order.items.map((it: any) => ({ name: it.name, quantity: it.quantity }))
        : [],
      timestamps: {
        paid: stampFor(['paid', 'confirmed']),
        inKitchen: stampFor(['in_kitchen']),
        outForDelivery: stampFor(['out_for_delivery']),
        delivered: stampFor(['delivered']),
      },
    },
  })
}
