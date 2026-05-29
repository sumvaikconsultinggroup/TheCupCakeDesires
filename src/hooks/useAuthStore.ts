import { UserResource } from '@clerk/types'
import { create } from 'zustand'

interface AuthState {
  user: UserResource | null | undefined
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: UserResource | null | undefined) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))