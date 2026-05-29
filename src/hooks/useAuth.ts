'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useAuthStore } from './useAuthStore'


export function useAuthSync() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { setUser, setIsLoading, setIsAuthenticated } = useAuthStore()

  useEffect(() => {
    setUser(user as any)
    setIsLoading(!isLoaded)
    setIsAuthenticated(isSignedIn as boolean)
  }, [user, isLoaded, isSignedIn, setUser, setIsLoading, setIsAuthenticated])
}

export const useAuth = () => useAuthStore((state) => state)