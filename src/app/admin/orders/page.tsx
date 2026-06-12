'use client'

import type { OrderEnriched } from '@/types/orders'
import { ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import BulkActionsBar from './components/BulkActionsBar'
import EmptyState from './components/EmptyState'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import MobileOrderCard from './components/MobileOrderCard'
import OrderRow from './components/OrderRow'
import type { FiltersState } from './components/OrdersFilters'
import OrdersFilters from './components/OrdersFilters'
import type { PaymentStats } from './components/OrdersStatsRow'
import OrdersStatsRow from './components/OrdersStatsRow'
import OrdersTabs from './components/OrdersTabs'
import QuickViewModal from './components/QuickViewModal'
import SavedFilterViews from './components/SavedFilterViews'
import { bulkMarkDeliveredAction, cancelOrderAction, getOrdersAction, markAsConfirmedAction } from './order-actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderRecord = OrderEnriched & { userEmail?: string }

interface SavedViewRecord {
  _id: string
  name: string
  filters: Record<string, unknown>
  isDefault?: boolean
}

interface ServerPaymentStats {
  totalPayments?: number
  totalTransactions?: number
  totalOrders?: number
  successRate?: number
  totalRevenue?: number
  pendingRevenue?: number
  refundedAmount?: number
  paidOrderCount?: number
  pendingOrderCount?: number
  cancelledOrderCount?: number
  avgOrderValue?: number
}

const TABLE_HEADERS: { label: string; align?: 'left' | 'right' }[] = [
  { label: 'Order' },
  { label: 'Customer' },
  { label: 'Items' },
  { label: 'Status' },
  { label: 'Payment' },
  { label: 'Total' },
  { label: 'Delivery' },
  { label: 'Created' },
  { label: 'Actions', align: 'right' },
]

interface PagerProps {
  page: number
  pages: number
  onChange: (page: number) => void
  className?: string
}

function Pager({ page, pages, onChange, className = '' }: PagerProps) {
  if (pages <= 1) return null
  const btn =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-line text-cocoa-soft transition-colors hover:bg-cream disabled:opacity-50'
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-sm text-taupe">
        Page {page} of {pages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={btn}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className={btn}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const DEFAULT_PAYMENT_STATS: PaymentStats = {
  totalRevenue: 0,
  pendingRevenue: 0,
  refundedAmount: 0,
  paidOrderCount: 0,
  pendingOrderCount: 0,
  cancelledOrderCount: 0,
  avgOrderValue: 0,
  successRate: 0,
}

function adaptPaymentStats(server: ServerPaymentStats | undefined): PaymentStats {
  if (!server) return { ...DEFAULT_PAYMENT_STATS }
  const totalRevenue = server.totalRevenue ?? server.totalPayments ?? 0
  const paidOrderCount = server.paidOrderCount ?? server.totalTransactions ?? 0
  const successRate = server.successRate ?? 0
  const avgOrderValue = server.avgOrderValue ?? (paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0)
  return {
    totalRevenue,
    pendingRevenue: server.pendingRevenue ?? 0,
    refundedAmount: server.refundedAmount ?? 0,
    paidOrderCount,
    pendingOrderCount: server.pendingOrderCount ?? 0,
    cancelledOrderCount: server.cancelledOrderCount ?? 0,
    avgOrderValue,
    successRate,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  // Data
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [paymentStats, setPaymentStats] = useState<PaymentStats>(DEFAULT_PAYMENT_STATS)

  // Filters
  const [filters, setFilters] = useState<FiltersState>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder] = useState<'desc' | 'asc'>('desc')

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedViewRecord[]>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)

  // UI state
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quickViewOrder, setQuickViewOrder] = useState<OrderRecord | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // ─── Data fetch ────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getOrdersAction({
        page: currentPage,
        limit: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: filters.paymentStatus,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate ? `${filters.endDate}T23:59:59.999Z` : undefined,
        sortOrder,
      })

      if (result.success) {
        const incoming = (result.orders ?? []) as unknown as OrderRecord[]
        setOrders(incoming)
        setTotalPages(result.pagination?.pages ?? 1)
        setTotalOrders(result.pagination?.total ?? 0)
        setStatusCounts(result.statusCounts ?? {})
        const serverStats = (result as { paymentStats?: ServerPaymentStats }).paymentStats
        setPaymentStats(adaptPaymentStats(serverStats))
      } else {
        toast.error(result.error || 'Failed to load orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, filters.paymentStatus, filters.search, filters.startDate, filters.endDate, sortOrder])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.search, filters.startDate, filters.endDate, filters.paymentStatus, statusFilter])

  // ─── Saved views ───────────────────────────────────────────────────────────

  const fetchSavedViews = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders/saved-views')
      if (!res.ok) return
      const data: { views?: SavedViewRecord[] } = await res.json()
      setSavedViews(data.views ?? [])
    } catch (err) {
      console.error('Failed to fetch saved views', err)
    }
  }, [])

  useEffect(() => {
    fetchSavedViews()
  }, [fetchSavedViews])

  const handleSelectView = useCallback((view: SavedViewRecord | null) => {
    if (!view) {
      setActiveViewId(null)
      setFilters({})
      setStatusFilter('all')
      return
    }
    setActiveViewId(view._id)
    const f = view.filters as Record<string, unknown>
    const pick = <T,>(k: string, t: 'string' | 'number' | 'boolean'): T | undefined =>
      typeof f[k] === t ? (f[k] as T) : undefined
    setFilters({
      search: pick<string>('search', 'string'),
      startDate: pick<string>('startDate', 'string'),
      endDate: pick<string>('endDate', 'string'),
      paymentStatus: pick<string>('paymentStatus', 'string'),
      paymentMethod: pick<string>('paymentMethod', 'string'),
      minAmount: pick<number>('minAmount', 'number'),
      maxAmount: pick<number>('maxAmount', 'number'),
      city: pick<string>('city', 'string'),
      hasIssues: pick<boolean>('hasIssues', 'boolean'),
    })
    if (typeof f.status === 'string') setStatusFilter(f.status)
  }, [])

  const persistView = useCallback(
    async (name: string) => {
      try {
        const res = await fetch('/api/admin/orders/saved-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            filters: { ...filters, status: statusFilter !== 'all' ? statusFilter : undefined },
          }),
        })
        if (!res.ok) return toast.error('Failed to save view')
        toast.success('View saved')
        fetchSavedViews()
      } catch (err) {
        console.error(err)
        toast.error('Failed to save view')
      }
    },
    [filters, statusFilter, fetchSavedViews]
  )

  const handleSaveCurrentView = useCallback(async () => {
    const name = window.prompt('Name for this view?')?.trim()
    if (name) persistView(name)
  }, [persistView])

  const handleDeleteView = useCallback(
    async (viewId: string) => {
      try {
        const res = await fetch('/api/admin/orders/saved-views', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewId }),
        })
        if (!res.ok) return toast.error('Failed to delete view')
        toast.success('View deleted')
        if (activeViewId === viewId) setActiveViewId(null)
        fetchSavedViews()
      } catch (err) {
        console.error(err)
        toast.error('Failed to delete view')
      }
    },
    [activeViewId, fetchSavedViews]
  )

  // ─── Existing handlers (preserved) ─────────────────────────────────────────

  const handleExport = useCallback(() => {
    const headers = ['Order', 'Status', 'Payment', 'Total (AUD)', 'Delivery date', 'Created']
    const rows = orders.map((order) => [
      order.orderId || order.id || '',
      order.status,
      order.paymentDetails?.paymentStatus || 'pending',
      order.totalAmount,
      order.deliveryDate
        ? new Date(order.deliveryDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' })
        : '',
      new Date(order.createdAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' }),
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Orders exported')
  }, [orders])

  const handleMarkAsConfirmed = useCallback(
    async (orderId: string) => {
      if (!confirm('Accept this order into the kitchen?')) return
      setActionLoading(orderId)
      try {
        const result = await markAsConfirmedAction(orderId)
        if (result.success) {
          toast.success(result.message || 'Order moved to the kitchen')
          fetchOrders()
        } else toast.error(result.error || 'Failed to accept order')
      } catch {
        toast.error('Failed to accept order')
      } finally {
        setActionLoading(null)
      }
    },
    [fetchOrders]
  )

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.orderId === orderId || o.id === orderId || o._id?.toString() === orderId)
      const isPaid = order?.paymentDetails?.paymentStatus === 'paid'
      const msg = isPaid
        ? 'Are you sure you want to cancel this PAID order? This will initiate a refund process that requires admin approval in the Refunds page.'
        : 'Are you sure you want to cancel this order?'
      if (!confirm(msg)) return
      setActionLoading(orderId)
      try {
        const result = await cancelOrderAction(orderId)
        if (result.success) {
          toast.success(
            isPaid
              ? 'Order cancelled. Refund request created - please approve in Refunds page.'
              : 'Order cancelled successfully'
          )
          fetchOrders()
        } else toast.error(result.error || 'Failed to cancel order')
      } catch {
        toast.error('Failed to cancel order')
      } finally {
        setActionLoading(null)
      }
    },
    [orders, fetchOrders]
  )

  const handleDownloadInvoice = useCallback(async (orderId: string) => {
    setActionLoading(`invoice-${orderId}`)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      if (result.success || result.invoice) {
        toast.success('Invoice generated. Open the order details to print.')
      } else {
        toast.error(result.error || result.message || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    } finally {
      setActionLoading(null)
    }
  }, [])

  // Resolve canonical id for a record
  const resolveOrderKey = useCallback((o: OrderRecord) => o.orderId || o.id || o._id?.toString() || '', [])

  const handleRowAction = useCallback(
    (action: string, id: string) => {
      if (action === 'confirm') handleMarkAsConfirmed(id)
      else if (action === 'cancel') handleCancelOrder(id)
      else if (action === 'print_invoice') handleDownloadInvoice(id)
      else if (action === 'refund') toast('Refund flow opens in order details', { icon: 'ℹ️' })
      else if (action === 'resend_email') toast('Resend email coming soon', { icon: '✉️' })
    },
    [handleMarkAsConfirmed, handleCancelOrder, handleDownloadInvoice]
  )

  // ─── Bulk selection ────────────────────────────────────────────────────────

  const toggleSelect = useCallback((orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const handleBulkAction = useCallback(
    async (action: string) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return
      if (action === 'export') {
        handleExport()
      } else if (action === 'confirm' && confirm(`Accept ${ids.length} orders into the kitchen?`)) {
        ids.forEach(handleMarkAsConfirmed)
      } else if (action === 'cancel' && confirm(`Cancel ${ids.length} orders?`)) {
        ids.forEach(handleCancelOrder)
      } else if (action === 'deliver' && confirm(`Mark ${ids.length} orders as delivered?`)) {
        const result = await bulkMarkDeliveredAction(ids)
        if (result.success) {
          toast.success(`Marked ${result.updated ?? ids.length} as delivered`)
          fetchOrders()
        } else {
          toast.error(result.error || 'Failed to mark delivered')
        }
      } else if (action === 'tag') {
        toast('Bulk tagging coming soon', { icon: 'ℹ️' })
      }
      clearSelection()
    },
    [selectedIds, handleExport, handleMarkAsConfirmed, handleCancelOrder, clearSelection, fetchOrders]
  )

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const isTyping = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === '?' && !isTyping) {
        e.preventDefault()
        setShowShortcuts((v) => !v)
        return
      }
      if (e.key === 'Escape') {
        if (showShortcuts) setShowShortcuts(false)
        if (quickViewOrder) setQuickViewOrder(null)
        return
      }
      if (isTyping) return
      const k = e.key.toLowerCase()
      if (k === 'j') {
        e.preventDefault()
        setFocusedRowIndex((i) => Math.min(i + 1, orders.length - 1))
      } else if (k === 'k') {
        e.preventDefault()
        setFocusedRowIndex((i) => Math.max(i - 1, 0))
      } else if (k === 'o') {
        e.preventDefault()
        const o = orders[focusedRowIndex >= 0 ? focusedRowIndex : 0]
        if (o) setQuickViewOrder(o)
      } else if (k === 'f' || e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (k === 'e') {
        e.preventDefault()
        handleExport()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [orders, focusedRowIndex, showShortcuts, quickViewOrder, handleExport])

  // Resolve search input (owned by OrdersFilters) for F / "/" shortcuts
  useEffect(() => {
    searchInputRef.current = document.querySelector<HTMLInputElement>(
      'input[type="search"][aria-label="Search orders"]'
    )
  })

  // ─── Derived ───────────────────────────────────────────────────────────────

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          filters.startDate ||
          filters.endDate ||
          filters.paymentStatus ||
          filters.paymentMethod ||
          filters.minAmount ||
          filters.maxAmount ||
          filters.city ||
          filters.hasIssues ||
          statusFilter !== 'all'
      ),
    [filters, statusFilter]
  )

  const handleStatsCardClick = useCallback((filter: string) => {
    if (filter === 'paid' || filter === 'pending') {
      setStatusFilter(filter)
    }
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-taupe uppercase">
            Narre Warren kitchen
          </p>
          <h1 className="font-bake-display text-3xl text-cocoa">Orders</h1>
          <p className="mt-1 text-sm text-cocoa-soft">
            {totalOrders} order{totalOrders === 1 ? '' : 's'} across the bake board
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SavedFilterViews
            views={savedViews}
            activeViewId={activeViewId}
            onSelectView={handleSelectView}
            onSaveCurrentView={handleSaveCurrentView}
            onDeleteView={handleDeleteView}
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-line bg-cream px-4 py-2 text-sm font-medium text-cocoa transition-all hover:bg-ivory"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory transition-all hover:bg-cocoa-soft disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <OrdersStatsRow paymentStats={paymentStats} onCardClick={handleStatsCardClick} />

      {/* Tabs */}
      <OrdersTabs
        statusCounts={statusCounts}
        totalCount={totalOrders}
        activeStatus={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Filters */}
      <OrdersFilters filters={filters} onChange={setFilters} savedViews={[]} onSaveView={persistView} />

      {/* Bulk actions */}
      <BulkActionsBar selectedCount={selectedIds.size} onAction={handleBulkAction} onClearSelection={clearSelection} />

      {/* Content */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-ivory shadow-sm">
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-cream" />
            ))}
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-ivory shadow-sm">
          <EmptyState
            hasFilters={hasFilters}
            onClearFilters={() => {
              setFilters({})
              setStatusFilter('all')
            }}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-ivory shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="hidden w-full md:table">
                <thead>
                  <tr className="border-b border-line bg-cream">
                    <th className="w-10 px-3 py-4">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={selectedIds.size > 0 && selectedIds.size === orders.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(new Set(orders.map(resolveOrderKey)))
                          else clearSelection()
                        }}
                        className="h-4 w-4 rounded border-line text-cocoa focus:ring-cocoa"
                      />
                    </th>
                    {TABLE_HEADERS.map((h) => (
                      <th
                        key={h.label}
                        className={`px-3 py-4 text-xs font-semibold tracking-wider whitespace-nowrap text-taupe uppercase ${h.align === 'right' ? 'text-right' : 'text-left'}`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {orders.map((order) => {
                    const key = resolveOrderKey(order)
                    return (
                      <OrderRow
                        key={key}
                        order={order}
                        isSelected={selectedIds.has(key)}
                        onToggleSelect={toggleSelect}
                        onAction={(action) => handleRowAction(action, key)}
                        onClick={() => setQuickViewOrder(order)}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pager
              page={currentPage}
              pages={totalPages}
              onChange={setCurrentPage}
              className="border-t border-line bg-cream px-4 py-4"
            />
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {orders.map((order) => (
              <MobileOrderCard
                key={resolveOrderKey(order)}
                order={order}
                onTap={(o) => setQuickViewOrder(o as OrderRecord)}
                onAction={(action, o) => handleRowAction(action, resolveOrderKey(o as OrderRecord))}
              />
            ))}
            <Pager
              page={currentPage}
              pages={totalPages}
              onChange={setCurrentPage}
              className="rounded-xl border border-line bg-ivory px-4 py-3 shadow-sm"
            />
          </div>
        </>
      )}

      {/* Quick view modal */}
      <QuickViewModal
        order={quickViewOrder}
        isOpen={Boolean(quickViewOrder)}
        onClose={() => setQuickViewOrder(null)}
        onAction={(action, o) => {
          const rec = o as OrderRecord
          const key = rec.orderId || rec.id || rec._id?.toString() || ''
          handleRowAction(action, key)
          if (action === 'cancel') setQuickViewOrder(null)
        }}
      />

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* In-flight indicator */}
      {actionLoading && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900/80 px-4 py-2 text-xs text-white shadow-lg">
          Working…
        </div>
      )}
    </div>
  )
}
