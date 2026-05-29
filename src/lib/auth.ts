import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import AdminUser, { IAdminUser } from '@/models/AdminUser'
import crypto from 'crypto'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Application cannot start without it.')
  }
  return secret
}

const JWT_SECRET = getJwtSecret()
const TOKEN_EXPIRY = '7d'

export interface TokenPayload {
  userId: string
  email: string
  role: 'owner' | 'admin' | 'staff'
  permissions: string[]
}

export function generateToken(user: IAdminUser): string {
  const payload: TokenPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<IAdminUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    
    if (!token) return null
    
    const payload = verifyToken(token)
    if (!payload) return null
    
    await connectDb()
    const user = await AdminUser.findById(payload.userId).select('-password')
    
    if (!user || !user.isActive) return null
    
    return user
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<IAdminUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Updated to check route-based permissions
export function hasPermission(user: IAdminUser, routePath: string): boolean {
  if (user.role === 'owner') return true
  return user.permissions.includes(routePath)
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Reusable admin request verification for API routes.
 * Returns the token payload if valid, or a 401 NextResponse if not.
 * Usage:
 *   const auth = await verifyAdminRequest()
 *   if (auth instanceof NextResponse) return auth
 *   // auth.user is the TokenPayload
 */
export async function verifyAdminRequest(): Promise<{ user: TokenPayload } | NextResponse> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return { user: payload }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
