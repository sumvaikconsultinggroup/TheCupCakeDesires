/**
 * Every order is stored once, with a source the shop can count:
 * website checkout (online), a phone call, or an email.
 * Orders saved before this field existed count as online.
 */

export const ORDER_SOURCES = ['online', 'phone', 'email'] as const

export type OrderSource = (typeof ORDER_SOURCES)[number]

export function normalizeOrderSource(value: unknown): OrderSource {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'phone' || raw === 'email') return raw
  return 'online'
}

export function orderSourceLabel(source: OrderSource | unknown): string {
  const value = normalizeOrderSource(source)
  if (value === 'phone') return 'Phone'
  if (value === 'email') return 'Email'
  return 'Online'
}

export function isOfflineOrderSource(source: unknown): boolean {
  const value = normalizeOrderSource(source)
  return value === 'phone' || value === 'email'
}

/** Mongo filter. Missing / blank source is online. Unknown values match nothing extra. */
export function orderSourceQuery(source: string | null | undefined): Record<string, unknown> | null {
  const raw = String(source ?? '')
    .trim()
    .toLowerCase()
  if (raw === 'phone' || raw === 'email') return { source: raw }
  if (raw === 'online') {
    return {
      $or: [{ source: 'online' }, { source: { $exists: false } }, { source: null }, { source: '' }],
    }
  }
  return null
}

/**
 * AND a source filter onto an existing query.
 * Search already uses `$or`, so an online filter (also `$or`) is combined with `$and`.
 */
export function mergeOrderSourceFilter(query: Record<string, unknown>, source: string | null | undefined): void {
  const clause = orderSourceQuery(source)
  if (!clause) return
  if (query.$or && clause.$or) {
    const and = Array.isArray(query.$and) ? [...query.$and] : []
    and.push({ $or: query.$or }, clause)
    delete query.$or
    query.$and = and
    return
  }
  Object.assign(query, clause)
}

export function paymentMethodLabel(method?: string | null): string {
  const value = String(method ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  if (!value || value === 'stripe' || value === 'prepaid') return 'Stripe'
  if (value === 'cash') return 'Cash'
  if (value === 'bank_transfer') return 'Bank transfer'
  if (value === 'card') return 'Card'
  if (value === 'unpaid') return 'Unpaid'
  return String(method).trim()
}

export function offlinePaymentMethodLabel(method: string): 'Cash' | 'Bank transfer' | 'Card' | null {
  const value = method.trim().toLowerCase().replace(/\s+/g, '_')
  if (value === 'cash') return 'Cash'
  if (value === 'bank_transfer') return 'Bank transfer'
  if (value === 'card') return 'Card'
  return null
}
