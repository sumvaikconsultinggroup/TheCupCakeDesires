import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'
import { currentUser } from '@clerk/nextjs/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/cart/manage
 * Create or update a cart (add item, update quantity, remove item)
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { action, cartId, items, sessionId } = await request.json()
        const user = await currentUser()

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Identify user
        const userId = user?.id
        const guestSessionId = sessionId || `session_${uuidv4()}`
        
        const email = user?.emailAddresses?.[0]?.emailAddress
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined
        const phoneNumber = user?.phoneNumbers?.[0]?.phoneNumber

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Cart items are required' },
                { status: 400 }
            )
        }

        // Calculate total value
        const totalValue = items.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        )

        let cart

        if (cartId) {
            // Update existing cart
            cart = await Cart.findOne({ cartId })
            
            if (!cart) {
                return NextResponse.json(
                    { success: false, message: 'Cart not found' },
                    { status: 404 }
                )
            }

            // Verify ownership
            const isOwner = (userId && cart.userId === userId) || 
                           (!userId && cart.sessionId === guestSessionId)
            
            if (!isOwner) {
                return NextResponse.json(
                    { success: false, message: 'Unauthorized' },
                    { status: 403 }
                )
            }

            // Update cart
            cart.items = items
            cart.totalValue = totalValue
            cart.lastUpdated = new Date()
            
            // Update user info if logged in and not set
            if (userId && !cart.userId) {
                cart.userId = userId
            }
            if (email && !cart.email) {
                cart.email = email
            }
            if (userName && !cart.userName) {
                cart.userName = userName
            }
            if (phoneNumber && !cart.phoneNumber) {
                cart.phoneNumber = phoneNumber
            }

            await cart.save()
        } else {
            // Check for existing active/checkout cart
            const existingCart = await Cart.findOne({
                $or: [
                    { userId: userId, status: { $in: ['active', 'checkout_started'] } },
                    { sessionId: guestSessionId, status: { $in: ['active', 'checkout_started'] } }
                ]
            })

            if (existingCart) {
                // Update existing cart
                existingCart.items = items
                existingCart.totalValue = totalValue
                existingCart.lastUpdated = new Date()
                
                if (userId && !existingCart.userId) {
                    existingCart.userId = userId
                }
                if (email && !existingCart.email) {
                    existingCart.email = email
                }
                if (userName && !existingCart.userName) {
                    existingCart.userName = userName
                }
                if (phoneNumber && !existingCart.phoneNumber) {
                    existingCart.phoneNumber = phoneNumber
                }

                await existingCart.save()
                cart = existingCart
            } else {
                // Create new cart
                const newCartId = `cart_${uuidv4()}`
                
                cart = await Cart.create({
                    cartId: newCartId,
                    userId: userId,
                    sessionId: !userId ? guestSessionId : undefined,
                    email: email,
                    userName: userName,
                    phoneNumber: phoneNumber,
                    items: items,
                    totalValue: totalValue,
                    status: 'active',
                    lastUpdated: new Date(),
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    recoveryAttempts: [],
                })
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                cartId: cart.cartId,
                sessionId: !userId ? guestSessionId : undefined,
                status: cart.status,
                items: cart.items,
                totalValue: cart.totalValue,
                lastUpdated: cart.lastUpdated,
            }
        })

    } catch (error) {
        console.error('Error managing cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to manage cart' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/cart/manage
 * Retrieve active cart for current user/session
 */
export async function GET(request: NextRequest) {
    try {
        await connectDb()

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')
        const user = await currentUser()

        const userId = user?.id

        if (!userId && !sessionId) {
            return NextResponse.json(
                { success: false, message: 'User or session ID required' },
                { status: 400 }
            )
        }

        // Find active or checkout_started cart
        const cart = await Cart.findOne({
            $or: [
                { userId: userId, status: { $in: ['active', 'checkout_started'] } },
                { sessionId: sessionId, status: { $in: ['active', 'checkout_started'] } }
            ]
        }).sort({ lastUpdated: -1 })

        if (!cart) {
            return NextResponse.json({
                success: true,
                data: null
            })
        }

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
                checkoutStartedAt: cart.checkoutStartedAt,
            }
        })

    } catch (error) {
        console.error('Error fetching cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch cart' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/cart/manage
 * Clear/delete a cart
 */
export async function DELETE(request: NextRequest) {
    try {
        await connectDb()

        const { searchParams } = new URL(request.url)
        const cartId = searchParams.get('cartId')
        const sessionId = searchParams.get('sessionId')
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

        await Cart.deleteOne({ cartId })

        return NextResponse.json({
            success: true,
            message: 'Cart deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete cart' },
            { status: 500 }
        )
    }
}
