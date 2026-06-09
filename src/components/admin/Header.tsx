'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import CommandPalette from './CommandPalette'

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
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!showUserMenu) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [showUserMenu])

  const initial = (user?.name?.charAt(0) || 'A').toUpperCase()
  const role = user?.role || 'owner'

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-ivory/95 px-4 backdrop-blur lg:px-8">
      {/* Left — mobile menu trigger + command palette */}
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cocoa-soft transition hover:bg-cream hover:text-cocoa lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <CommandPalette />
        </div>
      </div>

      {/* Right — status pill, theme toggle, user menu */}
      <div className="flex items-center gap-2">
        {/* System status */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          All systems operational
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cocoa-soft transition hover:bg-cream hover:text-cocoa"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="inline-flex items-center gap-2.5 rounded-xl border border-line bg-ivory px-2.5 py-1.5 transition hover:border-rose-accent"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            <span className="font-bake-display flex h-8 w-8 items-center justify-center rounded-full bg-cocoa text-sm font-semibold text-ivory">
              {initial}
            </span>
            <div className="hidden text-left sm:block">
              <p className="font-bake-display text-[13px] font-medium leading-tight text-cocoa">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[11px] capitalize leading-tight text-cocoa-soft">{role}</p>
            </div>
            <ChevronDown
              className={`hidden h-3.5 w-3.5 text-cocoa-soft transition-transform sm:block ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-ivory shadow-[0_20px_40px_-22px_rgba(46,31,21,0.35)]"
              >
                <div className="border-b border-line bg-cream/40 px-4 py-3">
                  <p className="font-bake-display text-sm font-medium text-cocoa">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-cocoa-soft">
                    <Mail className="h-3 w-3" />
                    {user?.email || 'admin@cupcakedesires.com'}
                  </p>
                </div>

                <div className="p-1.5">
                  <MenuLink
                    href="/admin/settings"
                    icon={Settings}
                    label="Account settings"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <MenuLink
                    href="/admin/settings/team"
                    icon={User}
                    label="Team & roles"
                    onClick={() => setShowUserMenu(false)}
                  />
                </div>

                <div className="border-t border-line p-1.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      onLogout()
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
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

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-cocoa transition hover:bg-cream/60 hover:text-rose-accent"
      role="menuitem"
    >
      <Icon className="h-4 w-4 text-cocoa-soft" strokeWidth={1.8} />
      {label}
    </Link>
  )
}
