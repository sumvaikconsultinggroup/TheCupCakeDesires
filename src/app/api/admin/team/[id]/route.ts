import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'

export const dynamic = 'force-dynamic'

/* ────────────────── PATCH — update a team member ────────────────── */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentUser()
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    if (adminUser.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Only owners can update team members' },
        { status: 403 }
      )
    }

    const { role, permissions, name } = await req.json()
    const { id: memberId } = await params

    const member = await AdminUser.findById(memberId)
    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      )
    }

    if (
      member.role === 'owner' &&
      (adminUser._id as any).toString() !== (member._id as any).toString()
    ) {
      return NextResponse.json(
        { success: false, message: 'Cannot modify owner account' },
        { status: 403 }
      )
    }

    if (role && role !== member.role) {
      member.role = role
      member.permissions =
        (DEFAULT_PERMISSIONS as Record<string, string[]>)[role] || []
    }
    if (Array.isArray(permissions)) member.permissions = permissions
    if (typeof name === 'string' && name.trim()) member.name = name.trim()

    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: {
        id: (member._id as any).toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: member.permissions,
      },
    })
  } catch (error: any) {
    console.error('PATCH /api/admin/team/[id] error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

/* ────────────────── DELETE — remove a team member (soft) ────────────────── */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentUser()
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    if (adminUser.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Only owners can remove team members' },
        { status: 403 }
      )
    }

    const { id: memberId } = await params

    const member = await AdminUser.findById(memberId)
    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      )
    }

    if (member.role === 'owner') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete owner account' },
        { status: 403 }
      )
    }

    member.isActive = false
    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error: any) {
    console.error('DELETE /api/admin/team/[id] error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
