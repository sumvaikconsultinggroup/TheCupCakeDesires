'use client'

import { formatINR, getCustomerName, getCustomerPhone } from '@/lib/format'
import { AlertTriangle, Phone } from 'lucide-react'

export interface CustomerCellProps {
  order: {
    customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }
    customerName?: string
    customerPhone?: string
    userEmail?: string
    customerLifetimeValue?: number
    customerOrderCount?: number
    customerIsRepeat?: boolean
    riskLevel?: 'low' | 'medium' | 'high'
    userId?: string
  }
}

export default function CustomerCell({ order }: CustomerCellProps) {
  const name = getCustomerName(order)
  const phone = getCustomerPhone(order)
  const email = order.customer?.email ?? order.userEmail ?? ''
  const ltv = order.customerLifetimeValue ?? 0
  const isRepeat = order.customerIsRepeat || (order.customerOrderCount ?? 0) > 1
  const risk = order.riskLevel
  const riskColor = risk === 'high' ? 'bg-red-500' : risk === 'medium' ? 'bg-amber-500' : null
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        {riskColor && (
          <span className={`h-2 w-2 rounded-full ${riskColor}`} title={`${risk} risk`} aria-label={`${risk} risk`} />
        )}
        <span className={'truncate font-semibold text-neutral-900 dark:text-neutral-100'}>{name}</span>
        {risk === 'high' && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-1 font-mono text-xs text-neutral-700 hover:text-[#2e1f15] dark:text-neutral-300 dark:hover:text-[#a3a0ff]"
        >
          <Phone className="h-3 w-3" />
          {phone}
        </a>
      )}
      {email && <span className={'truncate text-xs text-neutral-500 dark:text-neutral-400'}>{email}</span>}
      {isRepeat && ltv > 0 && (
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          &#8635; Returning &middot; {formatINR(ltv)}
        </span>
      )}
    </div>
  )
}
