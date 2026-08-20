'use server'

import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/product.model'
import Refund from '@/models/Refund'
import User from '@/models/User'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { unstable_cache } from 'next/cache'
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
  getDateRange,
  getPreviousPeriodRange,
} from '@/lib/dashboard-tz'

// Re-export for back-compat (route.ts imports getPreviousPeriodRange from here).
// Wrapped in async helpers below; sync versions live in @/lib/dashboard-tz.

// =====================================================================
// Public types
// =====================================================================

export interface DashboardData {
  period: { start: string; end: string }
  summary: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
    totalCustomers: number
    newCustomers: number
    trends: { revenue: number; orders: number; aov: number; customers: number }
    netRevenueExclGst: number
    gstCollected: number
    gstSplit: { cgst: number; sgst: number; igst: number }
    pendingFulfillmentCount: number
    refundsOutstandingCount: number
    newVsReturning: { newCustomers: number; returningCustomers: number }
    ytdRevenue: number
    allTimeRevenue: number
    conversionRate: number | null
  }
  charts: {
    revenueOverTime: { date: string; revenue: number; orders: number }[]
    orderStatus: { status: string; count: number }[]
    topProducts: { name: string; revenue: number; quantity: number }[]
    paymentMethods: { method: string; revenue: number; count?: number }[]
    promoCodes: { code: string; redemptions: number; discountValue: number; orderValue: number }[]
    topStates: { state: string; orders: number; revenue: number }[]
  }
  recentOrders: {
    _id: string
    orderNumber: string
    customer: string
    email: string
    phone?: string
    paymentMethod?: string
    gst?: number
    total: number
    status: string
    paymentStatus: string
    createdAt: string
  }[]
  lowStockProducts: {
    _id: string
    title: string
    handle: string
    image?: string
    inventory: number
  }[]
}

export interface DashboardResult {
  success: boolean
  error?: string
  data?: DashboardData
}

// =====================================================================
// Internal types
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

interface UserJoin {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

interface OrderLite {
  _id?: { toString(): string } | string
  orderId?: string
  userId?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  totalAmount?: number
  total?: number
  subtotal?: number
  discount?: number
  taxes?: number
  couponCode?: string
  discountCode?: string
  createdAt?: string | Date
  items?: OrderItemLite[]
  lineItems?: OrderItemLite[]
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string }
  customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }
  shippingAddress?: { firstName?: string; lastName?: string; name?: string; state?: string; phone?: string; email?: string }
  deliveryAddress?: { firstName?: string; lastName?: string; name?: string; state?: string; phone?: string; email?: string }
  paymentDetails?: { paymentMethod?: string; paymentStatus?: string; gateway?: string }
  payment?: { method?: string; status?: string }
  gstDetails?: { gstRate?: number; taxableValue?: number; cgst?: number; sgst?: number; igst?: number; isIntraState?: boolean; placeOfSupply?: string }
  _user?: UserJoin
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
// Operational queue: paid orders not yet accepted into the kitchen. Deliberately
// NOT scoped to the selected period — the queue is "everything still waiting".
const PENDING_FULFILLMENT_STATUSES = ['paid']
// Refund queue is counted from the Refund collection (not Order.status). These
// are the Refund.status values that are still open/actionable — i.e. everything
// except the terminal 'refunded' / 'failed' / 'rejected' states.
const REFUND_OUTSTANDING_STATUSES = ['refund_initiated', 'pending_approval', 'approved', 'processing']

function normalize(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

/** Reject Invalid Date — truthy but unusable with Intl/date-fns ("Invalid time value"). */
function toValidDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  const d = value instanceof Date ? value : new Date(value as string | number)
  return Number.isNaN(d.getTime()) ? null : d
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

/**
 * Compute (taxable value, gst total) for an order. AU GST is a single 10% line
 * included in the price — no cgst/sgst/igst split. Prefers the stored
 * order.taxes / gstDetails.taxableValue; falls back to backing out total*10/110.
 */
function getOrderGst(order: OrderLite): { taxable: number; gst: number } {
  const total = getOrderTotal(order)
  const storedTaxes = Number(order?.taxes || 0)
  const storedTaxable = Number(order?.gstDetails?.taxableValue || 0)
  if (storedTaxable > 0) {
    const gst = storedTaxes > 0 ? storedTaxes : Math.max(0, total - storedTaxable)
    return { taxable: Math.round(storedTaxable * 100) / 100, gst: Math.round(gst * 100) / 100 }
  }
  if (storedTaxes > 0) {
    return {
      taxable: Math.round((total - storedTaxes) * 100) / 100,
      gst: Math.round(storedTaxes * 100) / 100,
    }
  }
  // Prices are GST-inclusive @ 10%: back out total*10/110
  const gst = Math.round(((total * 10) / 110) * 100) / 100
  const taxable = Math.round((total - gst) * 100) / 100
  return { taxable, gst }
}

function serialize<T>(data: T): T {
  if (!data) return data
  return JSON.parse(JSON.stringify(data)) as T
}

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

// =====================================================================
// Date range helpers (IST-aware)
// =====================================================================

// getDateRange + getPreviousPeriodRange moved to '@/lib/dashboard-tz' so that
// this file's 'use server' directive can be honored (Server Action files
// require every export to be async; those two are sync). Imported below.

// =====================================================================
// Core uncached aggregation
// =====================================================================

async function fetchDashboardDataUncached(
  period: string,
  startDate?: string,
  endDate?: string,
): Promise<DashboardResult> {
  try {
    await connectDb()

    const { start, end } = getDateRange(period, startDate, endDate)
    const previousPeriod = getPreviousPeriodRange(start, end, period)
    const now = new Date()
    const ytdStart = istStartOfYear(now)
    const ytdEnd = istEndOfDay(now)

    // -----------------------------------------------------------------
    // Single $facet pipeline pulling everything we need in one round-trip.
    // -----------------------------------------------------------------
    const facetPipeline: Record<string, unknown>[] = [
      {
        $facet: {
          currentOrders: [
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
              $lookup: {
                from: 'users',
                let: { uid: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: [{ $toString: '$_id' }, '$$uid'] },
                          { $eq: ['$clerkId', '$$uid'] },
                        ],
                      },
                    },
                  },
                  { $project: { firstName: 1, lastName: 1, email: 1, phone: 1 } },
                  { $limit: 1 },
                ],
                as: '_userJoin',
              },
            },
            { $addFields: { _user: { $arrayElemAt: ['$_userJoin', 0] } } },
            { $project: { _userJoin: 0 } },
          ],
          previousOrders: [
            { $match: { createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } } },
          ],
          recentOrdersRaw: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'users',
                let: { uid: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: [{ $toString: '$_id' }, '$$uid'] },
                          { $eq: ['$clerkId', '$$uid'] },
                        ],
                      },
                    },
                  },
                  { $project: { firstName: 1, lastName: 1, email: 1, phone: 1 } },
                  { $limit: 1 },
                ],
                as: '_userJoin',
              },
            },
            { $addFields: { _user: { $arrayElemAt: ['$_userJoin', 0] } } },
            { $project: { _userJoin: 0 } },
          ],
          ytdRevenueAgg: [
            { $match: { createdAt: { $gte: ytdStart, $lte: ytdEnd } } },
            { $project: { totalAmount: 1, status: 1, paymentStatus: 1, paymentDetails: 1, payment: 1 } },
          ],
          allTimeRevenueAgg: [
            { $project: { totalAmount: 1, status: 1, paymentStatus: 1, paymentDetails: 1, payment: 1 } },
          ],
          firstOrderByUser: [
            { $match: { userId: { $ne: null } } },
            { $sort: { createdAt: 1 } },
            { $group: { _id: '$userId', firstAt: { $first: '$createdAt' } } },
          ],
          pendingFulfillmentCount: [
            { $match: { status: { $in: PENDING_FULFILLMENT_STATUSES } } },
            { $count: 'n' },
          ],
        },
      },
    ]

    const OrderModel = Order as unknown as { aggregate: (p: unknown[]) => Promise<unknown[]> }
    const facetResult = (await OrderModel.aggregate(facetPipeline)) as Array<{
      currentOrders: OrderLite[]
      previousOrders: OrderLite[]
      recentOrdersRaw: OrderLite[]
      ytdRevenueAgg: OrderLite[]
      allTimeRevenueAgg: OrderLite[]
      firstOrderByUser: { _id: string; firstAt: Date }[]
      pendingFulfillmentCount: { n: number }[]
    }>

    const facet = facetResult[0] || {
      currentOrders: [],
      previousOrders: [],
      recentOrdersRaw: [],
      ytdRevenueAgg: [],
      allTimeRevenueAgg: [],
      firstOrderByUser: [],
      pendingFulfillmentCount: [],
    }

    // Customer counts + refund queue + low-stock — issued in parallel
    const [totalCustomers, newCustomersCount, previousCustomersCount, refundsOutstandingCount, lowStockProductsRaw] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end } }),
      // Outstanding refunds live in the Refund collection, not on Order.status.
      Refund.countDocuments({ status: { $in: REFUND_OUTSTANDING_STATUSES } }),
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

    const orders = facet.currentOrders
    const previousOrders = facet.previousOrders

    const totalRevenue = orders.reduce((s, o) => s + (isPaidOrSuccessfulOrder(o) ? getOrderTotal(o) : 0), 0)
    const totalOrders = orders.length
    const paidOrderCount = orders.reduce((n, o) => n + (isPaidOrSuccessfulOrder(o) ? 1 : 0), 0)
    const previousRevenue = previousOrders.reduce((s, o) => s + (isPaidOrSuccessfulOrder(o) ? getOrderTotal(o) : 0), 0)
    const previousOrderCount = previousOrders.length
    const previousPaidOrderCount = previousOrders.reduce((n, o) => n + (isPaidOrSuccessfulOrder(o) ? 1 : 0), 0)
    // AOV = paid revenue ÷ paid order count (unpaid orders would dilute it)
    const avgOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0
    const previousAvgOrderValue = previousPaidOrderCount > 0 ? previousRevenue / previousPaidOrderCount : 0

    let netRevenueExclGst = 0
    let gstCollected = 0
    for (const o of orders) {
      if (!isPaidOrSuccessfulOrder(o)) continue
      const g = getOrderGst(o)
      netRevenueExclGst += g.taxable
      gstCollected += g.gst
    }

    const statusBreakdown: Record<string, number> = {}
    for (const o of orders) {
      const st = o.status || 'pending'
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1
    }

    // Revenue chart bucketing (IST)
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
      const ts = toValidDate(o.createdAt)
      if (!ts) continue
      const k = istFormatLabel(ts, bucketKind)
      const bucket = revenueByDate[k]
      if (!bucket) continue
      if (isPaidOrSuccessfulOrder(o)) bucket.revenue += getOrderTotal(o)
      bucket.orders += 1
    }

    // Top products (with prorated discount per line item) — Bug 4
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

    // Payment methods (Bug 7) — period-scoped, paid only, distinct paymentDetails.paymentMethod values
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

    // KPI 5 — promo codes
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

    // KPI 6 — geo distribution (orders store the address on either
    // shippingAddress or deliveryAddress depending on checkout flow)
    const stateMap: Record<string, { orders: number; revenue: number }> = {}
    for (const o of orders) {
      const state = (o.shippingAddress?.state || o.deliveryAddress?.state || '').trim()
      if (!state) continue
      if (!stateMap[state]) stateMap[state] = { orders: 0, revenue: 0 }
      stateMap[state].orders += 1
      if (isPaidOrSuccessfulOrder(o)) stateMap[state].revenue += getOrderTotal(o)
    }
    const topStates = Object.entries(stateMap)
      .map(([state, v]) => ({ state, ...v }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)

    // KPI 4 — new vs returning
    const firstOrderMap = new Map<string, Date>()
    for (const r of facet.firstOrderByUser) {
      const firstAt = toValidDate(r.firstAt)
      if (firstAt) firstOrderMap.set(String(r._id), firstAt)
    }
    const usersInPeriod = new Set<string>()
    for (const o of orders) {
      if (o.userId) usersInPeriod.add(String(o.userId))
    }
    let newCustomersWithOrder = 0
    let returningCustomersWithOrder = 0
    for (const uid of usersInPeriod) {
      const firstAt = firstOrderMap.get(uid)
      if (!firstAt) continue
      if (firstAt.getTime() >= start.getTime() && firstAt.getTime() <= end.getTime()) {
        newCustomersWithOrder += 1
      } else if (firstAt.getTime() < start.getTime()) {
        returningCustomersWithOrder += 1
      }
    }

    // KPI 7 — YTD + all-time revenue (paid only)
    const ytdRevenue = facet.ytdRevenueAgg.reduce((s, o) => s + (isPaidOrSuccessfulOrder(o) ? getOrderTotal(o) : 0), 0)
    const allTimeRevenue = facet.allTimeRevenueAgg.reduce((s, o) => s + (isPaidOrSuccessfulOrder(o) ? getOrderTotal(o) : 0), 0)

    // KPI 2 (KPI 3 — refundsOutstandingCount — is counted from Refund above)
    const pendingFulfillmentCount = facet.pendingFulfillmentCount[0]?.n || 0

    // Trends
    const pct = (cur: number, prev: number): number => {
      if (prev > 0) return ((cur - prev) / prev) * 100
      return cur > 0 ? 100 : 0
    }
    const revenueTrend = pct(totalRevenue, previousRevenue)
    const ordersTrend = pct(totalOrders, previousOrderCount)
    const aovTrend = pct(avgOrderValue, previousAvgOrderValue)
    // Compare like-for-like: new signups this period vs new signups last period
    const customersTrend = pct(newCustomersCount, previousCustomersCount)

    // Recent orders — uses $lookup'd _user (eliminates Bug 5 N+1)
    const recentOrders = facet.recentOrdersRaw.map((o) => {
      const u = o._user
      const customerName =
        [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim() ||
        [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ').trim() ||
        o.customer?.name ||
        [o.shippingAddress?.firstName, o.shippingAddress?.lastName].filter(Boolean).join(' ').trim() ||
        o.shippingAddress?.name ||
        [o.deliveryAddress?.firstName, o.deliveryAddress?.lastName].filter(Boolean).join(' ').trim() ||
        'Guest'
      const email = u?.email || o.customer?.email || ''
      const phone = u?.phone || o.customer?.phone || o.shippingAddress?.phone || ''
      const gst = getOrderGst(o).gst
      const idStr =
        typeof o._id === 'string'
          ? o._id
          : o._id && typeof o._id === 'object' && 'toString' in o._id
            ? o._id.toString()
            : ''
      return {
        _id: idStr,
        orderNumber: o.orderId || idStr.slice(-8),
        customer: customerName,
        email,
        phone,
        paymentMethod: o.paymentDetails?.paymentMethod || o.paymentMethod || '',
        gst: Math.round(gst * 100) / 100,
        total: getOrderTotal(o),
        status: o.status || 'pending',
        paymentStatus: o.paymentDetails?.paymentStatus || o.paymentStatus || 'pending',
        createdAt: toValidDate(o.createdAt)?.toISOString() ?? new Date().toISOString(),
      }
    })

    return serialize({
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
          // AU GST is a single line — the legacy cgst/sgst/igst split no longer applies.
          gstSplit: { cgst: 0, sgst: 0, igst: 0 },
          pendingFulfillmentCount,
          refundsOutstandingCount,
          newVsReturning: {
            newCustomers: newCustomersWithOrder,
            returningCustomers: returningCustomersWithOrder,
          },
          ytdRevenue: Math.round(ytdRevenue * 100) / 100,
          allTimeRevenue: Math.round(allTimeRevenue * 100) / 100,
          conversionRate: null, // KPI 9 — sessions endpoint is range-less; left as TODO
        },
        charts: {
          revenueOverTime: bucketKeys.map((k) => revenueByDate[k]),
          orderStatus: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
          topProducts,
          paymentMethods: Object.entries(paymentMethods).map(([method, v]) => ({ method, revenue: v.revenue, count: v.count })),
          promoCodes,
          topStates,
        },
        recentOrders,
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
    console.error('Dashboard action error:', error)
    return { success: false, error: msg }
  }
}

// =====================================================================
// Public entrypoint — auth gate + 60s cache (Bug 5)
// =====================================================================

const cachedDashboard = (period: string, startDate?: string, endDate?: string) =>
  unstable_cache(
    () => fetchDashboardDataUncached(period, startDate, endDate),
    ['admin-dashboard', period, startDate || '', endDate || ''],
    { revalidate: 60, tags: ['admin-dashboard'] },
  )()

export async function fetchDashboardData(
  period: string = 'last7days',
  startDate?: string,
  endDate?: string,
): Promise<DashboardResult> {
  const admin = await verifyAdmin()
  if (!admin) {
    return { success: false, error: 'Unauthorized' }
  }
  return cachedDashboard(period, startDate, endDate)
}
