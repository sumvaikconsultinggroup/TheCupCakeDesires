import { NextResponse } from 'next/server'
import { z } from 'zod'

import { issueAndSendOtp } from '@/lib/admin-otp'
import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  newEmail: z.string().email('Enter a valid email'),
})

/**
 * POST /api/admin/account/request-email-otp
 * Owner-only. Sends a 6-digit OTP to the admin's CURRENT email so they can
 * authorise changing their account email to `newEmail`.
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

    const newEmail = parsed.data.newEmail.toLowerCase().trim()

    if (newEmail === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'The new email is the same as your current email.' },
        { status: 400 }
      )
    }

    const taken = await AdminUser.findOne({ email: newEmail }).select('_id').lean()
    if (taken) {
      return NextResponse.json(
        { error: 'Another admin account is already using that email.' },
        { status: 409 }
      )
    }

    const result = await issueAndSendOtp({
      adminId: (user._id as any).toString(),
      purpose: 'email_change',
      recipientEmail: user.email, // OTP goes to the OLD email — proof of control
      adminName: user.name || 'there',
      newEmail,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Could not send verification email' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit code has been sent to your current email (${user.email}).`,
      expiresInMinutes: 10,
    })
  } catch (e: any) {
    console.error('request-email-otp error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
