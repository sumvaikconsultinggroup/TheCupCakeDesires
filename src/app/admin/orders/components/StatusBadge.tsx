'use client'

import { Check, CheckCircle2, Clock, Package, RotateCcw, Truck, XCircle } from 'lucide-react'

const config: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  order_created: {
    label: 'Order Created',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    icon: Package,
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  cod: {
    label: 'COD',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: Package,
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  pending_payment: {
    label: 'Awaiting Payment',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Check,
  },
  processing: {
    label: 'Processing',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: Package,
  },
  shipped: {
    label: 'Shipped',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    icon: XCircle,
  },
  refund_initiated: {
    label: 'Refund Initiated',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: RotateCcw,
  },
  refunded: {
    label: 'Refunded',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: RotateCcw,
  },
  expired: {
    label: 'Expired',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-400',
    icon: XCircle,
  },
  return_initiated: {
    label: 'Return Initiated',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: RotateCcw,
  },
  return_completed: {
    label: 'Returned',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    icon: RotateCcw,
  },
}

export interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = config[status] ?? {
    label: status,
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-700 dark:text-neutral-300',
    icon: Package,
  }
  const Icon = c.icon
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5'
  const isPending = status === 'pending' || status === 'pending_payment' || status === 'order_created'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${c.bg} ${c.text} ${sizing}`}>
      {isPending && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {c.label}
    </span>
  )
}
