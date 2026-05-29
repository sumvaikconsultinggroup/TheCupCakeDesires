'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  IndianRupee, ShoppingCart, Users,
  Package, Calendar, RefreshCw, Download,
  ChevronDown, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CreditCard, CheckCircle,
  BarChart3, PieChartIcon, Zap, Target,
  ArrowRight, ExternalLink, Sparkles, MapPin, Tag, RotateCcw, Truck
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
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
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  completed: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
  failed: '#ef4444'
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
        title: 'Active Users',
        value: data?.activeUsersCount || 0,
        icon: Users,
        color: 'emerald',
        bgGradient: 'from-emerald-500 to-teal-600',
        link: '/admin/analytics/live-activity'
      }
    } else if (type === 'active-carts') {
      return {
        title: 'Active Carts',
        value: data?.activeCartsCount || 0,
        icon: ShoppingCart,
        color: 'blue',
        bgGradient: 'from-blue-500 to-cyan-600',
        link: '/admin/analytics/live-activity'
      }
    } else {
      return {
        title: 'Abandoned Carts (24h)',
        value: data?.stats?.count || 0,
        icon: AlertTriangle,
        color: 'amber',
        bgGradient: 'from-amber-500 to-orange-600',
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
      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
    >
      <Link href={cardData.link} className="absolute inset-0 z-10" />
      <div className="relative z-0">
        <div className="flex items-center justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cardData.bgGradient}`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          {type !== 'abandoned-carts' && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-600">Live</span>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-500">{cardData.title}</p>
        <div className="flex items-center justify-between">
          <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">
            {loading ? '...' : cardData.value}
          </p>
          <ExternalLink className="h-4 w-4 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
    const toIst = (iso: string): string => {
      try { return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) } catch { return '' }
    }
    const headers = ['OrderID', 'Customer', 'Email', 'Phone', 'Status', 'PaymentMethod', 'Total', 'GST', 'CreatedAt(IST)']
    const rows = data.recentOrders.map(o => [
      o.orderNumber,
      o.customer,
      o.email,
      o.phone || '',
      o.status,
      o.paymentMethod || '',
      o.total,
      o.gst ?? '',
      toIst(o.createdAt),
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
      <span className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(value).toFixed(1)}{suffix}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
          <p className="mt-4 text-neutral-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
          <p className="mt-4 text-neutral-600">Failed to load dashboard data</p>
          <button
            onClick={() => fetchDashboard()}
            className="mt-4 rounded-lg bg-[#1B198F] px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const currentPeriod = PERIOD_OPTIONS.find(p => p.value === period)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      {/* Header */}
      <div className="sticky top-0 z-[110] border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-700 dark:bg-neutral-900/80">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-neutral-500">
              {format(new Date(data.period.start), 'MMM dd, yyyy')} — {format(new Date(data.period.end), 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative z-[101]">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-medium shadow-sm transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <Calendar className="h-4 w-4 text-neutral-500" />
                {currentPeriod?.label}
                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showPeriodDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl z-[100] dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {PERIOD_OPTIONS.filter(p => p.value !== 'custom').map(option => (
                        <button
                          key={option.value}
                          onClick={() => handlePeriodChange(option.value)}
                          className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${period === option.value
                            ? 'bg-[#1B198F] text-white'
                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                      <p className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">Custom Date Range</p>
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-xs text-neutral-500">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-neutral-500">End Date</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCustomDateApply}
                        disabled={!customStartDate || !customEndDate}
                        className="mt-3 w-full rounded-lg bg-[#1B198F] py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1B198F]/90"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export CSV (KPI 10) */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-medium shadow-sm transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
              title="Export recent orders as CSV"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-medium shadow-sm transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
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
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B198F] to-blue-600 p-6 text-white shadow-lg shadow-blue-500/20"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-50%] rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-0 h-24 w-24 translate-x-[-50%] translate-y-8 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <IndianRupee className="h-6 w-6" />
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
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-green-600" /> : <TrendIndicator value={data.summary.trends.orders} />}
            </div>
            <p className="mt-4 text-sm font-medium text-neutral-500">Total Orders</p>
            {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-green-600" /></div> : <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{data.summary.totalOrders}</p>}
            <p className="mt-1 text-xs text-neutral-400">All orders (paid + pending)</p>
          </motion.div>

          {/* AOV Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-purple-600" /> : <TrendIndicator value={data.summary.trends.aov} />}
            </div>
            <p className="mt-4 text-sm font-medium text-neutral-500">Avg Order Value</p>
            {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-purple-600" /></div> : <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{formatCurrency(data.summary.avgOrderValue)}</p>}
            <p className="mt-1 text-xs text-neutral-400">Paid revenue ÷ All orders</p>
          </motion.div>

          {/* Customers Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              {refreshing ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-600" /> : <TrendIndicator value={data.summary.trends.customers} />}
            </div>
            <p className="mt-4 text-sm font-medium text-neutral-500">Total Customers</p>
            {refreshing ? <div className="mt-2 flex h-8 items-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-600" /></div> : <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{data.summary.totalCustomers.toLocaleString()}</p>}
            <p className="mt-1 text-xs text-neutral-400">New in period: +{data.summary.newCustomers}</p>
          </motion.div>
        </div>

        {/* KPI 7 — YTD + All-Time anchor tile */}
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-neutral-600 dark:text-neutral-400">
            <span><span className="font-semibold text-neutral-900 dark:text-white">YTD Revenue:</span> {formatCurrency(data.summary.ytdRevenue)}</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span><span className="font-semibold text-neutral-900 dark:text-white">All-Time Revenue:</span> {formatCurrency(data.summary.allTimeRevenue)}</span>
            {data.summary.conversionRate !== null ? (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span><span className="font-semibold text-neutral-900 dark:text-white">Conversion:</span> {data.summary.conversionRate.toFixed(2)}%</span>
              </>
            ) : (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span className="italic text-neutral-400">Conversion rate: coming soon</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 1 — GST Net Revenue + GST Collected (Indian compliance) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-xs font-medium text-neutral-500">Net Revenue (Excl. GST)</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{formatCurrency(data.summary.netRevenueExclGst)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-3 text-xs font-medium text-neutral-500">GST Collected</p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{formatCurrency(data.summary.gstCollected)}</p>
            <p className="mt-1 text-xs text-neutral-400">
              CGST+SGST: {formatCurrency(data.summary.gstSplit.cgst + data.summary.gstSplit.sgst)} · IGST: {formatCurrency(data.summary.gstSplit.igst)}
            </p>
          </motion.div>

          {/* KPI 2 — Pending Fulfillment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <Link href="/admin/orders?status=paid" className="absolute inset-0 z-10" />
            <div className="relative z-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Truck className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-3 text-xs font-medium text-neutral-500">Pending Fulfillment</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{data.summary.pendingFulfillmentCount}</p>
              <p className="mt-1 text-xs text-neutral-400">paid + cod + confirmed + processing</p>
            </div>
          </motion.div>

          {/* KPI 3 — Refunds Outstanding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <Link href="/admin/refunds" className="absolute inset-0 z-10" />
            <div className="relative z-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <RotateCcw className="h-5 w-5 text-rose-600" />
              </div>
              <p className="mt-3 text-xs font-medium text-neutral-500">Refunds Outstanding</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{data.summary.refundsOutstandingCount}</p>
              <p className="mt-1 text-xs text-neutral-400">refund_initiated + return_initiated</p>
            </div>
          </motion.div>
        </div>

        {/* KPI 4 — New vs Returning customers (period-scoped) */}
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">New vs Returning Customers</h3>
              <p className="text-xs text-neutral-500">Distinct customers placing orders in this period</p>
            </div>
            <span className="text-xs font-medium text-neutral-500">
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
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <div className="h-full bg-emerald-500" style={{ width: `${nPct}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${rPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> New {n} ({nPct.toFixed(0)}%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Returning {r} ({rPct.toFixed(0)}%)</span>
                </div>
              </>
            )
          })()}
        </div>

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
            className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Sales Overview</h3>
                <p className="text-sm text-neutral-500">Revenue and orders over time</p>
              </div>
              <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-700">
                <button
                  onClick={() => setActiveChart('revenue')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeChart === 'revenue' ? 'bg-white shadow text-neutral-900 dark:bg-neutral-600 dark:text-white' : 'text-neutral-500'
                    }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setActiveChart('orders')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeChart === 'orders' ? 'bg-white shadow text-neutral-900 dark:bg-neutral-600 dark:text-white' : 'text-neutral-500'
                    }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {refreshing ? (
              <div className="flex h-80 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
              </div>
            ) : (
              <>
                <div className="h-80 w-full">
                  {data.charts.revenueOverTime.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-neutral-500">
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
                            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 z-10 whitespace-nowrap rounded-lg bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 dark:bg-white dark:text-neutral-900 shadow-lg">
                              <p className="font-bold text-center">{activeChart === 'revenue' ? formatCurrency(currentValue) : currentValue}</p>
                              <p className="text-[10px] opacity-80 text-center">{format(new Date(item.date), 'MMM dd')}</p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-white"></div>
                            </div>

                            <div
                              className={`w-full rounded-t-sm transition-all duration-500 ${activeChart === 'revenue'
                                  ? 'bg-[#1B198F] hover:bg-[#1B198F]/80 dark:bg-blue-500 dark:hover:bg-blue-400'
                                  : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-300'
                                }`}
                              style={{ height: `${heightPercentage}%` }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex justify-between text-xs text-neutral-500 px-1">
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
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Order Status</h3>
                <p className="text-sm text-neutral-500">Distribution by status</p>
              </div>
            </div>

            {refreshing ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
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
                      <span className="text-sm capitalize text-neutral-600 dark:text-neutral-400">{item.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{item.count}</span>
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
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Top Products</h3>
                <p className="text-sm text-neutral-500">Best sellers {activeProductView === 'revenue' ? 'by revenue' : 'by units sold'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-700">
                  <button
                    onClick={() => setActiveProductView('revenue')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${activeProductView === 'revenue' ? 'bg-white shadow text-neutral-900 dark:bg-neutral-600 dark:text-white' : 'text-neutral-500'}`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setActiveProductView('units')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${activeProductView === 'units' ? 'bg-white shadow text-neutral-900 dark:bg-neutral-600 dark:text-white' : 'text-neutral-500'}`}
                  >
                    Units
                  </button>
                </div>
                <Link
                  href="/admin/products"
                  className="flex items-center gap-1 text-sm font-medium text-[#1B198F] hover:underline"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {refreshing ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B198F]/10">
                              <BarChart3 className="h-4 w-4 text-[#1B198F]" />
                            </div>
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">
                              {product.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {activeProductView === 'revenue' ? formatCurrency(product.revenue) : `${product.quantity} units`}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1B198F] to-blue-600 transition-all"
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
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Payment Methods</h3>
                <p className="text-sm text-neutral-500">Paid orders in selected period, by method</p>
              </div>
            </div>

            {refreshing ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
              </div>
            ) : (
              <div className="space-y-4">
                {data.charts.paymentMethods.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No paid orders in selected period</p>
                  </div>
                ) : (
                  data.charts.paymentMethods.map((item) => (
                    <div key={item.method} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#1B198F] to-blue-600" />
                          <span className="text-sm font-medium text-neutral-900 dark:text-white">
                            {item.method}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-neutral-900 dark:text-white">
                            {formatCurrency(item.revenue)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-neutral-50 dark:bg-neutral-700/50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Orders (period)</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">{item.count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Avg Order Value</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                              {formatCurrency((item.count || 0) > 0 ? item.revenue / (item.count || 1) : 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
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
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Promo Codes</h3>
                <p className="text-sm text-neutral-500">Top redemptions in selected period</p>
              </div>
            </div>
            {data.charts.promoCodes.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">No promo codes used in this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs uppercase tracking-wider text-neutral-500">
                    <th className="pb-2 text-left">Code</th>
                    <th className="pb-2 text-right">Uses</th>
                    <th className="pb-2 text-right">Discount</th>
                    <th className="pb-2 text-right">Order Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {data.charts.promoCodes.map(p => (
                    <tr key={p.code}>
                      <td className="py-2 font-mono font-semibold text-neutral-900 dark:text-white">{p.code}</td>
                      <td className="py-2 text-right">{p.redemptions}</td>
                      <td className="py-2 text-right text-rose-600">-{formatCurrency(p.discountValue)}</td>
                      <td className="py-2 text-right font-semibold">{formatCurrency(p.orderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-neutral-500" />
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Top States</h3>
                <p className="text-sm text-neutral-500">Order volume by shipping state</p>
              </div>
            </div>
            {data.charts.topStates.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">No state-tagged orders in this period</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const max = Math.max(...data.charts.topStates.map(s => s.orders), 1)
                  return data.charts.topStates.map(s => {
                    const pct = (s.orders / max) * 100
                    return (
                      <div key={s.state} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-neutral-900 dark:text-white">{s.state}</span>
                          <span className="text-neutral-500">
                            {s.orders} orders · {formatCurrency(s.revenue)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
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
            className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Recent Orders</h3>
                <p className="text-sm text-neutral-500">Latest customer orders</p>
              </div>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-sm font-medium text-[#1B198F] hover:underline"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {refreshing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
                </div>
              ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Order</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Customer</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Payment</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Total</th>
                    <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                  {recentOrders.map(order => (
                    <tr key={order._id} className="group">
                      <td className="py-3">
                        <Link
                          href={`/admin/orders/${order.orderId}`}
                          className="font-medium text-neutral-900 hover:text-[#1B198F] dark:text-white"
                        >
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{order.customerName}</p>
                          <p className="text-xs text-neutral-500">{order.customerEmail}</p>
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
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="text-xs">
                          <p className="font-medium text-neutral-700 dark:text-neutral-300">{order.paymentDetails?.paymentMethod || 'N/A'}</p>
                          <p className={`capitalize ${order.paymentDetails?.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                            {order.paymentDetails?.paymentStatus || 'Pending'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 text-right text-sm text-neutral-500">
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
            className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 dark:bg-neutral-800 dark:ring-neutral-700"
          >
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">Low Stock Alert</h3>
                <p className="text-xs text-neutral-500">{lowStockItems.length} products</p>
              </div>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {refreshing ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-amber-600" />
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                  <p className="mt-2 text-sm text-neutral-500">All products are well stocked!</p>
                </div>
              ) : (
                lowStockItems.map((product, index) => (
                  <Link
                    key={`${product.handle}-${index}`}
                    href={`/admin/products/${product.handle}`}
                    className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-colors hover:bg-neutral-100 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-white">
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
                          <Package className="h-5 w-5 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {product.title}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {product.variant}
                      </p>
                      <p className={`text-xs font-semibold ${product.available <= 0 ? 'text-red-600' :
                          product.available <= 5 ? 'text-amber-600' : 'text-orange-600'
                        }`}>
                        {product.available <= 0 ? 'Out of stock' : `${product.available} left`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </Link>
                ))
              )}
            </div>

            {lowStockItems.length > 0 && (
              <Link
                href="/admin/products?stock=low"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <Package className="h-4 w-4" />
                Manage Inventory
              </Link>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="rounded-2xl bg-gradient-to-r from-[#1B198F] to-blue-600 p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <p className="text-sm text-white/70">Frequently used actions</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/products/new"
                className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 font-medium backdrop-blur transition-colors hover:bg-white/30"
              >
                <Package className="h-4 w-4" />
                Add Product
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 font-medium backdrop-blur transition-colors hover:bg-white/30"
              >
                <ShoppingCart className="h-4 w-4" />
                View Orders
              </Link>
              <Link
                href="/admin/bundles"
                className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 font-medium backdrop-blur transition-colors hover:bg-white/30"
              >
                <Sparkles className="h-4 w-4" />
                Create Bundle
              </Link>
              <Link
                href="/admin/blog"
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-medium text-[#1B198F] transition-colors hover:bg-white/90"
              >
                <Zap className="h-4 w-4" />
                Write Blog Post
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}