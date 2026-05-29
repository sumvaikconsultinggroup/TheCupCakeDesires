import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'

/**
 * POST /api/cart/detect-abandoned
 * Cron job to detect and mark abandoned carts
 * Should be called every 5-10 minutes
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const now = new Date()
        
        // Find active carts that have been inactive for 60+ minutes
        const activeCartsToAbandon = await Cart.find({
            status: 'active',
            lastUpdated: {
                $lte: new Date(now.getTime() - 60 * 60 * 1000) // 60 minutes ago
            }
        })

        // Find checkout_started carts that have been inactive for 20+ minutes
        const checkoutCartsToAbandon = await Cart.find({
            status: 'checkout_started',
            lastUpdated: {
                $lte: new Date(now.getTime() - 20 * 60 * 1000) // 20 minutes ago
            }
        })

        const cartsToAbandon = [...activeCartsToAbandon, ...checkoutCartsToAbandon]

        let abandonedCount = 0
        const abandonedCarts = []

        for (const cart of cartsToAbandon) {
            cart.status = 'abandoned'
            cart.abandonedAt = now
            await cart.save()
            
            abandonedCount++
            
            // Collect cart info for immediate recovery trigger
            if (cart.email || cart.userId) {
                abandonedCarts.push({
                    cartId: cart.cartId,
                    userId: cart.userId,
                    email: cart.email,
                    userName: cart.userName,
                    phoneNumber: cart.phoneNumber,
                    items: cart.items,
                    totalValue: cart.totalValue,
                    abandonedAt: cart.abandonedAt,
                })
            }
        }

        // Mark expired abandoned carts (abandoned for 72+ hours without recovery)
        const cartsToExpire = await Cart.find({
            status: 'abandoned',
            abandonedAt: {
                $lte: new Date(now.getTime() - 72 * 60 * 60 * 1000) // 72 hours ago
            }
        })

        let expiredCount = 0
        for (const cart of cartsToExpire) {
            // Check if max recovery attempts reached (3 attempts)
            if (cart.recoveryAttempts.length >= 3) {
                cart.status = 'expired'
                await cart.save()
                expiredCount++
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                abandonedCount,
                expiredCount,
                abandonedCarts: abandonedCarts, // For immediate trigger
            },
            message: `Marked ${abandonedCount} carts as abandoned, ${expiredCount} as expired`
        })

    } catch (error) {
        console.error('Error detecting abandoned carts:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to detect abandoned carts' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/cart/detect-abandoned
 * Manual trigger for testing (remove in production or add auth)
 */
export async function GET(request: NextRequest) {
    // For testing only - same logic as POST
    return POST(request)
}
