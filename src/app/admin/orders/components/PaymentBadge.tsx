'use client'

import { formatRelative } from '@/lib/format'

interface Cfg { label: string; bg: string; text: string }
const config: Record<string, Cfg> = {
  paid:     { label: 'Paid',     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  pending:  { label: 'Pending',  bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300' },
  failed:   { label: 'Failed',   bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300' },
  refunded: { label: 'Refunded', bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-300' },
}

export interface PaymentBadgeProps { status: string; paidAt?: string; pendingSince?: string }

export default function PaymentBadge({ status, paidAt, pendingSince }: PaymentBadgeProps) {
  const c = config[status] ?? { label: status, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400' }
  let overrideRed = false, pendingDays = 0
  if (status === 'pending' && pendingSince) {
    const hrs = (Date.now() - new Date(pendingSince).getTime()) / 3_600_000
    if (hrs > 24) { overrideRed = true; pendingDays = Math.floor(hrs / 24) }
  }
  const bg    = overrideRed ? 'bg-red-100 dark:bg-red-900/30'  : c.bg
  const text  = overrideRed ? 'text-red-700 dark:text-red-300' : c.text
  const label = overrideRed ? `Pending ${pendingDays}d`        : c.label
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>{label}</span>
      {status === 'paid' && paidAt && <span className="text-[11px] text-neutral-400 dark:text-neutral-500 pl-0.5">{formatRelative(paidAt)}</span>}
      {status === 'pending' && pendingSince && !overrideRed && <span className="text-[11px] text-neutral-400 dark:text-neutral-500 pl-0.5">since {formatRelative(pendingSince)}</span>}
    </div>
  )
}
