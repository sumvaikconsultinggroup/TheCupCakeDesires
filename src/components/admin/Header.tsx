'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Menu,
  Bell,
  Moon,
  Sun,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Activity,
  AlertTriangle,
  Package,
  ShoppingCart,
  CreditCard,
  Check,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CommandPalette from './CommandPalette'

interface Notification {
  id: string
  type: 'order' | 'stock' | 'payment' | 'system'
  title: string
  message: string
  time: string
  read: boolean
}

interface HeaderProps {
  user: {
    name?: string
    email?: string
    role?: string
  } | null
  onMenuClick: () => void
  onLogout: () => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
}

export default function Header({
  user,
  onMenuClick,
  onLogout,
  darkMode,
  setDarkMode,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Mock notifications - in production, fetch from API
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      message: 'Order #ORD-005 from Priya Patel - ₹4,999',
      time: '5 min ago',
      read: false,
    },
    {
      id: '2',
      type: 'stock',
      title: 'Low Stock Alert',
      message: 'BCAA 4:1:1 is running low (3 units left)',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Failed',
      message: 'Payment for Order #ORD-003 failed',
      time: '2 hours ago',
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case 'stock':
        return <Package className="h-4 w-4 text-orange-500" />
      case 'payment':
        return <CreditCard className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-neutral-500" />
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-lg dark:border-neutral-700 dark:bg-neutral-800/80 lg:px-8">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>

        {/* Command Palette Trigger */}
        <CommandPalette />
      </div>

      <div className="flex items-center gap-3">
        {/* Store Health Indicator */}
        <div className="hidden items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400 md:flex">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          All systems operational
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        {/* <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-[#1B198F] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-neutral-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
                          !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-neutral-900 dark:text-white`}>
                            {notification.title}
                          </p>
                          <p className="truncate text-xs text-neutral-500">{notification.message}</p>
                          <p className="mt-1 text-xs text-neutral-400">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-700">
                  <Link
                    href="/admin/notifications"
                    className="block py-3 text-center text-sm font-medium text-[#1B198F] hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    View all notifications
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div> */}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
            }}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B198F] font-semibold text-white">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-neutral-500 capitalize">{user?.role || 'owner'}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
              >
                <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
                  <p className="font-medium text-neutral-900 dark:text-white">{user?.name || 'Admin'}</p>
                  <p className="text-sm text-neutral-500">{user?.email || 'admin@store.com'}</p>
                </div>

                <div className="p-2">
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </Link>
                  <Link
                    href="/admin/settings/team"
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <User className="h-4 w-4" />
                    Team & Roles
                  </Link>
                </div>

                <div className="border-t border-neutral-200 p-2 dark:border-neutral-700">
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
