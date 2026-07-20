import connectDb from '@/lib/mongodb'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
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
  await attachLinkImages(items)
  return items
}

/**
 * Enrich every mega-menu link with a preview image so the storefront nav can
 * swap the panel's hero image on hover. Resolved from real data:
 *  - /collections/<handle>  → first product's image in that collection (else the collection image)
 *  - /products/<handle>     → that product's image
 *  - /cupcake-builder       → the Make Your Own box image
 * Best-effort: on any error the links simply keep no image and the panel falls
 * back to its static hero.
 */
async function attachLinkImages(items: NavItem[]): Promise<void> {
  try {
    const megaItems = items.filter((i): i is MegaNavItem => (i as MegaNavItem).mega === true)
    const links = megaItems.flatMap((m) => m.columns.flatMap((c) => c.links))
    if (links.length === 0) return

    const collectionHandles = new Set<string>()
    const productHandles = new Set<string>()
    const parse = (href: string): { type: 'collection' | 'product'; handle: string } | null => {
      const clean = (href || '').split('?')[0].replace(/\/$/, '')
      if (clean === '/cupcake-builder') return { type: 'product', handle: 'make-your-own-cupcake-box' }
      const col = clean.match(/^\/collections\/([^/]+)$/)
      if (col && col[1] !== 'all-items') return { type: 'collection', handle: col[1] }
      const prod = clean.match(/^\/products\/([^/]+)$/)
      if (prod) return { type: 'product', handle: prod[1] }
      return null
    }

    for (const l of links) {
      const p = parse(l.href)
      if (!p) continue
      if (p.type === 'collection') collectionHandles.add(p.handle)
      else productHandles.add(p.handle)
    }
    if (collectionHandles.size === 0 && productHandles.size === 0) return

    await connectDb()

    // Collections → grab their image + first product handle.
    const cols = collectionHandles.size
      ? ((await Collection.find({ handle: { $in: [...collectionHandles] } })
          .select('handle image thumbnailImage productHandles')
          .lean()) as unknown as {
          handle: string
          image?: string
          thumbnailImage?: string
          productHandles?: string[]
        }[])
      : []
    const colByHandle = new Map(cols.map((c) => [c.handle, c]))
    for (const c of cols) {
      const first = c.productHandles?.[0]
      if (first) productHandles.add(first)
    }

    // Products → resolve a usable image (product image first, else variant image).
    const prods = productHandles.size
      ? ((await Product.find({ handle: { $in: [...productHandles] }, isDeleted: { $ne: true } })
          .select('handle images variants.image')
          .lean()) as unknown as {
          handle: string
          images?: { src?: string }[]
          variants?: { image?: string }[]
        }[])
      : []
    const productImg = new Map<string, string>()
    for (const p of prods) {
      const src = p.images?.find((i) => i?.src)?.src || p.variants?.find((v) => v?.image)?.image
      if (src) productImg.set(p.handle, src)
    }

    const imageForHref = (href: string): string | undefined => {
      const p = parse(href)
      if (!p) return undefined
      if (p.type === 'product') return productImg.get(p.handle)
      const col = colByHandle.get(p.handle)
      const firstHandle = col?.productHandles?.[0]
      return (
        (firstHandle && productImg.get(firstHandle)) || col?.image || col?.thumbnailImage || undefined
      )
    }

    for (const l of links) {
      const img = imageForHref(l.href)
      if (img) l.image = img
    }
  } catch (err) {
    console.error('attachLinkImages failed:', err)
  }
}
