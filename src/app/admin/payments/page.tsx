'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Settings,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  IndianRupee,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Banknote,
  User,
  ExternalLink,
  Copy,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  getPayUPaymentResponses,
  getUserByClerkId,
  getPayments,
  getPaymentStats,
} from './payment-actions'

type TabType = 'transactions' | 'payu-responses'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payu-responses')
  const [loading, setLoading] = useState(true)

  // Transactions state
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, captured: 0, pending: 0, failed: 0, revenue: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')

  // PayU Responses state
  const [payuResponses, setPayuResponses] = useState<any[]>([])
  const [payuPage, setPayuPage] = useState(1)
  const [totalPayuResponses, setTotalPayuResponses] = useState(0)
  const [payuSearchQuery, setPayuSearchQuery] = useState('')
  const [payuStatusFilter, setPayuStatusFilter] = useState('all')
  const [payuDateFilter, setPayuDateFilter] = useState('7days')

  // Modal states
  const [showPayUModal, setShowPayUModal] = useState(false)
  const [selectedPayUResponse, setSelectedPayUResponse] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, searchQuery, statusFilter, providerFilter, payuPage, payuSearchQuery, payuStatusFilter, payuDateFilter])

  const getDateRange = (preset: string) => {
    const now = new Date()
    const to = now.toISOString().split('T')[0]
    let from: string
    switch (preset) {
      case 'today': {
        from = to
        break
      }
      case 'yesterday': {
        const d = new Date(now)
        d.setDate(d.getDate() - 1)
        from = d.toISOString().split('T')[0]
        return { fromDate: from, toDate: from }
      }
      case '7days': {
        const d = new Date(now)
        d.setDate(d.getDate() - 7)
        from = d.toISOString().split('T')[0]
        break
      }
      case '30days': {
        const d = new Date(now)
        d.setDate(d.getDate() - 30)
        from = d.toISOString().split('T')[0]
        break
      }
      default:
        from = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
    }
    return { fromDate: from, toDate: to }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'payu-responses') {
        const dateRange = getDateRange(payuDateFilter)
        const result = await getPayUPaymentResponses({
          page: payuPage,
          limit: 20,
          search: payuSearchQuery || undefined,
          status: payuStatusFilter !== 'all' ? payuStatusFilter : undefined,
          ...dateRange,
        })
        if (result.success) {
          setPayuResponses(result.payments || [])
          setTotalPayuResponses(result.pagination?.total || 0)
        }
      } else {
        const [paymentsResult, statsResult] = await Promise.all([
          getPayments({
            page: currentPage,
            limit: 20,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            provider: providerFilter !== 'all' ? providerFilter : undefined,
            search: searchQuery || undefined,
          }),
          getPaymentStats(),
        ])

        if (paymentsResult.success) {
          setPayments(paymentsResult.payments || [])
          setTotalPayments(paymentsResult.total || 0)
        }
        setStats(statsResult)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }







  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'captured':
      case 'success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'failed':
      case 'failure':
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'bounced': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
      case 'usercancelled':
      case 'cancelled': return 'bg-slate-100 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400'
      case 'dropped':
      case 'drop': return 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
      case 'refunded': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/20 dark:text-neutral-400'
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'razorpay': return 'bg-blue-100 text-blue-700'
      case 'payu': return 'bg-green-100 text-green-700'
      case 'cod': return 'bg-orange-100 text-orange-700'
      default: return 'bg-neutral-100 text-neutral-700'
    }
  }

  // Handle PayU response row click
  const handlePayUResponseClick = (response: any) => {
    setSelectedPayUResponse(response)
    setShowPayUModal(true)
    setSelectedUser(null)

    // Fetch user details if clerkId exists
    if (response.clerkId) {
      setLoadingUser(true)
      getUserByClerkId(response.clerkId).then((result) => {
        if (result.success) {
          setSelectedUser(result.user)
        }
        setLoadingUser(false)
      }).catch(() => {
        setLoadingUser(false)
      })
    }
  }

  // Handle order ID click (stop propagation to prevent modal)
  const handleOrderClick = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    window.open(`/admin/orders/${orderId}`, '_blank')
  }

  // Handle clerk ID click (stop propagation to prevent modal)
  const handleClerkIdClick = async (e: React.MouseEvent, clerkId: string) => {
    e.stopPropagation()
    setLoadingUser(true)
    const result = await getUserByClerkId(clerkId)
    if (result.success) {
      setSelectedUser(result.user)
      setShowPayUModal(true)
      // Set a dummy response to show user details
      setSelectedPayUResponse({ clerkId })
    } else {
      toast.error('User not found')
    }
    setLoadingUser(false)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Payments</h1>
          <p className="text-neutral-500">Manage payment gateways and view transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          onClick={() => setActiveTab('payu-responses')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'payu-responses'
            ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
            }`}
        >
          <Banknote className="mr-2 inline h-4 w-4" />
          PayU Responses
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'transactions'
            ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
            }`}
        >
          <CreditCard className="mr-2 inline h-4 w-4" />
          Transactions
        </button>
      </div>



      {activeTab === 'transactions' && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F]/10">
                  <CreditCard className="h-5 w-5 text-[#1B198F]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-neutral-500">Total</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.captured}</p>
                  <p className="text-sm text-neutral-500">Captured</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.pending}</p>
                  <p className="text-sm text-neutral-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.failed}</p>
                  <p className="text-sm text-neutral-500">Failed</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <IndianRupee className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">₹{stats.revenue.toLocaleString()}</p>
                  <p className="text-sm text-neutral-500">Revenue</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, email..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="all">All Status</option>
              <option value="captured">Captured/Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed/Error</option>
              <option value="bounced">Bounced</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="all">All Providers</option>
              <option value="razorpay">Razorpay</option>
              <option value="payu">PayU</option>
              <option value="cod">COD</option>
            </select>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#1B198F]" />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-20 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No transactions yet</h3>
                <p className="mt-2 text-neutral-500">Transactions will appear here once customers make payments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Payment ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Bank Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-neutral-900 dark:text-white">
                            {payment.paymentId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {payment.orderId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="text-neutral-900 dark:text-white">{payment.customerName || payment.customerEmail || '—'}</p>
                            {payment.customerEmail && payment.customerName && (
                              <p className="text-xs text-neutral-500">{payment.customerEmail}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            ₹{payment.amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 uppercase dark:bg-neutral-700 dark:text-neutral-300">
                              {payment.mode || payment.pgType || '—'}
                            </span>
                            {payment.bankCode && (
                              <span className="text-xs text-neutral-500">{payment.bankCode}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${getProviderColor(payment.provider)}`}>
                            {payment.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                            {payment.payuStatus && payment.payuStatus !== payment.status && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                PayU: {payment.payuStatus}
                              </span>
                            )}
                            {payment.errorMessage && (
                              <span className="text-xs text-red-500 dark:text-red-400" title={payment.errorMessage}>
                                {payment.errorMessage.length > 30 ? `${payment.errorMessage.substring(0, 30)}...` : payment.errorMessage}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                            {payment.bankRefNum || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500 whitespace-nowrap">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPayments > 20 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-4 dark:border-neutral-700">
                <p className="text-sm text-neutral-500">
                  Page {currentPage} of {Math.ceil(totalPayments / 20)} ({totalPayments} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(totalPayments / 20), currentPage + 1))}
                    disabled={currentPage >= Math.ceil(totalPayments / 20)}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'payu-responses' && (
        <>
          {/* Date Range Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => { setPayuDateFilter(preset.value); setPayuPage(1) }}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${payuDateFilter === preset.value
                  ? 'bg-[#1B198F] text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700'
                  }`}
              >
                <Clock className="mr-1.5 inline h-3.5 w-3.5" />
                {preset.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={payuSearchQuery}
                onChange={(e) => setPayuSearchQuery(e.target.value)}
                placeholder="Search by Transaction ID (txnid)..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <select
              value={payuStatusFilter}
              onChange={(e) => { setPayuStatusFilter(e.target.value); setPayuPage(1) }}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="all">All Statuses</option>
              <option value="success">Captured / Success</option>
              <option value="bounced">Bounced</option>
              <option value="userCancelled">User Cancelled</option>
              <option value="failure">Failed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {/* PayU Responses Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#1B198F]" />
              </div>
            ) : payuResponses.length === 0 ? (
              <div className="py-20 text-center">
                <Banknote className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No PayU responses yet</h3>
                <p className="mt-2 text-neutral-500">PayU payment responses will appear here after successful payments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Transaction ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Clerk ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Payment Mode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {payuResponses.map((response) => (
                      <tr
                        key={response.id || response._id}
                        onClick={() => handlePayUResponseClick(response)}
                        className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-neutral-900 dark:text-white">
                            {response.txnid || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {response.orderId ? (
                            <button
                              onClick={(e) => handleOrderClick(e, response.orderId)}
                              className="text-sm font-medium text-[#1B198F] hover:underline flex items-center gap-1"
                            >
                              {response.orderId}
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-sm text-neutral-900 dark:text-white">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {response.clerkId ? (
                            <button
                              onClick={(e) => handleClerkIdClick(e, response.clerkId)}
                              className="font-mono text-xs text-[#1B198F] hover:underline flex items-center gap-1"
                            >
                              {response.clerkId.slice(0, 20)}...
                              <User className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            ₹{parseFloat(response.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(response.status)}`}>
                            {response.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {response.mode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {response.email || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {response.createdAt ? new Date(response.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPayuResponses > 20 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-4 dark:border-neutral-700">
                <p className="text-sm text-neutral-500">
                  Page {payuPage} of {Math.ceil(totalPayuResponses / 20)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPayuPage(Math.max(1, payuPage - 1))}
                    disabled={payuPage === 1}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPayuPage(Math.min(Math.ceil(totalPayuResponses / 20), payuPage + 1))}
                    disabled={payuPage >= Math.ceil(totalPayuResponses / 20)}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-neutral-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* PayU Response Details Modal */}
      <AnimatePresence>
        {showPayUModal && selectedPayUResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowPayUModal(false)
              setSelectedPayUResponse(null)
              setSelectedUser(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-neutral-800"
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">PayU Payment Response Details</h2>
                  <p className="text-sm text-neutral-500">Transaction ID: {selectedPayUResponse.txnid || 'N/A'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPayUModal(false)
                    setSelectedPayUResponse(null)
                    setSelectedUser(null)
                  }}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* User Details Section */}
                {selectedPayUResponse.clerkId && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                        <User className="h-5 w-5" />
                        User Details
                      </h3>
                      {loadingUser && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
                    </div>
                    {selectedUser ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-neutral-500">Name</p>
                          <p className="font-medium text-neutral-900 dark:text-white">{selectedUser.name}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Email</p>
                          <p className="font-medium text-neutral-900 dark:text-white">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Phone</p>
                          <p className="font-medium text-neutral-900 dark:text-white">{selectedUser.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Total Orders</p>
                          <p className="font-medium text-neutral-900 dark:text-white">{selectedUser.totalOrders || 0}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Total Spent</p>
                          <p className="font-medium text-neutral-900 dark:text-white">₹{selectedUser.totalSpent?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">Clerk ID</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{selectedUser.clerkId}</p>
                            <button
                              onClick={() => copyToClipboard(selectedUser.clerkId, 'Clerk ID')}
                              className="text-neutral-400 hover:text-neutral-600"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : !loadingUser && (
                      <p className="text-sm text-neutral-500">User not found</p>
                    )}
                  </div>
                )}

                {/* Order Link */}
                {selectedPayUResponse.orderId && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-500">Order ID</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.orderId}</p>
                      </div>
                      <Link
                        href={`/admin/orders/${selectedPayUResponse.orderId}`}
                        target="_blank"
                        className="flex items-center gap-2 rounded-lg bg-[#1B198F] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B198F]/90"
                      >
                        View Order
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Payment Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Transaction ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.txnid || 'N/A'}</p>
                      {selectedPayUResponse.txnid && (
                        <button
                          onClick={() => copyToClipboard(selectedPayUResponse.txnid, 'Transaction ID')}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">PayU Payment ID</p>
                    <p className="font-mono text-sm font-medium text-neutral-900 dark:text-white mt-1">{selectedPayUResponse.mihpayid || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Amount</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white mt-1">₹{parseFloat(selectedPayUResponse.amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Net Amount Debit</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white mt-1">₹{parseFloat(selectedPayUResponse.net_amount_debit || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Status</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize mt-1 ${getStatusColor(selectedPayUResponse.status)}`}>
                      {selectedPayUResponse.status || 'N/A'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Payment Mode</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">{selectedPayUResponse.mode || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Card Category</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white mt-1">{selectedPayUResponse.cardCategory || 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="text-sm text-neutral-500">Bank Reference Number</p>
                    <p className="font-mono text-xs font-medium text-neutral-900 dark:text-white mt-1">{selectedPayUResponse.bank_ref_num || 'N/A'}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Name</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.firstname || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Email</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Phone</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Product Info</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.productinfo || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {(selectedPayUResponse.address1 || selectedPayUResponse.city || selectedPayUResponse.state) && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Address</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <p className="text-neutral-500">Address</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.address1 || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">City</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">State</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Country</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.country || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Zipcode</p>
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.zipcode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Gateway Details */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Payment Gateway Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">PG Type</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.PG_TYPE || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Bank Code</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.bankcode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Error Code</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.error || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Error Message</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.error_Message || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Unmapped Status</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.unmappedstatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Payment Source</p>
                      <p className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.payment_source || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedPayUResponse.field1 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Field 1:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.field1}</span>
                      </div>
                    )}
                    {selectedPayUResponse.field2 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Field 2:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.field2}</span>
                      </div>
                    )}
                    {selectedPayUResponse.field7 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Field 7:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.field7}</span>
                      </div>
                    )}
                    {selectedPayUResponse.field8 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Field 8:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.field8}</span>
                      </div>
                    )}
                    {selectedPayUResponse.field9 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Field 9:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.field9}</span>
                      </div>
                    )}
                    {selectedPayUResponse.cardnum && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Card Number:</span>
                        <span className="font-mono text-xs font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.cardnum}</span>
                      </div>
                    )}
                    {selectedPayUResponse.addedon && (
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Payment Date:</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{selectedPayUResponse.addedon}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Timestamps</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Created At</p>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedPayUResponse.createdAt ? new Date(selectedPayUResponse.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Updated At</p>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedPayUResponse.updatedAt ? new Date(selectedPayUResponse.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}
