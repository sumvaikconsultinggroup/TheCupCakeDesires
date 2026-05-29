'use client'

import { formatINR, formatRelative, getCustomerName, getCustomerPhone, shortOrderNumber } from '@/lib/format'
import { ChevronRight, MoreVertical, Package, Phone } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface MobileOrder {
  _id?: string
  id?: string
  orderId?: string
  status?: string
  totalAmount?: number
  createdAt?: string
  customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }
  customerName?: string
  customerPhone?: string
  items?: Array<{ name?: string; quantity?: number; price?: number }>
}

interface MobileOrderCardProps {
  order: MobileOrder
  onTap: (order: MobileOrder) => void
  onAction: (action: string, order: MobileOrder) => void
}

export default function MobileOrderCard({ order, onTap, onAction }: MobileOrderCardProps) {
  const firstItem = order.items?.[0]
  const extraCount = (order.items?.length ?? 0) - 1
  const phone = getCustomerPhone(order)

  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <button
        type="button"
        onClick={() => onTap(order)}
        className="flex min-h-[88px] w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:active:bg-neutral-800"
        aria-label={'Open order ' + shortOrderNumber(order)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {shortOrderNumber(order)}
          </span>
          <div className="flex items-center gap-2">
            {order.status && <StatusBadge status={order.status} size="sm" />}
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {formatINR(order.totalAmount || 0)}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {getCustomerName(order)}
          </span>
        </div>

        {firstItem && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {(firstItem.name || 'Product') + ' x ' + (firstItem.quantity || 1)}
              {extraCount > 0 && ' +' + extraCount + ' more'}
            </span>
          </div>
        )}

        {order.createdAt && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">{formatRelative(order.createdAt)}</p>
        )}
      </button>

      <div className="absolute top-3 right-10 flex items-center gap-1">
        {phone && (
          <a
            href={'tel:' + phone}
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-[#1B198F] dark:hover:bg-neutral-800"
            aria-label={'Call ' + getCustomerName(order)}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction('menu', order)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          aria-label="More actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
