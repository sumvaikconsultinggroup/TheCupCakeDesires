import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/cart/checkout
 * Mark cart as checkout started
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { cartId, sessionId, email } = await request.json()
        const user = await currentUser()

        const userId = user?.id

        if (!cartId) {
            return NextResponse.json(
                { success: false, message: 'Cart ID required' },
                { status: 400 }
            )
        }

        // Find the cart
        const cart = await Cart.findOne({ cartId })

        if (!cart) {
            return NextResponse.json(
                { success: false, message: 'Cart not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        const isOwner = (userId && cart.userId === userId) || 
                       (!userId && cart.sessionId === sessionId)
        
        if (!isOwner) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Check if already in checkout or later stage
        if (cart.status !== 'active' && cart.status !== 'checkout_started') {
            return NextResponse.json(
                { success: false, message: `Cart is ${cart.status}` },
                { status: 400 }
            )
        }

        // Update cart status to checkout_started
        cart.status = 'checkout_started'
        cart.checkoutStartedAt = new Date()
        cart.lastUpdated = new Date()

        // Capture email if guest provided it during checkout
        if (email && !cart.email) {
            cart.email = email
        }

        await cart.save()

        return NextResponse.json({
            success: true,
            data: {
                cartId: cart.cartId,
                status: cart.status,
                checkoutStartedAt: cart.checkoutStartedAt,
            },
            message: 'Checkout initiated successfully'
        })

    } catch (error) {
        console.error('Error starting checkout:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to start checkout' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/cart/checkout
 * Update checkout info (email capture, promo code, etc.)
 */
export async function PATCH(request: NextRequest) {
    try {
        await connectDb()

        const { cartId, sessionId, email, promoCode, discount } = await request.json()
        const user = await currentUser()

        const userId = user?.id

        if (!cartId) {
            return NextResponse.json(
                { success: false, message: 'Cart ID required' },
                { status: 400 }
            )
        }

        const cart = await Cart.findOne({ cartId })

        if (!cart) {
            return NextResponse.json(
                { success: false, message: 'Cart not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        const isOwner = (userId && cart.userId === userId) || 
                       (!userId && cart.sessionId === sessionId)
        
        if (!isOwner) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Update fields
        if (email && !cart.email) {
            cart.email = email
        }

        if (promoCode) {
            cart.promoCode = promoCode
        }

        if (discount !== undefined) {
            cart.discount = discount
        }

        cart.lastUpdated = new Date()
        await cart.save()

        return NextResponse.json({
            success: true,
            data: {
                cartId: cart.cartId,
                email: cart.email,
                promoCode: cart.promoCode,
                discount: cart.discount,
            },
            message: 'Checkout info updated'
        })

    } catch (error) {
        console.error('Error updating checkout info:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update checkout info' },
            { status: 500 }
        )
    }
}
