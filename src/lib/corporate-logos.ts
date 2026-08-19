export const MAX_CORPORATE_LOGOS = 4

const CLOUDINARY_LOGO_RE = /^https:\/\/res\.cloudinary\.com\/[\w.-]+\/image\/upload\//

export function isValidCloudinaryLogoUrl(url: string): boolean {
  const trimmed = url.trim()
  return CLOUDINARY_LOGO_RE.test(trimmed) && trimmed.length <= 500
}

/** Normalise logo list from cart/order payloads (new array + legacy single field + variants). */
export function getItemLogoUrls(item: {
  logoUrls?: string[] | null
  logoUrl?: string | null
  variants?: { name?: string; option?: string }[] | null
}): string[] {
  if (Array.isArray(item.logoUrls) && item.logoUrls.length > 0) {
    return item.logoUrls.filter((u) => typeof u === 'string' && u.trim())
  }
  if (typeof item.logoUrl === 'string' && item.logoUrl.trim()) {
    return [item.logoUrl.trim()]
  }
  const fromVariants = (item.variants || [])
    .filter((v) => v?.name && /^Logo(\s+\d+)?$/i.test(v.name) && typeof v.option === 'string' && v.option.trim())
    .sort((a, b) => {
      const num = (name?: string) => {
        const m = name?.match(/^Logo\s+(\d+)$/i)
        return m ? Number(m[1]) : 1
      }
      return num(a.name) - num(b.name)
    })
    .map((v) => v.option!.trim())
  return fromVariants
}

export function itemHasLogos(item: Parameters<typeof getItemLogoUrls>[0]): boolean {
  return getItemLogoUrls(item).length > 0
}

/** Variants stamped on cart lines so distinct logo sets stay separate rows. */
export function logoVariantsFromUrls(urls: string[]): { name: string; option: string }[] {
  return urls.map((url, i) => ({
    name: urls.length === 1 ? 'Logo' : `Logo ${i + 1}`,
    option: url,
  }))
}

/** Validate client cart payload logos; returns sanitised URLs or an error message. */
export function validateCartLogoUrls(
  urls: unknown,
  productTitle: string
): { ok: true; urls: string[] } | { ok: false; message: string } {
  if (urls == null || urls === '') {
    return { ok: true, urls: [] }
  }

  let list: string[] = []
  if (typeof urls === 'string' && urls.trim()) {
    list = [urls.trim()]
  } else if (Array.isArray(urls)) {
    list = urls.filter((u) => typeof u === 'string' && u.trim()).map((u) => u.trim())
  } else {
    return {
      ok: false,
      message: `The logo attached to "${productTitle}" is not valid. Please re-upload and try again.`,
    }
  }

  if (list.length > MAX_CORPORATE_LOGOS) {
    return {
      ok: false,
      message: `You can attach up to ${MAX_CORPORATE_LOGOS} logos per box on "${productTitle}".`,
    }
  }

  for (const candidate of list) {
    if (!isValidCloudinaryLogoUrl(candidate)) {
      return {
        ok: false,
        message: `The logo attached to "${productTitle}" is not valid. Please re-upload it and try again.`,
      }
    }
  }

  return { ok: true, urls: list }
}
