'use client'

import BakeryChat from '@/components/BakeryChat'
import CartInitializer from '@/components/CartInitializer'
import GlobalErrorHandler from '@/components/GlobalErrorHandler'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { Toaster as HotToaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'

const GlobalClient = () => {
  const pathname = usePathname()
  const hideAssistant =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up')

  return (
    <>
      <GlobalErrorHandler />
      <Suspense fallback={null}>
        <CartInitializer />
      </Suspense>

      {/* Storefront AI shopping assistant — hidden in admin / auth / checkout */}
      {!hideAssistant && <BakeryChat />}

      {/* Sonner — bake-themed toasts for new cart / review flows.
          z-index pushed above the cart aside (2147483638) so toasts surface
          when the side-cart auto-opens after an add. */}
      <SonnerToaster
        position="top-right"
        offset={24}
        gap={10}
        duration={5000}
        visibleToasts={3}
        style={{ zIndex: 2147483647 }}
        toastOptions={{
          unstyled: false,
          classNames: {
            toast:
              'group toast bake-toast !rounded-2xl !border !border-line !bg-ivory !p-4 !shadow-[0_20px_50px_-20px_rgba(46,31,21,0.35)] !font-bake-body',
            title: '!font-bake-display !text-[16px] !font-medium !text-cocoa',
            description: '!text-[13px] !text-cocoa-soft !font-bake-body',
            actionButton:
              '!rounded-full !bg-cocoa !text-ivory !px-4 !py-2 !text-[12px] !font-medium hover:!bg-rose-accent !transition-colors',
            cancelButton:
              '!rounded-full !bg-cream-deep !text-cocoa !px-4 !py-2 !text-[12px] !font-medium',
            success: '!bg-ivory',
            error: '!bg-ivory',
            info: '!bg-ivory',
            warning: '!bg-ivory',
          },
        }}
      />

      {/* react-hot-toast — kept for legacy callers (will fade out) */}
      <HotToaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-ivory, #fffbf2)',
            color: 'var(--color-cocoa, #2e1f15)',
            borderRadius: '999px',
            padding: '8px 16px',
            border: '1px solid var(--color-line, #ead9b4)',
            fontSize: '13px',
            fontFamily: 'var(--font-bake-body, sans-serif)',
            boxShadow: '0 12px 30px -12px rgba(46,31,21,0.2)',
          },
        }}
      />
    </>
  )
}

export default GlobalClient
