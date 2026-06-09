import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import PromoCode from '@/models/PromoCode'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  try {
    await connectDb()
    const { id } = await params
    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    if (
      parsed.data.discountType === 'percentage' &&
      parsed.data.discountValue !== undefined &&
      parsed.data.discountValue > 100
    ) {
      return NextResponse.json(
        { success: false, message: 'Percentage discount can’t exceed 100%.' },
        { status: 400 }
      )
    }

    // Code-uniqueness guard
    if (parsed.data.code) {
      const upper = parsed.data.code.toUpperCase().trim()
      const conflict = await PromoCode.findOne({ code: upper, _id: { $ne: id } })
        .select('_id')
        .lean()
      if (conflict) {
        return NextResponse.json(
          { success: false, message: 'A promo code with that code already exists.' },
          { status: 409 }
        )
      }
    }

    const update: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.code) update.code = parsed.data.code.toUpperCase().trim()
    if (parsed.data.startsAt !== undefined) {
      update.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null
    }
    if (parsed.data.expiresAt !== undefined) {
      update.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
    }

    const updated = await PromoCode.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean()
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    console.error('PATCH /api/admin/promo-codes/[id] error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  try {
    await connectDb()
    const { id } = await params
    const r = await PromoCode.findByIdAndDelete(id).lean()
    if (!r) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (e: any) {
    console.error('DELETE /api/admin/promo-codes/[id] error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}
