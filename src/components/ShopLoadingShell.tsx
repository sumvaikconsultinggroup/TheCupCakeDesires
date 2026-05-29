'use client'

import IntroLoader from '@/components/IntroLoader'
import RouteLoadingOverlay from '@/components/RouteLoadingOverlay'
import { LoadingProvider, useLoadingContext } from '@/context/LoadingContext'
import { Suspense } from 'react'

function ShopLoadingInner() {
  const { introComplete, completeIntro } = useLoadingContext()

  const handleIntroComplete = () => {
    completeIntro()
  }

  return (
    <>
      {!introComplete && <IntroLoader onComplete={handleIntroComplete} />}
      <Suspense fallback={null}>
        <RouteLoadingOverlay />
      </Suspense>
    </>
  )
}

export default function ShopLoadingShell() {
  return (
    <LoadingProvider>
      <ShopLoadingInner />
    </LoadingProvider>
  )
}
