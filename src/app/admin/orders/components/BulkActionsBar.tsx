'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, Download, Tag, X, XCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkActionsBarProps {
  selectedCount: number
  onAction: (action: string) => void
  onClearSelection: () => void
}

// ─── Action definition ────────────────────────────────────────────────────────

interface ActionDef {
  id: string
  label: string
  icon: React.ReactNode
  variant: 'default' | 'danger'
}

const ACTIONS: ActionDef[] = [
  {
    id: 'confirm',
    label: 'Mark Confirmed',
    icon: <CheckCheck className="h-4 w-4" aria-hidden="true" />,
    variant: 'default',
  },
  {
    id: 'cancel',
    label: 'Mark Cancelled',
    icon: <XCircle className="h-4 w-4" aria-hidden="true" />,
    variant: 'danger',
  },
  {
    id: 'tag',
    label: 'Add Tag',
    icon: <Tag className="h-4 w-4" aria-hidden="true" />,
    variant: 'default',
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" aria-hidden="true" />,
    variant: 'default',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkActionsBar({ selectedCount, onAction, onClearSelection }: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount >= 1 && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="sticky top-0 z-40 flex flex-wrap items-center gap-3 rounded-2xl border border-[#1B198F]/30 bg-[#1B198F] px-4 py-3 shadow-lg"
          role="toolbar"
          aria-label="Bulk order actions"
        >
          {/* Selection count badge */}
          <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white">
            {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="h-4 w-px shrink-0 bg-white/30" aria-hidden="true" />

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction(action.id)}
                className={[
                  'flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B198F]',
                  action.variant === 'danger'
                    ? 'bg-red-500/90 text-white hover:bg-red-400'
                    : 'bg-white/15 text-white hover:bg-white/25',
                ].join(' ')}
                aria-label={action.label}
              >
                {action.icon}
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="ml-auto" aria-hidden="true" />

          {/* Clear selection */}
          <button
            type="button"
            onClick={onClearSelection}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B198F]"
            aria-label="Clear selection"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
