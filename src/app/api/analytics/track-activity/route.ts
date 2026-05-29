import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ActiveSession from '@/models/ActiveSession'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/analytics/track-activity
 * Update user activity and session tracking
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { sessionId, page, cartItems } = await request.json()

        if (!sessionId) {
            return NextResponse.json(
                { success: false, message: 'Session ID is required' },
                { status: 400 }
            )
        }

        const user = await currentUser()
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        const guestId = user ? undefined : `guest_${Buffer.from(ipAddress).toString('base64').substring(0, 16)}`

        // Calculate cart value
        const cartValue = cartItems?.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        ) || 0

        // Find existing session
        const existingSession = await ActiveSession.findOne({ sessionId })

        if (existingSession) {
            // Update existing session
            existingSession.currentPage = page
            existingSession.cartItems = cartItems || []
            existingSession.cartValue = cartValue
            existingSession.lastActivityAt = new Date()
            existingSession.isActive = true
            existingSession.userId = user?.id || existingSession.userId
            existingSession.userName = user?.fullName || existingSession.userName
            existingSession.email = user?.emailAddresses?.[0]?.emailAddress || existingSession.email
            await existingSession.save()
        } else {
            // Create new session
            await ActiveSession.create({
                sessionId,
                userId: user?.id,
                guestId: guestId,
                userName: user?.fullName,
                email: user?.emailAddresses?.[0]?.emailAddress,
                ipAddress: ipAddress,
                userAgent: userAgent,
                currentPage: page,
                cartItems: cartItems || [],
                cartValue: cartValue,
                lastActivityAt: new Date(),
                startedAt: new Date(),
                isActive: true,
            })
        }

        // Mark sessions inactive if no activity for >60 seconds (user's requirement)
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000)
        await ActiveSession.updateMany(
            {
                lastActivityAt: { $lt: sixtySecondsAgo },
                isActive: true
            },
            {
                $set: { isActive: false }
            }
        )

        return NextResponse.json({
            success: true,
            message: 'Activity tracked successfully'
        })

    } catch (error) {
        console.error('Error tracking activity:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to track activity' },
            { status: 500 }
        )
    }
}
