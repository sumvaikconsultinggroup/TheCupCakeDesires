'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  IndianRupee,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { InventoryItem, InventoryStats, getInventory, updateInventory } from './inventory-actions'

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<
    Map<string, { handle: string; variantIndex: number; available: number; onHand: number }>
  >(new Map())
  const [showLowStockAlert, setShowLowStockAlert] = useState(true)

  const itemsPerPage = 50

  useEffect(() => {
    fetchInventory()
  }, [currentPage, filterStatus, searchQuery])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const result = await getInventory({
        search: searchQuery || undefined,
        status: filterStatus,
        page: currentPage,
        limit: itemsPerPage,
      })

      if (result.success) {
        setItems(result.items)
        setStats(result.stats)
        setTotalItems(result.total)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
    setLoading(false)
  }

  const handleEditStart = (itemKey: string, field: 'available' | 'onHand', currentValue: number) => {
    setEditingCell(`${itemKey}-${field}`)
    setEditValue(currentValue)
  }

  const handleEditSave = async (item: InventoryItem, field: 'available' | 'onHand') => {
    const itemKey = `${item.handle}-${item.variantIndex}`
    const current = pendingUpdates.get(itemKey) || {
      handle: item.handle,
      variantIndex: item.variantIndex,
      available: item.available,
      onHand: item.onHand,
    }

    const updated = { ...current, [field]: editValue }

    // If editing available, update onHand to match (simplified model)
    if (field === 'available') {
      updated.onHand = editValue
    }

    setPendingUpdates(new Map(pendingUpdates.set(itemKey, updated)))

    // Update local state immediately for responsiveness
    setItems(
      items.map((i) => {
        if (i.handle === item.handle && i.variantIndex === item.variantIndex) {
          return { ...i, [field]: editValue, onHand: field === 'available' ? editValue : i.onHand }
        }
        return i
      })
    )

    setEditingCell(null)

    // Auto-save after edit
    setSaving(true)
    try {
      await updateInventory(item.handle, item.variantIndex, 'onHand', editValue)
    } catch (error) {
      console.error('Error saving:', error)
    }
    setSaving(false)
    setPendingUpdates(new Map())
  }

  const handleKeyDown = (e: React.KeyboardEvent, item: InventoryItem, field: 'available' | 'onHand') => {
    if (e.key === 'Enter') {
      handleEditSave(item, field)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const exportInventory = () => {
    // Create CSV export
    const headers = ['Product', 'Variant', 'SKU', 'Unavailable', 'Committed', 'Available', 'On Hand']
    const rows = items.map((item) => [
      item.title,
      item.variantTitle,
      item.sku,
      item.unavailable,
      item.committed,
      item.available,
      item.onHand,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-export.csv'
    a.click()
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Header - Shopify Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inventory</h1>
          <p className="text-neutral-500">Manage stock levels across all your product variants</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportInventory}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards - Enhanced */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Products</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Variants</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{stats?.totalVariants || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Box className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">On Hand</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {stats?.totalOnHand?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Available</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">
                {stats?.totalAvailable?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Low Stock</p>
              <p className="text-xl font-bold text-amber-600">{stats?.lowStockCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Out of Stock</p>
              <p className="text-xl font-bold text-red-600">{stats?.outOfStockCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Value Card */}
      <div className="rounded-xl bg-gradient-to-r from-[#1B198F] to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-white/80">Total Inventory Value</p>
              <p className="text-2xl font-bold">₹{(stats?.inventoryValue || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/reports"
              className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
            >
              <BarChart3 className="h-4 w-4" />
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {showLowStockAlert && (stats?.lowStockCount || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {stats?.lowStockCount} variant{(stats?.lowStockCount || 0) > 1 ? 's' : ''} running low on stock
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Filter by "Low Stock" to see which items need restocking
            </p>
          </div>
          <button onClick={() => setShowLowStockAlert(false)} className="text-amber-600 hover:text-amber-800">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      {/* Filters - Shopify Style */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            All
          </button>
          <span className="text-neutral-300">|</span>
        </div>
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-4 pl-10 text-sm transition-all outline-none focus:border-[#1B198F] focus:ring-1 focus:ring-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock (&gt;10)</option>
            <option value="low_stock">Low Stock (1-10)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center gap-2 text-sm text-[#1B198F]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving changes...
        </div>
      )}

      {/* Inventory Table - Shopify Style */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                <th className="px-4 py-3 text-left">
                  <button className="flex items-center gap-1 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                    Product <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  Unavailable
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  Committed
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  Available
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  On hand
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                        <div className="space-y-2">
                          <div className="h-4 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                          <div className="h-3 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-neutral-300" />
                    <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">
                      No inventory items found
                    </p>
                    <p className="mt-1 text-neutral-500">Try adjusting your filters or add products to your store</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const itemKey = `${item.handle}-${item.variantIndex}`
                  const isLowStock = item.available > 0 && item.available <= 10
                  const isOutOfStock = item.available === 0

                  return (
                    <tr key={itemKey} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-700">
                            {item.image ? (
                              <Image src={item.image} alt="" fill className="object-cover" />
                            ) : (
                              <Package className="absolute inset-0 m-auto h-5 w-5 text-neutral-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${item.handle}`}
                              className="font-medium text-neutral-900 hover:text-[#1B198F] dark:text-white"
                            >
                              {item.title}
                            </Link>
                            <p className="text-sm text-neutral-500">{item.variantTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-neutral-500">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-neutral-500">{item.unavailable}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-neutral-500">{item.committed}</span>
                      </td>
                      <td className="px-4 py-3">
                        {editingCell === `${itemKey}-available` ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            onBlur={() => handleEditSave(item, 'available')}
                            onKeyDown={(e) => handleKeyDown(e, item, 'available')}
                            autoFocus
                            min="0"
                            className="mx-auto block w-20 rounded border border-[#1B198F] px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-[#1B198F]/20 dark:bg-neutral-900"
                          />
                        ) : (
                          <button
                            onClick={() => handleEditStart(itemKey, 'available', item.available)}
                            className={`mx-auto block w-20 rounded border px-2 py-1 text-center text-sm transition-colors hover:border-[#1B198F] ${
                              isOutOfStock
                                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20'
                                : isLowStock
                                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20'
                                  : 'border-neutral-200 dark:border-neutral-700'
                            }`}
                          >
                            {item.available}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingCell === `${itemKey}-onHand` ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            onBlur={() => handleEditSave(item, 'onHand')}
                            onKeyDown={(e) => handleKeyDown(e, item, 'onHand')}
                            autoFocus
                            min="0"
                            className="mx-auto block w-20 rounded border border-[#1B198F] px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-[#1B198F]/20 dark:bg-neutral-900"
                          />
                        ) : (
                          <button
                            onClick={() => handleEditStart(itemKey, 'onHand', item.onHand)}
                            className="mx-auto block w-20 rounded border border-neutral-200 px-2 py-1 text-center text-sm transition-colors hover:border-[#1B198F] dark:border-neutral-700"
                          >
                            {item.onHand}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-50 dark:border-neutral-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-neutral-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-50 dark:border-neutral-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
