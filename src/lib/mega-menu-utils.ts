import { STATIC_NAV_LINKS } from '@/data/mega-menu-defaults'
import type { MegaMenuConfig, MegaNavItem, NavItem } from '@/types/mega-menu'

export function configToNavItem(config: MegaMenuConfig): MegaNavItem {
  const base: MegaNavItem = {
    label: config.label,
    href: config.href,
    mega: true,
    description: config.description,
    columns: config.columns.map((col) => ({
      heading: col.heading,
      links: col.links.map((l) => ({ label: l.label, href: l.href })),
    })),
    featured: config.featured.map((f) => ({
      title: f.title,
      subtitle: f.subtitle,
      href: f.href,
      image: f.image,
      badge: f.badge,
    })),
  }

  if (config.layout === 'product-list') {
    base.layout = 'product-list'
    base.heroImage = config.heroImage
    base.heroImageAlt = config.heroImageAlt
  } else {
    base.columnLayout = config.columnLayout || 3
  }

  return base
}

export function buildNavItems(configs: MegaMenuConfig[]): NavItem[] {
  const megaItems = configs
    .filter((c) => c.isActive)
    .sort((a, b) => a.position - b.position)
    .map(configToNavItem)

  return [...megaItems, ...STATIC_NAV_LINKS]
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
