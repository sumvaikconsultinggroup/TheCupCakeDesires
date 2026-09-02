'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Eye,
  ShoppingCart,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'

interface AnalyticsData {
  revenue: {
    total: number
    change: number
    chartData: { date: string; value: number }[]
  }
  orders: {
    total: number
    change: number
    chartData: { date: string; value: number }[]
  }
  visitors: {
    total: number
    change: number
    chartData: { date: string; value: number }[]
  }
  conversionRate: number
  conversionChange: number
  averageOrderValue: number
  abandonedCartRate: number
  topCategories: { name: string; sales: number; percentage: number }[]
  salesByChannel: { channel: string; value: number; color: string }[]
  recentActivity: { type: string; description: string; time: string }[]
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders'>('revenue')
  const [showAllActivity, setShowAllActivity] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Use server action instead of API route
      const { getAnalyticsData } = await import('./analytics-actions')
      const result = await getAnalyticsData(timeRange)

      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
    setLoading(false)
  }

  const StatCard = ({ title, value, change, icon: Icon, color, chartData }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
            {loading ? (
              <span className="inline-block h-9 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            ) : (
              value
            )}
          </p>
          <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(change).toFixed(1)}% vs last period
          </div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {/* Mini Chart */}
      <div className="mt-4 flex h-16 items-end gap-1">
        {chartData?.slice(-14).map((d: any, i: number) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-[#2e1f15]/20 transition-all hover:bg-[#2e1f15]/40"
            style={{ height: `${(d.value / (Math.max(...chartData.map((x: any) => x.value)) || 1)) * 100}%` }}
          />
        ))}
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
          <p className="text-neutral-500">Track your store performance and insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#2e1f15]/90">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>



      {/* Main Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={data ? `$${data.revenue.total.toLocaleString()}` : '-'}
          change={data?.revenue.change || 0}
          icon={DollarSign}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          chartData={data?.revenue.chartData}
        />
        <StatCard
          title="Total Orders"
          value={data?.orders.total.toLocaleString() || '-'}
          change={data?.orders.change || 0}
          icon={ShoppingBag}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          chartData={data?.orders.chartData}
        />
        <StatCard
          title="Visitors"
          value={data?.visitors.total.toLocaleString() || '-'}
          change={data?.visitors.change || 0}
          icon={Eye}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          chartData={data?.visitors.chartData}
        />
        <StatCard
          title="Conversion Rate"
          value={data ? `${data.conversionRate.toFixed(2)}%` : '-'}
          change={data?.conversionChange || 0}
          icon={TrendingUp}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          chartData={data?.orders.chartData}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {activeChart === 'revenue' ? 'Revenue Overview' : 'Orders Overview'}
              </h2>
              <p className="text-sm text-neutral-500">
                {activeChart === 'revenue' ? 'Daily revenue' : 'Daily orders'} for the selected period
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChart('revenue')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeChart === 'revenue'
                    ? 'bg-[#2e1f15]/10 text-[#2e1f15]'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChart('orders')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${activeChart === 'orders'
                    ? 'bg-[#2e1f15]/10 text-[#2e1f15]'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
              >
                Orders
              </button>
            </div>
          </div>
          {/* Chart visualization */}
          <div className="flex h-64 items-end gap-2">
            {(() => {
              const chartData = activeChart === 'revenue' ? data?.revenue.chartData : data?.orders.chartData
              if (!chartData || chartData.length === 0) return <div className="w-full h-full flex items-center justify-center text-neutral-400">No data available</div>

              const maxValue = Math.max(...chartData.map(d => d.value)) || 1

              return chartData.map((d, i) => (
                <div key={i} className="group relative flex-1 h-full flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t transition-all ${activeChart === 'revenue'
                        ? 'bg-gradient-to-t from-[#2e1f15] to-[#2e1f15]/60 hover:from-[#2e1f15] hover:to-[#2e1f15]/80'
                        : 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-rose-accent hover:to-blue-500'
                      }`}
                    style={{ height: `${Math.max((d.value / maxValue) * 100, 4)}%` }}
                  />
                  <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 z-10 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-white dark:text-neutral-900 shadow-lg">
                    <p className="font-bold text-center">
                      {activeChart === 'revenue' ? `$${d.value.toLocaleString()}` : d.value}
                    </p>
                    <p className="text-[10px] opacity-80 text-center">{d.date}</p>
                  </div>
                </div>
              ))
            })()}
          </div>
          <div className="mt-4 flex justify-between text-xs text-neutral-400">
            {(() => {
              const chartData = activeChart === 'revenue' ? data?.revenue.chartData : data?.orders.chartData
              if (!chartData) return null
              const step = Math.ceil(chartData.length / 7)
              return chartData.filter((_, i) => i % step === 0).map((d, i) => (
                <span key={i}>{d.date}</span>
              ))
            })()}
          </div>
        </div>

        {/* Sales by Channel */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Sales by Channel</h2>
          <div className="space-y-4">
            {data?.salesByChannel.map((channel, i) => (
              <div key={i}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{channel.channel}</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">{channel.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${channel.value}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: channel.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Donut Chart Placeholder */}
          <div className="mt-8 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                {data?.salesByChannel.reduce((acc, channel, i) => {
                  const prevTotal = data.salesByChannel.slice(0, i).reduce((sum, c) => sum + c.value, 0)
                  const dashArray = (channel.value / 100) * 251.2
                  const dashOffset = -(prevTotal / 100) * 251.2
                  acc.push(
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={channel.color}
                      strokeWidth="12"
                      strokeDasharray={`${dashArray} 251.2`}
                      strokeDashoffset={dashOffset}
                    />
                  )
                  return acc
                }, [] as React.ReactElement[])}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{data?.salesByChannel.length}</p>
                  <p className="text-xs text-neutral-500">Channels</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Categories */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Top Categories</h2>
          <div className="space-y-4">
            {data?.topCategories.map((cat, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e1f15]/10 text-sm font-bold text-[#2e1f15]">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-white">{cat.name}</span>
                    <span className="text-sm font-bold text-green-600">${cat.sales.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full bg-[#2e1f15]"
                    />
                  </div>
                </div>
                <span className="text-sm text-neutral-500">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Recent Activity</h2>
          <div className="space-y-4">
            {data?.recentActivity?.slice(0, showAllActivity ? undefined : 5)?.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'customer' ? 'bg-green-100 text-green-600' :
                      activity.type === 'product' ? 'bg-purple-100 text-purple-600' :
                        'bg-amber-100 text-amber-600'
                  }`}>
                  {activity.type === 'order' && <ShoppingCart className="h-5 w-5" />}
                  {activity.type === 'customer' && <Users className="h-5 w-5" />}
                  {activity.type === 'product' && <Package className="h-5 w-5" />}
                  {activity.type === 'review' && <TrendingUp className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900 dark:text-white">{activity.description}</p>
                  <p className="text-sm text-neutral-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {data?.recentActivity && data.recentActivity.length > 5 && (
            <button
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="mt-4 w-full rounded-xl border border-neutral-200 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {showAllActivity ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="rounded-2xl bg-gradient-to-r from-cocoa to-rose-accent p-6">
        <h3 className="mb-6 text-xl font-bold text-white">Key Performance Indicators</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-sm text-white/70">Average Order Value</p>
            <p className="mt-1 text-2xl font-bold text-white">{data ? `$${data.averageOrderValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-sm text-white/70">Cart Abandonment Rate</p>
            <p className="mt-1 text-2xl font-bold text-white">{data ? `${data.abandonedCartRate.toFixed(1)}%` : '-'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
