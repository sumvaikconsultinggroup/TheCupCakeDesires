import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ActiveSession from '@/models/ActiveSession'

/**
 * GET /api/admin/analytics/active-sessions
 * Fetch currently active users and sessions
 */
export async function GET(request: NextRequest) {
    try {
        await connectDb()

        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000) // 60 seconds = active threshold

        // Mark stale sessions as inactive (no activity in last 60 seconds)
        await ActiveSession.updateMany(
            {
                lastActivityAt: { $lt: sixtySecondsAgo },
                isActive: true
            },
            {
                $set: { isActive: false }
            }
        )

        // Fetch active sessions
        const activeSessions = await ActiveSession
            .find({ isActive: true })
            .sort({ lastActivityAt: -1 })
            .lean()

        // Calculate stats
        const activeUsersCount = activeSessions.length
        const activeCartsCount = activeSessions.filter(s => s.cartItems.length > 0).length
        const totalCartValue = activeSessions.reduce((sum, s) => sum + s.cartValue, 0)

        // Group by page
        const pageViews = activeSessions.reduce((acc: Record<string, number>, session) => {
            const page = session.currentPage || 'unknown'
            acc[page] = (acc[page] || 0) + 1
            return acc
        }, {})

        return NextResponse.json({
            success: true,
            data: {
                activeUsersCount,
                activeCartsCount,
                totalCartValue,
                sessions: activeSessions.map(s => ({
                    sessionId: s.sessionId,
                    userId: s.userId,
                    userName: s.userName,
                    email: s.email,
                    currentPage: s.currentPage,
                    cartValue: s.cartValue,
                    cartItemsCount: s.cartItems.length,
                    lastActivityAt: s.lastActivityAt,
                    timeOnSite: Math.floor((new Date().getTime() - new Date(s.startedAt).getTime()) / 1000), // seconds
                })),
                pageViews,
            },
        })
    } catch (error) {
        console.error('Error fetching active sessions:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch active sessions' },
            { status: 500 }
        )
    }
}
