'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Wallet,
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
  ArrowLeft,
  Plug,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react'
import {
  getPaymentSettings,
  updatePaymentSettings,
  getPayments,
  getPaymentStats,
  processRefund,
} from './payment-actions'

type TabType = 'transactions' | 'settings'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState<any>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  
  // Transactions state
  const [payments, setPayments] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, captured: 0, pending: 0, failed: 0, revenue: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, searchQuery, statusFilter, providerFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'settings') {
        const result = await getPaymentSettings()
        if (result.success) {
          setSettings(result.settings)
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

  const handleSaveSettings = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const result = await updatePaymentSettings(settings)
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully' })
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Failed to save settings' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred' })
    }
    setSaving(false)
  }

  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.')
    setSettings((prev: any) => {
      const newSettings = { ...prev }
      let current = newSettings
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'refunded': return 'bg-purple-100 text-purple-700'
      default: return 'bg-neutral-100 text-neutral-700'
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/settings" className="text-neutral-500 hover:text-neutral-700">Settings</Link>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
        <Link href="/admin/settings/integrations" className="text-neutral-500 hover:text-neutral-700">Integrations</Link>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
        <span className="text-neutral-900 dark:text-white">Payment Gateways</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/settings/integrations"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Payment Gateways</h1>
            <p className="text-neutral-500">Configure payment providers with smart routing</p>
          </div>
        </div>
        
        {/* Pro Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1B198F]/10 to-purple-500/10 px-4 py-2">
          <Zap className="h-4 w-4 text-[#1B198F]" />
          <span className="text-sm font-medium text-[#1B198F]">Multi-Gateway Orchestration</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'transactions'
              ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
          }`}
        >
          <CreditCard className="mr-2 inline h-4 w-4" />
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
          }`}
        >
          <Settings className="mr-2 inline h-4 w-4" />
          Gateway Settings
        </button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 rounded-xl p-4 ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {saveMessage.text}
          <button onClick={() => setSaveMessage(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

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
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
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
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            ₹{payment.amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${getProviderColor(payment.provider)}`}>
                            {payment.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B198F]" />
            </div>
          ) : settings ? (
            <>
              {/* Razorpay Settings */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Razorpay</h2>
                      <p className="text-sm text-neutral-500">Accept payments via cards, UPI, netbanking</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('razorpay.enabled', !settings.razorpay?.enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.razorpay?.enabled ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.razorpay?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {settings.razorpay?.enabled && (
                  <div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-700">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Key ID *
                      </label>
                      <input
                        type="text"
                        value={settings.razorpay?.keyId || ''}
                        onChange={(e) => updateSetting('razorpay.keyId', e.target.value)}
                        placeholder="rzp_test_..."
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Key Secret *
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.razorpaySecret ? 'text' : 'password'}
                          value={settings.razorpay?.keySecret || ''}
                          onChange={(e) => updateSetting('razorpay.keySecret', e.target.value)}
                          placeholder="Enter secret key"
                          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 pr-10 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('razorpaySecret')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        >
                          {showSecrets.razorpaySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Webhook Secret
                      </label>
                      <input
                        type="text"
                        value={settings.razorpay?.webhookSecret || ''}
                        onChange={(e) => updateSetting('razorpay.webhookSecret', e.target.value)}
                        placeholder="For webhook verification"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Test Mode</span>
                      <button
                        onClick={() => updateSetting('razorpay.testMode', !settings.razorpay?.testMode)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          settings.razorpay?.testMode ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            settings.razorpay?.testMode ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* PayU Settings */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">PayU</h2>
                      <p className="text-sm text-neutral-500">PayU Money payment gateway</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('payu.enabled', !settings.payu?.enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.payu?.enabled ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.payu?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {settings.payu?.enabled && (
                  <div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-700">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Merchant Key *
                      </label>
                      <input
                        type="text"
                        value={settings.payu?.merchantKey || ''}
                        onChange={(e) => updateSetting('payu.merchantKey', e.target.value)}
                        placeholder="Enter merchant key"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Merchant Salt *
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.payuSalt ? 'text' : 'password'}
                          value={settings.payu?.merchantSalt || ''}
                          onChange={(e) => updateSetting('payu.merchantSalt', e.target.value)}
                          placeholder="Enter merchant salt"
                          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 pr-10 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('payuSalt')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        >
                          {showSecrets.payuSalt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Test Mode</span>
                      <button
                        onClick={() => updateSetting('payu.testMode', !settings.payu?.testMode)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          settings.payu?.testMode ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            settings.payu?.testMode ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* COD Settings */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                      <Banknote className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Cash on Delivery</h2>
                      <p className="text-sm text-neutral-500">Accept payment on delivery</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('cod.enabled', !settings.cod?.enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.cod?.enabled ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.cod?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {settings.cod?.enabled && (
                  <div className="grid gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-700 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Minimum Order Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.cod?.minAmount || 0}
                        onChange={(e) => updateSetting('cod.minAmount', Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Maximum Order Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.cod?.maxAmount || 50000}
                        onChange={(e) => updateSetting('cod.maxAmount', Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Extra Charge (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.cod?.extraCharge || 0}
                        onChange={(e) => updateSetting('cod.extraCharge', Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Charge Type
                      </label>
                      <select
                        value={settings.cod?.extraChargeType || 'fixed'}
                        onChange={(e) => updateSetting('cod.extraChargeType', e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-3 font-medium text-white transition-all hover:bg-[#1B198F]/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
