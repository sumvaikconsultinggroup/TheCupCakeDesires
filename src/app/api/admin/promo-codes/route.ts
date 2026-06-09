import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'

export const dynamic = 'force-dynamic'

/**
 * Admin promo-code CRUD. Authenticated via the shared admin JWT (admin_token).
 * Storefront-facing endpoints (`/api/promoCode/check`, `/api/promoCode/active`)
 * stay public and remain unchanged.
 */

const promoSchema = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, 'Letters, digits, hyphen and underscore only'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  appliesTo: z.enum(['all', 'products']).optional(),
  productIds: z.array(z.string()).optional(),
  allowedEmails: z.array(z.string().email()).optional(),
})

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) }
  }
  if (
    user.role !== 'owner' &&
    !user.permissions?.includes('/admin/discounts')
  ) {
    return {
      error: NextResponse.json(
        { success: false, message: 'You don’t have access to discounts.' },
        { status: 403 }
      ),
    }
  }
  return { user }
}

/* GET — list every promo code, newest first. */
export async function GET(_req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  try {
    await connectDb()
    const promoCodes = await PromoCode.find({}).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ success: true, data: promoCodes })
  } catch (e: any) {
    console.error('GET /api/admin/promo-codes error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}

/* POST — create a new promo code. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  try {
    await connectDb()
    const parsed = promoSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const code = parsed.data.code.toUpperCase().trim()
    const existing = await PromoCode.findOne({ code }).select('_id').lean()
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A promo code with that code already exists.' },
        { status: 409 }
      )
    }

    if (parsed.data.discountType === 'percentage' && parsed.data.discountValue > 100) {
      return NextResponse.json(
        { success: false, message: 'Percentage discount can’t exceed 100%.' },
        { status: 400 }
      )
    }

    const doc = await PromoCode.create({
      ...parsed.data,
      code,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      usageCount: 0,
      isActive: parsed.data.isActive ?? true,
      appliesTo: parsed.data.appliesTo ?? 'all',
    })

    return NextResponse.json({ success: true, data: doc.toObject() }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/admin/promo-codes error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}
