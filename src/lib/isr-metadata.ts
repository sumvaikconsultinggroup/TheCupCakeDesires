/**
 * Fail-closed checks for ISR metadata regeneration.
 *
 * A thrown error during revalidate keeps the last good page cached.
 * Returning a bare brand title (or missing description/canonical) is what
 * Google indexed on 10 Nov when Mongo blipped.
 */

const BARE_BRAND = /^the cupcake desire$/i

export function isDegradedStorefrontTitle(title: string | undefined | null): boolean {
  const t = typeof title === 'string' ? title.trim() : ''
  if (!t) return true
  if (BARE_BRAND.test(t)) return true
  if (t === 'Product Not Found' || t === 'Combo Not Found') return true
  return false
}

export function assertCompleteStorefrontMetadata(
  meta: {
    title?: string | null
    description?: string | null
    canonical?: string | null
  },
  context: string
): { title: string; description: string; canonical: string } {
  const title = typeof meta.title === 'string' ? meta.title.trim() : ''
  const description = typeof meta.description === 'string' ? meta.description.trim() : ''
  const canonical = typeof meta.canonical === 'string' ? meta.canonical.trim() : ''

  if (isDegradedStorefrontTitle(title)) {
    throw new Error(`[${context}] refusing degraded title ${JSON.stringify(title)}`)
  }
  if (!description || description.length < 40) {
    throw new Error(`[${context}] refusing degraded description`)
  }
  if (!canonical || canonical === '/') {
    throw new Error(`[${context}] refusing degraded canonical ${JSON.stringify(canonical)}`)
  }

  return { title, description, canonical }
}

/** True when a Metadata-like object would publish a degraded head. */
export function metadataLooksDegraded(meta: {
  title?: unknown
  description?: unknown
  alternates?: { canonical?: unknown }
}): boolean {
  const title = typeof meta.title === 'string' ? meta.title : ''
  const description = typeof meta.description === 'string' ? meta.description : ''
  const canonical =
    typeof meta.alternates?.canonical === 'string' ? meta.alternates.canonical : ''
  try {
    assertCompleteStorefrontMetadata({ title, description, canonical }, 'check')
    return false
  } catch {
    return true
  }
}
