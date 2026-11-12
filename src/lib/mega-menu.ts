import connectDb from '@/lib/mongodb'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import { VIRTUAL_COLLECTION_HANDLES, parseMenuHref } from '@/lib/mega-menu-links'
import MegaMenuConfig from '@/models/MegaMenuConfig'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import type { MegaMenuConfig as MegaMenuConfigType, MegaNavItem, NavItem } from '@/types/mega-menu'
import { buildNavItems, serializeMegaMenu } from '@/lib/mega-menu-utils'

export { configToNavItem, buildNavItems, serializeMegaMenu } from '@/lib/mega-menu-utils'

export async function getMegaMenuConfigs(): Promise<MegaMenuConfigType[]> {
  await connectDb()
  const docs = await MegaMenuConfig.find().sort({ position: 1 }).lean()
  if (!docs.length) return DEFAULT_MEGA_MENUS

  const bySlug = new Map(docs.map((d) => [d.slug, d]))
  return DEFAULT_MEGA_MENUS.map((def) => {
    const stored = bySlug.get(def.slug)
    if (!stored) return def
    return serializeMegaMenu(stored as Record<string, unknown>)
  })
}

export async function getStorefrontNav(): Promise<NavItem[]> {
  const configs = await getMegaMenuConfigs()
  const items = buildNavItems(configs)
  await resolveMenuTargets(items)
  return items
}

/**
 * Checks every collection/product entry against the live catalogue:
 *  - entries whose collection or product is deleted, unpublished or inactive
 *    are dropped (and a column left empty is dropped with them), so the menu
 *    never links to a 404;
 *  - each link gets a preview image for the hover panel, and featured cards
 *    without an image borrow one from their collection/product.
 * Best-effort: if the lookup fails the menu renders exactly as saved.
 */
async function resolveMenuTargets(items: NavItem[]): Promise<void> {
  try {
    const megaItems = items.filter((i): i is MegaNavItem => (i as MegaNavItem).mega === true)
    if (megaItems.length === 0) return

    const collectionHandles = new Set<string>()
    const productHandles = new Set<string>(['make-your-own-cupcake-box'])
    const hrefs = megaItems.flatMap((m) => [
      ...m.columns.flatMap((c) => c.links.map((l) => l.href)),
      ...m.featured.map((f) => f.href),
    ])
    for (const href of hrefs) {
      const t = parseMenuHref(href)
      if (t.collectionHandle && !VIRTUAL_COLLECTION_HANDLES.has(t.collectionHandle)) {
        collectionHandles.add(t.collectionHandle)
      }
      if (t.productHandle) productHandles.add(t.productHandle)
    }

    await connectDb()

    const cols = (await Collection.find({ handle: { $in: [...collectionHandles] } })
      .select('handle image thumbnailImage productHandles published isDeleted')
      .lean()) as unknown as {
      handle: string
      image?: string
      thumbnailImage?: string
      productHandles?: string[]
      published?: boolean
      isDeleted?: boolean
    }[]
    const colByHandle = new Map(cols.map((c) => [c.handle, c]))
    for (const c of cols) {
      const first = c.productHandles?.[0]
      if (first) productHandles.add(first)
    }

    const prods = (await Product.find({ handle: { $in: [...productHandles] } })
      .select('handle images variants.image published status isDeleted')
      .lean()) as unknown as {
      handle: string
      images?: { src?: string }[]
      variants?: { image?: string }[]
      published?: boolean
      status?: string
      isDeleted?: boolean
    }[]
    const prodByHandle = new Map(prods.map((p) => [p.handle, p]))
    const productImage = (handle?: string) => {
      const p = handle ? prodByHandle.get(handle) : undefined
      return p?.images?.find((i) => i?.src)?.src || p?.variants?.find((v) => v?.image)?.image
    }

    const isVisible = (href: string) => {
      const t = parseMenuHref(href)
      if (t.type === 'collection') {
        if (VIRTUAL_COLLECTION_HANDLES.has(t.collectionHandle!)) return true
        const c = colByHandle.get(t.collectionHandle!)
        return Boolean(c && c.isDeleted !== true && c.published !== false)
      }
      if (t.type === 'product') {
        const p = prodByHandle.get(t.productHandle!)
        return Boolean(p && p.isDeleted !== true && p.published === true && p.status === 'active')
      }
      return true
    }

    const imageFor = (href: string): string | undefined => {
      const clean = href.split(/[?#]/)[0].replace(/\/$/, '')
      if (clean === '/cupcake-builder') return productImage('make-your-own-cupcake-box')
      const t = parseMenuHref(href)
      if (t.type === 'product') return productImage(t.productHandle)
      if (t.type === 'collection') {
        const c = colByHandle.get(t.collectionHandle!)
        return productImage(c?.productHandles?.[0]) || c?.image || c?.thumbnailImage || undefined
      }
      return undefined
    }

    for (const mega of megaItems) {
      mega.columns = mega.columns
        .map((col) => ({
          ...col,
          links: col.links
            .filter((l) => isVisible(l.href))
            .map((l) => {
              const image = imageFor(l.href)
              return image ? { ...l, image } : l
            }),
        }))
        .filter((col) => col.links.length > 0)

      mega.featured = mega.featured
        .filter((f) => isVisible(f.href))
        .map((f) => (f.image ? f : { ...f, image: imageFor(f.href) || '' }))
        .filter((f) => f.image)
    }
  } catch (err) {
    console.error('resolveMenuTargets failed:', err)
  }
}
