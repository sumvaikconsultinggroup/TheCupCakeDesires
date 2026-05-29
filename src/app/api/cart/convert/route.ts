import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'

/**
 * POST /api/cart/convert
 * Mark cart as converted after successful payment
 * Called by payment webhook or order creation
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { cartId, orderId } = await request.json()

        if (!cartId) {
            return NextResponse.json(
                { success: false, message: 'Cart ID required' },
                { status: 400 }
            )
        }

        // Find the cart
        const cart = await Cart.findOne({ cartId })

        if (!cart) {
            // Cart might have been deleted or doesn't exist - not an error
            return NextResponse.json({
                success: true,
                message: 'Cart not found (may have been already processed)'
            })
        }

        // Mark as converted
        cart.status = 'converted'
        cart.convertedAt = new Date()
        await cart.save()

        return NextResponse.json({
            success: true,
            data: {
                cartId: cart.cartId,
                status: cart.status,
                convertedAt: cart.convertedAt,
                orderId: orderId,
            },
            message: 'Cart converted successfully'
        })

    } catch (error) {
        console.error('Error converting cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to convert cart' },
            { status: 500 }
        )
    }
}
