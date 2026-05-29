export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyAdminRequest } from '@/lib/auth'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_EXPORT_ROWS = 10_000

/** Escape a CSV cell: wrap in double-quotes, escape embedded double-quotes. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""'
  const str = String(value).replace(/"/g, '""')
  return `"${str}"`
}

/** Format a Date as IST (UTC+5:30). */
function toIST(date: unknown): string {
  if (!date) return ''
  const d = new Date(date as string | number | Date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

/** Build one CSV row from an order plain object. */
function orderToRow(order: Record<string, unknown>): string {
  const customer = (order.customer as Record<string, unknown>) ?? {}
  const shippingAddress = (order.shippingAddress as Record<string, unknown>) ?? {}
  const paymentDetails = (order.paymentDetails as Record<string, unknown>) ?? {}
  const shippingDetails = (order.shippingDetails as Record<string, unknown>) ?? {}

  const firstName = String(customer.firstName ?? '')
  const lastName = String(customer.lastName ?? '')
  const customerName = `${firstName} ${lastName}`.trim() || 'Guest'

  // Items summary: "Product A × 2; Product B × 1"
  const items = Array.isArray(order.items)
    ? (order.items as Array<Record<string, unknown>>)
    : []
  const itemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const itemsSummary = items
    .map((item) => {
      const name = String(item.name ?? 'Unknown')
      const qty = Number(item.quantity) || 1
      return `${name} × ${qty}`
    })
    .join('; ')

  const tags = Array.isArray(order.tags)
    ? (order.tags as string[]).join(', ')
    : ''

  const cells = [
    csvCell(order.orderId),
    csvCell(customerName),
    csvCell(customer.email),
    csvCell(customer.phone),
    csvCell(shippingAddress.city),
    csvCell(shippingAddress.state),
    csvCell(order.totalAmount),
    csvCell(itemsCount),
    csvCell(itemsSummary),
    csvCell(order.status),
    csvCell(paymentDetails.paymentStatus),
    csvCell(paymentDetails.paymentMethod),
    csvCell(paymentDetails.transactionId),
    csvCell(shippingDetails.awb_code),
    csvCell(toIST(order.createdAt)),
    csvCell(tags),
  ]

  return cells.join(',')
}

const CSV_HEADER =
  '"Order ID","Customer Name","Customer Email","Customer Phone","City","State",' +
  '"Total Amount (₹)","Items Count","Items Summary","Status","Payment Status",' +
  '"Payment Method","Transaction ID","AWB Code","Created At (IST)","Tags"'

// ---------------------------------------------------------------------------
// GET /api/admin/orders/export
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth guard
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query — mirrors the orders listing route
    const query: Record<string, unknown> = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query['paymentDetails.paymentStatus'] = paymentStatus
    }

    if (startDate || endDate) {
      const dateRange: Record<string, Date> = {}
      if (startDate) dateRange.$gte = new Date(startDate)
      if (endDate) dateRange.$lte = new Date(endDate)
      query.createdAt = dateRange
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.email': { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.firstName': { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.lastName': { $regex: escapeRegex(search), $options: 'i' } },
        { 'customer.phone': { $regex: escapeRegex(search), $options: 'i' } },
      ]
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT_ROWS)
      .select(
        'orderId customer shippingAddress paymentDetails shippingDetails totalAmount items status tags createdAt'
      )
      .lean()

    // Build CSV in memory
    const rows: string[] = [CSV_HEADER]
    for (const order of orders) {
      rows.push(orderToRow(order as Record<string, unknown>))
    }
    const csvBody = rows.join('\n')

    // Filename: orders-YYYY-MM-DD.csv in IST
    const today = new Date()
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // YYYY-MM-DD
    const filename = `orders-${today}.csv`

    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[export] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
