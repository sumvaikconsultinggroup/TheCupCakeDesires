export type MegaMenuSlug = 'event' | 'cupcakes' | 'cakes' | 'macarons'

export interface MegaMenuLink {
  label: string
  href: string
  collectionHandle?: string
}

export interface MegaMenuColumn {
  heading: string
  links: MegaMenuLink[]
}

export interface MegaMenuFeaturedCard {
  title: string
  subtitle: string
  href: string
  image: string
  badge?: string
  collectionHandle?: string
}

export interface MegaMenuConfig {
  slug: MegaMenuSlug
  label: string
  href: string
  layout: 'columns-featured' | 'product-list'
  columnLayout?: 2 | 3 | 4
  description: string
  columns: MegaMenuColumn[]
  featured: MegaMenuFeaturedCard[]
  heroImage?: string
  heroImageAlt?: string
  isActive: boolean
  position: number
}

export interface SimpleNavItem {
  label: string
  href: string
  mega?: false
  dropdown?: false
}

/** Compact static hover menu (not DB-driven mega). */
export interface DropdownNavItem {
  label: string
  href: string
  dropdown: true
  mega?: false
  links: { label: string; href: string; description?: string }[]
}

export interface MegaNavItem {
  label: string
  href: string
  mega: true
  dropdown?: false
  description?: string
  columns: { heading: string; links: { label: string; href: string; image?: string }[] }[]
  featured: {
    title: string
    subtitle: string
    href: string
    image: string
    badge?: string
  }[]
  columnLayout?: 2 | 3 | 4
  layout?: 'product-list'
  heroImage?: string
  heroImageAlt?: string
}

export type NavItem = SimpleNavItem | DropdownNavItem | MegaNavItem
