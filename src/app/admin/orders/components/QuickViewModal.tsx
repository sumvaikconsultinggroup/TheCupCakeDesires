'use client'

import { formatDateIN, formatINR, getCustomerName, getCustomerPhone } from '@/lib/format'
import { parseCupcakeContents } from '@/lib/cupcake-builder-images'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Phone, Printer, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface OrderItemLite {
  productId?: string
  name?: string
  quantity?: number
  price?: number
  imageUrl?: string
  variants?: { name?: string; option?: string }[]
}

interface QuickViewOrder {
  _id?: string
  id?: string
  orderId?: string
  status?: string
  totalAmount?: number
  createdAt?: string
  customer?: { firstName?: string; lastName?: string; name?: string; email?: string; phone?: string }
  customerName?: string
  customerPhone?: string
  customerLifetimeValue?: number
  customerOrderCount?: number
  customerIsRepeat?: boolean
  userEmail?: string
  items?: OrderItemLite[]
  paymentDetails?: { paymentMethod?: string; transactionId?: string; paymentStatus?: string }
  shippingAddress?: {
    address?: string
    address1?: string
    street?: string
    city?: string
    state?: string
    postalCode?: string
    zipcode?: string
    country?: string
  }
  tags?: string[]
  notes?: Array<{
    _id?: string
    text?: string
    content?: string
    createdAt?: string
    createdBy?: string
    isInternal?: boolean
  }>
  riskLevel?: 'low' | 'medium' | 'high'
}

export interface QuickViewModalProps {
  order: QuickViewOrder | null
  isOpen: boolean
  onClose: () => void
  onAction: (action: string, order: QuickViewOrder) => void
}

export default function QuickViewModal({ order, isOpen, onClose, onAction }: QuickViewModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Close on Escape + focus trap (Tab / Shift+Tab cycling within the modal)
  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null

    // Focus first focusable element inside the modal on open
    const focusFirst = () => {
      const panel = panelRef.current
      if (!panel) return
      const els = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (els.length > 0) els[0].focus()
    }
    const focusTimer = setTimeout(focusFirst, 50)

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const els = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled')
      )
      if (els.length === 0) {
        e.preventDefault()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('keydown', handler)
      // Restore focus to whatever the user came from
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && order && (
        <motion.div
          key="qv-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="qv-panel"
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Order quick view"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {'Order ' + (order.orderId || '#' + (order._id || '').slice(-6).toUpperCase())}
                </h2>
                {order.createdAt && (
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDateIN(order.createdAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                  Customer
                </h3>
                <p className="text-base font-medium text-neutral-900 dark:text-neutral-100">{getCustomerName(order)}</p>
                {getCustomerPhone(order) && (
                  <a
                    href={'tel:' + getCustomerPhone(order)}
                    className="mt-0.5 block text-sm text-neutral-700 hover:text-[#2e1f15] dark:text-neutral-300 dark:hover:text-[#a3a0ff]"
                  >
                    {getCustomerPhone(order)}
                  </a>
                )}
                {(order.customer?.email || order.userEmail) && (
                  <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                    {order.customer?.email || order.userEmail}
                  </p>
                )}
                {order.customerIsRepeat && (
                  <span className="mt-2 inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {'Returning · ' + formatINR(order.customerLifetimeValue || 0) + ' lifetime'}
                  </span>
                )}
              </section>

              {order.shippingAddress && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                    Shipping Address
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {order.shippingAddress.address || order.shippingAddress.address1 || order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city +
                      ', ' +
                      order.shippingAddress.state +
                      ' ' +
                      (order.shippingAddress.postalCode || order.shippingAddress.zipcode || '')}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </section>
              )}

              {order.items && order.items.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                    Items
                  </h3>
                  <ul className="space-y-2">
                    {order.items.map((it, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-3 text-sm">
                        <span className="min-w-0 text-neutral-900 dark:text-neutral-100">
                          <span className="block truncate">
                            {(it.name || 'Product') + ' x ' + (it.quantity || 1)}
                          </span>
                          {parseCupcakeContents(it.variants?.find((v) => v.name === 'Contents')?.option).length > 0 && (
                            <span className="mt-1 flex flex-wrap gap-1">
                              {parseCupcakeContents(it.variants?.find((v) => v.name === 'Contents')?.option).map((flavour) => (
                                <span
                                  key={flavour.name}
                                  className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                >
                                  {flavour.quantity}x {flavour.name}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                        <span className="ml-2 shrink-0 font-mono text-neutral-700 dark:text-neutral-300">
                          {formatINR((it.price || 0) * (it.quantity || 1))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Total</span>
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {formatINR(order.totalAmount || 0)}
                </span>
              </section>

              {order.paymentDetails && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                    Payment
                  </h3>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {(order.paymentDetails.paymentMethod || 'Unknown') +
                      ' · ' +
                      (order.paymentDetails.paymentStatus || 'pending')}
                  </p>
                  {order.paymentDetails.transactionId && (
                    <p className="mt-0.5 truncate font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {order.paymentDetails.transactionId}
                    </p>
                  )}
                </section>
              )}

              {order.tags && order.tags.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {order.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-900">
              <a
                href={'/admin/orders/' + (order._id || order.id)}
                className="rounded-md bg-[#2e1f15] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F0E5B]"
              >
                View full order
              </a>
              {getCustomerPhone(order) && (
                <a
                  href={'tel:' + getCustomerPhone(order)}
                  className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
              <button
                type="button"
                onClick={() => onAction('resend_email', order)}
                className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <Mail className="h-4 w-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => onAction('print_invoice', order)}
                className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <div className="ml-auto" />
              <button
                type="button"
                onClick={() => onAction('refund', order)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
              >
                <RotateCcw className="h-4 w-4" /> Refund
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
