import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/live/events
 * No event-tracking infrastructure exists yet, so this honestly returns an
 * empty list; the Live View page renders its "No recent activity" empty state.
 */
export async function GET() {
    return NextResponse.json({ success: true, events: [] })
}
