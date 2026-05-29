'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface UserData {
  id: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  phone?: string
}

interface UserAuthContextType {
  user: UserData | null
  isLoading: boolean
  isSignedIn: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  signUp: (data: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined)

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (res.ok) {
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          if (data.success && data.user) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      
      const text = await res.text()
      try {
        const data = JSON.parse(text)
        if (data.success && data.user) {
          setUser(data.user)
          return { success: true, message: 'Login successful' }
        }
        return { success: false, message: data.message || 'Login failed' }
      } catch {
        return { success: false, message: 'Server error' }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, message: 'Unable to connect. Please try again.' }
    }
  }

  const signUp = async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      
      const text = await res.text()
      try {
        const result = JSON.parse(text)
        if (result.success && result.user) {
          setUser(result.user)
          return { success: true, message: 'Registration successful' }
        }
        return { success: false, message: result.message || 'Registration failed' }
      } catch {
        return { success: false, message: 'Server error' }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, message: 'Unable to connect. Please try again.' }
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setUser(null)
      router.push('/')
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn: !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserAuthContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserAuthProvider')
  }
  return {
    user: context.user,
    isLoaded: !context.isLoading,
    isSignedIn: context.isSignedIn,
  }
}

export function useAuth() {
  const context = useContext(UserAuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserAuthProvider')
  }
  return context
}

// Compatibility hook for components that used useUser from Clerk
export function useClerk() {
  const context = useContext(UserAuthContext)
  if (context === undefined) {
    throw new Error('useClerk must be used within a UserAuthProvider')
  }
  return {
    signOut: context.signOut,
    openSignIn: () => {
      window.location.href = '/login'
    },
    openSignUp: () => {
      window.location.href = '/register'
    },
  }
}
