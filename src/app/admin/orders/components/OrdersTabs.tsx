'use client'

import { motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrdersTabsProps {
  statusCounts: Record<string, number>
  totalCount: number
  activeStatus: string
  onChange: (status: string) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersTabs({
  statusCounts,
  totalCount,
  activeStatus,
  onChange,
}: OrdersTabsProps) {
  function getCount(key: string): number {
    if (key === 'all') return totalCount
    return statusCounts[key] ?? 0
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="tablist"
      aria-label="Order status filters"
    >
      {TABS.map((tab) => {
        const isActive = activeStatus === tab.key
        const count = getCount(tab.key)

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={[
              'relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e1f15] focus-visible:ring-offset-2',
              isActive
                ? 'bg-[#2e1f15] text-white shadow-sm'
                : 'border border-neutral-200 bg-white text-neutral-600 hover:border-[#2e1f15]/40 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
            ].join(' ')}
          >
            <span>{tab.label}</span>

            {/* Count badge */}
            <motion.span
              key={count}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={[
                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
                isActive
                  ? 'bg-white/25 text-white'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
              ].join(' ')}
            >
              {count}
            </motion.span>
          </button>
        )
      })}
    </div>
  )
}
