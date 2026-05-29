import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'

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

// PATCH - Update member permissions (Owner only)
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
        message: 'Only owners can modify permissions' 
      }, { status: 403 })
    }

    const { permissions } = await req.json()
    const { id: memberId } = await params // Await params here

    // Find the member
    const member = await AdminUser.findById(memberId)
    if (!member) {
      return NextResponse.json({ success: false, message: 'Member not found' }, { status: 404 })
    }

    // Cannot modify owner permissions
    if (member.role === 'owner' && adminUser._id.toString() !== member._id.toString()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot modify owner permissions' 
      }, { status: 403 })
    }

    // Update permissions
    member.permissions = permissions
    await member.save()

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: member.permissions,
    })
  } catch (error: any) {
    console.error('Error updating permissions:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}   