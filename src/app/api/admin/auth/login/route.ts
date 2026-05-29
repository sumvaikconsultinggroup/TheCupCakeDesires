import connectDb from '@/lib/mongodb'
import AdminUser from '@/models/AdminUser'
import { generateToken } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    await connectDb()
    
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Find user with password field
    const user = await AdminUser.findOne({ email: email.toLowerCase() }).select('+password')
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is deactivated. Contact store owner.' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Update last login
    user.lastLogin = new Date()
    await user.save()
    
    // Generate token
    const token = generateToken(user)
    
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
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
