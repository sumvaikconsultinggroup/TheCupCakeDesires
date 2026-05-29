import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/analytics/track-cart
 * Track cart changes for abandoned cart detection
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { cartItems, email, userName } = await request.json()
        const user = await currentUser()

        // Get client info
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Generate guest ID from IP if not logged in
        const guestId = user ? undefined : `guest_${Buffer.from(ipAddress).toString('base64').substring(0, 16)}`

        // If cart is empty, don't track
        if (!cartItems || cartItems.length === 0) {
            // If user was previously tracked, mark as recovered or delete
            if (user?.id || guestId) {
                await AbandonedCart.updateMany(
                    {
                        $or: [
                            { userId: user?.id },
                            { guestId: guestId }
                        ],
                        status: 'abandoned'
                    },
                    {
                        $set: {
                            status: 'recovered',
                            lastUpdatedAt: new Date()
                        }
                    }
                )
            }
            return NextResponse.json({ success: true, message: 'Cart cleared' })
        }

        // Calculate total value
        const totalValue = cartItems.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        )

        // Find existing abandoned cart for this user/guest
        const existingCart = await AbandonedCart.findOne({
            $or: [
                { userId: user?.id },
                { guestId: guestId }
            ],
            status: 'abandoned'
        })

        if (existingCart) {
            // Update existing cart
            existingCart.cartItems = cartItems
            existingCart.totalValue = totalValue
            existingCart.lastUpdatedAt = new Date()
            existingCart.email = email || existingCart.email
            existingCart.userName = userName || user?.fullName || existingCart.userName
            await existingCart.save()
        } else {
            // Create new abandoned cart record
            await AbandonedCart.create({
                userId: user?.id,
                guestId: guestId,
                email: email || user?.emailAddresses?.[0]?.emailAddress,
                userName: userName || user?.fullName,
                cartItems: cartItems,
                totalValue: totalValue,
                status: 'abandoned',
                abandonedAt: new Date(),
                lastUpdatedAt: new Date(),
                recoveryEmailSent: false,
                ipAddress: ipAddress,
                userAgent: userAgent,
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Cart tracked successfully'
        })

    } catch (error) {
        console.error('Error tracking cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to track cart' },
            { status: 500 }
        )
    }
}
