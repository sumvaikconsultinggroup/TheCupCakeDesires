import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'
import { generateToken } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST - Initial admin setup (first user becomes owner)
export async function POST(request: Request) {
  try {
    await connectDb()
    
    // Check if any admin exists
    const existingAdmin = await AdminUser.findOne({})
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin already exists. Please login.' },
        { status: 400 }
      )
    }
    
    const { email, password, name, storeName } = await request.json()
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      )
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }
    
    // Create owner account
    const owner = await AdminUser.create({
      email,
      password,
      name,
      role: 'owner',
      permissions: DEFAULT_PERMISSIONS.owner,
      isActive: true,
    })
    
    // Generate token
    const token = generateToken(owner)
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    return NextResponse.json({
      success: true,
      message: 'Store setup complete!',
      user: {
        id: owner._id.toString(),
        email: owner.email,
        name: owner.name,
        role: owner.role,
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Setup error:', error)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Setup failed. Please try again.' },
      { status: 500 }
    )
  }
}

// GET - Check if setup is needed
export async function GET() {
  try {
    await connectDb()
    const existingAdmin = await AdminUser.findOne({})
    
    return NextResponse.json({
      success: true,
      needsSetup: !existingAdmin,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to check setup status' },
      { status: 500 }
    )
  }
}
