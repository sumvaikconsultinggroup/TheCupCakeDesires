'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Download,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CustomerData, CustomerStats, getCustomerDetails, getCustomers } from './customers-actions'

const PAGE_SIZE = 20

const aud = (n: number) =>
  `$${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const auDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || '?'

export default function CustomersClient() {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)

  useEffect(() => {
    fetchCustomers()
  }, [searchQuery, statusFilter, currentPage])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const result = await getCustomers({
        search: searchQuery || undefined,
        status: statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      })
      if (result.success) {
        setCustomers(result.customers)
        setStats(result.stats)
        setTotalCustomers(result.total)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
    setLoading(false)
  }

  const handleCustomerClick = async (customerId: string) => {
    setIsDetailsOpen(true)
    setDetailsLoading(true)
    try {
      const result = await getCustomerDetails(customerId)
      if (result.success && result.customer) {
        setSelectedCustomer(result.customer)
      }
    } catch (error) {
      console.error('Error fetching details:', error)
    }
    setDetailsLoading(false)
  }

  const closeDetails = () => {
    setIsDetailsOpen(false)
    setSelectedCustomer(null)
  }

  const totalRevenue = stats
    ? customers.reduce((sum, c) => sum + c.totalSpent, 0)
    : 0
  const avgOrderValue = stats?.averageOrderValue || 0
  const totalPages = Math.max(1, Math.ceil(totalCustomers / PAGE_SIZE))

  const handleExport = () => {
    if (customers.length === 0) return
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Total Orders',
      'Total Spent (AUD)',
      'Joined',
      'Last Order',
    ]
    const csvContent = [
      headers.join(','),
      ...customers.map((c) =>
        [
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          c.totalOrders,
          c.totalSpent,
          `"${auDate(c.createdAt)}"`,
          `"${auDate(c.lastOrder)}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Customers</h1>
          <p className="text-sm text-neutral-600">
            {stats?.totalCustomers ?? 0} customers · {stats?.newCustomersThisMonth ?? 0} new this
            month.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCustomers}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={customers.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total customers"
          value={String(stats?.totalCustomers ?? 0)}
          icon={Users}
          accent="bg-cocoa/5 text-cocoa"
        />
        <StatCard
          label="Revenue (page)"
          value={aud(totalRevenue)}
          icon={TrendingUp}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Avg order value"
          value={aud(avgOrderValue)}
          icon={ShoppingBag}
          accent="bg-rose-50 text-rose-700"
        />
      </section>

      {/* Toolbar */}
      <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s)
                setCurrentPage(1)
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? 'border-cocoa bg-cocoa text-ivory'
                  : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="hidden border-b border-neutral-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 lg:grid lg:grid-cols-[1.4fr_1.2fr_1fr_0.8fr_1fr_0.8fr] lg:gap-4">
          <span>Customer</span>
          <span>Contact</span>
          <span>Joined</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Last order</span>
        </div>

        {loading ? (
          <ul className="divide-y divide-neutral-200">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-1/5 animate-pulse rounded bg-neutral-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 font-bake-display text-[18px] font-medium text-cocoa">
              {searchQuery || statusFilter !== 'all' ? 'No matches' : 'No customers yet'}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try a different filter.'
                : 'Customers will appear here as orders start rolling in.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {customers.map((customer, idx) => (
              <motion.li
                key={customer.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.18) }}
                onClick={() => handleCustomerClick(customer.id)}
                className="grid cursor-pointer grid-cols-1 gap-3 px-6 py-4 transition-colors hover:bg-cream/40 lg:grid-cols-[1.4fr_1.2fr_1fr_0.8fr_1fr_0.8fr] lg:items-center lg:gap-4"
              >
                {/* Customer */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cocoa text-sm font-semibold text-ivory">
                    {initials(customer.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bake-display truncate text-sm font-medium text-cocoa">
                      {customer.name || 'Unnamed'}
                    </p>
                    <p className="truncate text-xs text-neutral-500">{customer.email}</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="min-w-0 text-sm">
                  <p className="flex items-center gap-1.5 text-cocoa">
                    <Mail className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="truncate">{customer.email || '—'}</span>
                  </p>
                  {customer.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-neutral-500">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </p>
                  )}
                </div>

                {/* Joined */}
                <div className="text-xs text-neutral-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {auDate(customer.createdAt)}
                  </span>
                </div>

                {/* Orders */}
                <div className="text-right text-sm font-medium text-cocoa">
                  {customer.totalOrders}
                </div>

                {/* Spent */}
                <div className="text-right text-sm font-semibold text-emerald-700">
                  {aud(customer.totalSpent)}
                </div>

                {/* Last order */}
                <div className="text-right text-xs text-neutral-500">
                  {customer.lastOrder ? auDate(customer.lastOrder) : <span className="text-neutral-400">Never</span>}
                </div>
              </motion.li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {!loading && customers.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 text-sm">
            <p className="text-neutral-600">
              Page {currentPage} of {totalPages} · {totalCustomers} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeDetails}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-[0_30px_60px_-30px_rgba(46,31,21,0.45)]"
            >
              <button
                onClick={closeDetails}
                className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-cocoa"
              >
                <X className="h-4 w-4" />
              </button>

              {detailsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
                </div>
              ) : selectedCustomer ? (
                <CustomerDetails customer={selectedCustomer} />
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ──────────────── Helpers ──────────────── */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-cocoa">{value}</p>
    </div>
  )
}

function CustomerDetails({ customer }: { customer: CustomerData }) {
  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-5 border-b border-neutral-200 pb-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-xl font-semibold text-ivory">
          {initials(customer.name)}
        </div>
        <div className="min-w-0">
          <h2 className="font-bake-display text-[24px] font-medium text-cocoa">{customer.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {customer.email}
            </span>
            {customer.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </span>
            )}
            {customer.gender && (
              <span className="inline-flex items-center gap-1.5 capitalize">
                <User className="h-3.5 w-3.5" />
                {customer.gender}
              </span>
            )}
            {customer.dob && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {auDate(customer.dob)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <DetailStat label="Orders" value={String(customer.totalOrders)} />
        <DetailStat label="Spent" value={aud(customer.totalSpent)} accent="text-emerald-700" />
        <DetailStat label="Joined" value={auDate(customer.createdAt)} small />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Addresses */}
        <section>
          <h3 className="font-bake-display mb-3 flex items-center gap-2 text-[16px] font-medium text-cocoa">
            <MapPin className="h-4 w-4 text-rose-accent" />
            Addresses
          </h3>
          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-3">
              {customer.addresses.map((addr: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {addr.billing_address_type || 'Address'}
                  </div>
                  <div className="text-sm text-cocoa">
                    {addr.billing_addressLine}, {addr.billing_city}
                    <br />
                    {addr.billing_state}, {addr.billing_country} — {addr.billing_pincode}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No addresses on file.</p>
          )}
        </section>

        {/* Wishlist */}
        <section>
          <h3 className="font-bake-display mb-3 flex items-center gap-2 text-[16px] font-medium text-cocoa">
            <Heart className="h-4 w-4 text-rose-accent" />
            Wishlist ({customer.wishlist?.length || 0})
          </h3>
          {customer.wishlist && customer.wishlist.length > 0 ? (
            <div className="space-y-2">
              {customer.wishlist.slice(0, 6).map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2.5"
                >
                  {item.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-cocoa">{item.productName}</p>
                    {item.variant && (
                      <p className="text-xs text-neutral-500">
                        {[item.variant.option1Value, item.variant.option2Value]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-cocoa">
                    {aud(item.variant?.price || item.price || 0)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Nothing saved yet.</p>
          )}
        </section>

        {/* Orders — full width */}
        <section className="lg:col-span-2">
          <h3 className="font-bake-display mb-3 flex items-center gap-2 text-[16px] font-medium text-cocoa">
            <Package className="h-4 w-4 text-rose-accent" />
            Recent orders
          </h3>
          {customer.orders && customer.orders.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <ul className="divide-y divide-neutral-200">
                {customer.orders.slice(0, 10).map((order: any) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bake-display text-sm font-medium text-cocoa">
                        {order.orderId}
                      </p>
                      <p className="text-xs text-neutral-500">{auDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={order.status} kind="order" />
                      <StatusPill status={order.paymentStatus} kind="payment" />
                      <span className="ml-2 text-sm font-semibold text-cocoa">
                        {aud(order.totalAmount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No orders yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function DetailStat({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: string
  accent?: string
  small?: boolean
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p
        className={`mt-1 font-bake-display font-medium ${small ? 'text-[15px]' : 'text-xl'} ${
          accent || 'text-cocoa'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function StatusPill({ status, kind }: { status?: string; kind: 'order' | 'payment' }) {
  if (!status) return null
  const orderColors: Record<string, string> = {
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    confirmed: 'bg-rose-50 text-rose-700 border-rose-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    shipped: 'bg-cocoa/5 text-cocoa border-cocoa/15',
    cancelled: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }
  const paymentColors: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  }
  const palette = kind === 'order' ? orderColors : paymentColors
  const cls = palette[status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  )
}
