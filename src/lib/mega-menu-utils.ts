import { DEFAULT_MEGA_MENUS, STOREFRONT_NAV_ORDER } from '@/data/mega-menu-defaults'
import type { DropdownNavItem, MegaMenuConfig, MegaNavItem, NavItem } from '@/types/mega-menu'

function isGiantCupcakesLink(link: { label?: string; href?: string }) {
  const href = (link.href || '').toLowerCase()
  const label = (link.label || '').toLowerCase()
  return href.includes('giant-cupcakes') || href.includes('giant-cupcake') || label.includes('giant cupcake')
}

/** Keep Corporate Event as the first column in the Event mega menu. */
export function ensureCorporateEventFirst(config: MegaMenuConfig): MegaMenuConfig {
  if (config.slug !== 'event' || !config.columns?.length) return config
  const idx = config.columns.findIndex((c) => /corporate/i.test(c.heading || ''))
  if (idx <= 0) return config
  const columns = [...config.columns]
  const [corporate] = columns.splice(idx, 1)
  return { ...config, columns: [corporate, ...columns] }
}

/**
 * Cakes mega menu always uses three columns (Giant Cupcakes / Dress Cakes / Round Cake).
 * Strips giant-cupcake links out of Cupcakes, and replaces any older single-column
 * “Shop cakes” DB config so the storefront stays in sync with defaults.
 */
export function relocateGiantCupcakes(configs: MegaMenuConfig[]): MegaMenuConfig[] {
  const cakesDefault = DEFAULT_MEGA_MENUS.find((m) => m.slug === 'cakes')
  const cakesColumns = cakesDefault?.columns || []
  const macaronsDefault = DEFAULT_MEGA_MENUS.find((m) => m.slug === 'macarons')
  const macaronsColumns = macaronsDefault?.columns || []

  return configs.map((config) => {
    if (config.slug === 'cupcakes') {
      return {
        ...config,
        columns: config.columns.map((col) => ({
          ...col,
          links: col.links.filter((link) => !isGiantCupcakesLink(link)),
        })),
      }
    }

    if (config.slug === 'cakes' && cakesColumns.length > 0) {
      return {
        ...config,
        description: cakesDefault?.description || config.description,
        heroImage: cakesDefault?.heroImage || config.heroImage,
        heroImageAlt: cakesDefault?.heroImageAlt || config.heroImageAlt,
        columns: cakesColumns.map((col) => ({
          heading: col.heading,
          links: col.links.map((l) => ({ ...l })),
        })),
      }
    }

    // Keep Macarons & Slices column headings in sync (e.g. “Standard size cake slices”).
    if (config.slug === 'macarons' && macaronsColumns.length > 0) {
      return {
        ...config,
        columns: macaronsColumns.map((col) => ({
          heading: col.heading,
          links: col.links.map((l) => ({ ...l })),
        })),
      }
    }

    return config
  })
}

export function configToNavItem(config: MegaMenuConfig): MegaNavItem {
  const normalized = ensureCorporateEventFirst(config)
  const base: MegaNavItem = {
    label: normalized.label,
    href: normalized.href,
    mega: true,
    description: normalized.description,
    columns: normalized.columns.map((col) => ({
      heading: col.heading,
      links: col.links.map((l) => ({ label: l.label, href: l.href })),
    })),
    featured: normalized.featured.map((f) => ({
      title: f.title,
      subtitle: f.subtitle,
      href: f.href,
      image: f.image,
      badge: f.badge,
    })),
  }

  if (normalized.layout === 'product-list') {
    base.layout = 'product-list'
    base.heroImage = normalized.heroImage
    base.heroImageAlt = normalized.heroImageAlt
  } else {
    base.columnLayout = normalized.columnLayout || 3
  }

  return base
}

export function buildNavItems(configs: MegaMenuConfig[]): NavItem[] {
  const normalizedConfigs = relocateGiantCupcakes(configs)
  const megaBySlug = new Map(
    normalizedConfigs
      .filter((c) => c.isActive)
      .map((c) => [c.slug, configToNavItem(c)] as const)
  )

  const items: NavItem[] = []
  for (const entry of STOREFRONT_NAV_ORDER) {
    if (entry.type === 'mega') {
      const mega = megaBySlug.get(entry.slug)
      if (mega) items.push(mega)
    } else if (entry.type === 'dropdown') {
      const dropdown: DropdownNavItem = {
        label: entry.label,
        href: entry.href,
        dropdown: true,
        links: entry.links.map((l) => ({ ...l })),
      }
      items.push(dropdown)
    } else {
      items.push({ label: entry.label, href: entry.href })
    }
  }
  return items
}

export function serializeMegaMenu(doc: Record<string, unknown>): MegaMenuConfig {
  return {
    slug: doc.slug as MegaMenuConfig['slug'],
    label: String(doc.label),
    href: String(doc.href),
    layout: doc.layout as MegaMenuConfig['layout'],
    columnLayout: doc.columnLayout as MegaMenuConfig['columnLayout'],
    description: String(doc.description || ''),
    columns: (doc.columns as MegaMenuConfig['columns']) || [],
    featured: (doc.featured as MegaMenuConfig['featured']) || [],
    heroImage: doc.heroImage as string | undefined,
    heroImageAlt: doc.heroImageAlt as string | undefined,
    isActive: Boolean(doc.isActive ?? true),
    position: Number(doc.position ?? 0),
  }
}
