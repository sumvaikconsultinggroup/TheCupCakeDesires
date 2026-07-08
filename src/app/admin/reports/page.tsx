'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Layers,
  AlertTriangle,
  Download,
  RefreshCw,
  PieChart,
  FileSpreadsheet,
  Calendar,
  Filter,
  ChevronRight,
  Box,
  ShoppingBag,
  Percent,
  Target
} from 'lucide-react'
import { getReportData, ReportData } from './report-actions'

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
      }
    } catch (error) {
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
${data.inventoryByCategory.map(c => `${c.category}: ${c.count} products, ${c.units} units, $${c.value.toLocaleString()}`).join('\n')}

TOP PRODUCTS BY VALUE
====================
${data.topProductsByValue.map((p, i) => `${i + 1}. ${p.title}: ${p.units} units, $${p.value.toLocaleString()}`).join('\n')}

STOCK DISTRIBUTION
==================
${data.stockDistribution.map(s => `${s.range}: ${s.count} (${s.percentage}%)`).join('\n')}

PRICE RANGES
============
${data.priceRanges.map(p => `${p.range}: ${p.count} (${p.percentage}%)`).join('\n')}
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'inventory', label: 'Inventory Analysis', icon: Package },
    { id: 'products', label: 'Product Performance', icon: ShoppingBag },
    { id: 'pricing', label: 'Pricing Analysis', icon: DollarSign },
  ]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports</h1>
          <p className="text-neutral-500">Comprehensive analytics and insights for your store</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#2e1f15]/90"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-white text-[#2e1f15] shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
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
              <div key={i} className="h-32 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
        </div>
      ) : !data ? (
        <div className="py-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-neutral-300" />
          <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">Unable to load reports</p>
          <button onClick={fetchReports} className="mt-4 text-[#2e1f15] hover:underline">Try again</button>
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
                  className="rounded-xl bg-gradient-to-br from-blue-500 to-rose-accent p-5 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100">Total Products</p>
                      <p className="mt-1 text-3xl font-bold">{data.overview.totalProducts}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <Package className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-blue-100">
                    {data.overview.totalVariants} total variants
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-100">Inventory Value</p>
                      <p className="mt-1 text-3xl font-bold">{formatInventoryValue(data.overview.totalInventoryValue)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-green-100">
                    {data.overview.totalInventoryUnits.toLocaleString()} total units
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-5 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-100">Average Price</p>
                      <p className="mt-1 text-3xl font-bold">${data.overview.averagePrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <Target className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-purple-100">
                    Across {data.overview.pricedVariants} priced variants
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-100">Products out of stock</p>
                      <p className="mt-1 text-3xl font-bold">{data.overview.productsWithoutStock}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-amber-100">
                    Products need restocking
                  </p>
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Stock Distribution */}
                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                  <h3 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Stock Distribution</h3>
                  <div className="space-y-4">
                    {data.stockDistribution.map((item, i) => (
                      <div key={i}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.range}</span>
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">{item.count} ({item.percentage}%)</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full rounded-full ${i === 0 ? 'bg-red-500' :
                                i === 1 ? 'bg-amber-500' :
                                  i === 2 ? 'bg-blue-500' :
                                    i === 3 ? 'bg-green-500' :
                                      'bg-purple-500'
                              }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory by Category */}
                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                  <h3 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Inventory by Category</h3>
                  <div className="space-y-3">
                    {data.inventoryByCategory.slice(0, 6).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-700/50">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e1f15]/10 text-sm font-bold text-[#2e1f15]">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{cat.category.replace(/-/g, " ").toUpperCase()}</p>
                            <p className="text-sm text-neutral-500">{cat.count} products</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-neutral-900 dark:text-white">{cat.units.toLocaleString()} units</p>
                          <p className="text-sm text-green-600">${cat.value.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inventory Health */}
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h3 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Inventory Health</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{data.inventoryTrends.outOfStock}</p>
                        <p className="text-sm text-red-600">Variants out of stock</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <TrendingDown className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{data.inventoryTrends.lowStock}</p>
                        <p className="text-sm text-amber-600">Low Stock</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                        <Box className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{data.inventoryTrends.wellStocked}</p>
                        <p className="text-sm text-green-600">Well Stocked</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{data.inventoryTrends.overstocked}</p>
                        <p className="text-sm text-purple-600">Overstocked</p>
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
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h3 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Inventory by Category</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700">
                        <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</th>
                        <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Products</th>
                        <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Units</th>
                        <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Value</th>
                        <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {data.inventoryByCategory.map((cat, i) => {
                        const percentOfTotal = Math.round((cat.value / (data.overview.totalInventoryValue || 1)) * 100)
                        return (
                          <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                            <td className="py-4 font-medium text-neutral-900 dark:text-white">{cat.category}</td>
                            <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">{cat.count}</td>
                            <td className="py-4 text-right text-neutral-600 dark:text-neutral-400">{cat.units.toLocaleString()}</td>
                            <td className="py-4 text-right font-medium text-neutral-900 dark:text-white">${cat.value.toLocaleString()}</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm text-neutral-500">{percentOfTotal}%</span>
                                <div className="h-2 w-16 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                                  <div className="h-full rounded-full bg-[#2e1f15]" style={{ width: `${percentOfTotal}%` }} />
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
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h3 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Top Products by Inventory Value</h3>
                <div className="space-y-3">
                  {data.topProductsByValue.map((product, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e1f15]/10 text-sm font-bold text-[#2e1f15]">
                        {i + 1}
                      </span>
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
                        {product.image ? (
                          <Image src={product.image} alt="" fill className="object-cover" />
                        ) : (
                          <Package className="absolute inset-0 m-auto h-6 w-6 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Link href={`/admin/products/${product.handle}`} className="font-medium text-neutral-900 hover:text-[#2e1f15] dark:text-white">
                          {product.title}
                        </Link>
                        <p className="text-sm text-neutral-500">{product.units.toLocaleString()} units in stock</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${product.value.toLocaleString()}</p>
                        <p className="text-xs text-neutral-500">inventory value</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-neutral-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Analysis Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h3 className="mb-6 text-lg font-bold text-neutral-900 dark:text-white">Price Distribution</h3>
                <div className="space-y-4">
                  {data.priceRanges.map((range, i) => (
                    <div key={i}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{range.range}</span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">{range.count} variants ({range.percentage}%)</span>
                      </div>
                      <div className="h-4 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${range.percentage}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#2e1f15] to-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl bg-gradient-to-br from-cocoa to-rose-accent p-6 text-white">
                  <h4 className="text-sm text-blue-100">Average Price</h4>
                  <p className="mt-2 text-4xl font-bold">${data.overview.averagePrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="mt-2 text-sm text-blue-200">Across {data.overview.pricedVariants} priced variants</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                  <h4 className="text-sm text-green-100">Total Inventory Value</h4>
                  <p className="mt-2 text-4xl font-bold">{formatInventoryValue(data.overview.totalInventoryValue)}</p>
                  <p className="mt-2 text-sm text-green-200">{data.overview.totalInventoryUnits.toLocaleString()} total units</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-6 text-white">
                  <h4 className="text-sm text-purple-100">Avg Value per Unit</h4>
                  <p className="mt-2 text-4xl font-bold">${data.overview.totalInventoryUnits > 0 ? Math.round(data.overview.totalInventoryValue / data.overview.totalInventoryUnits).toLocaleString() : 0}</p>
                  <p className="mt-2 text-sm text-purple-200">Per inventory unit</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
