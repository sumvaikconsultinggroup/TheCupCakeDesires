'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Store,
  Users,
  Plug,
  Bell,
  Code,
  Receipt,
  CreditCard,
  Truck,
  Shield,
  Globe,
  ChevronRight,
} from 'lucide-react'

interface SettingsNavItem {
  name: string
  href: string
  icon: React.ElementType
  description?: string
  badge?: string
  disabled?: boolean
}

const settingsNav: SettingsNavItem[] = [
  {
    name: 'Store',
    href: '/admin/settings',
    icon: Store,
    description: 'General store settings',
  },
  {
    name: 'Team & Roles',
    href: '/admin/settings/team',
    icon: Users,
    description: 'Manage staff and permissions',
  },
  // {
  //   name: 'Integrations',
  //   href: '/admin/settings/integrations',
  //   icon: Plug,
  //   description: 'Payment, shipping, and more',
  //   badge: 'Pro',
  // },
  {
    name: 'Taxes & Invoices',
    href: '/admin/settings/taxes',
    icon: Receipt,
    description: 'Tax rates and invoice settings',
    disabled: true,
  },
  // {
  //   name: 'Notifications',
  //   href: '/admin/settings/notifications',
  //   icon: Bell,
  //   description: 'Email and alert preferences',
  // },
  // {
  //   name: 'Developer',
  //   href: '/admin/settings/developer',
  //   icon: Code,
  //   description: 'API keys and webhooks',
  // },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin/settings') {
      return pathname === '/admin/settings'
    }
    return pathname.startsWith(href)
  }

  // Check if we're on a deep settings page (like /admin/settings/integrations/payments)
  const isDeepPage = pathname.split('/').length > 4

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-neutral-500">Manage your store configuration</p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-4">
        {/* Side Navigation */}
        {!isDeepPage && (
          <div className="min-w-0 lg:col-span-1">
            <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm lg:sticky lg:top-24 lg:block lg:space-y-1 dark:bg-neutral-800">
              {settingsNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  onClick={(e) => item.disabled && e.preventDefault()}
                  className={`group flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : isActive(item.href)
                      ? 'bg-[#2e1f15] text-white shadow-lg shadow-[#2e1f15]/20'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive(item.href) ? 'text-white' : 'text-neutral-400 group-hover:text-[#2e1f15]'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isActive(item.href)
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`hidden h-4 w-4 lg:block ${
                      isActive(item.href) ? 'text-white' : 'text-neutral-300'
                    }`}
                  />
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`min-w-0 ${isDeepPage ? 'lg:col-span-4' : 'lg:col-span-3'}`}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
