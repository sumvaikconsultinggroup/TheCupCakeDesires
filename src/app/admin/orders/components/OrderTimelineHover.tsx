'use client'

import { formatRelative } from '@/lib/format'
import { CheckCircle2, Circle, Package, RotateCcw, Truck, XCircle } from 'lucide-react'

interface OrderTimelineHoverProps {
  status: string
  createdAt?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
}

interface Step {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  timestamp?: string
}

export default function OrderTimelineHover({
  status,
  createdAt,
  paidAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
}: OrderTimelineHoverProps) {
  const isCancelled =
    status === 'cancelled' ||
    status === 'refunded' ||
    status === 'return_initiated' ||
    status === 'return_completed' ||
    status === 'expired'

  const mainSteps: Step[] = [
    { key: 'order_created', label: 'Created', icon: Package, timestamp: createdAt },
    { key: 'paid', label: 'Paid', icon: CheckCircle2, timestamp: paidAt },
    { key: 'shipped', label: 'Shipped', icon: Truck, timestamp: shippedAt },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, timestamp: deliveredAt },
  ]

  const ORDER: Record<string, number> = {
    order_created: 0,
    pending: 0,
    pending_payment: 0,
    paid: 1,
    confirmed: 1,
    processing: 1,
    shipped: 2,
    delivered: 3,
  }

  const currentIdx = isCancelled ? -1 : (ORDER[status] ?? 0)

  const getStepState = (idx: number): 'done' | 'active' | 'future' => {
    if (isCancelled) return 'future'
    if (idx < currentIdx) return 'done'
    if (idx === currentIdx) return 'active'
    return 'future'
  }

  return (
    <div className="w-max max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start gap-0">
        {mainSteps.map((step, idx) => {
          const state = getStepState(idx)
          const Icon = step.icon
          const isLast = idx === mainSteps.length - 1

          return (
            <div key={step.key} className="flex items-start">
              <div className="flex w-16 flex-col items-center gap-1">
                <div
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                    state === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : '',
                    state === 'active' ? 'border-[#2e1f15] bg-white text-[#2e1f15] dark:bg-neutral-900' : '',
                    state === 'future'
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-400 dark:border-neutral-600 dark:bg-neutral-800'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span
                  className={[
                    'text-center text-[10px] leading-tight font-medium',
                    state === 'done' ? 'text-emerald-600 dark:text-emerald-400' : '',
                    state === 'active' ? 'font-semibold text-[#2e1f15] dark:text-indigo-300' : '',
                    state === 'future' ? 'text-neutral-400 dark:text-neutral-500' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {step.label}
                </span>
                {step.timestamp && state !== 'future' && (
                  <span className="text-center text-[9px] leading-tight text-neutral-400 dark:text-neutral-500">
                    {formatRelative(step.timestamp)}
                  </span>
                )}
              </div>

              {!isLast && (
                <div
                  className={[
                    'mt-3 h-0.5 w-6 shrink-0',
                    state === 'done' ? 'bg-emerald-400' : 'bg-neutral-200 dark:bg-neutral-700',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>

      {isCancelled && (
        <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          {status === 'refunded' || status === 'return_completed' ? (
            <RotateCcw className="h-4 w-4 text-orange-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-xs font-medium text-red-600 capitalize dark:text-red-400">
            {status.replace(/_/g, ' ')}
          </span>
          {cancelledAt && <span className="ml-auto text-xs text-neutral-400">{formatRelative(cancelledAt)}</span>}
        </div>
      )}

      {!isCancelled && (
        <div className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800">
          <div className="flex items-center gap-1.5">
            <Circle className="h-2 w-2 animate-pulse fill-[#2e1f15] text-[#2e1f15]" />
            <span className="text-xs font-medium text-[#2e1f15] capitalize dark:text-indigo-300">
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
