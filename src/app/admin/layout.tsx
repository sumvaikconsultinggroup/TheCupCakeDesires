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
import './admin-responsive.css'

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
  const [setupStoreName, setSetupStoreName] = useState('The Cupcake Desire')
  const [setupError, setSetupError] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.documentElement.classList.add('admin-active')
    return () => document.documentElement.classList.remove('admin-active')
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileMenuOpen])

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
      <div className="flex min-h-screen items-center justify-center bg-cream/40">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-cocoa" />
          <p className="font-bake-body text-sm text-cocoa-soft">Loading admin…</p>
        </div>
      </div>
    )
  }

  // Setup screen (first time)
  if (needsSetup) {
    return (
      <AuthShell
        eyebrow="First-time setup"
        scriptWord="kitchen"
        headline="Welcome to your kitchen."
        subhead="Let’s create the owner account that runs The Cupcake Desire."
      >
        <form onSubmit={handleSetup} className="space-y-4">
          {setupError && <AuthError message={setupError} />}

          <AuthField label="Your name">
            <User className="auth-input-icon" />
            <input
              type="text"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
              placeholder="Alex Baker"
              className="auth-input pl-10"
              required
            />
          </AuthField>

          <AuthField label="Email">
            <Mail className="auth-input-icon" />
            <input
              type="email"
              value={setupEmail}
              onChange={(e) => setSetupEmail(e.target.value)}
              placeholder="admin@cupcakedesires.com"
              className="auth-input pl-10"
              required
            />
          </AuthField>

          <AuthField label="Password" hint="At least 8 characters.">
            <Lock className="auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={setupPassword}
              onChange={(e) => setSetupPassword(e.target.value)}
              placeholder="Pick something strong"
              className="auth-input pl-10 pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-soft transition hover:text-cocoa"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>

          <AuthField label="Store name">
            <Building2 className="auth-input-icon" />
            <input
              type="text"
              value={setupStoreName}
              onChange={(e) => setSetupStoreName(e.target.value)}
              placeholder="The Cupcake Desire"
              className="auth-input pl-10"
            />
          </AuthField>

          <button
            type="submit"
            disabled={setupLoading}
            className="font-bake-body inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cocoa py-3 text-sm font-medium tracking-[0.02em] text-ivory transition-all hover:bg-rose-accent hover:shadow-[0_18px_36px_-18px_rgba(217,113,133,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {setupLoading ? 'Setting up…' : 'Create admin account'}
          </button>
        </form>
      </AuthShell>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <AuthShell
        eyebrow="Admin panel"
        scriptWord="behind"
        headline="The behind-the-counter view."
        subhead="Sign in to manage orders, menu and the Wednesday letter."
      >
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && <AuthError message={loginError} />}

          <AuthField label="Email">
            <Mail className="auth-input-icon" />
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="admin@cupcakedesires.com"
              className="auth-input pl-10"
              required
              autoFocus
            />
          </AuthField>

          <AuthField label="Password">
            <Lock className="auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              className="auth-input pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cocoa-soft transition hover:text-cocoa"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>

          <button
            type="submit"
            disabled={loginLoading}
            className="font-bake-body inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cocoa py-3 text-sm font-medium tracking-[0.02em] text-ivory transition-all hover:bg-rose-accent hover:shadow-[0_18px_36px_-18px_rgba(217,113,133,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loginLoading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link
              href="/"
              className="font-bake-body text-xs font-medium text-cocoa-soft underline decoration-rose-300 underline-offset-4 transition hover:text-rose-accent"
            >
              ← Back to storefront
            </Link>
          </div>
        </form>
      </AuthShell>
    )
  }

  // Main admin dashboard
  return (
    <div className={`admin-shell min-h-screen ${darkMode ? 'dark bg-neutral-900' : 'bg-cream/30'}`}>
      {/* Sidebar — z-40 on mobile, in-flow on desktop via the ml-offset below */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        hasPermission={hasPermission}
      />

      {/* Main column — offset for the fixed sidebar width on lg+ */}
      <div
        className={`admin-main-col min-w-0 transition-[margin] duration-200 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[264px]'
        }`}
      >
        <Header
          user={user}
          onMenuClick={() => setMobileMenuOpen(true)}
          onLogout={logout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Page Content — pages own their own padding (p-6 lg:p-8) */}
        <main className="min-w-0 max-w-full">{children}</main>
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

/* ──────────────── Shared auth-screen helpers ──────────────── */

function AuthShell({
  eyebrow,
  scriptWord,
  headline,
  subhead,
  children,
}: {
  eyebrow: string
  scriptWord: string
  headline: string
  subhead: string
  children: React.ReactNode
}) {
  // Headline like "The behind-the-counter view." — the scriptWord gets the italic accent.
  const parts = headline.split(scriptWord)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream/40 px-4 py-12">
      {/* Soft brand blooms */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-rose-accent/15 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-cocoa/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-line bg-ivory shadow-[0_40px_80px_-30px_rgba(46,31,21,0.45)] lg:grid-cols-[1.05fr_1fr]"
      >
        {/* Editorial pane */}
        <div className="relative hidden flex-col justify-between bg-cocoa p-10 text-ivory lg:flex">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full bg-rose-accent/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 h-[320px] w-[320px] rounded-full bg-rose-deep/15 blur-3xl"
          />
          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition hover:opacity-90"
              aria-label="The Cupcake Desire"
            >
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-ivory/15">
                <Image
                  src="/images/Cupcake-Logo.png"
                  alt="The Cupcake Desire"
                  fill
                  className="object-contain p-1"
                />
              </div>
              <span className="font-bake-display text-[17px] font-medium">The Cupcake Desire</span>
            </Link>
          </div>

          <div className="relative">
            <p className="font-bake-body text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/65">
              <span className="mr-3 inline-block h-px w-7 align-middle bg-rose-accent" />
              {eyebrow}
            </p>
            <h1 className="font-bake-display mt-5 text-[34px] font-medium leading-[1.1] tracking-tight text-ivory">
              {parts[0]}
              <span className="bake-display-italic text-rose-accent">{scriptWord}</span>
              {parts.slice(1).join(scriptWord)}
            </h1>
            <p className="font-bake-body mt-4 max-w-[34ch] text-[15px] leading-relaxed text-ivory/80">
              {subhead}
            </p>
          </div>

          <p className="font-bake-body relative text-[11px] text-ivory/50">
            352 Princes Hwy, Narre Warren VIC · Baked to order, every order.
          </p>
        </div>

        {/* Form pane */}
        <div className="flex flex-col justify-center p-7 sm:p-10">
          {/* Mobile-only mini brand row (the editorial pane is hidden on small screens) */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-cream">
              <Image
                src="/images/Cupcake-Logo.png"
                alt="The Cupcake Desire"
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="font-bake-display text-[15px] font-medium text-cocoa">
              The Cupcake Desire
            </span>
          </div>

          <div className="lg:hidden mb-5">
            <p className="font-bake-body text-[10px] font-semibold uppercase tracking-[0.18em] text-cocoa-soft">
              {eyebrow}
            </p>
            <h2 className="font-bake-display mt-2 text-[24px] font-medium leading-tight tracking-tight text-cocoa">
              {parts[0]}
              <span className="bake-display-italic text-rose-accent">{scriptWord}</span>
              {parts.slice(1).join(scriptWord)}
            </h2>
            <p className="font-bake-body mt-2 text-sm text-cocoa-soft">{subhead}</p>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  )
}

function AuthField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="font-bake-body mb-1.5 block text-[12px] font-medium uppercase tracking-[0.08em] text-cocoa-soft">
        {label}
      </span>
      <div className="relative">{children}</div>
      {hint && (
        <span className="font-bake-body mt-1 block text-[11px] text-cocoa-soft/80">{hint}</span>
      )}
    </label>
  )
}

function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="font-bake-body flex items-start gap-2 rounded-xl border border-rose-accent/40 bg-rose-accent/10 px-3 py-2.5 text-[13px] text-cocoa"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-accent" />
      <span>{message}</span>
    </div>
  )
}
