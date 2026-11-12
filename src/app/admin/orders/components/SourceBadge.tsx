'use client'

import { normalizeOrderSource, orderSourceLabel, type OrderSource } from '@/lib/order-source'

const STYLES: Record<OrderSource, string> = {
  online: 'bg-cream text-cocoa ring-1 ring-line',
  phone: 'bg-rose-deep text-cocoa',
  email: 'bg-gold-soft text-cocoa',
}

export default function SourceBadge({ source, className = '' }: { source?: string | null; className?: string }) {
  const value = normalizeOrderSource(source)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${STYLES[value]} ${className}`}
    >
      {orderSourceLabel(value)}
    </span>
  )
}
