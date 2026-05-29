import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  username?: string
}

interface AuthState {
  // Authentication state
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean

  // Actions
  setAuthenticated: (user: User) => void
  setUnauthenticated: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      isLoading: true,

      // Actions
      setAuthenticated: (user: User) => {
        set({
          isAuthenticated: true,
          user,
          isLoading: false,
        })
      },

      setUnauthenticated: () => {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist authentication state, not loading state
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)

// Selectors for common use cases
export const useAuth = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  return { isAuthenticated, user, isLoading }
}

export const useUser = () => {
  const { user } = useAuthStore()
  return user
}

export const useAuthActions = () => {
  const { setAuthenticated, setUnauthenticated, setLoading, updateUser } = useAuthStore()
  return { setAuthenticated, setUnauthenticated, setLoading, updateUser }
}
