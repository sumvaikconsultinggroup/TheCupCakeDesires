import connectDb from '@/lib/mongodb'
import { DEFAULT_MEGA_MENUS } from '@/data/mega-menu-defaults'
import MegaMenuConfig from '@/models/MegaMenuConfig'
import type { MegaMenuConfig as MegaMenuConfigType, NavItem } from '@/types/mega-menu'
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
  return buildNavItems(configs)
}
