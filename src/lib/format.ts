/**
 * Formatting utilities shared across The Cupcake Desire admin.
 */

/**
 * Format a number as Australian Dollars ($).
 * Function kept as `formatINR` for backwards compatibility with admin callers.
 * Examples:
 *   formatINR(1234.5)  → "$1,234.50"
 *   formatINR(0)       → "$0.00"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string as a short Australian-locale date + time.
 * Function kept as `formatDateIN` for backwards compatibility with admin callers.
 */
export function formatDateIN(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Relative time: "3 days ago", "2h ago", "just now"
 */
export function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

/**
 * Best-effort customer name from order.
 */
export function getCustomerName(order: {
  customer?: { firstName?: string; lastName?: string; name?: string }
  customerName?: string
  userId?: string
}): string {
  if (order.customerName) return order.customerName
  const c = order.customer
  if (c) {
    const full = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
    if (full) return full
    if (c.name) return c.name
  }
  if (order.userId?.startsWith('guest_')) return 'Guest'
  return 'Unknown'
}

/**
 * Best-effort customer phone from order.
 */
export function getCustomerPhone(order: {
  customer?: { phone?: string }
  customerPhone?: string
}): string | null {
  return order.customerPhone ?? order.customer?.phone ?? null
}

/**
 * Truncate ID with ellipsis: "guest_177772abc" -> "guest_177...abc"
 */
export function shortId(id: string, prefixLen = 9, suffixLen = 4): string {
  if (!id || id.length <= prefixLen + suffixLen + 3) return id
  return `${id.slice(0, prefixLen)}...${id.slice(-suffixLen)}`
}

/**
 * Short order number from MongoDB ObjectId or orderId field.
 */
export function shortOrderNumber(order: {
  orderId?: string
  _id?: string
  id?: string
}): string {
  if (order.orderId) {
    const parts = order.orderId.split('-')
    if (parts.length > 1) return `#${parts[parts.length - 1]}`
    return `#${order.orderId.slice(-6)}`
  }
  const id = order._id ?? order.id ?? ''
  return `#${id.slice(-6).toUpperCase()}`
}
