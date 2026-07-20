/**
 * Delivery rules for The Cupcake Desire — shared by the checkout UI (client) and
 * the order API (server) so the lead-time policy and the serviceable-area list
 * live in exactly one place.
 *
 * Two rules are enforced:
 *   1. Serviceable area — we self-deliver across Greater Melbourne only. A
 *      customer's postcode must fall inside one of SERVICEABLE_RANGES.
 *   2. Lead time — every box is baked to order, so the earliest delivery date is
 *      MIN_DELIVERY_LEAD_DAYS days from "today" in the bakery's timezone.
 */

// Bakery timezone — lead-time maths is anchored here, not the visitor's browser
// timezone, so the lead-time promise counts bakery days.
export const BAKERY_TIMEZONE = 'Australia/Melbourne'

// Baked-to-order lead time: the soonest a box can be delivered is today + this
// many days. e.g. order on the 6th → the 7th and 8th are blocked → earliest
// delivery is the 9th (a clear 2-day gap before the delivery day).
export const MIN_DELIVERY_LEAD_DAYS = 3

/**
 * Greater Melbourne metropolitan postcode ranges (VIC), inclusive [min, max].
 * The kitchen sits in Narre Warren (3805). Edit these ranges to expand or shrink
 * the delivery footprint — this is the single source of truth.
 */
export const SERVICEABLE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [3000, 3207], // Melbourne CBD + inner/mid suburbs (all directions)
  [3335, 3341], // Melton / Rockbank growth corridor
  [3427, 3442], // Sunbury / Diggers Rest
  [3750, 3811], // Outer north (Whittlesea) + SE growth — incl. Narre Warren 3805, Berwick 3806, Pakenham 3810
  [3910, 3920], // Frankston / Hastings
  [3930, 3944], // Mornington / Mount Eliza
  [3975, 3978], // Lynbrook / Lyndhurst / Cranbourne
  [3980, 3980], // Cranbourne South
]

/** True when `postcode` is a 4-digit Australian postcode we deliver to. */
export function isServiceablePostcode(postcode: string | number | null | undefined): boolean {
  if (postcode === null || postcode === undefined) return false
  const raw = String(postcode).trim()
  if (!/^\d{4}$/.test(raw)) return false
  const n = Number(raw)
  return SERVICEABLE_RANGES.some(([min, max]) => n >= min && n <= max)
}

/** Today's calendar date in the bakery timezone as `YYYY-MM-DD`. */
export function bakeryTodayISO(): string {
  // en-CA formats as YYYY-MM-DD, which sorts lexicographically as a real date.
  return new Intl.DateTimeFormat('en-CA', { timeZone: BAKERY_TIMEZONE }).format(new Date())
}

/** Add `days` to a `YYYY-MM-DD` string, returning a `YYYY-MM-DD` string. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/**
 * Earliest date a customer may choose, as `YYYY-MM-DD`. Use this for the date
 * input's `min` attribute and for server-side validation.
 */
export function minDeliveryDateISO(): string {
  return addDaysISO(bakeryTodayISO(), MIN_DELIVERY_LEAD_DAYS)
}

/**
 * True when `dateISO` (a `YYYY-MM-DD` string) is a valid delivery date: a real
 * date, on or after the minimum lead-time date, with no upper bound.
 */
export function isValidDeliveryDate(dateISO: string | null | undefined): boolean {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false
  // Reject impossible calendar dates (e.g. 2026-02-31) — round-tripping through
  // Date normalises them, so compare back to the input.
  const [y, m, d] = dateISO.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return false
  }
  return dateISO >= minDeliveryDateISO()
}
