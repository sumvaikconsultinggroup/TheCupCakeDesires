import type { MegaMenuFeaturedCard, MegaMenuLink, MegaMenuLinkType } from '@/types/mega-menu'

/** Collection routes that are built in code rather than stored as Collection documents. */
export const VIRTUAL_COLLECTION_HANDLES = new Set([
  'all-items',
  'all-cupcakes',
  // Soft-fallback Halloween collections stay visible before Mongo seed publishes them.
  'halloween-cupcakes',
  'halloween-cakes',
])

export interface MenuTarget {
  type: MegaMenuLinkType
  collectionHandle?: string
  productHandle?: string
}

export function parseMenuHref(href: string): MenuTarget {
  const clean = (href || '').split(/[?#]/)[0].replace(/\/$/, '')
  const col = clean.match(/^\/collections\/([^/]+)$/)
  if (col) return { type: 'collection', collectionHandle: col[1] }
  const prod = clean.match(/^\/products\/([^/]+)$/)
  if (prod) return { type: 'product', productHandle: prod[1] }
  return { type: 'custom' }
}

export function hrefForTarget(type: 'collection' | 'product', handle: string) {
  return type === 'collection' ? `/collections/${handle}` : `/products/${handle}`
}

/**
 * Fills in type/handles for older entries that only stored an href, and keeps
 * href in step with the handle so a collection/product entry can't drift to a
 * different page. A query string on a product link (e.g. ?flavour=) is kept.
 */
export function normalizeMenuTarget<T extends MegaMenuLink | MegaMenuFeaturedCard>(entry: T): T {
  const fromHref = parseMenuHref(entry.href)
  const type: MegaMenuLinkType = entry.type || fromHref.type
  const out = { ...entry, type } as T

  if (type === 'collection') {
    const handle = entry.collectionHandle || fromHref.collectionHandle
    if (!handle) return { ...out, type: 'custom', collectionHandle: undefined, productHandle: undefined }
    out.collectionHandle = handle
    out.productHandle = undefined
    if (fromHref.collectionHandle !== handle) out.href = hrefForTarget('collection', handle)
  } else if (type === 'product') {
    const handle = entry.productHandle || fromHref.productHandle
    if (!handle) return { ...out, type: 'custom', collectionHandle: undefined, productHandle: undefined }
    out.productHandle = handle
    out.collectionHandle = undefined
    if (fromHref.productHandle !== handle) out.href = hrefForTarget('product', handle)
  } else {
    out.collectionHandle = undefined
    out.productHandle = undefined
  }
  return out
}

export function isValidCustomHref(href: string) {
  return /^\/(?!\/)\S*$/.test(href) || /^https?:\/\/\S+$/i.test(href)
}
