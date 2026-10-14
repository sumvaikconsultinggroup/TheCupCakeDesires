import crypto from 'node:crypto'

import connectDb from '@/lib/mongodb'
import RateLimit from '@/models/RateLimit'

export function clientKey(headers: Headers, scope: string): string {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    'unknown'
  return `${scope}:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)}`
}

/**
 * Counts one hit against every window and reports whether all are still within
 * their limit. Fails open: a database hiccup should not take the feature down.
 */
export async function hitRateLimit(
  key: string,
  windows: { limit: number; seconds: number }[]
): Promise<boolean> {
  try {
    await connectDb()
    const now = Date.now()
    const counts = await Promise.all(
      windows.map(async ({ seconds }) => {
        const bucket = Math.floor(now / (seconds * 1000))
        const filter = { key: `${key}:${seconds}:${bucket}` }
        const update = {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date((bucket + 1) * seconds * 1000) },
        }
        try {
          const doc = await RateLimit.findOneAndUpdate(filter, update, { upsert: true, new: true }).lean<{ count: number }>()
          return doc?.count ?? 0
        } catch (e: any) {
          // Two concurrent upserts on a fresh key: the loser retries as a plain update.
          if (e?.code !== 11000) throw e
          const doc = await RateLimit.findOneAndUpdate(filter, update, { new: true }).lean<{ count: number }>()
          return doc?.count ?? 0
        }
      })
    )
    return counts.every((count, i) => count <= windows[i].limit)
  } catch (e) {
    console.error('[rate-limit] check failed, allowing request:', e)
    return true
  }
}
