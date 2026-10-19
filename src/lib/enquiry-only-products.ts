/**
 * Products sold by custom quote only (no cart / stock / quantity).
 * Match wedding cupcake tier handles specifically — other wedding boxes stay buyable.
 */
const ENQUIRY_ONLY_HANDLES = new Set(['wedding-cupcake-tier'])

export function isEnquiryOnlyProduct(handle?: string | null): boolean {
  if (!handle) return false
  const h = handle.trim().toLowerCase()
  if (ENQUIRY_ONLY_HANDLES.has(h)) return true
  // Size / colour variants that share the same base handle prefix
  return h.startsWith('wedding-cupcake-tier-')
}

/** Wedding box and wedding tier product pages (shared policy treatment). */
export function isWeddingProduct(handle?: string | null): boolean {
  if (!handle) return false
  return /wedding/i.test(handle.trim())
}
