import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/account/me
 * Returns the signed-in admin's identity for the settings UI to render
 * role-gated controls (only the owner can change their account email).
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({
      success: true,
      account: {
        id: (user._id as any).toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
