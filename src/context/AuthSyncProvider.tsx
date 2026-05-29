'use client'

import { useUser } from '@clerk/nextjs'
import { setAuthStatusGetter, useCart } from '@/components/useCartStore'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function AuthSyncProviderInner({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded } = useUser()
    const { items } = useCart()
    const hasSynced = useRef(false)
    const isInitialized = useRef(false)

    // Set up auth status getter for cart store
    useEffect(() => {
        setAuthStatusGetter(() => isSignedIn ?? false)
    }, [isSignedIn])

    // Handle cart sync on sign-in
    useEffect(() => {
        // Wait for auth to be loaded
        if (!isLoaded) {
            return
        }

        // On first load after auth is ready
        if (!isInitialized.current) {
            isInitialized.current = true
            
            // If user is already signed in and has cart items, sync immediately
            if (isSignedIn && items.length > 0 && !hasSynced.current) {
                syncCartToServer()
                hasSynced.current = true
            }
            return
        }

        // Reset sync flag when user signs out
        if (!isSignedIn) {
            hasSynced.current = false
        }
    }, [isSignedIn, isLoaded, items])

    const syncCartToServer = async () => {
        try {
            const response = await fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            })

            if (response.ok) {
                const data = await response.json()
            } else {
                const errorText = await response.text()
                console.error('❌ Failed to sync cart:', response.status, errorText)
            }
        } catch (error) {
            console.error('❌ Cart sync error:', error)
        }
    }

    return <>{children}</>
}

export default function AuthSyncProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    // Define routes where auth sync should be skipped
    const skipAuthRoutes = [
        '/order-successful',
        '/payment',
        '/success', 
        '/failure',
    ]

    const shouldSkipAuth = skipAuthRoutes.some(route => pathname?.startsWith(route))

    if (shouldSkipAuth) {
        return <>{children}</>
    }

    return <AuthSyncProviderInner>{children}</AuthSyncProviderInner>
}