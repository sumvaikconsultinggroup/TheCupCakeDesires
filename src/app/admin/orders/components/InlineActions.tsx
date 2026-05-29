'use client'

import { getCustomerPhone } from '@/lib/format'
import { Eye, Mail, MessageCircle, MoreVertical, Phone, Printer, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export interface InlineActionsProps {
  order: {
    _id?: string
    id?: string
    orderId?: string
    status?: string
    customer?: { phone?: string }
    customerPhone?: string
  }
  onAction: (action: string, orderId: string) => void
}

export default function InlineActions({ order, onAction }: InlineActionsProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  // Prefer human-readable orderId (e.g. "ORD-1234"), then Mongo _id, then id.
  // Using only _id produced empty href when API enrichment omitted it.
  const orderId = order.orderId || order._id || order.id || ''

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close dropdown on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const phone = getCustomerPhone(order)
  const waPhone = phone ? phone.replace(/[^0-9]/g, '') : null
  const btn =
    'flex items-center justify-center w-8 h-8 rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors'
  return (
    <div className="relative flex items-center gap-0.5">
      <Link
        href={`/admin/orders/${orderId}`}
        className={btn}
        aria-label="View order"
        onClick={(e) => e.stopPropagation()}
      >
        <Eye className="h-4 w-4" />
      </Link>
      {phone && (
        <a href={`tel:${phone}`} className={btn} aria-label="Call customer">
          <Phone className="h-4 w-4" />
        </a>
      )}
      {waPhone && (
        <a
          href={`https://wa.me/${waPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          aria-label="WhatsApp customer"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
      <button className={btn} aria-label="Resend email" onClick={() => onAction('resend_email', orderId)}>
        <Mail className="h-4 w-4" />
      </button>
      <button className={btn} aria-label="Print invoice" onClick={() => onAction('print_invoice', orderId)}>
        <Printer className="h-4 w-4" />
      </button>
      <div className="relative" ref={menuRef}>
        <button className={btn} aria-label="More actions" onClick={() => setOpen((v) => !v)}>
          <MoreVertical className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute top-full right-0 z-40 mt-1 min-w-[140px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => {
                onAction('refund', orderId)
                setOpen(false)
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Refund
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              onClick={() => {
                onAction('cancel', orderId)
                setOpen(false)
              }}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
