import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import type { RiskLevel } from '@/types/orders'

export const dynamic = 'force-dynamic'

// ── Score thresholds ─────────────────────────────────────────────────────────

const SCORE_MEDIUM_THRESHOLD = 30
const SCORE_HIGH_THRESHOLD = 60

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= SCORE_HIGH_THRESHOLD) return 'high'
  if (score >= SCORE_MEDIUM_THRESHOLD) return 'medium'
  return 'low'
}

// ── Disposable email domain list ─────────────────────────────────────────────

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'throwam.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
])

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false
}

// ── Risk-score computation ────────────────────────────────────────────────────

interface RiskResult {
  riskLevel: RiskLevel
  reasons: string[]
  score: number
}

async function computeRisk(orderId: string): Promise<RiskResult | null> {
  await connectDb()

  // Find order by orderId string first, then by MongoDB _id
  let order = await Order.findOne({ orderId }).lean()
  if (!order) {
    order = await Order.findById(orderId).lean()
  }
  if (!order) return null

  const doc = order as Record<string, unknown>

  let score = 0
  const reasons: string[] = []

  // ── 1. New customer + high value ─────────────────────────────────────────
  const customerEmail: string =
    (doc['customer'] as Record<string, unknown> | undefined)?.['email'] as string ?? ''

  const totalAmount = (doc['totalAmount'] as number) ?? 0

  if (customerEmail) {
    const orderCount = await Order.countDocuments({ 'customer.email': customerEmail })
    const isNewCustomer = orderCount <= 1 // this order is counted
    if (isNewCustomer && totalAmount > 10_000) {
      score += 30
      reasons.push('new_customer_high_value')
    }

    // ── 6. COD on first order ───────────────────────────────────────────────
    if (isNewCustomer) {
      const paymentMethod: string =
        (
          (doc['paymentDetails'] as Record<string, unknown> | undefined)?.['paymentMethod'] as string
        )?.toLowerCase() ??
        ((doc['paymentMethod'] as string) ?? '').toLowerCase()

      if (paymentMethod === 'cod') {
        score += 10
        reasons.push('cod_first_order')
      }
    }

    // ── 4. Disposable email ─────────────────────────────────────────────────
    if (isDisposableEmail(customerEmail)) {
      score += 25
      reasons.push('disposable_email')
    }
  }

  // ── 2. Mismatched billing/shipping city ───────────────────────────────────
  const shippingCity: string =
    ((doc['shippingAddress'] as Record<string, unknown> | undefined)?.['city'] as string ?? '').toLowerCase()

  const billingCity: string =
    ((doc['billingAddress'] as Record<string, unknown> | undefined)?.['city'] as string ?? '').toLowerCase()

  if (shippingCity && billingCity && shippingCity !== billingCity) {
    score += 20
    reasons.push('address_mismatch')
  }

  // ── 3. Payment retried multiple times ─────────────────────────────────────
  // Detect multiple statusLog entries for failed payment transitions
  const statusLogs = (doc['statusLogs'] as Array<Record<string, unknown>>) ?? []
  const paymentFailureCount = statusLogs.filter(
    (log) => (log['status'] as string) === 'failed',
  ).length
  if (paymentFailureCount >= 2) {
    score += 15
    reasons.push('payment_retries')
  }

  // ── 5. Multiple orders from same IP within 1 hour ─────────────────────────
  // The schema does not store IP directly; we check if the same customer email
  // placed more than one order within the last 60 minutes as a proxy.
  if (customerEmail) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentOrderCount = await Order.countDocuments({
      'customer.email': customerEmail,
      createdAt: { $gte: oneHourAgo },
    })
    if (recentOrderCount > 1) {
      score += 20
      reasons.push('ip_velocity')
    }
  }

  return {
    riskLevel: scoreToRiskLevel(score),
    reasons,
    score,
  }
}

// ── GET /api/admin/orders/[orderId]/risk ──────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  const { orderId } = await params

  try {
    const result = await computeRisk(orderId)
    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error computing risk score:', error)
    return NextResponse.json({ error: 'Failed to compute risk score' }, { status: 500 })
  }
}

// ── POST /api/admin/orders/[orderId]/risk ─────────────────────────────────────

interface RiskOverrideBody {
  riskLevel: RiskLevel
  reasons: string[]
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const auth = await verifyAdminRequest()
  if (auth instanceof NextResponse) return auth

  const { orderId } = await params

  let body: RiskOverrideBody
  try {
    body = (await req.json()) as RiskOverrideBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { riskLevel, reasons } = body

  if (!['low', 'medium', 'high'].includes(riskLevel)) {
    return NextResponse.json(
      { error: 'riskLevel must be one of: low, medium, high' },
      { status: 400 },
    )
  }

  if (!Array.isArray(reasons)) {
    return NextResponse.json({ error: 'reasons must be an array of strings' }, { status: 400 })
  }

  try {
    await connectDb()

    let order = await Order.findOne({ orderId })
    if (!order) {
      order = await Order.findById(orderId)
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    order.riskLevel = riskLevel
    order.riskReasons = reasons
    await order.save()

    return NextResponse.json({
      success: true,
      riskLevel: order.riskLevel,
      riskReasons: order.riskReasons,
    })
  } catch (error) {
    console.error('Error updating risk:', error)
    return NextResponse.json({ error: 'Failed to update risk' }, { status: 500 })
  }
}
