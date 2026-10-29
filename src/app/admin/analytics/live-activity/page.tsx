'use client'

import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Activity, ArrowLeft, Clock, Eye, Monitor, RefreshCw, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface ActiveSession {
  sessionId: string
  userId?: string
  userName?: string
  email?: string
  currentPage: string
  cartValue: number
  cartItemsCount: number
  lastActivityAt: string
  timeOnSite: number
}

export default function LiveActivityPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const inFlight = useRef(false)

  const fetchData = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/analytics/active-sessions', { cache: 'no-store' })
      const result = await res.json()

      if (res.ok && result.success) {
        setSessions(result.data.sessions)
        setStats(result.data)
        setUpdatedAt(new Date())
        setError('')
      } else {
        setError('Failed to load live activity. Please retry.')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching live activity:', error)
      setError('Failed to load live activity. Please retry.')
      setLoading(false)
    } finally {
      inFlight.current = false
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(() => {
        if (!document.hidden) void fetchData()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-[#2e1f15]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-0 bg-ivory p-6 text-cocoa md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/analytics"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-cocoa-soft hover:text-cocoa"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-bake-display text-[32px] leading-tight font-medium text-cocoa md:text-[40px]">
                Live Activity
              </h1>
              <div className="flex items-center gap-2 rounded-full bg-rose/40 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700">{autoRefresh ? 'Auto' : 'Paused'}</span>
              </div>
            </div>
            <p className="text-sm text-taupe">Sessions active within the last five minutes</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={fetchData}
              disabled={refreshing}
              aria-label="Refresh live activity"
              title="Refresh live activity"
              className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 font-medium transition-all hover:border-line"
            >
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bake-card min-w-0 p-6 text-cocoa">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Users className="h-6 w-6" />
            </div>
            <Activity className="h-5 w-5 opacity-70" />
          </div>
          <p className="mt-4 text-sm font-medium text-cocoa/80">Active Sessions</p>
          <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
            {stats?.activeUsersCount || 0}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose/40">
              <ShoppingCart className="h-6 w-6 text-rose-accent" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-taupe">Active Carts</p>
          <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words text-cocoa">
            {stats?.activeCartsCount || 0}
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose/40">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-taupe">Total Cart Value</p>
          <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words text-cocoa">
            {formatCurrency(stats?.totalCartValue || 0)}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose/40">
              <Monitor className="h-6 w-6 text-rose-accent" />
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-taupe">Busiest current page</p>
          <p className="mt-1 truncate text-sm font-semibold text-cocoa">
            {stats?.pageViews && Object.keys(stats.pageViews).length > 0
              ? Object.entries(stats.pageViews).sort(([, a]: any, [, b]: any) => b - a)[0][0]
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="border-y border-line bg-white px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-cocoa">Active Sessions</h2>
            <p className="text-sm text-taupe">Users currently browsing your store</p>
          </div>
          <p className="text-sm text-taupe">
            Last updated: {updatedAt?.toLocaleTimeString('en-AU', { timeZone: 'Australia/Melbourne' }) || '-'} Melbourne
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-line" />
            <p className="mt-4 text-taupe">No active users right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <motion.div
                key={session.sessionId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-3 hover:bg-cream"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cocoa">
                    <Users className="h-5 w-5 text-ivory" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold break-words text-cocoa">
                      {session.userName || session.email || `Guest ${session.sessionId.substring(0, 8)}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm break-all text-taupe">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(session.timeOnSite)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {session.currentPage}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {session.cartItemsCount > 0 && (
                    <div className="rounded-lg bg-rose/40 px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-rose-accent" />
                        <span className="text-sm font-semibold text-rose-accent">
                          {session.cartItemsCount} items • {formatCurrency(session.cartValue)}
                        </span>
                      </div>
                    </div>
                  )}
                  <span className="text-xs text-taupe">
                    {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Page Views */}
      {stats?.pageViews && Object.keys(stats.pageViews).length > 0 && (
        <div className="mt-6 border-t border-line bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-cocoa">Current sessions by page</h2>
          <div className="space-y-2">
            {Object.entries(stats.pageViews)
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 10)
              .map(([page, count]: any) => (
                <div key={page} className="flex items-center justify-between">
                  <span className="min-w-0 pr-3 text-sm break-all text-cocoa">{page}</span>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-cocoa">
                    {count} {count === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
