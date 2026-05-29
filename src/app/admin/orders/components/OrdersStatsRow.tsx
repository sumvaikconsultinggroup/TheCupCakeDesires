'use client'

import { formatINR } from '@/lib/format'
import { motion } from 'framer-motion'
import { AlertTriangle, IndianRupee, TrendingUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentStats {
  totalRevenue: number
  pendingRevenue: number
  refundedAmount: number
  paidOrderCount: number
  pendingOrderCount: number
  cancelledOrderCount: number
  avgOrderValue: number
  successRate: number
  /** Optional flag: any pending order is older than 24 h */
  hasStalePending?: boolean
}

interface OrdersStatsRowProps {
  paymentStats: PaymentStats
  onCardClick: (filter: string) => void
}

// ─── Mini sparkline (purely decorative) ───────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  const w = 64
  const h = 24
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - (v / max) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="opacity-60">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Donut arc ────────────────────────────────────────────────────────────────

function DonutArc({ pct }: { pct: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx={24} cy={24} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="opacity-15" />
      <circle
        cx={24}
        cy={24}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        className="transition-all duration-500"
      />
    </svg>
  )
}

// ─── Individual stat card ─────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon: React.ReactNode
  colorClass: string
  onClick: () => void
}

function StatCard({ label, value, sub, icon, colorClass, onClick }: StatCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={[
        'group flex w-full flex-col gap-3 rounded-2xl border bg-white p-5 text-left transition-colors duration-150',
        'dark:border-neutral-700 dark:bg-neutral-800',
        'border-neutral-200 hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B198F] focus-visible:ring-offset-2',
        colorClass,
      ].join(' ')}
      type="button"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition-colors group-hover:bg-[#1B198F]/10 group-hover:text-[#1B198F] dark:bg-neutral-700 dark:text-neutral-300">
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
          {sub && <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{sub}</div>}
        </div>
      </div>
    </motion.button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersStatsRow({ paymentStats, onCardClick }: OrdersStatsRowProps) {
  const { totalRevenue, pendingRevenue, pendingOrderCount, avgOrderValue, successRate, hasStalePending } = paymentStats

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Total Revenue */}
      <StatCard
        label="Total Revenue"
        value={formatINR(totalRevenue)}
        sub={<span className="text-neutral-500 dark:text-neutral-400">From paid orders</span>}
        icon={<IndianRupee className="h-5 w-5" />}
        colorClass=""
        onClick={() => onCardClick('paid')}
      />

      {/* Pending Revenue */}
      <StatCard
        label="Pending Revenue"
        value={formatINR(pendingRevenue)}
        sub={
          <span className="flex items-center gap-1">
            {hasStalePending && (
              <AlertTriangle
                className="h-3 w-3 text-amber-500"
                aria-label="Some pending orders are over 24 hours old"
              />
            )}
            <span>
              {pendingOrderCount} order{pendingOrderCount !== 1 ? 's' : ''} pending
            </span>
          </span>
        }
        icon={<AlertTriangle className="h-5 w-5" />}
        colorClass=""
        onClick={() => onCardClick('pending')}
      />

      {/* Average Order Value */}
      <StatCard
        label="Avg Order Value"
        value={formatINR(avgOrderValue)}
        sub={<span className="text-neutral-500 dark:text-neutral-400">For selected period</span>}
        icon={<TrendingUp className="h-5 w-5" />}
        colorClass=""
        onClick={() => onCardClick('avg')}
      />

      {/* Success Rate */}
      <StatCard
        label="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        sub={<span className="text-neutral-500 dark:text-neutral-400">of all orders paid</span>}
        icon={
          <span className="text-[#1B198F] dark:text-indigo-400">
            <DonutArc pct={successRate} />
          </span>
        }
        colorClass=""
        onClick={() => onCardClick('success')}
      />
    </div>
  )
}
