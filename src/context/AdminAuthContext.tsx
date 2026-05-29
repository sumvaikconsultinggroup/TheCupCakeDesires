'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  loginAdmin, 
  logoutAdmin, 
  getCurrentUser, 
  checkSetupNeeded,
  setupAdmin,
  AdminUserData 
} from '@/app/admin/actions'

interface AdminAuthContextType {
  user: AdminUserData | null
  isLoading: boolean
  isAuthenticated: boolean
  needsSetup: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  setup: (data: { email: string; password: string; name: string; storeName?: string }) => Promise<{ success: boolean; message: string }>
  refreshUser: () => Promise<void>
  hasPermission: (routePath: string) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      // Check if setup is needed using server action
      const setupResult = await checkSetupNeeded()
      
      if (setupResult.success && setupResult.needsSetup) {
        setNeedsSetup(true)
        setIsLoading(false)
        return
      }
      setNeedsSetup(false)
      
      // Check if user is logged in using server action
      const authResult = await getCurrentUser()
      
      if (authResult.success && authResult.user) {
        setUser(authResult.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // On error, just show login page
      setUser(null)
      setNeedsSetup(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    try {
      // Use server action instead of API route
      const result = await loginAdmin(email, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        return { success: true, message: 'Login successful' }
      }
      
      return { success: false, message: result.message || 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Unable to connect. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      // Use server action instead of API route
      await logoutAdmin()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/admin')
    }
  }

  const setup = async (data: { email: string; password: string; name: string; storeName?: string }) => {
    try {
      // Use server action instead of API route
      const result = await setupAdmin(data)
      
      if (result.success && result.user) {
        setUser(result.user)
        setNeedsSetup(false)
        return { success: true, message: 'Setup complete!' }
      }
      
      return { success: false, message: result.message || 'Setup failed' }
    } catch (error) {
      console.error('Setup error:', error)
      return { success: false, message: 'Unable to connect. Please try again.' }
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  // Updated to check route-based permissions
  const hasPermission = (routePath: string): boolean => {
    if (!user) return false
    if (user.role === 'owner') return true
    return user.permissions.includes(routePath)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        needsSetup,
        login,
        logout,
        setup,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}