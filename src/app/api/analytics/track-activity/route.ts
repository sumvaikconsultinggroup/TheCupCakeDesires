import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ActiveSession from '@/models/ActiveSession'

/**
 * POST /api/analytics/track-activity
 * Lightweight session heartbeat. Stale cleanup runs on a cron, not here.
 * Does not call Clerk — identity comes from the client when signed in.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDb()

    const body = await request.json().catch(() => null)
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''
    const page = typeof body?.page === 'string' ? body.page.slice(0, 500) : '/'

    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'Session ID is required' }, { status: 400 })
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const userId = typeof body?.userId === 'string' ? body.userId : undefined
    const userName = typeof body?.userName === 'string' ? body.userName : undefined
    const email = typeof body?.email === 'string' ? body.email : undefined
    const guestId = userId
      ? undefined
      : `guest_${Buffer.from(ipAddress).toString('base64').substring(0, 16)}`

    const now = new Date()
    const $set: Record<string, unknown> = {
      currentPage: page,
      lastActivityAt: now,
      isActive: true,
      ipAddress,
      userAgent,
    }
    if (userId) $set.userId = userId
    if (userName) $set.userName = userName
    if (email) $set.email = email
    if (guestId) $set.guestId = guestId

    await ActiveSession.findOneAndUpdate(
      { sessionId },
      {
        $set,
        $setOnInsert: {
          sessionId,
          cartItems: [],
          cartValue: 0,
          startedAt: now,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: 'Activity tracked successfully' })
  } catch (error) {
    console.error('Error tracking activity:', error)
    return NextResponse.json({ success: false, message: 'Failed to track activity' }, { status: 500 })
  }
}
