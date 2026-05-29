import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/cart/resume
 * Resume an abandoned cart when user returns
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { cartId, sessionId } = await request.json()
        const user = await currentUser()

        const userId = user?.id

        // Find abandoned cart for this user/session
        let cart

        if (cartId) {
            // Resume specific cart
            cart = await Cart.findOne({
                cartId: cartId,
                status: { $in: ['abandoned', 'checkout_started'] }
            })
        } else {
            // Find most recent abandoned cart
            const query: any = {
                status: { $in: ['abandoned', 'checkout_started', 'active'] }
            }

            if (userId) {
                query.userId = userId
            } else if (sessionId) {
                query.sessionId = sessionId
            } else {
                return NextResponse.json(
                    { success: false, message: 'Cart ID, user ID, or session ID required' },
                    { status: 400 }
                )
            }

            cart = await Cart.findOne(query).sort({ abandonedAt: -1, lastUpdated: -1 })
        }

        if (!cart) {
            return NextResponse.json({
                success: false,
                message: 'No abandoned cart found'
            })
        }

        // Check if cart is expired
        if (cart.status === 'expired') {
            return NextResponse.json({
                success: false,
                message: 'Cart has expired'
            })
        }

        // Reactivate the cart
        cart.status = 'active'
        cart.lastUpdated = new Date()

        // If user logged in after creating guest cart, link it
        if (userId && !cart.userId) {
            cart.userId = userId
            
            if (user.emailAddresses?.[0]?.emailAddress && !cart.email) {
                cart.email = user.emailAddresses[0].emailAddress
            }
            if (user.firstName || user.lastName) {
                cart.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
            }
            if (user.phoneNumbers?.[0]?.phoneNumber && !cart.phoneNumber) {
                cart.phoneNumber = user.phoneNumbers[0].phoneNumber
            }
        }

        await cart.save()

        return NextResponse.json({
            success: true,
            data: {
                cartId: cart.cartId,
                status: cart.status,
                items: cart.items,
                totalValue: cart.totalValue,
                discount: cart.discount,
                promoCode: cart.promoCode,
                lastUpdated: cart.lastUpdated,
            },
            message: 'Cart resumed successfully'
        })

    } catch (error) {
        console.error('Error resuming cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to resume cart' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/cart/resume
 * Check if user has an abandoned cart to resume
 */
export async function GET(request: NextRequest) {
    try {
        await connectDb()

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')
        const user = await currentUser()

        const userId = user?.id

        if (!userId && !sessionId) {
            return NextResponse.json({
                success: true,
                hasAbandonedCart: false,
                cart: null
            })
        }

        // Find most recent abandoned or checkout cart
        const query: any = {
            status: { $in: ['abandoned', 'checkout_started'] }
        }

        if (userId) {
            query.userId = userId
        } else if (sessionId) {
            query.sessionId = sessionId
        }

        const cart = await Cart.findOne(query).sort({ abandonedAt: -1, lastUpdated: -1 })

        if (!cart) {
            return NextResponse.json({
                success: true,
                hasAbandonedCart: false,
                cart: null
            })
        }

        return NextResponse.json({
            success: true,
            hasAbandonedCart: true,
            cart: {
                cartId: cart.cartId,
                itemCount: cart.items.length,
                totalValue: cart.totalValue,
                abandonedAt: cart.abandonedAt,
                items: cart.items.slice(0, 3), // Preview first 3 items
            }
        })

    } catch (error) {
        console.error('Error checking abandoned cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to check abandoned cart' },
            { status: 500 }
        )
    }
}
