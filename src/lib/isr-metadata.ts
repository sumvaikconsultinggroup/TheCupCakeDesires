/**
 * Fail-closed checks for ISR metadata regeneration.
 *
 * A thrown error during revalidate keeps the last good page cached.
 * Returning a bare brand title (or missing canonical) is what Google
 * indexed on 10 Nov when Mongo blipped.
 *
 * Short CMS descriptions must NOT take a page down: prefer a generated
 * fallback description, and only hard-fail on missing/generic title or
 * missing canonical.
 */

const BARE_BRAND = /^the cupcake desire$/i
const MIN_USEFUL_DESCRIPTION = 40

export function isDegradedStorefrontTitle(title: string | undefined | null): boolean {
  const t = typeof title === 'string' ? title.trim() : ''
  if (!t) return true
  if (BARE_BRAND.test(t)) return true
  if (t === 'Product Not Found' || t === 'Combo Not Found' || t === 'Post Not Found') return true
  return false
}

/** Prefer the first description that is long enough; otherwise any non-empty. */
export function pickMetaDescription(...candidates: Array<string | null | undefined>): string {
  const trimmed = candidates.map((c) => (typeof c === 'string' ? c.trim() : '')).filter(Boolean)
  const useful = trimmed.find((d) => d.length >= MIN_USEFUL_DESCRIPTION)
  return useful || trimmed[0] || ''
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
  // Description length is soft: a short CMS blurb must not 500 a cold ISR page.
  // Callers should run pickMetaDescription(...) first so a generated fallback wins.
  if (!canonical || canonical === '/') {
    throw new Error(`[${context}] refusing degraded canonical ${JSON.stringify(canonical)}`)
  }

  return { title, description, canonical }
}

/** True when a Metadata-like object would publish a degraded head. */
export function metadataLooksDegraded(meta: {
  title?: unknown
  description?: unknown
  canonical?: unknown
  alternates?: { canonical?: unknown } | null
}): boolean {
  const title = typeof meta.title === 'string' ? meta.title : ''
  const canonical =
    typeof meta.canonical === 'string'
      ? meta.canonical
      : typeof meta.alternates?.canonical === 'string'
        ? meta.alternates.canonical
        : ''
  try {
    assertCompleteStorefrontMetadata({ title, description: '', canonical }, 'check')
    return false
  } catch {
    return true
  }
}
