'use client'

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
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
import {
  InventoryItem,
  InventoryStats,
  getInventory,
  updateAvailable,
} from './inventory-actions'

const ITEMS_PER_PAGE = 50

const aud = (n: number) =>
  `$${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'low_stock' | 'out_of_stock' | 'in_stock'
  >('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [showLowStockAlert, setShowLowStockAlert] = useState(true)

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
        limit: ITEMS_PER_PAGE,
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

  const handleEditStart = (itemKey: string, currentValue: number) => {
    setEditingCell(itemKey)
    setEditValue(currentValue)
  }

  const handleEditSave = async (item: InventoryItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.handle === item.handle && i.variantIndex === item.variantIndex
          ? { ...i, available: editValue }
          : i
      )
    )
    setEditingCell(null)
    setSaving(true)
    try {
      await updateAvailable(item.handle, item.variantIndex, editValue)
    } catch (error) {
      console.error('Error saving:', error)
    }
    setSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, item: InventoryItem) => {
    if (e.key === 'Enter') {
      handleEditSave(item)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const exportInventory = () => {
    if (items.length === 0) return
    const headers = ['Product', 'Variant', 'SKU', 'Available']
    const rows = items.map((item) => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.variantTitle.replace(/"/g, '""')}"`,
      `"${item.sku.replace(/"/g, '""')}"`,
      item.available,
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Inventory</h1>
          <p className="text-sm text-neutral-600">
            Each row is a product variant — the <strong>Available</strong> number is the daily
            order capacity. Click any cell to edit.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportInventory}
            disabled={items.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Products"
          value={String(stats?.totalProducts ?? 0)}
          icon={Package}
          accent="bg-cocoa/5 text-cocoa"
        />
        <StatCard
          label="Variants"
          value={String(stats?.totalVariants ?? 0)}
          icon={Boxes}
          accent="bg-cocoa/5 text-cocoa"
        />
        <StatCard
          label="Available"
          value={(stats?.totalAvailable ?? 0).toLocaleString('en-AU')}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Low stock"
          value={String(stats?.lowStockCount ?? 0)}
          icon={AlertTriangle}
          accent="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Out of stock"
          value={String(stats?.outOfStockCount ?? 0)}
          icon={XCircle}
          accent="bg-red-50 text-red-700"
        />
      </section>

      {/* Inventory value banner */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-line bg-cream/60 p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cocoa text-ivory">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cocoa-soft">
                Total inventory value (AUD)
              </p>
              <p className="font-bake-display mt-1 text-2xl font-medium text-cocoa">
                {aud(stats?.inventoryValue || 0)}
              </p>
            </div>
          </div>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 rounded-xl border border-cocoa/15 bg-ivory px-4 py-2 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <BarChart3 className="h-4 w-4" />
            View reports
          </Link>
        </div>
      </section>

      {/* Low stock alert */}
      {showLowStockAlert && (stats?.lowStockCount || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              {stats?.lowStockCount} variant{(stats?.lowStockCount || 0) > 1 ? 's' : ''} running
              low on stock.
            </p>
            <p className="text-xs text-amber-700">Filter by "Low stock" below to see them all.</p>
          </div>
          <button
            onClick={() => setShowLowStockAlert(false)}
            className="text-amber-700 transition hover:text-amber-900"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Toolbar */}
      <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by product title or SKU…"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'in_stock', label: 'In stock' },
              { value: 'low_stock', label: 'Low stock' },
              { value: 'out_of_stock', label: 'Out' },
            ] as const
          ).map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setFilterStatus(s.value)
                setCurrentPage(1)
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filterStatus === s.value
                  ? 'border-cocoa bg-cocoa text-ivory'
                  : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Saving indicator */}
      {saving && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-cocoa px-3 py-1.5 text-xs font-medium text-ivory">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </div>
      )}

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="hidden border-b border-neutral-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 lg:grid lg:grid-cols-[2fr_1fr_auto] lg:gap-4">
          <span>Product</span>
          <span>SKU</span>
          <span className="text-right">Available</span>
        </div>

        {loading ? (
          <ul className="divide-y divide-neutral-200">
            {[...Array(8)].map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-1/5 animate-pulse rounded bg-neutral-100" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-100" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 font-bake-display text-[18px] font-medium text-cocoa">
              No matching variants
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try a different filter or search term.'
                : 'Add products to see inventory here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {items.map((item, idx) => {
              const itemKey = `${item.handle}-${item.variantIndex}`
              const isLowStock = item.available > 0 && item.available <= 10
              const isOutOfStock = item.available === 0
              return (
                <motion.li
                  key={itemKey}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.015, 0.18) }}
                  className="grid grid-cols-1 gap-3 px-6 py-4 transition-colors hover:bg-cream/40 lg:grid-cols-[2fr_1fr_auto] lg:items-center lg:gap-4"
                >
                  {/* Product */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                      {item.image ? (
                        <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-4 w-4 text-cocoa-soft" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${item.handle}`}
                        className="font-bake-display block truncate text-sm font-medium text-cocoa transition-colors hover:text-rose-accent"
                      >
                        {item.title}
                      </Link>
                      <p className="truncate text-xs text-neutral-500">{item.variantTitle}</p>
                    </div>
                  </div>

                  {/* SKU */}
                  <div className="text-sm">
                    <span className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-600">
                      {item.sku}
                    </span>
                  </div>

                  {/* Available */}
                  <div className="lg:text-right">
                    {editingCell === itemKey ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        onBlur={() => handleEditSave(item)}
                        onKeyDown={(e) => handleKeyDown(e, item)}
                        autoFocus
                        min="0"
                        className="w-24 rounded-lg border border-rose-accent bg-white px-3 py-1.5 text-right text-sm font-medium text-cocoa outline-none ring-4 ring-rose-accent/15"
                      />
                    ) : (
                      <button
                        onClick={() => handleEditStart(itemKey, item.available)}
                        className={`inline-flex w-24 items-center justify-end gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                          isOutOfStock
                            ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
                            : isLowStock
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'
                              : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent hover:text-rose-accent'
                        }`}
                        title="Click to edit"
                      >
                        {item.available}
                      </button>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}

        {/* Pagination */}
        {!loading && items.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 text-sm">
            <p className="text-neutral-600">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-neutral-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ──────────────── Helpers ──────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-cocoa">{value}</p>
    </div>
  )
}
