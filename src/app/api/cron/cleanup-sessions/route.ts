import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ActiveSession from '@/models/ActiveSession'

/** Sessions with no heartbeat for this long are marked inactive. */
const INACTIVE_AFTER_MS = 5 * 60 * 1000

/**
 * POST /api/cron/cleanup-sessions
 * Marks stale ActiveSession docs inactive. Replaces the per-heartbeat
 * global updateMany that was inflating Fluid provisioned memory.
 */
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()

    const cutoff = new Date(Date.now() - INACTIVE_AFTER_MS)
    const result = await ActiveSession.updateMany(
      { lastActivityAt: { $lt: cutoff }, isActive: true },
      { $set: { isActive: false } }
    )

    return NextResponse.json({
      success: true,
      markedInactive: result.modifiedCount ?? 0,
    })
  } catch (error) {
    console.error('[cron/cleanup-sessions]', error)
    return NextResponse.json({ success: false, message: 'Cleanup failed' }, { status: 500 })
  }
}

/** Vercel Cron sends GET by default for some schedules — accept both. */
export async function GET(request: NextRequest) {
  return POST(request)
}
