import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-user-secret-key-change-in-production'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, user: null })
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    
    await connectDb()
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return NextResponse.json({ success: false, user: null })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ success: false, user: null })
  }
}
