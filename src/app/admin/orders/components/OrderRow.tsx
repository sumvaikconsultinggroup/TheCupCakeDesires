'use client'

import { formatDateIN, formatINR, formatRelative, shortOrderNumber } from '@/lib/format'
import type { OrderEnriched } from '@/types/orders'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import CustomerCell from './CustomerCell'
import InlineActions from './InlineActions'
import ItemsCell from './ItemsCell'
import PaymentBadge from './PaymentBadge'
import StatusBadge from './StatusBadge'

export interface OrderRowProps {
  order: OrderEnriched
  isSelected: boolean
  onToggleSelect: (orderId: string) => void
  onAction: (action: string, orderId: string) => void
  onClick?: () => void
}

export default function OrderRow({ order, isSelected, onToggleSelect, onAction, onClick }: OrderRowProps) {
  const orderId = order._id ?? order.id ?? ''
  const shortNum = shortOrderNumber(order)
  const risk = order.riskLevel as string | undefined
  const totalAmount = (order.totalAmount ?? 0) as number
  const riskBorder =
    risk === 'high' ? 'border-l-4 border-red-500' : risk === 'medium' ? 'border-l-4 border-amber-500' : ''
  const handleCopyId = useCallback(() => {
    navigator.clipboard
      .writeText(orderId)
      .then(() => toast.success('Order ID copied'))
      .catch(() => {})
  }, [orderId])
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === 'Enter') onClick?.()
    },
    [onClick]
  )
  const paymentStatus: string = order.paymentDetails?.paymentStatus ?? 'pending'
  const paidAt: string | undefined = order.paymentDetails?.paidAt ?? order.paymentDetails?.timestamp ?? undefined
  const pendingSince: string | undefined = paymentStatus === 'pending' ? (order.createdAt ?? undefined) : undefined
  return (
    <tr
      className={`group cursor-pointer transition-colors hover:bg-cream focus-visible:ring-2 focus-visible:ring-cocoa focus-visible:outline-none focus-visible:ring-inset ${riskBorder}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      aria-selected={isSelected}
    >
      <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(orderId)}
          className="h-4 w-4 rounded border-line text-cocoa focus:ring-cocoa"
          aria-label={`Select order ${shortNum}`}
        />
      </td>
      <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleCopyId}
          className="font-mono text-sm font-semibold text-cocoa hover:underline"
          title={`Click to copy: ${orderId}`}
        >
          {shortNum}
        </button>
      </td>
      <td className="max-w-[200px] px-3 py-3">
        <CustomerCell order={order} />
      </td>
      <td className="max-w-[220px] px-3 py-3">
        <ItemsCell items={order.items ?? []} />
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <StatusBadge status={order.status ?? 'pending'} />
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <PaymentBadge status={paymentStatus} paidAt={paidAt} pendingSince={pendingSince} />
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span
          className={`font-semibold tabular-nums ${totalAmount >= 150 ? 'text-mint-accent' : 'text-cocoa'}`}
        >
          {formatINR(totalAmount)}
        </span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        {order.deliveryDate ? (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-cocoa">
              {new Date(order.deliveryDate).toLocaleDateString('en-AU', {
                timeZone: 'Australia/Melbourne',
                day: '2-digit',
                month: 'short',
              })}
            </span>
            {order.deliverySlot ? (
              <span className="text-xs text-taupe capitalize">{order.deliverySlot}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-taupe">—</span>
        )}
      </td>
      <td className="px-3 py-3 whitespace-nowrap">
        {order.createdAt ? (
          <span className="text-sm text-cocoa-soft" title={formatRelative(order.createdAt)}>
            {formatDateIN(order.createdAt)}
          </span>
        ) : (
          <span className="text-sm text-taupe">-</span>
        )}
      </td>
      <td
        className="px-3 py-3 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <InlineActions order={order} onAction={onAction} />
      </td>
    </tr>
  )
}
