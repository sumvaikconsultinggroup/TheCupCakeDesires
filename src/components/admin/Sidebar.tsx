'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderOpen,
  Globe,
  Home,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  PanelTop,
  Percent,
  RotateCcw,
  Settings,
  ShieldX,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  Users,
  Video,
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
        name: 'All Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        permission: '/admin/orders',
      },
      {
        name: 'Cancelled Orders',
        href: '/admin/orders/cancelled',
        icon: X,
        permission: '/admin/orders/cancelled',
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
        name: 'Homepage Builder',
        href: '/admin/homepage',
        icon: Home,
        permission: '/admin/homepage',
      },
      {
        name: 'Video Reels',
        href: '/admin/videos',
        icon: Video,
        permission: '/admin/videos',
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
        name: 'Combos',
        href: '/admin/combos',
        icon: Tag,
        permission: '/admin/combos',
      },
      {
        name: 'Recommendations',
        href: '/admin/recommendations',
        icon: Sparkles,
        permission: '/admin/recommendations',
      },
      {
        name: 'FAQs',
        href: '/admin/faqs',
        icon: MessageSquare,
        permission: '/admin/faqs',
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
      {
        name: 'Bundle Offers',
        href: '/admin/bundles',
        icon: Tag,
        permission: '/admin/bundles',
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
    name: 'Product Authentication',
    href: '/admin/product-auth',
    icon: ShieldX,
    permission: '/admin/product-auth',
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
    logoUrl: '/GibbonLogoEccom.png',
    storeName: 'Gibbon Nutrition',
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
        const isChildActive = item.children.some((child) => child.href && pathname.startsWith(child.href))
        if (isChildActive && !expandedItems.includes(item.name)) {
          setExpandedItems((prev) => [...prev, item.name])
        }
      }
    })
  }, [pathname])

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const isParentActive = (item: NavItem) => {
    if (item.href) return isActive(item.href)
    return item.children?.some((child) => isActive(child.href))
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
            className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              active
                ? 'bg-[#1B198F]/10 text-[#1B198F] dark:bg-[#1B198F]/20 dark:text-white'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            <item.icon
              className={`h-5 w-5 flex-shrink-0 ${
                active ? 'text-[#1B198F] dark:text-white' : 'text-neutral-400 group-hover:text-[#1B198F]'
              }`}
            />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && !collapsed && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-1 ml-4 space-y-1 overflow-hidden border-l border-neutral-200 pl-4 dark:border-neutral-700"
              >
                {item.children!.map((child) => (
                  <li key={child.name}>
                    <Link
                      href={child.href!}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                        isActive(child.href)
                          ? 'bg-[#1B198F] text-white shadow-lg shadow-[#1B198F]/20'
                          : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <child.icon className="h-4 w-4" />
                      <span>{child.name}</span>
                      {child.badge && (
                        <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 uppercase dark:bg-green-900 dark:text-green-300">
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
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
          className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
            active
              ? 'bg-[#1B198F] text-white shadow-lg shadow-[#1B198F]/30'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
          }`}
        >
          <item.icon
            className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-neutral-400 group-hover:text-[#1B198F]'}`}
          />
          {!collapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 uppercase dark:bg-green-900 dark:text-green-300">
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
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-xl transition-transform lg:translate-x-0 dark:bg-neutral-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-700">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
              <div className="relative h-10 w-10 shrink-0">
                <Image
                  src={storeSettings.logoUrl || '/GibbonLogoEccom.png'}
                  alt={storeSettings.storeName || 'Store Logo'}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="truncate text-lg font-bold text-neutral-900 dark:text-white">
                {storeSettings.storeName || 'Gibbon Nutrition'}
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto">
              {storeSettings.logoUrl ? (
                <div className="relative h-10 w-10">
                  <Image
                    src={storeSettings.logoUrl}
                    alt={storeSettings.storeName || 'Store'}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F] font-bold text-white">
                  {storeSettings.storeName?.charAt(0) || 'G'}
                </div>
              )}
            </div>
          )}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">{visibleItems.map((item) => renderNavItem(item))}</ul>
        </nav>

        {/* View Store Button */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
          <Link
            href="/"
            target="_blank"
            className={`flex items-center justify-center gap-2 rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600 ${
              collapsed ? 'px-2' : 'px-4'
            }`}
          >
            <Store className="h-5 w-5" />
            {!collapsed && <span>View Store</span>}
          </Link>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 hidden h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-md lg:flex dark:border-neutral-600 dark:bg-neutral-700"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </motion.aside>
    </>
  )
}
