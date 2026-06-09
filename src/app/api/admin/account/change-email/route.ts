import { NextResponse } from 'next/server'
import { z } from 'zod'

import { verifyOtp } from '@/lib/admin-otp'
import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

/**
 * POST /api/admin/account/change-email
 * Owner-only. Verifies the OTP that was sent to the OLD email and finalises
 * the email swap (the new email was captured when the OTP was requested).
 */
export async function POST(req: Request) {
  try {
    await connectDb()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the owner can change their account email.' },
        { status: 403 }
      )
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
      purpose: 'email_change',
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

    const newEmail = result.record?.newEmail?.toLowerCase().trim()
    if (!newEmail) {
      return NextResponse.json(
        { error: 'No pending email change found. Please start over.' },
        { status: 400 }
      )
    }

    // Race condition guard: a different admin may have grabbed the email
    // between request-email-otp and now.
    const taken = await AdminUser.findOne({ email: newEmail, _id: { $ne: user._id } })
      .select('_id')
      .lean()
    if (taken) {
      return NextResponse.json(
        { error: 'That email was just claimed by another account.' },
        { status: 409 }
      )
    }

    await AdminUser.updateOne({ _id: user._id }, { $set: { email: newEmail } })

    return NextResponse.json({
      success: true,
      message: `Account email updated to ${newEmail}.`,
      newEmail,
    })
  } catch (e: any) {
    console.error('change-email error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
