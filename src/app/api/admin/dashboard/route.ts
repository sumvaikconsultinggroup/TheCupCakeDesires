import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/product.model'
import User from '@/models/User'
import { verifyAdminRequest } from '@/lib/auth'
import { parseISO } from 'date-fns'
import {
  istStartOfDay,
  istEndOfDay,
  istStartOfMonth,
  istEndOfMonth,
  istStartOfYear,
  istSubDays,
  istFormatLabel,
  istEachDay,
  istEachWeek,
  istEachMonth,
  getPreviousPeriodRange,
} from '@/lib/dashboard-tz'

// =====================================================================
// Local types
// =====================================================================

interface OrderItemLite {
  productId?: unknown
  product?: unknown
  title?: string
  name?: string
  productTitle?: string
  price?: number
  quantity?: number
}

interface OrderLite {
  _id?: { toString(): string } | string
  orderId?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  totalAmount?: number
  total?: number
  subtotal?: number
  discount?: number
  couponCode?: string
  discountCode?: string
  createdAt?: string | Date
  items?: OrderItemLite[]
  lineItems?: OrderItemLite[]
  customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }
  shippingAddress?: { firstName?: string; lastName?: string; name?: string; state?: string; phone?: string; email?: string }
  deliveryAddress?: { firstName?: string; lastName?: string; name?: string; state?: string; phone?: string; email?: string }
  paymentDetails?: { paymentMethod?: string; paymentStatus?: string; gateway?: string }
  payment?: { method?: string; status?: string }
  gstDetails?: { gstRate?: number; taxableValue?: number; cgst?: number; sgst?: number; igst?: number; isIntraState?: boolean; placeOfSupply?: string }
  email?: string
}

interface LowStockLean {
  _id: { toString(): string }
  title: string
  handle: string
  images?: { src?: string }[]
  variants?: { inventory?: number }[]
  inventory?: number
}

const EXCLUDED_STATUSES = new Set(['cancelled', 'refund_initiated', 'refunded', 'return_initiated', 'return_completed'])
const PAID_PAYMENT_STATUSES = new Set(['paid', 'success', 'successful', 'sucessfull'])
const PENDING_FULFILLMENT_STATUSES = ['paid', 'cod', 'confirmed', 'processing']
const REFUND_OUTSTANDING_STATUSES = ['refund_initiated', 'return_initiated']

function normalize(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function isPaidOrSuccessfulOrder(order: OrderLite): boolean {
  if (EXCLUDED_STATUSES.has(normalize(order?.status))) return false
  const paymentStatus =
    normalize(order?.paymentDetails?.paymentStatus) ||
    normalize(order?.paymentStatus) ||
    normalize(order?.payment?.status)
  return PAID_PAYMENT_STATUSES.has(paymentStatus)
}

function getOrderTotal(order: OrderLite): number {
  return Number(order?.totalAmount ?? order?.total ?? 0)
}

function getOrderGst(order: OrderLite): { taxable: number; gst: number; cgst: number; sgst: number; igst: number } {
  const total = getOrderTotal(order)
  const g = order?.gstDetails
  if (g && (g.taxableValue || g.cgst || g.sgst || g.igst)) {
    const cgst = Number(g.cgst || 0)
    const sgst = Number(g.sgst || 0)
    const igst = Number(g.igst || 0)
    const taxable = Number(g.taxableValue || (total - cgst - sgst - igst))
    return { taxable, gst: cgst + sgst + igst, cgst, sgst, igst }
  }
  const taxable = Math.round(((total * 100) / 105) * 100) / 100
  const gst = Math.round(((total * 5) / 105) * 100) / 100
  const cgst = Math.round(gst * 50) / 100
  const sgst = gst - cgst
  return { taxable, gst, cgst, sgst, igst: 0 }
}

function getDateRange(period: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case 'today':
      return { start: istStartOfDay(now), end: istEndOfDay(now) }
    case 'yesterday': {
      const y = istSubDays(now, 1)
      return { start: istStartOfDay(y), end: istEndOfDay(y) }
    }
    case 'last7days':
      return { start: istStartOfDay(istSubDays(now, 6)), end: istEndOfDay(now) }
    case 'last30days':
      return { start: istStartOfDay(istSubDays(now, 29)), end: istEndOfDay(now) }
    case 'thisMonth':
      return { start: istStartOfMonth(now), end: istEndOfDay(now) }
    case 'lastMonth': {
      const lm = istSubDays(istStartOfMonth(now), 1)
      return { start: istStartOfMonth(lm), end: istEndOfMonth(lm) }
    }
    case 'thisYear':
      return { start: istStartOfYear(now), end: istEndOfDay(now) }
    case 'custom':
      if (startDate && endDate) {
        return { start: istStartOfDay(parseISO(startDate)), end: istEndOfDay(parseISO(endDate)) }
      }
      return { start: istStartOfDay(istSubDays(now, 29)), end: istEndOfDay(now) }
    default:
      return { start: istStartOfDay(istSubDays(now, 29)), end: istEndOfDay(now) }
  }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest()
    if (auth instanceof NextResponse) return auth

    await connectDb()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'last7days'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const { start, end } = getDateRange(period, startDate, endDate)
    // Bug 3: previous-period math now uses the per-preset logic shared from dashboard-actions.ts
    const previousPeriod = getPreviousPeriodRange(start, end, period)

    const [ordersRaw, previousOrdersRaw, recentOrdersRaw, pendingFulfillmentCount, refundsOutstandingCount] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } }).lean(),
      Order.find({ createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).lean(),
      Order.countDocuments({ status: { $in: PENDING_FULFILLMENT_STATUSES } }),
      Order.countDocuments({ status: { $in: REFUND_OUTSTANDING_STATUSES } }),
    ])
    const orders = ordersRaw as unknown as OrderLite[]
    const previousOrders = previousOrdersRaw as unknown as OrderLite[]
    const recentOrders = recentOrdersRaw as unknown as OrderLite[]

    const totalRevenue = orders.reduce((s, o) => s + (isPaidOrSuccessfulOrder(o) ? getOrderTotal(o) : 0), 0)
    const previousRevenue = previousOrders.reduce((s, o) => s + (isPaidOrSuccessfulOrder(o) ? getOrderTotal(o) : 0), 0)
    const totalOrders = orders.length
    const previousOrderCount = previousOrders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const previousAvgOrderValue = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0

    let netRevenueExclGst = 0
    let gstCgst = 0
    let gstSgst = 0
    let gstIgst = 0
    for (const o of orders) {
      if (!isPaidOrSuccessfulOrder(o)) continue
      const g = getOrderGst(o)
      netRevenueExclGst += g.taxable
      gstCgst += g.cgst
      gstSgst += g.sgst
      gstIgst += g.igst
    }
    const gstCollected = gstCgst + gstSgst + gstIgst

    const statusBreakdown: Record<string, number> = {}
    for (const o of orders) {
      const status = o.status || 'pending'
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1
    }

    const revenueByDate: Record<string, { date: string; revenue: number; orders: number }> = {}
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    let bucketKind: 'hour' | 'day' | 'week' | 'month'
    const bucketKeys: string[] = []
    if (daysDiff <= 1) {
      bucketKind = 'hour'
      for (let i = 0; i < 24; i++) {
        const k = `${String(i).padStart(2, '0')}:00`
        revenueByDate[k] = { date: k, revenue: 0, orders: 0 }
        bucketKeys.push(k)
      }
    } else if (daysDiff <= 31) {
      bucketKind = 'day'
      for (const d of istEachDay(start, end)) {
        const k = istFormatLabel(d, 'day')
        revenueByDate[k] = { date: k, revenue: 0, orders: 0 }
        bucketKeys.push(k)
      }
    } else if (daysDiff <= 90) {
      bucketKind = 'week'
      for (const d of istEachWeek(start, end)) {
        const k = istFormatLabel(d, 'week')
        if (!revenueByDate[k]) {
          revenueByDate[k] = { date: k, revenue: 0, orders: 0 }
          bucketKeys.push(k)
        }
      }
    } else {
      bucketKind = 'month'
      for (const d of istEachMonth(start, end)) {
        const k = istFormatLabel(d, 'month')
        revenueByDate[k] = { date: k, revenue: 0, orders: 0 }
        bucketKeys.push(k)
      }
    }
    for (const o of orders) {
      const ts = o.createdAt ? new Date(o.createdAt) : null
      if (!ts) continue
      const k = istFormatLabel(ts, bucketKind)
      const bucket = revenueByDate[k]
      if (!bucket) continue
      if (isPaidOrSuccessfulOrder(o)) bucket.revenue += getOrderTotal(o)
      bucket.orders += 1
    }

    // Top products with prorated discount (Bug 4)
    const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {}
    for (const o of orders) {
      if (!isPaidOrSuccessfulOrder(o)) continue
      const items = o.items || o.lineItems || []
      const lineGrosses = items.map((it) => Number(it.price || 0) * Number(it.quantity || 1))
      const orderSubtotal = Number(o.subtotal || lineGrosses.reduce((a, b) => a + b, 0))
      const orderDiscount = Number(o.discount || 0)
      items.forEach((item, i) => {
        const id = String(
          (item.productId as { toString?: () => string } | undefined)?.toString?.() ||
            (item.product as { toString?: () => string } | undefined)?.toString?.() ||
            'unknown',
        )
        const name = item.title || item.name || item.productTitle || 'Unknown Product'
        if (!productRevenue[id]) productRevenue[id] = { name, revenue: 0, quantity: 0 }
        const lineGross = lineGrosses[i] || 0
        const discountShare = orderSubtotal > 0 ? orderDiscount * (lineGross / orderSubtotal) : 0
        const lineNet = Math.max(0, lineGross - discountShare)
        productRevenue[id].revenue += lineNet
        productRevenue[id].quantity += Number(item.quantity || 1)
      })
    }
    const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    // Payment methods (Bug 7)
    const paymentMethods: Record<string, { revenue: number; count: number }> = {}
    for (const o of orders) {
      if (!isPaidOrSuccessfulOrder(o)) continue
      const rawMethod =
        (o.paymentDetails?.paymentMethod && String(o.paymentDetails.paymentMethod)) ||
        (o.payment?.method && String(o.payment.method)) ||
        (o.paymentMethod && String(o.paymentMethod)) ||
        'unknown'
      const lc = rawMethod.toLowerCase()
      const label = lc === 'cod' ? 'Cash on Delivery' : lc === 'prepaid' ? 'Prepaid (PayU)' : rawMethod
      if (!paymentMethods[label]) paymentMethods[label] = { revenue: 0, count: 0 }
      paymentMethods[label].revenue += getOrderTotal(o)
      paymentMethods[label].count += 1
    }

    // KPI 5 promo
    const promoMap: Record<string, { redemptions: number; discountValue: number; orderValue: number }> = {}
    for (const o of orders) {
      const code = (o.couponCode || o.discountCode || '').trim()
      if (!code) continue
      if (!promoMap[code]) promoMap[code] = { redemptions: 0, discountValue: 0, orderValue: 0 }
      promoMap[code].redemptions += 1
      promoMap[code].discountValue += Number(o.discount || 0)
      promoMap[code].orderValue += getOrderTotal(o)
    }
    const promoCodes = Object.entries(promoMap)
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, 5)

    // KPI 6 geo
    const stateMap: Record<string, { orders: number; revenue: number }> = {}
    for (const o of orders) {
      const state = (o.shippingAddress?.state || '').trim()
      if (!state) continue
      if (!stateMap[state]) stateMap[state] = { orders: 0, revenue: 0 }
      stateMap[state].orders += 1
      if (isPaidOrSuccessfulOrder(o)) stateMap[state].revenue += getOrderTotal(o)
    }
    const topStates = Object.entries(stateMap)
      .map(([state, v]) => ({ state, ...v }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)

    // Bug 2: totalCustomers is now lifetime (no createdAt filter)
    const [totalCustomers, newCustomersCount, previousCustomersCount, lowStockProductsRaw] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }),
      Product.find({
        $or: [
          { 'variants.inventory': { $lte: 10, $gte: 0 } },
          { inventory: { $lte: 10, $gte: 0 } },
        ],
      })
        .limit(10)
        .select('title handle variants inventory images')
        .lean(),
    ])
    const lowStockProducts = lowStockProductsRaw as unknown as LowStockLean[]

    const pct = (cur: number, prev: number): number => {
      if (prev > 0) return ((cur - prev) / prev) * 100
      return cur > 0 ? 100 : 0
    }
    const revenueTrend = pct(totalRevenue, previousRevenue)
    const ordersTrend = pct(totalOrders, previousOrderCount)
    const aovTrend = pct(avgOrderValue, previousAvgOrderValue)
    const customersTrend = pct(totalCustomers, previousCustomersCount)

    return NextResponse.json({
      success: true,
      data: {
        period: { start: start.toISOString(), end: end.toISOString() },
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          totalCustomers,
          newCustomers: newCustomersCount,
          trends: {
            revenue: Math.round(revenueTrend * 10) / 10,
            orders: Math.round(ordersTrend * 10) / 10,
            aov: Math.round(aovTrend * 10) / 10,
            customers: Math.round(customersTrend * 10) / 10,
          },
          netRevenueExclGst: Math.round(netRevenueExclGst * 100) / 100,
          gstCollected: Math.round(gstCollected * 100) / 100,
          gstSplit: {
            cgst: Math.round(gstCgst * 100) / 100,
            sgst: Math.round(gstSgst * 100) / 100,
            igst: Math.round(gstIgst * 100) / 100,
          },
          pendingFulfillmentCount,
          refundsOutstandingCount,
        },
        charts: {
          revenueOverTime: bucketKeys.map((k) => revenueByDate[k]),
          orderStatus: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
          topProducts,
          paymentMethods: Object.entries(paymentMethods).map(([method, v]) => ({ method, revenue: v.revenue, count: v.count })),
          promoCodes,
          topStates,
        },
        recentOrders: recentOrders.map((o) => {
          const idStr =
            typeof o._id === 'string'
              ? o._id
              : o._id && typeof o._id === 'object' && 'toString' in o._id
                ? o._id.toString()
                : ''
          // Bug 6 — schema is firstName/lastName, not customer.name
          const customerName =
            [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ').trim() ||
            [o.shippingAddress?.firstName, o.shippingAddress?.lastName].filter(Boolean).join(' ').trim() ||
            [o.deliveryAddress?.firstName, o.deliveryAddress?.lastName].filter(Boolean).join(' ').trim() ||
            'Guest'
          return {
            _id: idStr,
            orderNumber: o.orderId || idStr.slice(-8),
            customer: customerName,
            email: o.customer?.email || o.email || '',
            phone: o.customer?.phone || o.shippingAddress?.phone || '',
            paymentMethod: o.paymentDetails?.paymentMethod || o.paymentMethod || '',
            gst: Math.round(getOrderGst(o).gst * 100) / 100,
            total: getOrderTotal(o),
            status: o.status || 'pending',
            paymentStatus: o.paymentDetails?.paymentStatus || o.paymentStatus || 'pending',
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
          }
        }),
        lowStockProducts: lowStockProducts.map((p) => ({
          _id: p._id.toString(),
          title: p.title,
          handle: p.handle,
          image: p.images?.[0]?.src,
          inventory: p.variants?.[0]?.inventory ?? p.inventory ?? 0,
        })),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Dashboard API error:', error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
