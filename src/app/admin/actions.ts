'use server'

import connectDb from '@/lib/mongodb'
import AdminUser, { DEFAULT_PERMISSIONS } from '@/models/AdminUser'
import { generateToken, verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export interface AdminUserData {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'staff'
  permissions: string[]
  avatar?: string
  lastLogin?: string
}

export interface AuthResult {
  success: boolean
  message: string
  user?: AdminUserData
  needsSetup?: boolean
}

// Check if setup is needed
export async function checkSetupNeeded(): Promise<AuthResult> {
  try {
    await connectDb()
    const adminCount = await AdminUser.countDocuments()
    return { 
      success: true, 
      message: adminCount === 0 ? 'Setup required' : 'Setup complete',
      needsSetup: adminCount === 0 
    }
  } catch (error) {
    console.error('Setup check error:', error)
    return { success: false, message: 'Unable to check setup status' }
  }
}

// Get current user from cookie
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return { success: false, message: 'Not authenticated' }
    }

    const payload = verifyToken(token)
    if (!payload) {
      return { success: false, message: 'Invalid token' }
    }

    await connectDb()
    const user = await AdminUser.findById(payload.userId)
    
    if (!user || !user.isActive) {
      return { success: false, message: 'User not found or inactive' }
    }

    return {
      success: true,
      message: 'Authenticated',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin?.toISOString(),
      }
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return { success: false, message: 'Authentication check failed' }
  }
}

// Login action
export async function loginAdmin(email: string, password: string): Promise<AuthResult> {
  try {
    if (!email || !password) {
      return { success: false, message: 'Email and password are required' }
    }

    await connectDb()
    
    // Find user with password field
    const user = await AdminUser.findOne({ email: email.toLowerCase() }).select('+password')
    
    if (!user) {
      return { success: false, message: 'Invalid email or password' }
    }
    
    if (!user.isActive) {
      return { success: false, message: 'Account is deactivated. Contact store owner.' }
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return { success: false, message: 'Invalid email or password' }
    }
    
    // Strip any legacy permissions that are no longer in the schema enum
    const validPermissions = (user.schema.path('permissions') as any)?.caster?.enumValues
    if (validPermissions) {
      user.permissions = user.permissions.filter((p: string) => validPermissions.includes(p))
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin?.toISOString(),
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'Login failed. Please try again.' }
  }
}

// Logout action
export async function logoutAdmin(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_token')
    return { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, message: 'Logout failed' }
  }
}

// Setup action - create first admin user
export async function setupAdmin(data: {
  email: string
  password: string
  name: string
  storeName?: string
}): Promise<AuthResult> {
  try {
    await connectDb()
    
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne()
    if (existingAdmin) {
      return { success: false, message: 'Admin already exists. Please login.' }
    }
    
    // Create owner account with all permissions
    const owner = new AdminUser({
      email: data.email.toLowerCase(),
      password: data.password,
      name: data.name || 'Store Owner',
      role: 'owner',
      permissions: DEFAULT_PERMISSIONS.owner,
      isActive: true,
    })
    
    await owner.save()
    
    // Generate token and set cookie
    const token = generateToken(owner)
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    
    return {
      success: true,
      message: 'Setup complete! Welcome to your admin panel.',
      user: {
        id: owner._id.toString(),
        email: owner.email,
        name: owner.name,
        role: owner.role,
        permissions: owner.permissions,
      }
    }
  } catch (error) {
    console.error('Setup error:', error)
    return { success: false, message: 'Setup failed. Please try again.' }
  }
}