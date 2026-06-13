'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  Percent,
  Settings,
  BarChart3,
  Plus,
  ArrowRight,
  Command,
  LayoutDashboard,
  Boxes,
  ChefHat,
  Truck,
  CreditCard,
  FileText,
  FolderOpen,
  RotateCcw,
  Home,
  Menu,
  Newspaper,
  MessageSquare,
  Gift,
} from 'lucide-react'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ElementType
  action: () => void
  category: 'navigation' | 'actions' | 'search'
  shortcut?: string
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const navigate = useCallback((path: string) => {
    router.push(path)
    setIsOpen(false)
    setQuery('')
  }, [router])

  const commands: CommandItem[] = [
    // Navigation
    { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, action: () => navigate('/admin'), category: 'navigation' },
    
    // Orders
    { id: 'orders', title: 'All orders', icon: ShoppingCart, action: () => navigate('/admin/orders'), category: 'navigation' },
    { id: 'kitchen', title: 'Kitchen queue', icon: ChefHat, action: () => navigate('/admin/orders/kitchen'), category: 'navigation' },
    { id: 'refunds', title: 'Refunds', icon: RotateCcw, action: () => navigate('/admin/refunds'), category: 'navigation' },

    // Payments
    { id: 'payments', title: 'Payments', icon: CreditCard, action: () => navigate('/admin/payments'), category: 'navigation' },

    // Storefront
    { id: 'homepage', title: 'Homepage Hero', icon: Home, action: () => navigate('/admin/homepage'), category: 'navigation' },
    { id: 'homepage-sections', title: 'Homepage Sections', icon: Home, action: () => navigate('/admin/homepage/sections'), category: 'navigation' },
    { id: 'navigation', title: 'Navigation', icon: Menu, action: () => navigate('/admin/navigation'), category: 'navigation' },
    { id: 'blog', title: 'Blog', icon: Newspaper, action: () => navigate('/admin/blog'), category: 'navigation' },
    { id: 'reviews', title: 'Reviews', icon: MessageSquare, action: () => navigate('/admin/reviews'), category: 'navigation' },
    { id: 'faqs', title: 'FAQs', icon: MessageSquare, action: () => navigate('/admin/faqs'), category: 'navigation' },
    { id: 'gift-voucher', title: 'Gift Voucher', icon: Gift, action: () => navigate('/admin/gift-voucher'), category: 'navigation' },

    // Catalog
    { id: 'products', title: 'Products', icon: Package, action: () => navigate('/admin/products'), category: 'navigation' },
    { id: 'collections', title: 'Collections', icon: FolderOpen, action: () => navigate('/admin/collections'), category: 'navigation' },

    // Inventory & Customers
    { id: 'inventory', title: 'Inventory', icon: Boxes, action: () => navigate('/admin/inventory'), category: 'navigation' },
    { id: 'customers', title: 'Customers', icon: Users, action: () => navigate('/admin/customers'), category: 'navigation' },

    // Marketing
    { id: 'discounts', title: 'Discounts', icon: Percent, action: () => navigate('/admin/discounts'), category: 'navigation' },

    // Analytics
    { id: 'analytics', title: 'Analytics Overview', icon: BarChart3, action: () => navigate('/admin/analytics'), category: 'navigation' },
    { id: 'reports', title: 'Reports', icon: FileText, action: () => navigate('/admin/reports'), category: 'navigation' },
    { id: 'finance', title: 'Finance', icon: CreditCard, action: () => navigate('/admin/finance'), category: 'navigation' },
    { id: 'live-activity', title: 'Live Activity', icon: Users, action: () => navigate('/admin/analytics/live-activity'), category: 'navigation' },
    { id: 'abandoned-carts', title: 'Abandoned Carts', icon: ShoppingCart, action: () => navigate('/admin/analytics/abandoned-carts'), category: 'navigation' },

    // Other
    { id: 'settings', title: 'Settings', icon: Settings, action: () => navigate('/admin/settings'), category: 'navigation' },
    
    // Actions
    { id: 'new-product', title: 'Create New Product', description: 'Add a new product to your catalog', icon: Plus, action: () => navigate('/admin/products/new'), category: 'actions' },
    { id: 'new-collection', title: 'Create New Collection', description: 'Create a new product collection', icon: Plus, action: () => navigate('/admin/collections/new'), category: 'actions' },
    { id: 'new-discount', title: 'Create New Discount', description: 'Set up a new discount code', icon: Plus, action: () => navigate('/admin/discounts/new'), category: 'actions' },
  ]

  const filteredCommands = query
    ? commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      
      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle keyboard navigation within palette
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = filteredCommands.length
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % totalItems)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filteredCommands[selectedIndex]?.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Quick Actions',
    search: 'Search Results',
  }

  let itemIndex = -1

  return (
    <>
      {/* Trigger in the header */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-line bg-cream/40 px-3 py-2 text-sm text-cocoa-soft transition hover:border-rose-accent/40 hover:bg-cream md:flex"
      >
        <Search className="h-4 w-4 text-cocoa-soft" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="flex items-center gap-0.5 rounded bg-ivory px-1.5 py-0.5 text-[10px] font-medium text-cocoa-soft">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — z-60 so it sits above page modals (z-50) and the sidebar (z-40) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-60 bg-cocoa/40 backdrop-blur-sm"
              onClick={() => {
                setIsOpen(false)
                setQuery('')
              }}
            />

            {/* Palette — global, on top of everything */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] z-60 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_40px_80px_-30px_rgba(46,31,21,0.55)]"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-line bg-cream/40 px-4">
                <Search className="h-4 w-4 text-cocoa-soft" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, pages, actions…"
                  className="font-bake-body flex-1 bg-transparent py-3.5 text-sm text-cocoa outline-none placeholder:text-cocoa-soft"
                />
                <kbd className="rounded bg-ivory px-2 py-1 text-[10px] font-medium text-cocoa-soft">
                  ESC
                </kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    No results found for "{query}"
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, items]) => (
                    <div key={category} className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {categoryLabels[category]}
                      </div>
                      {items.map((cmd) => {
                        itemIndex++
                        const currentIndex = itemIndex
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                              selectedIndex === currentIndex
                                ? 'bg-[#2e1f15] text-white'
                                : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <cmd.icon className={`h-5 w-5 ${selectedIndex === currentIndex ? 'text-white' : 'text-neutral-400'}`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{cmd.title}</div>
                              {cmd.description && (
                                <div className={`text-xs ${selectedIndex === currentIndex ? 'text-white/70' : 'text-neutral-500'}`}>
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                            {cmd.shortcut && (
                              <kbd className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                                selectedIndex === currentIndex
                                  ? 'bg-white/20 text-white'
                                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                              }`}>
                                {cmd.shortcut}
                              </kbd>
                            )}
                            <ArrowRight className={`h-4 w-4 ${selectedIndex === currentIndex ? 'text-white' : 'text-neutral-300'}`} />
                          </button>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-700">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800">↵</kbd> select
                  </span>
                </div>
                <span>Powered by CupCake Desires Admin</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
