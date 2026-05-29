import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'
import { getCurrentUser, hasPermission, generateInviteToken } from '@/lib/auth'
import { NextResponse } from 'next/server'

// GET - List all staff members
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(currentUser, 'staff.view')) {
      return NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 })
    }
    
    await connectDb()
    const staff = await AdminUser.find({}).select('-password').sort({ createdAt: -1 })
    
    return NextResponse.json({
      success: true,
      staff: staff.map(s => ({
        id: s._id.toString(),
        email: s.email,
        name: s.name,
        role: s.role,
        permissions: s.permissions,
        isActive: s.isActive,
        lastLogin: s.lastLogin,
        createdAt: s.createdAt,
      }))
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST - Invite new staff member
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(currentUser, 'staff.invite')) {
      return NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 })
    }
    
    const { email, name, role, permissions } = await request.json()
    
    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      )
    }
    
    // Only owner can create admins
    if (role === 'admin' && currentUser.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Only store owner can create admin accounts' },
        { status: 403 }
      )
    }
    
    // Cannot create owner accounts
    if (role === 'owner') {
      return NextResponse.json(
        { success: false, message: 'Cannot create owner accounts' },
        { status: 403 }
      )
    }
    
    await connectDb()
    
    // Check if email already exists
    const existing = await AdminUser.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      )
    }
    
    const staffRole = role || 'staff'
    const staffPermissions = permissions || DEFAULT_PERMISSIONS[staffRole as keyof typeof DEFAULT_PERMISSIONS]
    
    // Generate invite token and temporary password
    const inviteToken = generateInviteToken()
    const tempPassword = Math.random().toString(36).slice(-12)
    
    const newStaff = await AdminUser.create({
      email: email.toLowerCase(),
      password: tempPassword, // Will be hashed by pre-save hook
      name,
      role: staffRole,
      permissions: staffPermissions,
      isActive: true,
      invitedBy: currentUser._id.toString(),
      inviteToken,
      inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })
    
    return NextResponse.json({
      success: true,
      message: 'Staff member invited successfully',
      staff: {
        id: newStaff._id.toString(),
        email: newStaff.email,
        name: newStaff.name,
        role: newStaff.role,
        tempPassword, // Send this to the staff member
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to invite staff member' },
      { status: 500 }
    )
  }
}
