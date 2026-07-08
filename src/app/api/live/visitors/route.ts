import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/live/visitors
 * No visitor-tracking infrastructure exists yet, so this honestly returns an
 * empty list; the Live View page renders its "No active visitors" empty state.
 */
export async function GET() {
    return NextResponse.json({ success: true, visitors: [] })
}
