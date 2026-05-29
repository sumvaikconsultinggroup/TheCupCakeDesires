'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type LoadingContextValue = {
  introComplete: boolean
  completeIntro: () => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [introComplete, setIntroComplete] = useState(false)

  const completeIntro = useCallback(() => {
    setIntroComplete(true)
  }, [])

  const value = useMemo(
    () => ({ introComplete, completeIntro }),
    [introComplete, completeIntro]
  )

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}

export function useLoadingContext() {
  const ctx = useContext(LoadingContext)
  if (!ctx) {
    throw new Error('useLoadingContext must be used within LoadingProvider')
  }
  return ctx
}
