'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Box,
  ChevronRight,
  DollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingBag,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ReportData, getReportData } from './report-actions'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'products' | 'pricing'>('overview')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const result = await getReportData()
      if (result.success && result.data) {
        setData(result.data)
      } else {
        setData(null)
      }
    } catch (error) {
      setData(null)
      console.error('Error fetching reports:', error)
    }
    setLoading(false)
  }

  const formatInventoryValue = (value: number) =>
    value < 10000 ? `$${value.toLocaleString('en-AU')}` : `$${(value / 1000).toFixed(1)}K`

  const exportReport = () => {
    if (!data) return

    const reportContent = `
INVENTORY REPORT
Generated: ${new Date().toLocaleString()}

OVERVIEW
=========
Total Products: ${data.overview.totalProducts}
Total Variants: ${data.overview.totalVariants}
Total Inventory Units: ${data.overview.totalInventoryUnits}
Total Inventory Value: $${data.overview.totalInventoryValue.toLocaleString()}
Average Price: $${data.overview.averagePrice.toLocaleString()}
Products Without Stock: ${data.overview.productsWithoutStock}

INVENTORY BY CATEGORY
=====================
${data.inventoryByCategory.map((c) => `${c.category}: ${c.count} products, ${c.units} units, $${c.value.toLocaleString()}`).join('\n')}

TOP PRODUCTS BY VALUE
====================
${data.topProductsByValue.map((p, i) => `${i + 1}. ${p.title}: ${p.units} units, $${p.value.toLocaleString()}`).join('\n')}

STOCK DISTRIBUTION
==================
${data.stockDistribution.map((s) => `${s.range}: ${s.count} (${s.percentage}%)`).join('\n')}

PRICE RANGES
============
${data.priceRanges.map((p) => `${p.range}: ${p.count} (${p.percentage}%)`).join('\n')}
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Analysis', icon: Package },
    { id: 'products', label: 'Inventory Value', icon: ShoppingBag },
    { id: 'pricing', label: 'Pricing Analysis', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen min-w-0 space-y-8 bg-ivory p-6 text-cocoa md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="bake-eyebrow text-rose-accent">Inventory insights</p>
          <h1 className="mt-2 font-bake-display text-[32px] leading-tight font-medium md:text-[40px]">Reports</h1>
          <p className="text-taupe">Inventory, stock levels and product pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="bake-btn bake-btn-ghost bake-btn-sm disabled:opacity-50"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="bake-btn bake-btn-sm disabled:opacity-50"
            disabled={loading || !data}
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            aria-pressed={activeTab === tab.id}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-cocoa bg-cocoa text-ivory'
                : 'border-line bg-cream text-cocoa-soft hover:border-cocoa'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-md bg-cream-deep" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-md bg-cream-deep" />
        </div>
      ) : !data ? (
        <div className="py-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-line" />
          <p className="mt-4 text-lg font-medium text-cocoa">Unable to load reports</p>
          <button onClick={fetchReports} className="mt-4 text-cocoa hover:underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bake-card min-w-0 p-6 text-cocoa"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cocoa-soft">Total Products</p>
                      <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
                        {data.overview.totalProducts}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                      <Package className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-cocoa-soft">{data.overview.totalVariants} total variants</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bake-card min-w-0 p-6 text-cocoa"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cocoa-soft">Inventory Value</p>
                      <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
                        {formatInventoryValue(data.overview.totalInventoryValue)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-cocoa-soft">
                    {data.overview.totalInventoryUnits.toLocaleString()} total units
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bake-card min-w-0 p-6 text-cocoa"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cocoa-soft">Average Price</p>
                      <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
                        $
                        {data.overview.averagePrice.toLocaleString('en-AU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-cocoa-soft">Across {data.overview.pricedVariants} priced variants</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bake-card min-w-0 p-6 text-cocoa"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cocoa-soft">Products out of stock</p>
                      <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
                        {data.overview.productsWithoutStock}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-cocoa-soft">Products need restocking</p>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Stock Distribution */}
                <div className="rounded-lg bg-white p-6">
                  <h3 className="mb-6 text-lg font-bold text-cocoa">Stock Distribution</h3>
                  <div className="space-y-4">
                    {data.stockDistribution.map((item, i) => (
                      <div key={i}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-cocoa">{item.range}</span>
                          <span className="text-sm font-bold text-cocoa">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-cream">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full rounded-full ${
                              i === 0
                                ? 'bg-red-500'
                                : i === 1
                                  ? 'bg-amber-500'
                                  : i === 2
                                    ? 'bg-blue-500'
                                    : i === 3
                                      ? 'bg-green-500'
                                      : 'bg-purple-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory by Category */}
                <div className="rounded-lg bg-white p-6">
                  <h3 className="mb-6 text-lg font-bold text-cocoa">Inventory by Category</h3>
                  <div className="space-y-3">
                    {data.inventoryByCategory.slice(0, 6).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-cream p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e1f15]/10 text-sm font-bold text-cocoa">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-cocoa">{cat.category.replace(/-/g, ' ').toUpperCase()}</p>
                            <p className="text-sm text-taupe">{cat.count} products</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-cocoa">{cat.units.toLocaleString()} units</p>
                          <p className="text-sm text-green-600">${cat.value.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inventory Health */}
              <div className="rounded-lg bg-white p-6">
                <h3 className="mb-6 text-lg font-bold text-cocoa">Inventory Health</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{data.inventoryTrends.outOfStock}</p>
                        <p className="text-sm text-red-600">Variants out of stock</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <TrendingDown className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{data.inventoryTrends.lowStock}</p>
                        <p className="text-sm text-amber-600">Low Stock</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose/40">
                        <Box className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{data.inventoryTrends.wellStocked}</p>
                        <p className="text-sm text-green-600">Well Stocked</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose/40">
                        <TrendingUp className="h-5 w-5 text-rose-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-rose-accent">{data.inventoryTrends.overstocked}</p>
                        <p className="text-sm text-rose-accent">Overstocked</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Analysis Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6">
                <h3 className="mb-6 text-lg font-bold text-cocoa">Inventory by Category</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="py-3 text-left text-xs font-semibold tracking-wider text-taupe uppercase">
                          Category
                        </th>
                        <th className="py-3 text-right text-xs font-semibold tracking-wider text-taupe uppercase">
                          Products
                        </th>
                        <th className="py-3 text-right text-xs font-semibold tracking-wider text-taupe uppercase">
                          Units
                        </th>
                        <th className="py-3 text-right text-xs font-semibold tracking-wider text-taupe uppercase">
                          Value
                        </th>
                        <th className="py-3 text-right text-xs font-semibold tracking-wider text-taupe uppercase">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.inventoryByCategory.map((cat, i) => {
                        const percentOfTotal = Math.round((cat.value / (data.overview.totalInventoryValue || 1)) * 100)
                        return (
                          <tr key={i} className="hover:bg-cream">
                            <td className="py-4 font-medium text-cocoa">{cat.category}</td>
                            <td className="py-4 text-right text-cocoa-soft">{cat.count}</td>
                            <td className="py-4 text-right text-cocoa-soft">{cat.units.toLocaleString()}</td>
                            <td className="py-4 text-right font-medium text-cocoa">${cat.value.toLocaleString()}</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-taupe">{percentOfTotal}%</span>
                                <div className="h-2 w-16 overflow-hidden rounded-full bg-cream">
                                  <div
                                    className="h-full rounded-full bg-cocoa"
                                    style={{ width: `${percentOfTotal}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Product Performance Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6">
                <h3 className="mb-6 text-lg font-bold text-cocoa">Top Products by Inventory Value</h3>
                <div className="space-y-3">
                  {data.topProductsByValue.map((product, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-lg border border-line p-4 transition-colors hover:bg-cream"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e1f15]/10 text-sm font-bold text-cocoa">
                        {i + 1}
                      </span>
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-cream">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.title}
                            title={product.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="absolute inset-0 m-auto h-6 w-6 text-taupe" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/admin/products/${product.handle}`}
                          className="font-medium text-cocoa hover:text-cocoa"
                        >
                          {product.title}
                        </Link>
                        <p className="text-sm text-taupe">{product.units.toLocaleString()} units in stock</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${product.value.toLocaleString()}</p>
                        <p className="text-xs text-taupe">inventory value</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-taupe" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Analysis Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6">
                <h3 className="mb-6 text-lg font-bold text-cocoa">Price Distribution</h3>
                <div className="space-y-4">
                  {data.priceRanges.map((range, i) => (
                    <div key={i}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-cocoa">{range.range}</span>
                        <span className="text-sm font-bold text-cocoa">
                          {range.count} variants ({range.percentage}%)
                        </span>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full bg-cream">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${range.percentage}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full bg-rose-accent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="bake-card min-w-0 p-6 text-cocoa">
                  <h4 className="text-sm text-cocoa-soft">Average Price</h4>
                  <p className="mt-2 text-4xl font-bold">
                    $
                    {data.overview.averagePrice.toLocaleString('en-AU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="mt-2 text-sm text-cocoa-soft">Across {data.overview.pricedVariants} priced variants</p>
                </div>
                <div className="bake-card min-w-0 p-6 text-cocoa">
                  <h4 className="text-sm text-cocoa-soft">Total Inventory Value</h4>
                  <p className="mt-2 text-4xl font-bold">{formatInventoryValue(data.overview.totalInventoryValue)}</p>
                  <p className="mt-2 text-sm text-cocoa-soft">
                    {data.overview.totalInventoryUnits.toLocaleString()} total units
                  </p>
                </div>
                <div className="bake-card min-w-0 p-6 text-cocoa">
                  <h4 className="text-sm text-cocoa-soft">Avg Value per Unit</h4>
                  <p className="mt-2 text-4xl font-bold">
                    $
                    {data.overview.totalInventoryUnits > 0
                      ? Math.round(
                          data.overview.totalInventoryValue / data.overview.totalInventoryUnits
                        ).toLocaleString()
                      : 0}
                  </p>
                  <p className="mt-2 text-sm text-cocoa-soft">Per inventory unit</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
