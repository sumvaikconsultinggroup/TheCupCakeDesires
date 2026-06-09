import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email/send'
import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'
import { AdminTeamInviteEmail } from '@/emails/templates/AdminTeamInviteEmail'

export const dynamic = 'force-dynamic'

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'staff']),
})

/* ────────────────── GET — list team members ────────────────── */
export async function GET(_req: NextRequest) {
  try {
    const currentAdmin = await getCurrentUser()
    if (!currentAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    if (
      currentAdmin.role !== 'owner' &&
      !currentAdmin.permissions.includes('/admin/settings')
    ) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const members = await AdminUser.find({ isActive: true })
      .select('-password')
      .sort({ role: 1, createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      members: members.map((m: any) => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        role: m.role,
        permissions: m.permissions || [],
        avatar: m.avatar,
        status: 'active' as const,
        lastActive: m.lastLogin
          ? new Date(m.lastLogin).toLocaleString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Never',
        createdAt: m.createdAt,
      })),
    })
  } catch (e: any) {
    console.error('GET /api/admin/team error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}

/* ────────────────── POST — invite a new team member ────────────────── */
export async function POST(req: NextRequest) {
  try {
    const currentAdmin = await getCurrentUser()
    if (!currentAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    if (currentAdmin.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Only owners can add team members' },
        { status: 403 }
      )
    }

    const parsed = inviteSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const email = parsed.data.email.toLowerCase().trim()
    const name = (parsed.data.name || email.split('@')[0]).trim()
    const role = parsed.data.role

    /*
     * If a row already exists, prefer to RE-ACTIVATE rather than fail —
     * an owner shouldn't be stuck because the email was previously removed
     * (soft-delete via isActive:false). Active duplicates are still rejected.
     */
    const existing = await AdminUser.findOne({ email })
    if (existing && existing.isActive) {
      return NextResponse.json(
        { success: false, message: 'A team member with that email already exists.' },
        { status: 409 }
      )
    }

    const temporaryPassword = crypto.randomBytes(8).toString('base64url')

    let user
    if (existing) {
      existing.name = name
      existing.role = role
      existing.permissions = (DEFAULT_PERMISSIONS as any)[role] || []
      existing.isActive = true
      existing.password = temporaryPassword // pre-save hook hashes
      await existing.save()
      user = existing
    } else {
      user = await AdminUser.create({
        email,
        password: temporaryPassword, // pre-save hook hashes
        name,
        role,
        permissions: (DEFAULT_PERMISSIONS as any)[role] || [],
        isActive: true,
      })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''
    const loginUrl = `${baseUrl.replace(/\/$/, '')}/admin`

    const emailResult = await sendEmail({
      to: email,
      subject: 'You’ve been added to the CupCake Desires admin team',
      react: AdminTeamInviteEmail({
        recipientEmail: email,
        inviteeName: name,
        inviterName: currentAdmin.name || 'The CupCake Desires team',
        role,
        temporaryPassword,
        loginUrl,
      }),
      templateId: 'admin-team-invite',
      tags: [{ name: 'role', value: role }],
      skipSuppressionCheck: true, // operational/account email
    })

    if (!emailResult.success) {
      // Roll back so the owner can re-try cleanly.
      await AdminUser.deleteOne({ _id: user._id })
      return NextResponse.json(
        {
          success: false,
          message: emailResult.error || 'Could not send the invitation email.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent.',
      member: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: 'active' as const,
        lastActive: 'Never',
      },
    })
  } catch (e: any) {
    console.error('POST /api/admin/team error:', e)
    return NextResponse.json(
      { success: false, message: e?.message || 'Server error' },
      { status: 500 }
    )
  }
}
