'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, needsSetup, login, logout, setup, hasPermission } = useAdminAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Setup form state
  const [setupName, setSetupName] = useState('')
  const [setupEmail, setSetupEmail] = useState('')
  const [setupPassword, setSetupPassword] = useState('')
  const [setupStoreName, setSetupStoreName] = useState('Gibbon Nutrition')
  const [setupError, setSetupError] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Route permission check - redirect if user doesn't have access
  useEffect(() => {
    if (!isAuthenticated || isLoading || needsSetup) return

    // Allow access to base admin route, forbidden page, and login/setup pages
    if (pathname === '/admin' || pathname === '/admin/login' || pathname === '/admin/setup' || pathname === '/admin/forbidden') {
      return
    }

    // Check if user has permission for current route
    let hasAccess = false
    
    // First, check for exact route match
    if (hasPermission(pathname)) {
      hasAccess = true
    } else {
      // For nested routes (like /admin/settings/team or /admin/analytics/live-activity)
      // Check if user has permission for the immediate parent route
      // But NOT the base /admin route to prevent overly broad access
      const pathParts = pathname.split('/').filter(Boolean)
      
      // Only check parent routes if we're at depth 3 or more (e.g., /admin/settings/team)
      if (pathParts.length >= 3) {
        // Check one level up (e.g., /admin/settings for /admin/settings/team)
        const parentPath = '/' + pathParts.slice(0, -1).join('/')
        if (hasPermission(parentPath)) {
          hasAccess = true
        }
      }
    }

    // If no access, redirect to forbidden page
    if (!hasAccess) {
      router.push('/admin/forbidden')
    }
  }, [pathname, isAuthenticated, isLoading, needsSetup, hasPermission, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    const result = await login(loginEmail, loginPassword)
    
    if (!result.success) {
      setLoginError(result.message)
    }
    setLoginLoading(false)
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupError('')
    setSetupLoading(true)

    const result = await setup({
      email: setupEmail,
      password: setupPassword,
      name: setupName,
      storeName: setupStoreName,
    })
    
    if (!result.success) {
      setSetupError(result.message)
    }
    setSetupLoading(false)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#1B198F]" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Setup screen (first time)
  if (needsSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1B198F] via-blue-600 to-purple-700 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-[#1B198F] to-blue-600 p-6 text-center">
            <Image src="/GibbonLogoEccom.png" alt="Gibbon" width={180} height={50} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Welcome to Your Store</h1>
            <p className="text-white/80">Let&apos;s set up your admin account</p>
          </div>

          <form onSubmit={handleSetup} className="p-6 space-y-4">
            {setupError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {setupError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Your Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="admin@gibbonnutrition.com"
                  className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-12 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Store Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={setupStoreName}
                  onChange={(e) => setSetupStoreName(e.target.value)}
                  placeholder="My Store"
                  className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={setupLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B198F] py-3 font-semibold text-white transition-all hover:bg-[#1B198F]/90 disabled:opacity-50"
            >
              {setupLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {setupLoading ? 'Setting up...' : 'Create Admin Account'}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1B198F] via-blue-600 to-purple-700 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="bg-gradient-to-r from-[#1B198F] to-blue-600 p-6 text-center">
            <Image src="/GibbonLogoEccom.png" alt="Gibbon" width={180} height={50} className="mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-white/80">Sign in to manage your store</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {loginError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@gibbonnutrition.com"
                  className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-12 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B198F] py-3 font-semibold text-white transition-all hover:bg-[#1B198F]/90 disabled:opacity-50"
            >
              {loginLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <Link href="/" className="text-sm text-[#1B198F] hover:underline">
                ← Back to Store
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  // Main admin dashboard
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-neutral-900' : 'bg-neutral-50'}`}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        hasPermission={hasPermission}
      />

      {/* Main Content */}
      <div className={`transition-all ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
        {/* Header */}
        <Header
          user={user}
          onMenuClick={() => setMobileMenuOpen(true)}
          onLogout={logout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
