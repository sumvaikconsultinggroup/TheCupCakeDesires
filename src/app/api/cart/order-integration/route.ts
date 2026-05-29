import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'
import Order from '@/models/Order'

/**
 * POST /api/cart/order-integration
 * Integration endpoint to be called when an order is created
 * Marks the cart as converted
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { cartId, orderId, sessionId, userId } = await request.json()

        // Try to find cart by cartId, sessionId, or userId
        let cart

        if (cartId) {
            cart = await Cart.findOne({ cartId })
        } else if (userId) {
            cart = await Cart.findOne({
                userId: userId,
                status: { $in: ['active', 'checkout_started'] }
            }).sort({ lastUpdated: -1 })
        } else if (sessionId) {
            cart = await Cart.findOne({
                sessionId: sessionId,
                status: { $in: ['active', 'checkout_started'] }
            }).sort({ lastUpdated: -1 })
        }

        if (cart) {
            // Mark cart as converted
            cart.status = 'converted'
            cart.convertedAt = new Date()
            await cart.save()

            return NextResponse.json({
                success: true,
                message: 'Cart marked as converted',
                data: {
                    cartId: cart.cartId,
                    orderId: orderId,
                }
            })
        }

        // Cart not found - this is OK, might be a direct checkout
        return NextResponse.json({
            success: true,
            message: 'No cart found to convert (direct checkout)'
        })

    } catch (error) {
        console.error('Error in order-cart integration:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to integrate with cart' },
            { status: 500 }
        )
    }
}
