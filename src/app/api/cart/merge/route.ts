import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/cart/merge
 * Merge guest cart into user cart when user logs in
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { guestSessionId } = await request.json()
        const user = await currentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User must be logged in' },
                { status: 401 }
            )
        }

        const userId = user.id

        if (!guestSessionId) {
            return NextResponse.json(
                { success: false, message: 'Guest session ID required' },
                { status: 400 }
            )
        }

        // Find guest cart
        const guestCart = await Cart.findOne({
            sessionId: guestSessionId,
            status: { $in: ['active', 'checkout_started', 'abandoned'] }
        })

        if (!guestCart) {
            return NextResponse.json({
                success: false,
                message: 'No guest cart found'
            })
        }

        // Find user's existing cart
        const userCart = await Cart.findOne({
            userId: userId,
            status: { $in: ['active', 'checkout_started'] }
        })

        if (userCart) {
            // Merge items from guest cart into user cart
            const mergedItems = [...userCart.items]

            for (const guestItem of guestCart.items) {
                const existingItemIndex = mergedItems.findIndex(
                    item => item.productId === guestItem.productId &&
                           item.variant?.id === guestItem.variant?.id
                )

                if (existingItemIndex >= 0) {
                    // Update quantity if item already exists
                    mergedItems[existingItemIndex].quantity += guestItem.quantity
                } else {
                    // Add new item
                    mergedItems.push(guestItem)
                }
            }

            // Recalculate total
            const newTotal = mergedItems.reduce(
                (sum, item) => sum + (item.price * item.quantity),
                0
            )

            userCart.items = mergedItems
            userCart.totalValue = newTotal
            userCart.lastUpdated = new Date()

            await userCart.save()

            // Delete guest cart
            await Cart.deleteOne({ _id: guestCart._id })

            return NextResponse.json({
                success: true,
                data: {
                    cartId: userCart.cartId,
                    items: userCart.items,
                    totalValue: userCart.totalValue,
                },
                message: 'Carts merged successfully'
            })
        } else {
            // No user cart exists, convert guest cart to user cart
            guestCart.userId = userId
            guestCart.sessionId = undefined
            guestCart.email = user.emailAddresses?.[0]?.emailAddress || guestCart.email
            guestCart.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
            guestCart.phoneNumber = user.phoneNumbers?.[0]?.phoneNumber || guestCart.phoneNumber
            guestCart.status = 'active'
            guestCart.lastUpdated = new Date()

            await guestCart.save()

            return NextResponse.json({
                success: true,
                data: {
                    cartId: guestCart.cartId,
                    items: guestCart.items,
                    totalValue: guestCart.totalValue,
                },
                message: 'Guest cart converted to user cart'
            })
        }

    } catch (error) {
        console.error('Error merging carts:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to merge carts' },
            { status: 500 }
        )
    }
}
