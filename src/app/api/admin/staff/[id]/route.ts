import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'




// PUT - Update staff member
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(currentUser, 'staff.edit')) {
      return NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 })
    }
    
    const params = await context.params
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, message: 'Invalid staff ID' }, { status: 400 })
    }
    
    await connectDb()
    
    const staff = await AdminUser.findById(params.id)
    if (!staff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 })
    }
    
    // Cannot edit owner unless you are the owner
    if (staff.role === 'owner' && currentUser.role !== 'owner') {
      return NextResponse.json({ success: false, message: 'Cannot edit owner account' }, { status: 403 })
    }
    
    // Cannot change own role
    if (staff._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({ success: false, message: 'Cannot edit your own role' }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, role, permissions, isActive } = body
    
    // Only owner can promote to admin
    if (role === 'admin' && currentUser.role !== 'owner') {
      return NextResponse.json({ success: false, message: 'Only owner can create admins' }, { status: 403 })
    }
    
    // Cannot set role to owner
    if (role === 'owner') {
      return NextResponse.json({ success: false, message: 'Cannot set role to owner' }, { status: 403 })
    }
    
    const updateData: any = {}
    if (name) updateData.name = name
    if (role) updateData.role = role
    if (permissions) updateData.permissions = permissions
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    
    const updated = await AdminUser.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true }
    ).select('-password')
    
    return NextResponse.json({
      success: true,
      message: 'Staff updated successfully',
      staff: {
        id: updated._id.toString(),
        email: updated.email,
        name: updated.name,
        role: updated.role,
        permissions: updated.permissions,
        isActive: updated.isActive,
      }
    })
  } catch (error) {
    console.error('Update staff error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update staff' }, { status: 500 })
  }
}

// DELETE - Remove staff member
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    if (!hasPermission(currentUser, 'staff.delete')) {
      return NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 })
    }
    
    const params = await context.params
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ success: false, message: 'Invalid staff ID' }, { status: 400 })
    }
    
    await connectDb()
    
    const staff = await AdminUser.findById(params.id)
    if (!staff) {
      return NextResponse.json({ success: false, message: 'Staff not found' }, { status: 404 })
    }
    
    // Cannot delete owner
    if (staff.role === 'owner') {
      return NextResponse.json({ success: false, message: 'Cannot delete owner account' }, { status: 403 })
    }
    
    // Cannot delete yourself
    if (staff._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({ success: false, message: 'Cannot delete your own account' }, { status: 403 })
    }
    
    await AdminUser.findByIdAndDelete(params.id)
    
    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully'
    })
  } catch (error) {
    console.error('Delete staff error:', error)
    return NextResponse.json({ success: false, message: 'Failed to delete staff' }, { status: 500 })
  }
}
