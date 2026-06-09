import { NextResponse } from 'next/server'

import { issueAndSendOtp } from '@/lib/admin-otp'
import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/account/request-password-otp
 * Sends a 6-digit OTP to the signed-in admin's current email.
 * Used for the "I want to change my password" flow.
 */
export async function POST() {
  try {
    await connectDb()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await issueAndSendOtp({
      adminId: (user._id as any).toString(),
      purpose: 'password_reset',
      recipientEmail: user.email,
      adminName: user.name || 'there',
    })

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message || 'Could not send verification email',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit code has been sent to ${user.email}.`,
      expiresInMinutes: 10,
    })
  } catch (e: any) {
    console.error('request-password-otp error:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
