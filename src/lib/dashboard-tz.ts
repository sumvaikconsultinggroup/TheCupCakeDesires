/**
 * IST-aware date bucketing helpers.
 *
 * The server (Vercel) runs in UTC. Naively calling date-fns `startOfDay`,
 * `startOfMonth`, etc. produces UTC boundaries — so an order placed at
 * 2:00 AM IST on Mar 5 is bucketed into Mar 4 (because it is 20:30 UTC on
 * Mar 4). For an Indian e-commerce admin dashboard we want every boundary
 * computed against IST wall-clock (UTC+5:30, no DST).
 *
 * These helpers return native JS `Date` objects whose `.getTime()` (UTC ms)
 * corresponds to the IST wall-clock boundary, so they can be passed straight
 * to MongoDB queries on `createdAt`.
 */

const IST_OFFSET_MIN = 330 // UTC+5:30
const MS_PER_MIN = 60_000
const MS_PER_DAY = 24 * 60 * 60 * 1000
const IST_OFFSET_MS = IST_OFFSET_MIN * MS_PER_MIN

/** Convert a UTC Date to a "shifted" Date whose UTC components reflect IST wall clock. */
function toIstShifted(d: Date): Date {
  return new Date(d.getTime() + IST_OFFSET_MS)
}

/** Convert IST wall-clock components (Y, M, D, h, m, s, ms) back to a real UTC Date. */
function fromIstWallClock(year: number, month: number, day: number, hour = 0, minute = 0, second = 0, ms = 0): Date {
  const utcMs = Date.UTC(year, month, day, hour, minute, second, ms) - IST_OFFSET_MS
  return new Date(utcMs)
}

export function istStartOfDay(d: Date): Date {
  const ist = toIstShifted(d)
  return fromIstWallClock(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())
}

export function istEndOfDay(d: Date): Date {
  const start = istStartOfDay(d)
  return new Date(start.getTime() + MS_PER_DAY - 1)
}

export function istStartOfMonth(d: Date): Date {
  const ist = toIstShifted(d)
  return fromIstWallClock(ist.getUTCFullYear(), ist.getUTCMonth(), 1)
}

export function istEndOfMonth(d: Date): Date {
  const ist = toIstShifted(d)
  // Day 0 of next month == last day of current month, in IST wall clock.
  const lastDay = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() + 1, 0)).getUTCDate()
  const start = fromIstWallClock(ist.getUTCFullYear(), ist.getUTCMonth(), lastDay)
  return new Date(start.getTime() + MS_PER_DAY - 1)
}

export function istStartOfYear(d: Date): Date {
  const ist = toIstShifted(d)
  return fromIstWallClock(ist.getUTCFullYear(), 0, 1)
}

export function istSubDays(d: Date, n: number): Date {
  return new Date(d.getTime() - n * MS_PER_DAY)
}

export function istSubMonths(d: Date, n: number): Date {
  const ist = toIstShifted(d)
  return fromIstWallClock(
    ist.getUTCFullYear(),
    ist.getUTCMonth() - n,
    ist.getUTCDate(),
    ist.getUTCHours(),
    ist.getUTCMinutes(),
    ist.getUTCSeconds(),
    ist.getUTCMilliseconds(),
  )
}

/** Format a Date in IST using a coarse bucket label. */
export function istFormatLabel(d: Date, kind: 'hour' | 'day' | 'week' | 'month'): string {
  const ist = toIstShifted(d)
  const Y = ist.getUTCFullYear()
  const M = ist.getUTCMonth()
  const D = ist.getUTCDate()
  const H = ist.getUTCHours()
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][M]
  switch (kind) {
    case 'hour':
      return `${String(H).padStart(2, '0')}:00`
    case 'day':
      return `${monthShort} ${String(D).padStart(2, '0')}`
    case 'week': {
      // ISO week number using IST wall clock
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

/** Enumerate IST day buckets between [start,end] (inclusive). */
export function istEachDay(start: Date, end: Date): Date[] {
  const out: Date[] = []
  let cur = istStartOfDay(start)
  const last = istStartOfDay(end)
  while (cur.getTime() <= last.getTime()) {
    out.push(cur)
    cur = new Date(cur.getTime() + MS_PER_DAY)
  }
  return out
}

/** Enumerate IST week buckets (Monday-anchored) between [start,end]. */
export function istEachWeek(start: Date, end: Date): Date[] {
  const out: Date[] = []
  // Anchor to Monday in IST.
  const startIst = toIstShifted(start)
  const dayNr = (startIst.getUTCDay() + 6) % 7
  let cur = new Date(istStartOfDay(start).getTime() - dayNr * MS_PER_DAY)
  const last = istStartOfDay(end)
  while (cur.getTime() <= last.getTime()) {
    out.push(cur)
    cur = new Date(cur.getTime() + 7 * MS_PER_DAY)
  }
  return out
}

/** Enumerate IST month buckets between [start,end]. */
export function istEachMonth(start: Date, end: Date): Date[] {
  const out: Date[] = []
  let cur = istStartOfMonth(start)
  const lastMonthStart = istStartOfMonth(end)
  while (cur.getTime() <= lastMonthStart.getTime()) {
    out.push(cur)
    const ist = toIstShifted(cur)
    cur = fromIstWallClock(ist.getUTCFullYear(), ist.getUTCMonth() + 1, 1)
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
      const lastYear = now.getFullYear() - 1
      const startUtcMs = Date.UTC(lastYear, 0, 1) - 330 * 60_000
      const endUtcMs = Date.UTC(lastYear, 11, 31, 23, 59, 59, 999) - 330 * 60_000
      return { start: new Date(startUtcMs), end: new Date(endUtcMs) }
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
