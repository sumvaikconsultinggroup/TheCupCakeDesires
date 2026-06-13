'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  CreditCard,
  ExternalLink,
  FileText,
  Store,
  FolderOpen,
  Gift,
  Globe,
  Home,
  LayoutDashboard,
  Layers,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  PanelTop,
  Percent,
  RotateCcw,
  Settings,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface NavItem {
  name: string
  href?: string
  icon: React.ElementType
  permission?: string | null
  children?: NavItem[]
  badge?: string | number
}

const sidebarItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: '/admin',
  },
  {
    name: 'Orders',
    icon: ShoppingCart,
    permission: '/admin/orders',
    children: [
      {
        name: 'All orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        permission: '/admin/orders',
      },
      {
        name: 'Kitchen queue',
        href: '/admin/orders/kitchen',
        icon: ChefHat,
        permission: '/admin/orders',
      },
      {
        name: 'Refunds',
        href: '/admin/refunds',
        icon: RotateCcw,
        permission: '/admin/refunds',
      },
    ],
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    permission: '/admin/payments',
  },
  {
    name: 'Storefront',
    icon: PanelTop,
    permission: '/admin/homepage',
    children: [
      {
        name: 'Homepage Hero',
        href: '/admin/homepage',
        icon: Home,
        permission: '/admin/homepage',
      },
      {
        name: 'Homepage Sections',
        href: '/admin/homepage/sections',
        icon: Layers,
        permission: '/admin/homepage',
      },
      {
        name: 'Navigation',
        href: '/admin/navigation',
        icon: Menu,
        permission: '/admin/navigation',
      },
      {
        name: 'Blog',
        href: '/admin/blog',
        icon: Newspaper,
        permission: '/admin/blog',
      },
      {
        name: 'Reviews',
        href: '/admin/reviews',
        icon: MessageSquare,
        permission: '/admin/reviews',
      },
      {
        name: 'FAQs',
        href: '/admin/faqs',
        icon: MessageSquare,
        permission: '/admin/faqs',
      },
      {
        name: 'Gift Voucher',
        href: '/admin/gift-voucher',
        icon: Gift,
        permission: '/admin/gift-voucher',
      },
    ],
  },
  {
    name: 'Catalog',
    icon: Package,
    permission: '/admin/products',
    children: [
      {
        name: 'Products',
        href: '/admin/products',
        icon: Package,
        permission: '/admin/products',
      },
      {
        name: 'Collections',
        href: '/admin/collections',
        icon: FolderOpen,
        permission: '/admin/collections',
      },
    ],
  },
  {
    name: 'Inventory',
    href: '/admin/inventory',
    icon: Boxes,
    permission: '/admin/inventory',
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
    permission: '/admin/customers',
  },
  {
    name: 'Marketing',
    icon: Megaphone,
    permission: '/admin/discounts',
    children: [
      {
        name: 'Discounts',
        href: '/admin/discounts',
        icon: Percent,
        permission: '/admin/discounts',
      },
      {
        name: 'Newsletter',
        href: '/admin/marketing/newsletter',
        icon: Mail,
        permission: '/admin/marketing/newsletter',
      },
    ],
  },

  {
    name: 'Analytics',
    icon: BarChart3,
    permission: '/admin/analytics',
    children: [
      {
        name: 'Overview',
        href: '/admin/analytics',
        icon: BarChart3,
        permission: '/admin/analytics',
      },
      {
        name: 'Reports',
        href: '/admin/reports',
        icon: FileText,
        permission: '/admin/reports',
      },
      {
        name: 'Finance',
        href: '/admin/finance',
        icon: CreditCard,
        permission: '/admin/finance',
      },
      {
        name: 'Live Activity',
        href: '/admin/analytics/live-activity',
        icon: Users,
        permission: '/admin/analytics/live-activity',
      },
      {
        name: 'AbandonedCarts',
        href: '/admin/analytics/abandoned-carts',
        icon: ShoppingCart,
        permission: '/admin/analytics/abandoned-carts',
      },
    ],
  },
  {
    name: 'SEO',
    href: '/admin/seo',
    icon: Globe,
    permission: '/admin/seo',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: '/admin/settings',
  },
]

/** Match admin nav links without highlighting a parent when a nested sibling is active. */
function isAdminNavActive(pathname: string, href: string, siblingHrefs: string[] = []) {
  if (href === '/admin') return pathname === '/admin'

  const hasNestedSibling = siblingHrefs.some(
    (sibling) => sibling !== href && sibling.startsWith(`${href}/`)
  )

  if (hasNestedSibling) return pathname === href

  return pathname === href || pathname.startsWith(`${href}/`)
}

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  hasPermission: (permission: string) => boolean
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, hasPermission }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [storeSettings, setStoreSettings] = useState<{ logoUrl?: string; storeName?: string }>({
    logoUrl: '/images/Cupcake-Logo.png',
    storeName: 'CupCake Desires',
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        if (data.success && data.settings) {
          setStoreSettings(data.settings)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Auto-expand parent items based on current path
  useEffect(() => {
    sidebarItems.forEach((item) => {
      if (item.children) {
        const siblingHrefs = item.children
          .map((child) => child.href)
          .filter((href): href is string => Boolean(href))
        const isChildActive = item.children.some(
          (child) => child.href && isAdminNavActive(pathname, child.href, siblingHrefs)
        )
        if (isChildActive && !expandedItems.includes(item.name)) {
          setExpandedItems((prev) => [...prev, item.name])
        }
      }
    })
  }, [pathname])

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const isActive = (href?: string, siblingHrefs: string[] = []) => {
    if (!href) return false
    return isAdminNavActive(pathname, href, siblingHrefs)
  }

  const isParentActive = (item: NavItem) => {
    if (item.href) return isActive(item.href)
    const siblingHrefs =
      item.children?.map((child) => child.href).filter((href): href is string => Boolean(href)) ??
      []
    return item.children?.some((child) => isActive(child.href, siblingHrefs))
  }

  // Filter items based on permissions
  const filterItemsByPermission = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (item.children) {
          const children = filterItemsByPermission(item.children)
          if (children.length > 0) {
            return { ...item, children }
          }
        }
        // An item without children (or whose children are all filtered out)
        // is only visible if it's a link and has permission.
        if (item.href && item.permission && hasPermission(item.permission)) {
          const newItem = { ...item }
          delete newItem.children // remove children array if it exists
          return newItem
        }
        return null
      })
      .filter((item): item is NavItem => item !== null)
  }

  const visibleItems = filterItemsByPermission(sidebarItems)

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    const active = isParentActive(item)

    if (hasChildren) {
      return (
        <li key={item.name}>
          <button
            onClick={() => toggleExpand(item.name)}
            title={collapsed ? item.name : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-rose-accent/10 text-cocoa'
                : 'text-cocoa-soft hover:bg-cream/60 hover:text-cocoa'
            }`}
          >
            <item.icon
              className={`h-4 w-4 shrink-0 ${
                active ? 'text-rose-accent' : 'text-cocoa-soft group-hover:text-cocoa'
              }`}
              strokeWidth={1.8}
            />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  strokeWidth={1.8}
                />
              </>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && !collapsed && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="ml-3.5 mt-1 space-y-0.5 overflow-hidden border-l border-line pl-3"
              >
                {item.children!.map((child) => {
                  const siblingHrefs = item.children!
                    .map((c) => c.href)
                    .filter((href): href is string => Boolean(href))

                  return (
                  <li key={child.name}>
                    <Link
                      href={child.href!}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                        isActive(child.href, siblingHrefs)
                          ? 'bg-cocoa text-ivory'
                          : 'text-cocoa-soft hover:bg-cream/60 hover:text-cocoa'
                      }`}
                    >
                      <child.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                      <span className="truncate">{child.name}</span>
                      {child.badge && (
                        <span className="ml-auto rounded-full bg-rose-accent/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-accent">
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                  )
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </li>
      )
    }

    return (
      <li key={item.name}>
        <Link
          href={item.href!}
          onClick={() => setMobileOpen(false)}
          title={collapsed ? item.name : undefined}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            active
              ? 'bg-cocoa text-ivory shadow-[0_8px_22px_-12px_rgba(46,31,21,0.5)]'
              : 'text-cocoa-soft hover:bg-cream/60 hover:text-cocoa'
          }`}
        >
          <item.icon
            className={`h-4 w-4 shrink-0 ${
              active ? 'text-ivory' : 'text-cocoa-soft group-hover:text-cocoa'
            }`}
            strokeWidth={1.8}
          />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.name}</span>
              {item.badge && (
                <span className="rounded-full bg-rose-accent/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-accent">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      </li>
    )
  }

  return (
    <>
      {/* Mobile backdrop (lower z than sidebar so the panel sits on top of it) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-cocoa/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — z-40 on mobile (above backdrop, below modals at z-50);
          on desktop it stays in-flow with no z so page modals (z-50) sit cleanly above. */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 264 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-ivory shadow-[0_18px_36px_-22px_rgba(46,31,21,0.18)] transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          {!collapsed ? (
            <Link
              href="/admin"
              className="flex min-w-0 items-center gap-2.5 overflow-hidden"
              onClick={() => setMobileOpen(false)}
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-cream">
                <Image
                  src={storeSettings.logoUrl || '/images/Cupcake-Logo.png'}
                  alt={storeSettings.storeName || 'CupCake Desires'}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <span className="font-bake-display truncate text-[15px] font-medium text-cocoa">
                {storeSettings.storeName || 'CupCake Desires'}
              </span>
            </Link>
          ) : (
            <Link
              href="/admin"
              className="mx-auto block"
              onClick={() => setMobileOpen(false)}
              title="Dashboard"
            >
              <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-cream">
                <Image
                  src={storeSettings.logoUrl || '/images/Cupcake-Logo.png'}
                  alt={storeSettings.storeName || 'CupCake Desires'}
                  fill
                  className="object-contain p-1"
                />
              </div>
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-cocoa-soft transition hover:bg-cream hover:text-cocoa lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="hidden-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">{visibleItems.map((item) => renderNavItem(item))}</ul>
        </nav>

        {/* View Storefront CTA */}
        <div className="border-t border-line p-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'View storefront' : undefined}
            className={`group flex items-center gap-2 rounded-xl border border-line bg-cream/40 text-sm font-medium text-cocoa transition-colors hover:border-rose-accent hover:bg-cream hover:text-rose-accent ${
              collapsed ? 'justify-center px-2 py-2.5' : 'justify-center px-3 py-2.5'
            }`}
          >
            <Store className="h-4 w-4" strokeWidth={1.8} />
            {!collapsed && (
              <>
                <span>View storefront</span>
                <ExternalLink className="ml-auto h-3 w-3 text-cocoa-soft transition-colors group-hover:text-rose-accent" />
              </>
            )}
          </Link>
        </div>

        {/* Collapse toggle — only on desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 hidden h-6 w-6 items-center justify-center rounded-full border border-line bg-ivory text-cocoa-soft shadow-sm transition hover:border-rose-accent hover:text-rose-accent lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </motion.aside>
    </>
  )
}
