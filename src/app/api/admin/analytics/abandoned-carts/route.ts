import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'
import Cart from '@/models/Cart'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

function money(n: unknown) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}

/** Order.notes is often [{ content, author, ... }] — never pass objects to React text nodes. */
function notesToText(notes: unknown, deliveryNote?: unknown): string | undefined {
  if (typeof deliveryNote === 'string' && deliveryNote.trim()) return deliveryNote.trim()
  if (typeof notes === 'string' && notes.trim()) return notes.trim()
  if (Array.isArray(notes)) {
    const parts = notes
      .map((n) => (typeof n === 'string' ? n : n?.content || n?.message || ''))
      .map((s) => String(s).trim())
      .filter(Boolean)
    return parts.length ? parts.join(' · ') : undefined
  }
  if (notes && typeof notes === 'object' && 'content' in (notes as object)) {
    const c = (notes as { content?: string }).content
    return typeof c === 'string' && c.trim() ? c.trim() : undefined
  }
  return undefined
}

function mapOrderToCart(order: any) {
  const items = (order.items || []).map((item: any) => ({
    productId: item.productId || item.id || '',
    productName: item.name || item.title || item.productName || 'Item',
    handle: item.handle,
    category: item.category || item.productCategory,
    imageUrl: item.image || item.imageUrl || item.images?.[0],
    price: money(item.price),
    quantity: item.quantity || 1,
    sku: item.sku,
    variant: item.variant || {
      option1Value: item.flavour || item.option1Value,
      option2Value: item.option2Value,
      sku: item.sku,
    },
    variants: item.variants,
    logoUrls: item.logoUrls || (item.logoUrl ? [item.logoUrl] : []),
  }))
  const addr = order.shippingAddress || order.deliveryAddress || {}
  const customer = order.customer || order.user || {}
  return {
    _id: `order-${order._id}`,
    source: 'pending_order',
    userId: order.userId,
    email: customer.email || addr.email || order.user?.email,
    userName:
      [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
      addr.name ||
      order.user?.name,
    firstName: customer.firstName || addr.name,
    lastName: customer.lastName,
    phoneNumber: customer.phone || addr.phone || order.user?.phone,
    isGuest: !order.userId,
    cartItems: items,
    totalValue: money(order.totalAmount),
    subtotal: money(order.subtotal),
    discount: money(order.discount),
    shipping: money(order.shippingFee || order.shipping),
    taxes: money(order.tax),
    promoCode: order.couponCode || order.discountCode,
    paymentMethod: order.paymentDetails?.paymentMethod || 'stripe',
    shippingAddress: {
      line1: addr.address || addr.line1 || addr.street,
      city: addr.city,
      state: addr.state,
      country: addr.country || 'Australia',
      zipcode: addr.zipcode || addr.postcode || addr.postalCode,
      addressType: addr.addressType || addr.type,
    },
    delivery: {
      date: order.deliveryDate ? new Date(order.deliveryDate).toISOString().slice(0, 10) : undefined,
      slot: order.deliverySlot,
      instructions: notesToText(order.notes, order.deliveryNote),
      postcode: addr.zipcode || addr.postcode,
    },
    checkoutStage: 'payment_started',
    pendingOrderId: String(order._id),
    pendingOrderNumber: order.orderId,
    status: 'abandoned',
    abandonedAt: order.createdAt,
    lastUpdatedAt: order.updatedAt || order.createdAt,
    paymentStartedAt: order.createdAt,
    recoveryEmailSent: false,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest()
    if (auth instanceof NextResponse) return auth

    await connectDb()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'unpaid'
    const limit = parseInt(searchParams.get('limit') || '80')
    const offset = parseInt(searchParams.get('offset') || '0')

    const query: Record<string, unknown> = {}
    if (status === 'recovered') query.status = 'recovered'
    else if (status === 'expired') query.status = 'expired'
    else if (status !== 'all') query.status = 'abandoned'

    if (status === 'ready_to_pay') query.checkoutStage = 'ready_to_pay'
    if (status === 'payment_started') query.checkoutStage = 'payment_started'
    if (status === 'checkout') query.checkoutStage = 'checkout'
    if (status === 'cart') query.checkoutStage = { $in: ['cart', null] }
    if (status === 'unpaid') {
      query.status = 'abandoned'
      query.checkoutStage = { $in: ['ready_to_pay', 'payment_started'] }
    }

    const carts = await AbandonedCart.find(query)
      .sort({ lastUpdatedAt: -1, abandonedAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    const emails = carts.map((c: any) => c.email).filter(Boolean)
    const guestIds = carts.map((c: any) => c.guestId).filter(Boolean)
    const extraCarts =
      emails.length || guestIds.length
        ? await Cart.find({
            $or: [
              ...(emails.length ? [{ email: { $in: emails } }] : []),
              ...(guestIds.length ? [{ sessionId: { $in: guestIds } }] : []),
            ],
          })
            .sort({ lastUpdated: -1 })
            .lean()
        : []

    const cartByKey = new Map<string, any>()
    for (const c of extraCarts) {
      if (c.email) cartByKey.set(`e:${c.email}`, c)
      if (c.sessionId) cartByKey.set(`s:${c.sessionId}`, c)
    }

    const enriched = carts.map((row: any) => {
      const extra = (row.email && cartByKey.get(`e:${row.email}`)) || (row.guestId && cartByKey.get(`s:${row.guestId}`))
      return {
        ...row,
        source: 'abandoned_cart',
        phoneNumber: row.phoneNumber || extra?.phoneNumber,
        firstName: row.firstName || extra?.firstName,
        lastName: row.lastName || extra?.lastName,
        shippingAddress: row.shippingAddress?.line1 ? row.shippingAddress : extra?.shippingAddress,
        delivery: row.delivery?.date || row.delivery?.slot ? row.delivery : extra?.delivery,
        subtotal: row.subtotal ?? extra?.subtotal,
        discount: row.discount ?? extra?.discount,
        shipping: row.shipping ?? extra?.shipping,
        taxes: row.taxes ?? extra?.taxes,
        promoCode: row.promoCode || extra?.promoCode,
        pendingOrderId: row.pendingOrderId || extra?.pendingOrderId,
        pendingOrderNumber: row.pendingOrderNumber || extra?.pendingOrderNumber,
        checkoutStage: row.checkoutStage || extra?.checkoutStage || 'cart',
        paymentMethod: row.paymentMethod || extra?.paymentMethod,
        cartItems: row.cartItems?.length ? row.cartItems : extra?.items || [],
        checkoutStartedAt: row.checkoutStartedAt || extra?.checkoutStartedAt,
        readyToPayAt: row.readyToPayAt || extra?.readyToPayAt,
        paymentStartedAt: row.paymentStartedAt || extra?.paymentStartedAt,
        recoveryAttempts: extra?.recoveryAttempts || [],
      }
    })

    let merged = enriched
    if (status === 'unpaid' || status === 'payment_started' || status === 'all' || status === 'abandoned') {
      const pendingOrders = await Order.find({
        status: 'pending_payment',
        'paymentDetails.paymentStatus': { $ne: 'paid' },
      })
        .sort({ createdAt: -1 })
        .limit(80)
        .lean()

      const existingOrderIds = new Set(
        enriched.map((c: any) => c.pendingOrderId).filter(Boolean)
      )
      const extraOrders = pendingOrders
        .filter((o: any) => !existingOrderIds.has(String(o._id)) && !existingOrderIds.has(o.orderId))
        .map(mapOrderToCart)

      merged = [...extraOrders, ...enriched]
    }

    const visible = merged.slice(0, limit)
    const count = visible.length
    const totalValue = visible.reduce((s: number, c: any) => s + money(c.totalValue), 0)
    const unpaidCount = visible.filter(
      (c: any) =>
        c.status !== 'recovered' &&
        (c.checkoutStage === 'ready_to_pay' || c.checkoutStage === 'payment_started' || c.source === 'pending_order')
    ).length

    return NextResponse.json({
      success: true,
      data: {
        carts: visible,
        pagination: { total: count, limit, offset, hasMore: false },
        stats: {
          count,
          unpaidCount,
          totalValue,
          averageValue: count ? totalValue / count : 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching abandoned carts:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch abandoned carts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest()
    if (auth instanceof NextResponse) return auth

    await connectDb()
    const { cartId, status, recoveryEmailSent } = await request.json()

    if (!cartId || (!status && recoveryEmailSent == null)) {
      return NextResponse.json({ success: false, message: 'Cart ID and an update are required' }, { status: 400 })
    }

    if (String(cartId).startsWith('order-')) {
      return NextResponse.json({
        success: false,
        message: 'This record is an unpaid order. Mark it recovered from Orders after payment.',
      }, { status: 400 })
    }

    const update: Record<string, unknown> = { lastUpdatedAt: new Date() }
    if (status) update.status = status
    if (recoveryEmailSent != null) update.recoveryEmailSent = Boolean(recoveryEmailSent)

    const cart = await AbandonedCart.findByIdAndUpdate(cartId, update, { new: true })

    if (!cart) {
      return NextResponse.json({ success: false, message: 'Cart not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: cart })
  } catch (error) {
    console.error('Error updating abandoned cart:', error)
    return NextResponse.json({ success: false, message: 'Failed to update cart' }, { status: 500 })
  }
}
