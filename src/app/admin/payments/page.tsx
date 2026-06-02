'use client'

import { motion } from 'framer-motion'
import {
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getPayments, getPaymentStats } from './payment-actions'

type StatusFilter =
  | 'all'
  | 'captured'
  | 'pending'
  | 'authorized'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'

interface PaymentRow {
  _id: string
  paymentId: string
  orderId: string
  provider: string
  amount: number
  currency: string
  amountRefunded: number
  status: string
  customerEmail: string
  customerName: string
  customerPhone: string
  providerPaymentId?: string
  providerOrderId?: string
  paymentMethod?: {
    type?: string
    cardLast4?: string
    cardNetwork?: string
  }
  createdAt: string
}

const STATUS_TONE: Record<string, string> = {
  captured: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  authorized: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  refunded: 'bg-rose-50 text-rose-700 border-rose-200',
  partially_refunded: 'bg-rose-50 text-rose-700 border-rose-200',
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
        STATUS_TONE[status] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function formatAUD(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function describeMethod(payment: PaymentRow) {
  const pm = payment.paymentMethod
  if (!pm) return payment.provider || 'Stripe'
  if (pm.type === 'card') {
    const brand = pm.cardNetwork ? pm.cardNetwork.toUpperCase() : 'CARD'
    return `${brand} •••• ${pm.cardLast4 ?? '——'}`
  }
  if (pm.type === 'apple_pay') return 'Apple Pay'
  if (pm.type === 'google_pay') return 'Google Pay'
  if (pm.type === 'link') return 'Stripe Link'
  if (pm.type === 'afterpay_clearpay') return 'Afterpay'
  return 'Stripe'
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [stats, setStats] = useState({
    total: 0,
    captured: 0,
    failed: 0,
    refunded: 0,
    grossRevenue: 0,
    refundsTotal: 0,
    netRevenue: 0,
    successRate: 0,
  })

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([
        getPayments({
          page,
          limit: 50,
          status: statusFilter,
          search: search.trim() || undefined,
        }),
        getPaymentStats('30d'),
      ])
      if (pRes.success) {
        setPayments((pRes.payments as any) || [])
        if (pRes.pagination) {
          setPages(pRes.pagination.pages || 1)
        }
      } else {
        toast.error(pRes.message || 'Could not load payments')
      }
      if (sRes.success && sRes.stats) {
        setStats(sRes.stats as any)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  const statCards = useMemo(
    () => [
      {
        label: 'Captured',
        value: stats.captured,
        Icon: CheckCircle,
        accent: 'text-emerald-600',
      },
      {
        label: 'Failed',
        value: stats.failed,
        Icon: XCircle,
        accent: 'text-red-600',
      },
      {
        label: 'Refunded',
        value: stats.refunded,
        Icon: Clock,
        accent: 'text-rose-600',
      },
      {
        label: 'Success rate',
        value: `${stats.successRate}%`,
        Icon: CreditCard,
        accent: 'text-cocoa',
      },
    ],
    [stats]
  )

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">
            Stripe Payments
          </h1>
          <p className="text-sm text-neutral-600">
            All transactions captured by Stripe. Refresh for the latest webhook events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
          <Link
            href="/admin/settings/integrations/payments"
            className="inline-flex items-center gap-2 rounded-lg bg-cocoa px-3 py-2 text-sm font-medium text-ivory transition hover:bg-rose-accent"
          >
            <CreditCard className="h-4 w-4" />
            Configure Stripe
          </Link>
        </div>
      </div>

      {/* Revenue strip */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neutral-200 bg-white p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Gross revenue · 30d
          </p>
          <p className="mt-2 font-bake-display text-[24px] font-medium text-cocoa">
            {formatAUD(stats.grossRevenue)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-neutral-200 bg-white p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Refunds · 30d
          </p>
          <p className="mt-2 font-bake-display text-[24px] font-medium text-rose-accent">
            −{formatAUD(stats.refundsTotal)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Net revenue · 30d
          </p>
          <p className="mt-2 font-bake-display text-[28px] font-medium text-cocoa">
            {formatAUD(stats.netRevenue)}
          </p>
        </motion.div>
      </div>

      {/* Stat tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, Icon, accent }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 ${accent}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
              <p className="font-bake-display text-[18px] font-medium text-cocoa">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                fetchAll()
              }
            }}
            placeholder="Search by Stripe id, order, email, or name…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            setPage(1)
          }}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
        >
          <option value="all">All statuses</option>
          <option value="captured">Captured</option>
          <option value="authorized">Authorized</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {loading && payments.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Banknote className="h-10 w-10 text-neutral-300" />
            <p className="font-bake-display text-[18px] text-cocoa">No payments yet</p>
            <p className="text-sm text-neutral-500">
              Once Stripe processes its first checkout it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Stripe ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((p) => (
                  <tr key={p._id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-700">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <Link
                        href={`/admin/orders/${p.orderId}`}
                        className="font-medium text-cocoa hover:text-rose-accent"
                      >
                        #{p.orderId?.slice(-8) ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-neutral-900">{p.customerName || '—'}</p>
                      <p className="text-xs text-neutral-500">{p.customerEmail || '—'}</p>
                    </td>
                    <td className="px-5 py-3 text-neutral-700">{describeMethod(p)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-neutral-900">
                      {formatAUD(p.amount)}
                      {p.amountRefunded > 0 && (
                        <p className="text-xs font-normal text-rose-accent">
                          −{formatAUD(p.amountRefunded)} refunded
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-mono text-[11px] text-neutral-500">
                        {p.providerPaymentId ?? p.providerOrderId ?? '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-sm">
            <p className="text-neutral-500">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
