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

// Self-delivery lifecycle: pending_payment → paid → in_kitchen → out_for_delivery → delivered
const TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Awaiting payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'in_kitchen', label: 'In kitchen' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
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
              'relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cocoa focus-visible:ring-offset-2',
              isActive
                ? 'bg-cocoa text-ivory shadow-sm'
                : 'border border-line bg-cream text-cocoa/70 hover:border-cocoa/40 hover:bg-ivory',
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
