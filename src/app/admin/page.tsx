'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  DollarSign, ShoppingCart, Users,
  Package, Calendar, RefreshCw, Download,
  ChevronDown, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CreditCard, CheckCircle,
  BarChart3, PieChartIcon, Zap, Target,
  ArrowRight, ExternalLink, Sparkles, MapPin, Tag, RotateCcw, Truck
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import KitchenTodayWidget from '@/components/admin/KitchenTodayWidget'
import { fetchDashboardData, DashboardData } from './dashboard-actions'
import { getLowStockAlerts } from './inventory/inventory-actions'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today', shortLabel: 'Today' },
  { value: 'yesterday', label: 'Yesterday', shortLabel: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days', shortLabel: '7D' },
  { value: 'last30days', label: 'Last 30 Days', shortLabel: '30D' },
  { value: 'thisMonth', label: 'This Month', shortLabel: 'MTD' },
  { value: 'lastMonth', label: 'Last Month', shortLabel: 'Last Mo' },
  { value: 'thisYear', label: 'This Year', shortLabel: 'YTD' },
  { value: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
]

const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#f59e0b',
  pending: '#f59e0b',
  paid: '#10b981',
  in_kitchen: '#c89860',     // gold
  out_for_delivery: '#d97185', // rose-accent
  delivered: '#6f8d65',       // mint-accent
  completed: '#6f8d65',
  cancelled: '#ef4444',
  refunded: '#a16207',
  failed: '#ef4444',
}

const PAYMENT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

// Live Analytics Card Component
function LiveAnalyticsCard({ type }: { type: 'active-users' | 'active-carts' | 'abandoned-carts' }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (type === 'abandoned-carts') {
          const res = await fetch('/api/admin/analytics/abandoned-carts?status=abandoned&limit=10')
          const result = await res.json()
          setData(result.data)
        } else {
          const res = await fetch('/api/admin/analytics/active-sessions')
          const result = await res.json()
          setData(result.data)
        }
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [type])

  const getCardData = () => {
    if (type === 'active-users') {
      return {
        title: 'Active visitors',
        value: data?.activeUsersCount || 0,
        icon: Users,
        color: 'mint',
        bgGradient: 'from-mint-accent to-cocoa-soft',
        link: '/admin/analytics/live-activity'
      }
    } else if (type === 'active-carts') {
      return {
        title: 'Open carts',
        value: data?.activeCartsCount || 0,
        icon: ShoppingCart,
        color: 'cocoa',
        bgGradient: 'from-cocoa to-rose-accent',
        link: '/admin/analytics/live-activity'
      }
    } else {
      return {
        title: 'Abandoned carts (24h)',
        value: data?.stats?.count || 0,
        icon: AlertTriangle,
        color: 'rose',
        bgGradient: 'from-rose-accent to-cocoa',
        link: '/admin/analytics/abandoned-carts'
      }
    }
  }

  const cardData = getCardData()
  const IconComponent = cardData.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-6 shadow-sm"
    >
      <Link href={cardData.link} className="absolute inset-0 z-10" />
      <div className="relative z-0">
        <div className="flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cardData.bgGradient}`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          {type !== 'abandoned-carts' && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-mint-accent" />
              <span className="text-xs font-medium text-mint-accent">Live</span>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">{cardData.title}</p>
        <div className="flex items-center justify-between">
          <p className="mt-1 font-bake-display text-3xl text-cocoa">
            {loading ? '…' : cardData.value}
          </p>
          <ExternalLink className="h-4 w-4 text-taupe opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </motion.div>
  )
}


export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [data, setData] = useState<DashboardData | null>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState('last7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [appliedCustomStart, setAppliedCustomStart] = useState('')
  const [appliedCustomEnd, setAppliedCustomEnd] = useState('')
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders'>('revenue')
  const [activeProductView, setActiveProductView] = useState<'revenue' | 'units'>('revenue')

  const initialLoadDone = useRef(false)
  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing || initialLoadDone.current) setRefreshing(true)
    else setLoading(true)

    try {
      // Single round-trip to the dashboard server action; it returns
      // pre-joined recent orders (no N+1) and period-scoped payment-method
      // breakdown (no client-side override).
      const [dashboardResult, lowStockResult] = await Promise.all([
        fetchDashboardData(
          period,
          period === 'custom' ? appliedCustomStart : undefined,
          period === 'custom' ? appliedCustomEnd : undefined
        ),
        getLowStockAlerts(),
      ])

      if (dashboardResult.success && dashboardResult.data) {
        setData(dashboardResult.data)
        // Surface dashboard-action recent orders directly (already enriched
        // via $lookup). Map to the legacy shape the table reads.
        const enriched = dashboardResult.data.recentOrders.slice(0, 6).map(o => ({
          _id: o._id,
          orderId: o.orderNumber,
          customerName: o.customer,
          customerEmail: o.email,
          status: o.status,
          paymentDetails: { paymentMethod: o.paymentMethod || '-', paymentStatus: o.paymentStatus },
          totalAmount: o.total,
          createdAt: o.createdAt,
        }))
        setRecentOrders(enriched)
      } else {
        toast.error(dashboardResult.error || 'Failed to load dashboard')
      }

      if (lowStockResult.success) {
        setLowStockItems(lowStockResult.alerts)
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
      initialLoadDone.current = true
    }
  }, [period, appliedCustomStart, appliedCustomEnd])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      // Don't auto-fetch for custom period without dates
      if (period === 'custom' && (!appliedCustomStart || !appliedCustomEnd)) {
        return
      }
      fetchDashboard()
    }
  }, [isAuthenticated, fetchDashboard, period, appliedCustomStart, appliedCustomEnd])

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    setShowPeriodDropdown(false)
    // Only fetch data if it's NOT custom range
    // Custom range requires user to click "Apply Range" button
    if (newPeriod !== 'custom') {
      fetchDashboard()
    }
  }

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setAppliedCustomStart(customStartDate)
      setAppliedCustomEnd(customEndDate)
      setPeriod('custom')
      setShowPeriodDropdown(false)
    } else {
      toast.error('Please select both start and end dates')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // KPI 10 — CSV export of recent orders feed
  const handleExportCsv = useCallback(() => {
    if (!data || data.recentOrders.length === 0) {
      toast.error('No orders to export')
      return
    }
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return '""'
      const s = String(v).replace(/"/g, '""')
      return `"${s}"`
    }
    const toLocal = (iso: string): string => {
      try { return new Date(iso).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }) } catch { return '' }
    }
    const headers = ['OrderID', 'Customer', 'Email', 'Phone', 'Status', 'PaymentMethod', 'Total (AUD)', 'GST', 'CreatedAt(Melbourne)']
    const rows = data.recentOrders.map(o => [
      o.orderNumber,
      o.customer,
      o.email,
      o.phone || '',
      o.status,
      o.paymentMethod || '',
      o.total,
      o.gst ?? '',
      toLocal(o.createdAt),
    ].map(escape).join(','))
    const csv = [headers.map(escape).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data])

  const getStatusColor = (status: string) => STATUS_COLORS[status?.toLowerCase()] || '#6b7280'

  const TrendIndicator = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    const isPositive = value >= 0
    return (
      <span className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-mint-accent' : 'text-rose-accent'}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(value).toFixed(1)}{suffix}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-cream border-t-cocoa" />
          <p className="mt-4 text-cocoa-soft">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-rose-accent" />
          <p className="mt-4 text-cocoa-soft">Failed to load dashboard data</p>
          <button
            onClick={() => fetchDashboard()}
            className="mt-4 rounded-lg bg-cocoa px-4 py-2 text-ivory hover:bg-cocoa-soft"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const currentPeriod = PERIOD_OPTIONS.find(p => p.value === period)

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="sticky top-0 z-[110] border-b border-line bg-cream/80 backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-taupe uppercase">
              Narre Warren · CupCake Desires
            </p>
            <h1 className="font-bake-display text-3xl text-cocoa">Dashboard</h1>
            <p className="mt-1 text-sm text-cocoa-soft">
              {format(new Date(data.period.start), 'MMM dd, yyyy')} — {format(new Date(data.period.end), 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative z-[101]">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 rounded-xl border border-line bg-ivory px-4 py-2.5 font-medium text-cocoa shadow-sm transition-all hover:bg-cream"
              >
                <Calendar className="h-4 w-4 text-cocoa-soft" />
                {currentPeriod?.label}
                <ChevronDown className={`h-4 w-4 text-taupe transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showPeriodDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-line bg-ivory p-2 shadow-xl z-[100]"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {PERIOD_OPTIONS.filter(p => p.value !== 'custom').map(option => (
                        <button
                          key={option.value}
                          onClick={() => handlePeriodChange(option.value)}
                          className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${period === option.value
                            ? 'bg-cocoa text-ivory'
                            : 'text-cocoa-soft hover:bg-cream'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-line pt-3">
                      <p className="mb-2 text-xs font-semibold text-cocoa">Custom date range</p>
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-xs text-taupe">Start date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-cocoa focus:border-cocoa focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-taupe">End date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm text-cocoa focus:border-cocoa focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCustomDateApply}
                        disabled={!customStartDate || !customEndDate}
                        className="mt-3 w-full rounded-lg bg-cocoa py-2.5 text-sm font-medium text-ivory transition-opacity hover:bg-cocoa-soft disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply custom range
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export CSV (KPI 10) */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-xl border border-line bg-ivory px-4 py-2.5 font-medium text-cocoa shadow-sm transition-all hover:bg-cream"
              title="Export recent orders as CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 font-medium text-ivory shadow-sm transition-all hover:bg-cocoa-soft disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cocoa to-rose-accent p-6 text-white shadow-lg shadow-blue-500/20"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-50%] rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-0 h-24 w-24 translate-x-[-50%] translate-y-8 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <DollarSign className="h-6 w-6" />
                </div>
                {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <TrendIndicator value={data.summary.trends.revenue} />}
              </div>
              <p className="mt-4 text-sm font-medium text-white/70">Total Revenue</p>
              {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /></div> : <p className="mt-1 text-3xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>}
              <p className="mt-1 text-xs text-white/50">From paid orders only</p>
            </div>
          </motion.div>

          {/* Orders Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint">
                <ShoppingCart className="h-6 w-6 text-mint-accent" />
              </div>
              {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-mint-accent" /> : <TrendIndicator value={data.summary.trends.orders} />}
            </div>
            <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">Total orders</p>
            {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-mint-accent" /></div> : <p className="mt-1 font-bake-display text-3xl text-cocoa">{data.summary.totalOrders}</p>}
            <p className="mt-1 text-xs text-taupe">Paid + awaiting payment</p>
          </motion.div>

          {/* AOV Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream-deep">
                <Target className="h-6 w-6 text-cocoa" />
              </div>
              {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-cocoa" /> : <TrendIndicator value={data.summary.trends.aov} />}
            </div>
            <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">Avg order value</p>
            {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-cocoa" /></div> : <p className="mt-1 font-bake-display text-3xl text-cocoa">{formatCurrency(data.summary.avgOrderValue)}</p>}
            <p className="mt-1 text-xs text-taupe">Paid revenue ÷ all orders</p>
          </motion.div>

          {/* Customers Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose">
                <Users className="h-6 w-6 text-rose-accent" />
              </div>
              {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-rose-accent" /> : <TrendIndicator value={data.summary.trends.customers} />}
            </div>
            <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">Total customers</p>
            {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-cream border-t-rose-accent" /></div> : <p className="mt-1 font-bake-display text-3xl text-cocoa">{data.summary.totalCustomers.toLocaleString()}</p>}
            <p className="mt-1 text-xs text-taupe">New in period: +{data.summary.newCustomers}</p>
          </motion.div>
        </div>

        {/* KPI 7 — YTD + All-Time anchor tile */}
        <div className="rounded-xl border border-line bg-cream px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-cocoa-soft">
            <span><span className="font-semibold text-cocoa">YTD revenue:</span> {formatCurrency(data.summary.ytdRevenue)}</span>
            <span className="text-line">·</span>
            <span><span className="font-semibold text-cocoa">All-time revenue:</span> {formatCurrency(data.summary.allTimeRevenue)}</span>
            {data.summary.conversionRate !== null ? (
              <>
                <span className="text-line">·</span>
                <span><span className="font-semibold text-cocoa">Conversion:</span> {data.summary.conversionRate.toFixed(2)}%</span>
              </>
            ) : (
              <>
                <span className="text-line">·</span>
                <span className="italic text-taupe">Conversion rate: coming soon</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 1 — Net revenue + GST collected (AU GST is 10%, included in price) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint">
              <DollarSign className="h-5 w-5 text-mint-accent" />
            </div>
            <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">Net revenue (excl. GST)</p>
            <p className="mt-1 font-bake-display text-2xl text-cocoa">{formatCurrency(data.summary.netRevenueExclGst)}</p>
            <p className="mt-1 text-xs text-taupe">After backing out 10% GST</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-deep">
              <BarChart3 className="h-5 w-5 text-cocoa" />
            </div>
            <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">GST collected</p>
            <p className="mt-1 font-bake-display text-2xl text-cocoa">{formatCurrency(data.summary.gstCollected)}</p>
            <p className="mt-1 text-xs text-taupe">For your next BAS lodgement</p>
          </motion.div>

          {/* KPI 2 — Pending Fulfillment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative rounded-2xl border border-line bg-ivory p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href="/admin/orders?status=paid" className="absolute inset-0 z-10" />
            <div className="relative z-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-deep">
                <Truck className="h-5 w-5 text-cocoa" />
              </div>
              <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">Awaiting kitchen</p>
              <p className="mt-1 font-bake-display text-2xl text-cocoa">{data.summary.pendingFulfillmentCount}</p>
              <p className="mt-1 text-xs text-taupe">Paid orders not yet on the bake board</p>
            </div>
          </motion.div>

          {/* KPI 3 — Refunds Outstanding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative rounded-2xl border border-line bg-ivory p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href="/admin/refunds" className="absolute inset-0 z-10" />
            <div className="relative z-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose">
                <RotateCcw className="h-5 w-5 text-rose-accent" />
              </div>
              <p className="mt-3 text-xs font-semibold tracking-[0.18em] text-taupe uppercase">Refunds queue</p>
              <p className="mt-1 font-bake-display text-2xl text-cocoa">{data.summary.refundsOutstandingCount}</p>
              <p className="mt-1 text-xs text-taupe">Awaiting Stripe refund approval</p>
            </div>
          </motion.div>
        </div>

        {/* KPI 4 — New vs Returning customers (period-scoped) */}
        <div className="rounded-2xl border border-line bg-ivory p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bake-display text-lg text-cocoa">New vs returning customers</h3>
              <p className="text-xs text-taupe">Distinct customers placing orders in this period</p>
            </div>
            <span className="text-xs font-semibold tracking-[0.18em] text-taupe uppercase">
              {data.summary.newVsReturning.newCustomers + data.summary.newVsReturning.returningCustomers} total
            </span>
          </div>
          {(() => {
            const n = data.summary.newVsReturning.newCustomers
            const r = data.summary.newVsReturning.returningCustomers
            const tot = n + r
            const nPct = tot > 0 ? (n / tot) * 100 : 0
            const rPct = tot > 0 ? (r / tot) * 100 : 0
            return (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-cream">
                  <div className="h-full bg-mint-accent" style={{ width: `${nPct}%` }} />
                  <div className="h-full bg-rose-accent" style={{ width: `${rPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-cocoa-soft">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-mint-accent" /> New {n} ({nPct.toFixed(0)}%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-accent" /> Returning {r} ({rPct.toFixed(0)}%)</span>
                </div>
              </>
            )
          })()}
        </div>

        {/* Kitchen widget — today's bake board + past-due strip */}
        <KitchenTodayWidget />

        {/* Real-Time Analytics Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <LiveAnalyticsCard type="active-users" />
          <LiveAnalyticsCard type="active-carts" />
          <LiveAnalyticsCard type="abandoned-carts" />
        </div>

        {/* Main Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue/Orders Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Sales overview</h3>
                <p className="text-sm text-taupe">Revenue and orders over time</p>
              </div>
              <div className="flex rounded-lg border border-line bg-cream p-1">
                <button
                  onClick={() => setActiveChart('revenue')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeChart === 'revenue' ? 'bg-cocoa text-ivory shadow' : 'text-cocoa-soft'
                    }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setActiveChart('orders')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeChart === 'orders' ? 'bg-cocoa text-ivory shadow' : 'text-cocoa-soft'
                    }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {refreshing ? (
              <div className="flex h-80 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream border-t-cocoa" />
              </div>
            ) : (
              <>
                <div className="h-80 w-full">
                  {data.charts.revenueOverTime.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-taupe">
                      No data available for this period
                    </div>
                  ) : (
                    <div className="flex h-full items-end gap-1 sm:gap-2 pt-8 pb-2">
                      {data.charts.revenueOverTime.map((item, index) => {
                        const maxValue = Math.max(...data.charts.revenueOverTime.map(d => activeChart === 'revenue' ? d.revenue : d.orders)) || 1
                        const currentValue = activeChart === 'revenue' ? item.revenue : item.orders
                        const heightPercentage = Math.max((currentValue / maxValue) * 100, 4)

                        return (
                          <div key={index} className="group relative flex-1 flex flex-col justify-end h-full">
                            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-cocoa px-2 py-1 text-xs text-ivory opacity-0 transition-opacity group-hover:block group-hover:opacity-100 shadow-lg">
                              <p className="font-bold text-center">{activeChart === 'revenue' ? formatCurrency(currentValue) : currentValue}</p>
                              <p className="text-[10px] opacity-80 text-center">{format(new Date(item.date), 'MMM dd')}</p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cocoa"></div>
                            </div>

                            <div
                              className={`w-full rounded-t-sm transition-all duration-500 ${activeChart === 'revenue'
                                  ? 'bg-cocoa hover:bg-cocoa-soft'
                                  : 'bg-rose-accent hover:opacity-90'
                                }`}
                              style={{ height: `${heightPercentage}%` }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex justify-between text-xs text-taupe px-1">
                  {data.charts.revenueOverTime.length > 0 && (
                    <>
                      <span>{format(new Date(data.charts.revenueOverTime[0].date), 'MMM dd')}</span>
                      {data.charts.revenueOverTime.length > 1 && (
                        <span>{format(new Date(data.charts.revenueOverTime[Math.floor(data.charts.revenueOverTime.length / 2)].date), 'MMM dd')}</span>
                      )}
                      <span>{format(new Date(data.charts.revenueOverTime[data.charts.revenueOverTime.length - 1].date), 'MMM dd')}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>

          {/* Order Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-taupe" />
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Order status</h3>
                <p className="text-sm text-taupe">Distribution by status</p>
              </div>
            </div>

            {refreshing ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream border-t-cocoa" />
              </div>
            ) : (
              <div className="space-y-2">
                {data.charts.orderStatus.map(item => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      />
                      <span className="text-sm capitalize text-cocoa-soft">{item.status.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-cocoa">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Top products</h3>
                <p className="text-sm text-taupe">Best sellers {activeProductView === 'revenue' ? 'by revenue' : 'by units sold'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-line bg-cream p-1">
                  <button
                    onClick={() => setActiveProductView('revenue')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${activeProductView === 'revenue' ? 'bg-cocoa text-ivory shadow' : 'text-cocoa-soft'}`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setActiveProductView('units')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${activeProductView === 'units' ? 'bg-cocoa text-ivory shadow' : 'text-cocoa-soft'}`}
                  >
                    Units
                  </button>
                </div>
                <Link
                  href="/admin/products"
                  className="flex items-center gap-1 text-sm font-medium text-cocoa hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {refreshing ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream border-t-cocoa" />
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const sorted = [...data.charts.topProducts].sort((a, b) =>
                    activeProductView === 'revenue' ? b.revenue - a.revenue : b.quantity - a.quantity
                  ).slice(0, 5)
                  const max = Math.max(...sorted.map(p => activeProductView === 'revenue' ? p.revenue : p.quantity), 1)
                  return sorted.map((product, index) => {
                    const value = activeProductView === 'revenue' ? product.revenue : product.quantity
                    const percentage = (value / max) * 100
                    return (
                      <div key={`${product.name}-${index}`} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-deep">
                              <BarChart3 className="h-4 w-4 text-cocoa" />
                            </div>
                            <span className="text-sm font-medium text-cocoa">
                              {product.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-cocoa">
                            {activeProductView === 'revenue' ? formatCurrency(product.revenue) : `${product.quantity} units`}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cocoa to-rose-accent transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-taupe" />
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Payment methods</h3>
                <p className="text-sm text-taupe">Paid orders in selected period, by method</p>
              </div>
            </div>

            {refreshing ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream border-t-cocoa" />
              </div>
            ) : (
              <div className="space-y-4">
                {data.charts.paymentMethods.length === 0 ? (
                  <div className="py-8 text-center text-taupe">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No paid orders in selected period</p>
                  </div>
                ) : (
                  data.charts.paymentMethods.map((item) => (
                    <div key={item.method} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cocoa to-rose-accent" />
                          <span className="text-sm font-medium text-cocoa">
                            {item.method}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bake-display text-lg text-cocoa">
                            {formatCurrency(item.revenue)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-line bg-cream p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-taupe mb-1">Orders (period)</p>
                            <p className="font-bake-display text-xl text-cocoa">{item.count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-taupe mb-1">Avg order value</p>
                            <p className="font-bake-display text-xl text-cocoa">
                              {formatCurrency((item.count || 0) > 0 ? item.revenue / (item.count || 1) : 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-taupe">
                        <div className="h-1.5 w-1.5 rounded-full bg-mint-accent" />
                        <span>Scoped to selected period · paid orders only</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* KPI 5 + 6 — Promo Codes & Geographic Distribution */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-taupe" />
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Promo codes</h3>
                <p className="text-sm text-taupe">Top redemptions in selected period</p>
              </div>
            </div>
            {data.charts.promoCodes.length === 0 ? (
              <p className="py-8 text-center text-sm text-taupe">No promo codes used in this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wider text-taupe">
                    <th className="pb-2 text-left">Code</th>
                    <th className="pb-2 text-right">Uses</th>
                    <th className="pb-2 text-right">Discount</th>
                    <th className="pb-2 text-right">Order value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {data.charts.promoCodes.map(p => (
                    <tr key={p.code}>
                      <td className="py-2 font-mono font-semibold text-cocoa">{p.code}</td>
                      <td className="py-2 text-right text-cocoa-soft">{p.redemptions}</td>
                      <td className="py-2 text-right text-rose-accent">-{formatCurrency(p.discountValue)}</td>
                      <td className="py-2 text-right font-semibold text-cocoa">{formatCurrency(p.orderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-taupe" />
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Top delivery suburbs</h3>
                <p className="text-sm text-taupe">Order volume by suburb / state</p>
              </div>
            </div>
            {data.charts.topStates.length === 0 ? (
              <p className="py-8 text-center text-sm text-taupe">No location-tagged orders in this period</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const max = Math.max(...data.charts.topStates.map(s => s.orders), 1)
                  return data.charts.topStates.map(s => {
                    const pct = (s.orders / max) * 100
                    return (
                      <div key={s.state} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-cocoa">{s.state}</span>
                          <span className="text-taupe">
                            {s.orders} orders · {formatCurrency(s.revenue)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-mint-accent to-rose-accent"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Row - Recent Orders & Low Stock */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Recent orders</h3>
                <p className="text-sm text-taupe">Latest customer orders</p>
              </div>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-sm font-medium text-cocoa hover:underline"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {refreshing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream border-t-cocoa" />
                </div>
              ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-taupe">Order</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-taupe">Customer</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-taupe">Status</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-taupe">Payment</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-taupe">Total</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-taupe">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {recentOrders.map(order => (
                    <tr key={order._id} className="group transition-colors hover:bg-cream">
                      <td className="py-3">
                        <Link
                          href={`/admin/orders/${order.orderId}`}
                          className="font-mono font-medium text-cocoa hover:underline"
                        >
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-cocoa">{order.customerName}</p>
                          <p className="text-xs text-taupe">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                          style={{
                            backgroundColor: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status)
                          }}
                        >
                          {(order.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="text-xs">
                          <p className="font-medium text-cocoa">Stripe</p>
                          <p className={`capitalize ${order.paymentDetails?.paymentStatus === 'paid' ? 'text-mint-accent' : 'text-amber-700'}`}>
                            {order.paymentDetails?.paymentStatus || 'Pending'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold text-cocoa">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 text-right text-sm text-taupe">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </motion.div>

          {/* Low Stock Alert */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-2xl border border-line bg-ivory p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose">
                <AlertTriangle className="h-4 w-4 text-rose-accent" />
              </div>
              <div>
                <h3 className="font-bake-display text-lg text-cocoa">Low stock</h3>
                <p className="text-xs text-taupe">{lowStockItems.length} product{lowStockItems.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {refreshing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream border-t-rose-accent" />
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-10 w-10 text-mint-accent" />
                  <p className="mt-2 text-sm text-taupe">Pantry&rsquo;s full — all products in stock.</p>
                </div>
              ) : (
                lowStockItems.map((product, index) => (
                  <Link
                    key={`${product.handle}-${index}`}
                    href={`/admin/products/${product.handle}`}
                    className="flex items-center gap-3 rounded-xl border border-line-soft bg-cream p-3 transition-colors hover:bg-cream-deep"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-ivory">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-5 w-5 text-taupe" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-cocoa">
                        {product.title}
                      </p>
                      <p className="truncate text-xs text-taupe">
                        {product.variant}
                      </p>
                      <p className={`text-xs font-semibold ${product.available <= 0 ? 'text-red-600' :
                          product.available <= 5 ? 'text-amber-700' : 'text-rose-accent'
                        }`}>
                        {product.available <= 0 ? 'Out of stock' : `${product.available} left`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-taupe" />
                  </Link>
                ))
              )}
            </div>

            {lowStockItems.length > 0 && (
              <Link
                href="/admin/products?stock=low"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose py-2.5 text-sm font-medium text-cocoa transition-colors hover:bg-rose-deep"
              >
                <Package className="h-4 w-4" />
                Manage inventory
              </Link>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="rounded-2xl bg-gradient-to-r from-cocoa to-rose-accent p-6 text-ivory shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-ivory/60 uppercase">Shortcuts</p>
              <h3 className="font-bake-display text-xl">Quick actions</h3>
              <p className="text-sm text-ivory/70">Frequently used jumps from the bake board</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin/orders/kitchen"
                className="flex items-center gap-2 rounded-xl bg-ivory/15 px-4 py-2.5 font-medium backdrop-blur transition-colors hover:bg-ivory/25"
              >
                <Package className="h-4 w-4" />
                Kitchen queue
              </Link>
              <Link
                href="/admin/products/new"
                className="flex items-center gap-2 rounded-xl bg-ivory/15 px-4 py-2.5 font-medium backdrop-blur transition-colors hover:bg-ivory/25"
              >
                <Sparkles className="h-4 w-4" />
                Add product
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 rounded-xl bg-ivory/15 px-4 py-2.5 font-medium backdrop-blur transition-colors hover:bg-ivory/25"
              >
                <ShoppingCart className="h-4 w-4" />
                View orders
              </Link>
              <Link
                href="/admin/blog"
                className="flex items-center gap-2 rounded-xl bg-ivory px-4 py-2.5 font-medium text-cocoa transition-colors hover:bg-cream"
              >
                <Zap className="h-4 w-4" />
                Write blog post
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}