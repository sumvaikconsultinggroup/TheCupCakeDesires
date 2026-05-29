import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'

// Helper to get current admin user from token
async function getCurrentAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) {
    return null
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string }
    await connectDb()
    const adminUser = await AdminUser.findById(decoded.userId).select('-password')
    return adminUser
  } catch (error) {
    return null
  }
}

// PATCH - Update team member (Owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser()
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    // Check if current user is owner
    if (adminUser.role !== 'owner') {
      return NextResponse.json({ 
        success: false, 
        message: 'Only owners can update team members' 
      }, { status: 403 })
    }

    const { role, permissions, name } = await req.json()
    const { id: memberId } = await params

    // Find the member to update
    const member = await AdminUser.findById(memberId)
    if (!member) {
      return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 })
    }

    // Cannot modify owner
    if (member.role === 'owner' && adminUser._id.toString() !== member._id.toString()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot modify owner account' 
      }, { status: 403 })
    }

    // Update fields
    if (role && role !== member.role) {
      member.role = role
      // Reset to default permissions for new role
      member.permissions = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || []
    }
    
    if (permissions) {
      member.permissions = permissions
    }
    
    if (name) {
      member.name = name
    }

    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: {
        id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: member.permissions,
      },
    })
  } catch (error: any) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE - Remove team member (Owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser()
    if (!adminUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    // Check if current user is owner
    if (adminUser.role !== 'owner') {
      return NextResponse.json({ 
        success: false, 
        message: 'Only owners can remove team members' 
      }, { status: 403 })
    }

    const { id: memberId } = await params

    const member = await AdminUser.findById(memberId)
    if (!member) {
      return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 })
    }

    // Cannot delete owner
    if (member.role === 'owner') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete owner account' 
      }, { status: 403 })
    }

    // Soft delete by setting isActive to false
    member.isActive = false
    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    })
  } catch (error: any) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}