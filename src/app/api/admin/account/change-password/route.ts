import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifyOtp } from '@/lib/admin-otp'
import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
})

/**
 * POST /api/admin/account/change-password
 * Verifies the OTP and sets a new bcrypt-hashed password on the current admin.
 */
export async function POST(req: Request) {
  try {
    await connectDb()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const adminId = (user._id as any).toString()
    const result = await verifyOtp({
      adminId,
      purpose: 'password_reset',
      code: parsed.data.code,
    })

    if (!result.ok) {
      const msg =
        result.reason === 'not_found'
          ? 'No active code — request a new one.'
          : result.reason === 'expired'
            ? 'Code expired — request a new one.'
            : result.reason === 'locked'
              ? 'Too many wrong tries — request a new code.'
              : 'Incorrect code — try again.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const hash = await bcrypt.hash(parsed.data.newPassword, 12)
    await AdminUser.updateOne({ _id: user._id }, { $set: { password: hash } })

    return NextResponse.json({
      success: true,
      message: 'Password updated. Use the new password next time you sign in.',
    })
  } catch (e: any) {
    console.error('change-password error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
