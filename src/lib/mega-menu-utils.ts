import { STOREFRONT_NAV_ORDER } from '@/data/mega-menu-defaults'
import { normalizeMenuTarget } from '@/lib/mega-menu-links'
import type { DropdownNavItem, MegaMenuConfig, MegaNavItem, NavItem } from '@/types/mega-menu'

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
  const megaBySlug = new Map(
    configs.filter((c) => c.isActive).map((c) => [c.slug, configToNavItem(c)] as const)
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
  const columns = ((doc.columns as MegaMenuConfig['columns']) || []).map((col) => ({
    heading: String(col.heading || ''),
    links: (col.links || []).map((l) =>
      normalizeMenuTarget({
        label: String(l.label || ''),
        href: String(l.href || ''),
        type: l.type,
        collectionHandle: l.collectionHandle,
        productHandle: l.productHandle,
      })
    ),
  }))
  const featured = ((doc.featured as MegaMenuConfig['featured']) || []).map((f) =>
    normalizeMenuTarget({
      title: String(f.title || ''),
      subtitle: String(f.subtitle || ''),
      href: String(f.href || ''),
      image: String(f.image || ''),
      badge: f.badge || undefined,
      type: f.type,
      collectionHandle: f.collectionHandle,
      productHandle: f.productHandle,
    })
  )

  return {
    slug: doc.slug as MegaMenuConfig['slug'],
    label: String(doc.label),
    href: String(doc.href),
    layout: doc.layout as MegaMenuConfig['layout'],
    columnLayout: doc.columnLayout as MegaMenuConfig['columnLayout'],
    description: String(doc.description || ''),
    columns,
    featured,
    heroImage: doc.heroImage as string | undefined,
    heroImageAlt: doc.heroImageAlt as string | undefined,
    isActive: Boolean(doc.isActive ?? true),
    position: Number(doc.position ?? 0),
  }
}
