'use client'

import { CheckCircle2, ChefHat, Clock, CookingPot, RotateCcw, Truck, XCircle } from 'lucide-react'

// Self-delivery lifecycle palette — uses bake tokens so badges sit happily on
// ivory/cream surfaces alongside the rest of the admin shell.
const config: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending_payment: {
    label: 'Awaiting payment',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    icon: CheckCircle2,
  },
  in_kitchen: {
    label: 'In kitchen',
    bg: 'bg-cream-deep',
    text: 'text-cocoa',
    icon: ChefHat,
  },
  out_for_delivery: {
    label: 'Out for delivery',
    bg: 'bg-rose-deep',
    text: 'text-cocoa',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-mint',
    text: 'text-mint-accent',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: RotateCcw,
  },
}

// Legacy values from before the self-delivery refactor — map them onto the
// closest current label so old orders still render until the migration runs.
const legacy: Record<string, string> = {
  order_created: 'pending_payment',
  pending: 'pending_payment',
  cod: 'paid',
  confirmed: 'in_kitchen',
  processing: 'in_kitchen',
  shipped: 'out_for_delivery',
  refund_initiated: 'refunded',
  return_initiated: 'refunded',
  return_completed: 'refunded',
  expired: 'cancelled',
}

export interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const resolved = config[status] ?? config[legacy[status] ?? ''] ?? {
    label: status,
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    icon: CookingPot,
  }
  const Icon = resolved.icon
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5'
  const isPending = status === 'pending_payment' || status === 'pending' || status === 'order_created'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${resolved.bg} ${resolved.text} ${sizing}`}>
      {isPending && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {resolved.label}
    </span>
  )
}
