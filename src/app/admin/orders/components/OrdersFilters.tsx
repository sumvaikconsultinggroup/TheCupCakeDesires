'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FiltersState {
  search?: string
  startDate?: string
  endDate?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  minAmount?: number
  maxAmount?: number
  city?: string
  hasIssues?: boolean
}

export interface SavedView {
  id: string
  name: string
  filters: FiltersState
}

interface OrdersFiltersProps {
  filters: FiltersState
  onChange: (filters: FiltersState) => void
  savedViews: SavedView[]
  onSaveView: (name: string) => void
}

// ─── Date preset helpers ──────────────────────────────────────────────────────

type DatePreset = 'today' | '7d' | '30d' | '90d' | 'custom'

function buildDateRange(preset: DatePreset): { startDate: string; endDate: string } | null {
  if (preset === 'custom') return null
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  const offsets: Record<Exclude<DatePreset, 'custom'>, number> = {
    today: 0,
    '7d': 6,
    '30d': 29,
    '90d': 89,
  }
  const start = new Date(now)
  start.setDate(start.getDate() - offsets[preset as Exclude<DatePreset, 'custom'>])
  return { startDate: start.toISOString().split('T')[0], endDate: end }
}

// ─── Save-view dialog ─────────────────────────────────────────────────────────

interface SaveViewDialogProps {
  onSave: (name: string) => void
  onClose: () => void
}

function SaveViewDialog({ onSave, onClose }: SaveViewDialogProps) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      onSave(trimmed)
      onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 z-50 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
      role="dialog"
      aria-modal="true"
      aria-label="Save filter view"
    >
      <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Save current view</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="View name…"
          maxLength={40}
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="shrink-0 rounded-xl bg-[#2e1f15] px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15] focus-visible:ring-offset-2 disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15] focus-visible:ring-offset-2 dark:border-neutral-700 dark:text-neutral-300"
        >
          <X className="h-4 w-4" aria-label="Close" />
        </button>
      </form>
    </motion.div>
  )
}

// ─── Chip component ───────────────────────────────────────────────────────────

interface ChipProps {
  label: string
  onRemove: () => void
}

function Chip({ label, onRemove }: ChipProps) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#2e1f15]/30 bg-[#2e1f15]/10 px-3 py-1 text-xs font-medium text-[#2e1f15] dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#2e1f15]/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2e1f15]"
        aria-label={`Remove filter: ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  custom: 'Custom',
}

const DATE_PRESETS: DatePreset[] = ['today', '7d', '30d', '90d', 'custom']

export default function OrdersFilters({ filters, onChange, savedViews: _savedViews, onSaveView }: OrdersFiltersProps) {
  const [datePreset, setDatePreset] = useState<DatePreset>('custom')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const saveDialogRef = useRef<HTMLDivElement>(null)

  // Debounce search — use a ref to always read the latest filters so the debounce
  // callback never reverts other concurrent filter changes
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '')
  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    const t = setTimeout(() => {
      onChangeRef.current({ ...filtersRef.current, search: searchDraft || undefined })
    }, 300)
    return () => clearTimeout(t)
  }, [searchDraft])

  // Close save dialog on outside click
  useEffect(() => {
    if (!showSaveDialog) return
    function handleClick(e: MouseEvent) {
      if (saveDialogRef.current && !saveDialogRef.current.contains(e.target as Node)) {
        setShowSaveDialog(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSaveDialog])

  const setFilter = useCallback(
    (partial: Partial<FiltersState>) => onChange({ ...filters, ...partial }),
    [filters, onChange]
  )

  function applyDatePreset(preset: DatePreset) {
    setDatePreset(preset)
    const range = buildDateRange(preset)
    if (range) {
      setFilter({ startDate: range.startDate, endDate: range.endDate })
    }
  }

  // ─── Active filter chips ───────────────────────────────────────────────────

  const chips: { label: string; onRemove: () => void }[] = []

  if (filters.search)
    chips.push({
      label: `Search: "${filters.search}"`,
      onRemove: () => {
        setSearchDraft('')
        setFilter({ search: undefined })
      },
    })
  if (filters.startDate || filters.endDate) {
    chips.push({
      label: `Date: ${filters.startDate ?? '…'} → ${filters.endDate ?? '…'}`,
      onRemove: () => {
        setDatePreset('custom')
        setFilter({ startDate: undefined, endDate: undefined })
      },
    })
  }
  if (filters.paymentStatus)
    chips.push({ label: `Payment: ${filters.paymentStatus}`, onRemove: () => setFilter({ paymentStatus: undefined }) })
  if (filters.paymentMethod)
    chips.push({ label: `Method: ${filters.paymentMethod}`, onRemove: () => setFilter({ paymentMethod: undefined }) })
  if (filters.minAmount != null || filters.maxAmount != null) {
    chips.push({
      label: `Amount: $${filters.minAmount ?? 0} – $${filters.maxAmount ?? '∞'}`,
      onRemove: () => setFilter({ minAmount: undefined, maxAmount: undefined }),
    })
  }
  if (filters.city) chips.push({ label: `City: ${filters.city}`, onRemove: () => setFilter({ city: undefined }) })
  if (filters.hasIssues) chips.push({ label: 'Has issues', onRemove: () => setFilter({ hasIssues: undefined }) })

  function clearAll() {
    setSearchDraft('')
    setDatePreset('custom')
    onChange({})
  }

  const selectCls =
    'rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 outline-none transition-colors focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      {/* Row 1: Search + preset buttons + toggles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search orders, customers, IDs…"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pr-4 pl-10 text-sm transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            aria-label="Search orders"
          />
        </div>

        {/* Date presets */}
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-neutral-200 p-1 dark:border-neutral-700">
          <Calendar className="ml-1 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          {DATE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyDatePreset(p)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15]',
                datePreset === p
                  ? 'bg-[#2e1f15] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700',
              ].join(' ')}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Payment status */}
        <select
          value={filters.paymentStatus ?? ''}
          onChange={(e) => setFilter({ paymentStatus: e.target.value || undefined })}
          className={selectCls}
          aria-label="Payment status filter"
        >
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        {/* Payment method */}
        <select
          value={filters.paymentMethod ?? ''}
          onChange={(e) => setFilter({ paymentMethod: e.target.value || undefined })}
          className={selectCls}
          aria-label="Payment method filter"
        >
          <option value="">All Methods</option>
          <option value="Stripe">Stripe</option>
          <option value="Wallet">Wallet</option>
        </select>

        {/* Has issues toggle */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 select-none dark:text-neutral-300">
          <span
            role="checkbox"
            aria-checked={!!filters.hasIssues}
            tabIndex={0}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setFilter({ hasIssues: !filters.hasIssues })}
            onClick={() => setFilter({ hasIssues: !filters.hasIssues })}
            className={[
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15] focus-visible:ring-offset-1',
              filters.hasIssues ? 'bg-[#EA580C]' : 'bg-neutral-200 dark:bg-neutral-600',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                filters.hasIssues ? 'translate-x-4' : 'translate-x-0',
              ].join(' ')}
            />
          </span>
          Has issues
        </label>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15] dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-150 ${showAdvanced ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Row 2: Advanced filters (collapsible) */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-700">
              {/* Custom date range */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-500">Start date</label>
                  <input
                    type="date"
                    value={filters.startDate ?? ''}
                    onChange={(e) => {
                      setDatePreset('custom')
                      setFilter({ startDate: e.target.value || undefined })
                    }}
                    className={selectCls}
                    aria-label="Start date"
                  />
                </div>
                <span className="mt-5 text-neutral-400">–</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-500">End date</label>
                  <input
                    type="date"
                    value={filters.endDate ?? ''}
                    onChange={(e) => {
                      setDatePreset('custom')
                      setFilter({ endDate: e.target.value || undefined })
                    }}
                    className={selectCls}
                    aria-label="End date"
                  />
                </div>
              </div>

              {/* Amount range */}
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-500">Min $</label>
                  <input
                    type="number"
                    min={0}
                    value={filters.minAmount ?? ''}
                    onChange={(e) => setFilter({ minAmount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className={`${selectCls} w-28`}
                    aria-label="Minimum order amount"
                  />
                </div>
                <span className="mb-2 text-neutral-400">–</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-500">Max $</label>
                  <input
                    type="number"
                    min={0}
                    value={filters.maxAmount ?? ''}
                    onChange={(e) => setFilter({ maxAmount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="∞"
                    className={`${selectCls} w-28`}
                    aria-label="Maximum order amount"
                  />
                </div>
              </div>

              {/* City filter */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-neutral-500">City</label>
                <input
                  type="text"
                  value={filters.city ?? ''}
                  onChange={(e) => setFilter({ city: e.target.value || undefined })}
                  placeholder="e.g. Mumbai"
                  className={`${selectCls} w-36`}
                  aria-label="City filter"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 3: Active chips + actions */}
      <AnimatePresence>
        {chips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap items-center gap-2 overflow-hidden border-t border-neutral-100 pt-3 dark:border-neutral-700"
          >
            {chips.map((chip) => (
              <Chip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-red-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15]"
            >
              Clear all
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save view button (always visible at bottom-right) */}
      <div className="flex justify-end" ref={saveDialogRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setShowSaveDialog((v) => !v)}
          className="text-xs font-medium text-[#2e1f15] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15] dark:text-indigo-400"
        >
          + Save view
        </button>
        <AnimatePresence>
          {showSaveDialog && <SaveViewDialog onSave={onSaveView} onClose={() => setShowSaveDialog(false)} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
