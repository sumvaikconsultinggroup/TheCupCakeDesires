import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'

export const dynamic = 'force-dynamic'

/* PATCH — overwrite a member's permissions list (owner only) */
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
        { success: false, message: 'Only owners can modify permissions' },
        { status: 403 }
      )
    }

    const { permissions } = await req.json()
    const { id: memberId } = await params

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: 'permissions must be an array' },
        { status: 400 }
      )
    }

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
        { success: false, message: 'Cannot modify owner permissions' },
        { status: 403 }
      )
    }

    member.permissions = permissions
    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: member.permissions,
    })
  } catch (error: any) {
    console.error('PATCH /api/admin/team/[id]/permissions error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
