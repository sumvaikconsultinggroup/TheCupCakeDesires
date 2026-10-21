import { revalidatePath } from 'next/cache'

/**
 * Bust storefront ISR after catalogue changes.
 *
 * Avoids `revalidatePath('/', 'layout')`, which invalidates the entire shop
 * tree (suburb SEO pages, blogs, catering landers, etc.) and is the main
 * driver of ISR write costs. We only touch surfaces that show product data.
 *
 * Use {@link refreshEntireShopLayout} only for rare global chrome changes
 * (e.g. mega-menu), where the header is baked into every cached page.
 */
export function refreshStorefront(handles?: string | string[] | null) {
  const list = (Array.isArray(handles) ? handles : handles ? [handles] : [])
    .map((h) => String(h || '').trim())
    .filter(Boolean)

  try {
    revalidatePath('/')
    revalidatePath('/deals')
    revalidatePath('/collections', 'layout')
    revalidatePath('/sitemap.xml')

    for (const handle of new Set(list)) {
      revalidatePath(`/products/${handle}`)
    }
  } catch (e) {
    console.error('[refreshStorefront] failed', e)
  }
}

/** Rare: nav/chrome baked into every page via the shop layout Header. */
export function refreshEntireShopLayout() {
  try {
    revalidatePath('/', 'layout')
  } catch (e) {
    console.error('[refreshEntireShopLayout] failed', e)
  }
}
