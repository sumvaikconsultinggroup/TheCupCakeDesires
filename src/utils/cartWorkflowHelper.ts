/**
 * Cart Workflow Helper Functions
 * Utilities to integrate cart workflow with existing systems
 */

import Cart from '@/models/Cart'

/**
 * Find or create active cart for user/session
 */
export async function getOrCreateCart(params: {
    userId?: string
    sessionId?: string
    email?: string
    userName?: string
    phoneNumber?: string
    ipAddress?: string
    userAgent?: string
}): Promise<any> {
    const { userId, sessionId, email, userName, phoneNumber, ipAddress, userAgent } = params

    // Find existing active/checkout cart
    const existingCart = await Cart.findOne({
        $or: [
            { userId: userId, status: { $in: ['active', 'checkout_started'] } },
            { sessionId: sessionId, status: { $in: ['active', 'checkout_started'] } }
        ]
    }).sort({ lastUpdated: -1 })

    if (existingCart) {
        return existingCart
    }

    // Create new cart
    const { v4: uuidv4 } = require('uuid')
    const newCart = await Cart.create({
        cartId: `cart_${uuidv4()}`,
        userId: userId,
        sessionId: !userId ? sessionId : undefined,
        email: email,
        userName: userName,
        phoneNumber: phoneNumber,
        items: [],
        totalValue: 0,
        status: 'active',
        lastUpdated: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent,
        recoveryAttempts: [],
    })

    return newCart
}

/**
 * Update cart items and recalculate total
 */
export async function updateCartItems(
    cartId: string,
    items: Array<{
        productId: string
        productName: string
        imageUrl?: string
        price: number
        quantity: number
        variant?: any
    }>
): Promise<any> {
    const cart = await Cart.findOne({ cartId })

    if (!cart) {
        throw new Error('Cart not found')
    }

    const totalValue = items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    )

    cart.items = items
    cart.totalValue = totalValue
    cart.lastUpdated = new Date()

    await cart.save()
    return cart
}

/**
 * Mark cart as checkout started
 */
export async function startCheckout(cartId: string, email?: string): Promise<any> {
    const cart = await Cart.findOne({ cartId })

    if (!cart) {
        throw new Error('Cart not found')
    }

    if (cart.status !== 'active' && cart.status !== 'checkout_started') {
        throw new Error(`Cart is ${cart.status}`)
    }

    cart.status = 'checkout_started'
    cart.checkoutStartedAt = new Date()
    cart.lastUpdated = new Date()

    if (email && !cart.email) {
        cart.email = email
    }

    await cart.save()
    return cart
}

/**
 * Mark cart as converted (after successful payment)
 */
export async function convertCart(cartId: string): Promise<void> {
    const cart = await Cart.findOne({ cartId })

    if (cart) {
        cart.status = 'converted'
        cart.convertedAt = new Date()
        await cart.save()
    }
}

/**
 * Mark cart as abandoned
 */
export async function abandonCart(cartId: string): Promise<void> {
    const cart = await Cart.findOne({ cartId })

    if (cart && cart.status !== 'converted') {
        cart.status = 'abandoned'
        cart.abandonedAt = new Date()
        await cart.save()
    }
}

/**
 * Merge guest cart into user cart after login
 */
export async function mergeGuestCartToUser(
    guestSessionId: string,
    userId: string,
    userEmail: string,
    userName?: string,
    phoneNumber?: string
): Promise<any> {
    const guestCart = await Cart.findOne({
        sessionId: guestSessionId,
        status: { $in: ['active', 'checkout_started', 'abandoned'] }
    })

    if (!guestCart) {
        return null
    }

    const userCart = await Cart.findOne({
        userId: userId,
        status: { $in: ['active', 'checkout_started'] }
    })

    if (userCart) {
        // Merge items
        const mergedItems = [...userCart.items]

        for (const guestItem of guestCart.items) {
            const existingItemIndex = mergedItems.findIndex(
                item => item.productId === guestItem.productId &&
                       item.variant?.id === guestItem.variant?.id
            )

            if (existingItemIndex >= 0) {
                mergedItems[existingItemIndex].quantity += guestItem.quantity
            } else {
                mergedItems.push(guestItem)
            }
        }

        const newTotal = mergedItems.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        )

        userCart.items = mergedItems
        userCart.totalValue = newTotal
        userCart.lastUpdated = new Date()

        await userCart.save()
        await Cart.deleteOne({ _id: guestCart._id })

        return userCart
    } else {
        // Convert guest cart to user cart
        guestCart.userId = userId
        guestCart.sessionId = undefined
        guestCart.email = userEmail
        guestCart.userName = userName
        guestCart.phoneNumber = phoneNumber
        guestCart.status = 'active'
        guestCart.lastUpdated = new Date()

        await guestCart.save()
        return guestCart
    }
}

/**
 * Get abandoned cart for recovery
 */
export async function getAbandonedCartForUser(
    userId?: string,
    sessionId?: string
): Promise<any> {
    const query: any = {
        status: { $in: ['abandoned', 'checkout_started'] }
    }

    if (userId) {
        query.userId = userId
    } else if (sessionId) {
        query.sessionId = sessionId
    } else {
        return null
    }

    return await Cart.findOne(query).sort({ abandonedAt: -1, lastUpdated: -1 })
}

/**
 * Resume abandoned cart
 */
export async function resumeCart(
    cartId: string,
    userId?: string,
    userEmail?: string,
    userName?: string,
    phoneNumber?: string
): Promise<any> {
    const cart = await Cart.findOne({ cartId })

    if (!cart || cart.status === 'expired' || cart.status === 'converted') {
        return null
    }

    cart.status = 'active'
    cart.lastUpdated = new Date()

    // Update user info if logged in
    if (userId && !cart.userId) {
        cart.userId = userId
        cart.email = userEmail || cart.email
        cart.userName = userName || cart.userName
        cart.phoneNumber = phoneNumber || cart.phoneNumber
    }

    await cart.save()
    return cart
}

/**
 * Check if cart should be abandoned (utility for cron job)
 */
export function shouldCartBeAbandoned(cart: any): boolean {
    const now = new Date()
    const diffMinutes = (now.getTime() - cart.lastUpdated.getTime()) / (1000 * 60)

    if (cart.status === 'active' && diffMinutes >= 60) {
        return true
    } else if (cart.status === 'checkout_started' && diffMinutes >= 20) {
        return true
    }

    return false
}
