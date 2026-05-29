/**
 * Session Helper for Abandoned Cart Workflow
 * Manages cart and session identifiers in localStorage
 */

/**
 * Get or create a session ID for guest users
 * Persists across page refreshes
 */
export function getSessionId(): string {
    if (typeof window === 'undefined') return ''
    
    let sessionId = localStorage.getItem('sessionId')
    
    if (!sessionId) {
        // Generate a unique session ID
        sessionId = `session_${crypto.randomUUID()}`
        localStorage.setItem('sessionId', sessionId)
    }
    
    return sessionId
}

/**
 * Get the current cart ID
 */
export function getCartId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('cartId')
}

/**
 * Set the cart ID after creating/updating cart
 */
export function setCartId(cartId: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('cartId', cartId)
}

/**
 * Clear cart ID (after order completion)
 * Note: Keep sessionId for abandoned cart detection
 */
export function clearCart(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('cartId')
}

/**
 * Clear session completely (e.g., after user logs in and cart is merged)
 */
export function clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('sessionId')
}

/**
 * Check if this is a guest user (no authentication)
 */
export function isGuestUser(userId?: string): boolean {
    return !userId
}

/**
 * Get cart identifier based on user status
 */
export function getCartIdentifier(userId?: string): {
    cartId: string | null
    sessionId?: string
    userId?: string
} {
    const cartId = getCartId()
    
    if (userId) {
        return { cartId, userId }
    } else {
        return { cartId, sessionId: getSessionId() }
    }
}

/**
 * Initialize cart tracking on app load
 */
export function initializeCartTracking(): void {
    if (typeof window === 'undefined') return
    
    // Ensure session ID exists
    getSessionId()
}
