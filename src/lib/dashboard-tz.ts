/**
 * Melbourne-aware date bucketing helpers.
 *
 * The server (Vercel) runs in UTC. Naively calling date-fns `startOfDay`,
 * `startOfMonth`, etc. produces UTC boundaries — so an order placed at
 * 8:00 AM AEDT on Mar 5 is bucketed into Mar 4 (because it is 21:00 UTC on
 * Mar 4). For an Australian e-commerce admin dashboard we want every boundary
 * computed against Australia/Melbourne wall-clock (UTC+10, UTC+11 during
 * daylight saving — the per-date offset is resolved via Intl so DST
 * transitions are handled correctly).
 *
 * These helpers return native JS `Date` objects whose `.getTime()` (UTC ms)
 * corresponds to the Melbourne wall-clock boundary, so they can be passed
 * straight to MongoDB queries on `createdAt`.
 *
 * NOTE: the exported `ist*` names are kept for backwards compatibility with
 * existing imports (dashboard-actions, dashboard API route) — internally
 * everything is Australia/Melbourne.
 */

const MELBOURNE_TZ = 'Australia/Melbourne'
const MS_PER_MIN = 60_000
const MS_PER_DAY = 24 * 60 * 60 * 1000

// Reused formatter — `shortOffset` yields "GMT+10" / "GMT+11" per instant.
const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: MELBOURNE_TZ,
  timeZoneName: 'shortOffset',
})

/** Zone offset (minutes east of UTC) for Melbourne at the given instant — DST-aware. */
function melbourneOffsetMin(d: Date): number {
  const tzName = offsetFormatter.formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || 'GMT+10'
  const m = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!m) return 600 // AEST fallback (UTC+10)
  const sign = m[1] === '-' ? -1 : 1
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0))
}

/** Convert a UTC Date to a "shifted" Date whose UTC components reflect Melbourne wall clock. */
function toMelbourneShifted(d: Date): Date {
  return new Date(d.getTime() + melbourneOffsetMin(d) * MS_PER_MIN)
}

/**
 * Convert Melbourne wall-clock components (Y, M, D, h, m, s, ms) back to a real UTC Date.
 * Two-pass so the offset is evaluated at the target instant (handles DST edges).
 */
function fromMelbourneWallClock(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const wallMs = Date.UTC(year, month, day, hour, minute, second, ms)
  // First guess using the offset in effect at the wall-clock instant read as UTC…
  let utcMs = wallMs - melbourneOffsetMin(new Date(wallMs)) * MS_PER_MIN
  // …then re-evaluate at the computed instant and correct if a DST boundary was crossed.
  const offset2 = melbourneOffsetMin(new Date(utcMs))
  utcMs = wallMs - offset2 * MS_PER_MIN
  return new Date(utcMs)
}

export function istStartOfDay(d: Date): Date {
  const mel = toMelbourneShifted(d)
  return fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth(), mel.getUTCDate())
}

export function istEndOfDay(d: Date): Date {
  // Start of the NEXT Melbourne day minus 1 ms (a DST day can be 23 or 25 h long).
  const mel = toMelbourneShifted(d)
  const nextStart = fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth(), mel.getUTCDate() + 1)
  return new Date(nextStart.getTime() - 1)
}

export function istStartOfMonth(d: Date): Date {
  const mel = toMelbourneShifted(d)
  return fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth(), 1)
}

export function istEndOfMonth(d: Date): Date {
  const mel = toMelbourneShifted(d)
  // Start of next month minus 1 ms, in Melbourne wall clock.
  const nextMonthStart = fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth() + 1, 1)
  return new Date(nextMonthStart.getTime() - 1)
}

export function istStartOfYear(d: Date): Date {
  const mel = toMelbourneShifted(d)
  return fromMelbourneWallClock(mel.getUTCFullYear(), 0, 1)
}

export function istSubDays(d: Date, n: number): Date {
  // Calendar arithmetic in Melbourne wall clock (not fixed 24 h) so DST
  // transitions don't drift the wall-clock time.
  const mel = toMelbourneShifted(d)
  return fromMelbourneWallClock(
    mel.getUTCFullYear(),
    mel.getUTCMonth(),
    mel.getUTCDate() - n,
    mel.getUTCHours(),
    mel.getUTCMinutes(),
    mel.getUTCSeconds(),
    mel.getUTCMilliseconds(),
  )
}

export function istSubMonths(d: Date, n: number): Date {
  const mel = toMelbourneShifted(d)
  return fromMelbourneWallClock(
    mel.getUTCFullYear(),
    mel.getUTCMonth() - n,
    mel.getUTCDate(),
    mel.getUTCHours(),
    mel.getUTCMinutes(),
    mel.getUTCSeconds(),
    mel.getUTCMilliseconds(),
  )
}

/** Format a Date in Melbourne time using a coarse bucket label. */
export function istFormatLabel(d: Date, kind: 'hour' | 'day' | 'week' | 'month'): string {
  const mel = toMelbourneShifted(d)
  const Y = mel.getUTCFullYear()
  const M = mel.getUTCMonth()
  const D = mel.getUTCDate()
  const H = mel.getUTCHours()
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][M]
  switch (kind) {
    case 'hour':
      return `${String(H).padStart(2, '0')}:00`
    case 'day':
      return `${monthShort} ${String(D).padStart(2, '0')}`
    case 'week': {
      // ISO week number using Melbourne wall clock
      const target = new Date(Date.UTC(Y, M, D))
      const dayNr = (target.getUTCDay() + 6) % 7
      target.setUTCDate(target.getUTCDate() - dayNr + 3)
      const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
      const diff = (target.getTime() - firstThursday.getTime()) / MS_PER_DAY
      const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
      return `Week ${week}`
    }
    case 'month':
      return `${monthShort} ${Y}`
  }
}

/** Enumerate Melbourne day buckets between [start,end] (inclusive). */
export function istEachDay(start: Date, end: Date): Date[] {
  const out: Date[] = []
  let cur = istStartOfDay(start)
  const last = istStartOfDay(end)
  while (cur.getTime() <= last.getTime()) {
    out.push(cur)
    const mel = toMelbourneShifted(cur)
    cur = fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth(), mel.getUTCDate() + 1)
  }
  return out
}

/** Enumerate Melbourne week buckets (Monday-anchored) between [start,end]. */
export function istEachWeek(start: Date, end: Date): Date[] {
  const out: Date[] = []
  // Anchor to Monday in Melbourne wall clock.
  const startMel = toMelbourneShifted(start)
  const dayNr = (startMel.getUTCDay() + 6) % 7
  let cur = istStartOfDay(istSubDays(start, dayNr))
  const last = istStartOfDay(end)
  while (cur.getTime() <= last.getTime()) {
    out.push(cur)
    const mel = toMelbourneShifted(cur)
    cur = fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth(), mel.getUTCDate() + 7)
  }
  return out
}

/** Enumerate Melbourne month buckets between [start,end]. */
export function istEachMonth(start: Date, end: Date): Date[] {
  const out: Date[] = []
  let cur = istStartOfMonth(start)
  const lastMonthStart = istStartOfMonth(end)
  while (cur.getTime() <= lastMonthStart.getTime()) {
    out.push(cur)
    const mel = toMelbourneShifted(cur)
    cur = fromMelbourneWallClock(mel.getUTCFullYear(), mel.getUTCMonth() + 1, 1)
  }
  return out
}

// =====================================================================
// Period range resolvers (must live OUTSIDE 'use server' files because
// they are sync — Server Action files require every export to be async).
// =====================================================================

import { parseISO } from 'date-fns'

export function getDateRange(
  period: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case 'today':
      return { start: istStartOfDay(now), end: istEndOfDay(now) }
    case 'yesterday': {
      const y = istSubDays(now, 1)
      return { start: istStartOfDay(y), end: istEndOfDay(y) }
    }
    case 'last7days':
      return { start: istStartOfDay(istSubDays(now, 6)), end: istEndOfDay(now) }
    case 'last30days':
      return { start: istStartOfDay(istSubDays(now, 29)), end: istEndOfDay(now) }
    case 'thisMonth':
      return { start: istStartOfMonth(now), end: istEndOfDay(now) }
    case 'lastMonth': {
      const lm = istSubDays(istStartOfMonth(now), 1)
      return { start: istStartOfMonth(lm), end: istEndOfMonth(lm) }
    }
    case 'thisYear':
      return { start: istStartOfYear(now), end: istEndOfDay(now) }
    case 'custom':
      if (startDate && endDate) {
        return { start: istStartOfDay(parseISO(startDate)), end: istEndOfDay(parseISO(endDate)) }
      }
      return { start: istStartOfDay(istSubDays(now, 29)), end: istEndOfDay(now) }
    default:
      return { start: istStartOfDay(istSubDays(now, 29)), end: istEndOfDay(now) }
  }
}

export function getPreviousPeriodRange(
  start: Date,
  end: Date,
  period: string
): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case 'today': {
      const y = istSubDays(now, 1)
      return { start: istStartOfDay(y), end: istEndOfDay(y) }
    }
    case 'yesterday': {
      const dby = istSubDays(now, 2)
      return { start: istStartOfDay(dby), end: istEndOfDay(dby) }
    }
    case 'last7days':
      return { start: istStartOfDay(istSubDays(now, 13)), end: istEndOfDay(istSubDays(now, 7)) }
    case 'last30days':
      return { start: istStartOfDay(istSubDays(now, 59)), end: istEndOfDay(istSubDays(now, 30)) }
    case 'thisMonth': {
      const lm = istSubDays(istStartOfMonth(now), 1)
      return { start: istStartOfMonth(lm), end: istEndOfMonth(lm) }
    }
    case 'lastMonth': {
      const twoMonthsAgo = istSubDays(istStartOfMonth(istSubDays(istStartOfMonth(now), 1)), 1)
      return { start: istStartOfMonth(twoMonthsAgo), end: istEndOfMonth(twoMonthsAgo) }
    }
    case 'thisYear': {
      const lastYear = toMelbourneShifted(now).getUTCFullYear() - 1
      return {
        start: fromMelbourneWallClock(lastYear, 0, 1),
        end: fromMelbourneWallClock(lastYear, 11, 31, 23, 59, 59, 999),
      }
    }
    case 'custom':
    default: {
      const customDuration = end.getTime() - start.getTime() + 24 * 60 * 60 * 1000
      return {
        start: new Date(start.getTime() - customDuration),
        end: new Date(start.getTime() - 1),
      }
    }
  }
}
