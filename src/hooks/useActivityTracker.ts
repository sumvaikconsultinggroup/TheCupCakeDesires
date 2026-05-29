import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/useCartStore'
import { useUser } from '@clerk/nextjs'

// Generate or retrieve session ID
const getSessionId = (): string => {
    if (typeof window === 'undefined') return ''

    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
}

export const useActivityTracker = () => {
    const pathname = usePathname()
    const { items: cartItems } = useCart()
    const { user } = useUser()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const sessionIdRef = useRef<string>('')

    // Initialize session ID
    useEffect(() => {
        sessionIdRef.current = getSessionId()
    }, [])

    // Track page views
    useEffect(() => {
        if (!sessionIdRef.current || !pathname) return

        // Skip admin pages
        if (pathname.startsWith('/admin')) return

        const trackActivity = async () => {
            try {
                await fetch('/api/analytics/track-activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sessionIdRef.current,
                        page: pathname,
                        cartItems: cartItems.map(item => ({
                            productId: item.productId,
                            productName: item.name,
                            price: item.price,
                            quantity: item.quantity,
                        })),
                    }),
                })
            } catch (error) {
                console.error('Failed to track activity:', error)
            }
        }

        // Track immediately on page load
        trackActivity()

        // Set up heartbeat every 30 seconds
        intervalRef.current = setInterval(trackActivity, 30000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [pathname, cartItems])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])
}
