/**
 * Delivery rules for The Cupcake Desire — shared by the checkout UI (client) and
 * the order API (server) so the lead-time policy and the serviceable-area list
 * live in exactly one place.
 *
 * Two rules are enforced:
 *   1. Serviceable area — a customer's postcode must match SERVICEABLE_EXACT_POSTCODES
 *      or fall inside one of SERVICEABLE_RANGES (shared by checkout UI + create-order).
 *   2. Lead time — everything is baked to order, and how much notice we need
 *      depends on what is in the basket (see LEAD_DAYS_* below).
 *
 * The lead-time tiers:
 *   - A single box on its own ....... 1 day  (next-day delivery)
 *   - Anything else ................. 2 days
 *   - Any cake in the basket ........ 3 days
 *
 * A mixed basket always takes the LONGEST applicable tier, because the whole
 * order is baked and delivered together — one cake pushes the order to 3 days.
 *
 * Orders placed after ORDER_CUTOFF_HOUR count as the next day, so a box ordered
 * at 11pm is not treated as if it had reached the kitchen in time to bake.
 */

// Bakery timezone — lead-time maths is anchored here, not the visitor's browser
// timezone, so the lead-time promise counts bakery days.
export const BAKERY_TIMEZONE = 'Australia/Melbourne'

/**
 * Order-by cutoff, as an hour (0-23) in the bakery timezone. Orders placed at or
 * after this hour count as having landed the following day, protecting the
 * morning bake schedule from a late-night "next day" order.
 */
export const ORDER_CUTOFF_HOUR = 14 // 2pm Melbourne time

/** Lead-time tiers, in days. See the file header for how these are chosen. */
export const LEAD_DAYS_SINGLE_BOX = 1
export const LEAD_DAYS_STANDARD = 2
export const LEAD_DAYS_CAKE = 3

/** The longest notice we ever ask for — used as the safe fallback. */
export const MAX_LEAD_DAYS = LEAD_DAYS_CAKE

/**
 * Product categories that need full cake notice. Cake Slices sit here too: the
 * slices are cut and finished from a baked cake, and the corporate ones need
 * logo artwork printed and set before assembly.
 */
export const CAKE_CATEGORIES: readonly string[] = [
  'Cakes',
  'Special Occasion Cakes',
  'Dress Cakes',
  'Custom Cakes',
  'Cake Slices',
]

/** Categories that qualify as "a box" for the single-box next-day tier. */
export const BOX_CATEGORIES: readonly string[] = ['Cupcake Boxes', 'Themed Boxes']

/**
 * Everything else we knowingly sell. Listed explicitly so that an unrecognised
 * category fails SAFE (to the 3-day cake tier) rather than silently being sold
 * as next-day. If you add a product category, classify it here.
 */
export const STANDARD_CATEGORIES: readonly string[] = [
  'Giant Cupcakes',
  'Macarons',
  'Custom Orders',
  'Gift Voucher',
]

/**
 * Greater Melbourne metropolitan postcode ranges (VIC), inclusive [min, max].
 * The kitchen sits in Narre Warren (3805). Edit these ranges to expand or shrink
 * the delivery footprint — this is the single source of truth together with
 * SERVICEABLE_EXACT_POSTCODES below.
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

/**
 * Explicitly allowlisted 4-digit postcodes (kept as strings so leading-zero
 * codes like 0820 stay correct). Used for one-off / out-of-range additions that
 * must be accepted on both the checkout UI and create-order API.
 *
 * Checked BEFORE ranges — if a code is here, it is serviceable even when it
 * falls outside SERVICEABLE_RANGES.
 */
export const SERVICEABLE_EXACT_POSTCODES: ReadonlySet<string> = new Set([
  '3133',
  '2281',
  '3168',
  '3806',
  '3178',
  '3810',
  '3175',
  '3977',
  '3121',
  '3138',
  '3173',
  '3008',
  '0820',
  '3152',
  '3350',
  '3818',
  '3809',
  '6164',
  '3031',
  '3072',
  '3124',
  '2000',
  '3978',
  '3207',
])

/** True when `postcode` is a 4-digit Australian postcode we deliver to. */
export function isServiceablePostcode(postcode: string | number | null | undefined): boolean {
  if (postcode === null || postcode === undefined) return false
  // Preserve leading zeros (e.g. 0820) — pad numeric inputs back to 4 digits.
  const raw =
    typeof postcode === 'number'
      ? String(Math.trunc(postcode)).padStart(4, '0')
      : String(postcode).trim()
  if (!/^\d{4}$/.test(raw)) return false
  if (SERVICEABLE_EXACT_POSTCODES.has(raw)) return true
  const n = Number(raw)
  return SERVICEABLE_RANGES.some(([min, max]) => n >= min && n <= max)
}

/* ------------------------------- Lead time -------------------------------- */

/** The shape the lead-time rules need from a basket line. */
export type LeadTimeItem = {
  category?: string | null
  quantity?: number | null
}

const normalise = (value: string | null | undefined) => String(value ?? '').trim().toLowerCase()
const toSet = (list: readonly string[]) => new Set(list.map((c) => c.toLowerCase()))

const CAKE_SET = toSet(CAKE_CATEGORIES)
const BOX_SET = toSet(BOX_CATEGORIES)
const STANDARD_SET = toSet(STANDARD_CATEGORIES)

/** Which tier a single category falls into. Unknown categories fail safe. */
export function tierForCategory(category: string | null | undefined): 'cake' | 'box' | 'standard' {
  const c = normalise(category)
  if (CAKE_SET.has(c)) return 'cake'
  if (BOX_SET.has(c)) return 'box'
  if (STANDARD_SET.has(c)) return 'standard'
  // Unrecognised or missing — assume the longest notice rather than promising a
  // turnaround the kitchen may not be able to meet.
  return 'cake'
}

/**
 * How many days' notice this basket needs. An empty or unreadable basket falls
 * back to the longest tier, so we never under-quote by accident.
 */
export function leadDaysForItems(items: readonly LeadTimeItem[] | null | undefined): number {
  if (!Array.isArray(items) || items.length === 0) return MAX_LEAD_DAYS

  let totalQty = 0
  let hasCake = false
  let everyLineIsABox = true

  for (const item of items) {
    const tier = tierForCategory(item?.category)
    const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1))
    totalQty += qty
    if (tier === 'cake') hasCake = true
    if (tier !== 'box') everyLineIsABox = false
  }

  // Any cake anywhere in the basket sets the whole order to the cake tier.
  if (hasCake) return LEAD_DAYS_CAKE

  // Next-day is reserved for exactly one box — not one line of several boxes.
  if (everyLineIsABox && totalQty === 1) return LEAD_DAYS_SINGLE_BOX

  return LEAD_DAYS_STANDARD
}

/** Today's calendar date in the bakery timezone as `YYYY-MM-DD`. */
export function bakeryTodayISO(): string {
  // en-CA formats as YYYY-MM-DD, which sorts lexicographically as a real date.
  return new Intl.DateTimeFormat('en-CA', { timeZone: BAKERY_TIMEZONE }).format(new Date())
}

/** Current hour (0-23) in the bakery timezone. */
export function bakeryHour(): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BAKERY_TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  return Number.isFinite(hour) ? hour : 0
}

/** Add `days` to a `YYYY-MM-DD` string, returning a `YYYY-MM-DD` string. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/**
 * The day an order placed right now counts against. Past the cutoff the order
 * is treated as landing tomorrow, so lead time is measured from then.
 */
export function effectiveOrderDateISO(): string {
  const today = bakeryTodayISO()
  return bakeryHour() >= ORDER_CUTOFF_HOUR ? addDaysISO(today, 1) : today
}

/** True when the 2pm cutoff has already passed in the bakery's timezone. */
export function isAfterCutoff(): boolean {
  return bakeryHour() >= ORDER_CUTOFF_HOUR
}

/**
 * Earliest date a customer may choose for this basket, as `YYYY-MM-DD`. Use for
 * the date input's `min` attribute and for server-side validation.
 */
export function minDeliveryDateISO(items?: readonly LeadTimeItem[] | null): string {
  return addDaysISO(effectiveOrderDateISO(), leadDaysForItems(items))
}

/**
 * True when `dateISO` is a real `YYYY-MM-DD` calendar date. Says nothing about
 * lead time — use for a cheap shape check before the basket is known.
 */
export function isRealCalendarDate(dateISO: string | null | undefined): boolean {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false
  // Reject impossible calendar dates (e.g. 2026-02-31) — round-tripping through
  // Date normalises them, so compare back to the input.
  const [y, m, d] = dateISO.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/**
 * True when `dateISO` is a valid delivery date for this basket: a real calendar
 * date, on or after the basket's minimum lead-time date, with no upper bound.
 */
export function isValidDeliveryDate(
  dateISO: string | null | undefined,
  items?: readonly LeadTimeItem[] | null
): boolean {
  if (!isRealCalendarDate(dateISO)) return false
  return (dateISO as string) >= minDeliveryDateISO(items)
}

/**
 * Customer-facing phrase for a lead time, e.g. "next-day delivery" or
 * "2 days' notice". Keeps every surface wording the rule the same way.
 */
export function leadTimeLabel(days: number): string {
  if (days <= 1) return 'next-day delivery'
  return `${days} days’ notice`
}

/** One-line explanation of why this basket needs the notice it does. */
export function leadTimeReason(days: number): string {
  if (days <= LEAD_DAYS_SINGLE_BOX) return 'A single box on its own can be delivered as soon as tomorrow.'
  if (days >= LEAD_DAYS_CAKE) return 'Cakes are baked and finished to order, so they need 3 days’ notice.'
  return 'Baked to order, so we need 2 days’ notice on this order.'
}
