'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Truck,
  Package,
  Settings,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  Search,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  Navigation,
  RotateCcw,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  Zap,
  BarChart3,
  Route,
} from 'lucide-react'
import {
  getShippingSettings,
  getShipments,
  getShipmentStats,
  generateShippingLabel,
  trackShipment,
  createShiprocketOrder,
} from './shipping-actions'
import { updatePaymentSettings, getPaymentSettings } from '../payments/payment-actions'

type TabType = 'shipments' | 'settings'

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('shipments')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Shipments state
  const [shipments, setShipments] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, delivered: 0, returned: 0 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalShipments, setTotalShipments] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [trackingModal, setTrackingModal] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPage, searchQuery, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'settings') {
        const result = await getPaymentSettings()
        if (result.success) {
          setSettings(result.settings)
        }
      } else {
        const [shipmentsResult, statsResult] = await Promise.all([
          getShipments({
            page: currentPage,
            limit: 20,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: searchQuery || undefined,
          }),
          getShipmentStats(),
        ])
        
        if (shipmentsResult.success) {
          setShipments(shipmentsResult.shipments || [])
          setTotalShipments(shipmentsResult.total || 0)
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
      const result = await updatePaymentSettings({
        shiprocket: settings.shiprocket,
        pickupAddress: settings.pickupAddress,
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultShippingCost: settings.defaultShippingCost,
      })
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

  const handleGenerateLabel = async (shipmentId: string) => {
    setActionLoading(shipmentId)
    try {
      const result = await generateShippingLabel(shipmentId)
      if (result.success && result.labelUrl) {
        window.open(result.labelUrl, '_blank')
        fetchData()
      } else {
        alert(result.message || 'Failed to generate label')
      }
    } catch (error) {
      alert('An error occurred')
    }
    setActionLoading(null)
  }

  const handleTrackShipment = async (shipmentId: string) => {
    setActionLoading(shipmentId)
    try {
      const result = await trackShipment(shipmentId)
      if (result.success) {
        setTrackingModal(result)
        fetchData()
      } else {
        alert(result.message || 'Failed to track shipment')
      }
    } catch (error) {
      alert('An error occurred')
    }
    setActionLoading(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'in_transit':
      case 'out_for_delivery':
      case 'picked_up': return 'bg-blue-100 text-blue-700'
      case 'pending':
      case 'processing':
      case 'ready_to_ship': return 'bg-yellow-100 text-yellow-700'
      case 'returned':
      case 'failed': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-neutral-100 text-neutral-700'
      default: return 'bg-neutral-100 text-neutral-700'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/settings" className="text-neutral-500 hover:text-neutral-700">Settings</Link>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
        <Link href="/admin/settings/integrations" className="text-neutral-500 hover:text-neutral-700">Integrations</Link>
        <ChevronRight className="h-4 w-4 text-neutral-400" />
        <span className="text-neutral-900 dark:text-white">Shipping Carriers</span>
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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Shipping Carriers</h1>
            <p className="text-neutral-500">Multi-carrier shipping with rate shopping and tracking</p>
          </div>
        </div>
        
        {/* Pro Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2e1f15]/10 to-purple-500/10 px-4 py-2">
          <Route className="h-4 w-4 text-[#2e1f15]" />
          <span className="text-sm font-medium text-[#2e1f15]">Rate Shopping + NDR/RTO</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'shipments'
              ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
          }`}
        >
          <Truck className="mr-2 inline h-4 w-4" />
          Shipments
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
          Shiprocket Settings
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

      {activeTab === 'shipments' && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e1f15]/10">
                  <Package className="h-5 w-5 text-[#2e1f15]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
                  <p className="text-sm text-neutral-500">Total</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.inTransit}</p>
                  <p className="text-sm text-neutral-500">In Transit</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.delivered}</p>
                  <p className="text-sm text-neutral-500">Delivered</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.returned}</p>
                  <p className="text-sm text-neutral-500">Returned</p>
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
                placeholder="Search by ID, AWB..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          {/* Shipments Table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#2e1f15]" />
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-20 text-center">
                <Truck className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No shipments yet</h3>
                <p className="mt-2 text-neutral-500">Shipments will appear here when orders are shipped</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Shipment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">AWB</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Courier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {shipments.map((shipment) => (
                      <tr key={shipment._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-neutral-900 dark:text-white">
                            {shipment.shipmentId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders?id=${shipment.orderId}`}
                            className="text-sm text-[#2e1f15] hover:underline"
                          >
                            {shipment.orderId}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                            {shipment.awbNumber || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {shipment.courierName || shipment.provider || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(shipment.status)}`}>
                            {formatStatus(shipment.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!shipment.labelUrl && shipment.providerShipmentId && (
                              <button
                                onClick={() => handleGenerateLabel(shipment.shipmentId)}
                                disabled={actionLoading === shipment.shipmentId}
                                className="flex items-center gap-1 rounded-lg bg-[#2e1f15]/10 px-2 py-1 text-xs font-medium text-[#2e1f15] hover:bg-[#2e1f15]/20 disabled:opacity-50"
                              >
                                {actionLoading === shipment.shipmentId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <FileText className="h-3 w-3" />
                                )}
                                Label
                              </button>
                            )}
                            {shipment.labelUrl && (
                              <a
                                href={shipment.labelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View
                              </a>
                            )}
                            {shipment.awbNumber && (
                              <button
                                onClick={() => handleTrackShipment(shipment.shipmentId)}
                                disabled={actionLoading === shipment.shipmentId}
                                className="flex items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                              >
                                {actionLoading === shipment.shipmentId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Navigation className="h-3 w-3" />
                                )}
                                Track
                              </button>
                            )}
                          </div>
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
              <Loader2 className="h-8 w-8 animate-spin text-[#2e1f15]" />
            </div>
          ) : settings ? (
            <>
              {/* Shiprocket Settings */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                      <Truck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Shiprocket</h2>
                      <p className="text-sm text-neutral-500">Connect your Shiprocket account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('shiprocket.enabled', !settings.shiprocket?.enabled)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.shiprocket?.enabled ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.shiprocket?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {settings.shiprocket?.enabled && (
                  <div className="space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-700">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={settings.shiprocket?.email || ''}
                          onChange={(e) => updateSetting('shiprocket.email', e.target.value)}
                          placeholder="your@email.com"
                          className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.shiprocket?.password || ''}
                            onChange={(e) => updateSetting('shiprocket.password', e.target.value)}
                            placeholder="Enter password"
                            className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 pr-10 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                      <div>
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Auto-generate Labels</span>
                        <p className="text-xs text-neutral-500">Automatically generate shipping labels when orders are confirmed</p>
                      </div>
                      <button
                        onClick={() => updateSetting('shiprocket.autoLabel', !settings.shiprocket?.autoLabel)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          settings.shiprocket?.autoLabel ? 'bg-green-500' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            settings.shiprocket?.autoLabel ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Address */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Pickup Address</h2>
                    <p className="text-sm text-neutral-500">Where couriers will pick up packages</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={settings.pickupAddress?.name || ''}
                      onChange={(e) => updateSetting('pickupAddress.name', e.target.value)}
                      placeholder="Warehouse Name"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={settings.pickupAddress?.phone || ''}
                      onChange={(e) => updateSetting('pickupAddress.phone', e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={settings.pickupAddress?.address || ''}
                      onChange={(e) => updateSetting('pickupAddress.address', e.target.value)}
                      placeholder="Street address"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      City *
                    </label>
                    <input
                      type="text"
                      value={settings.pickupAddress?.city || ''}
                      onChange={(e) => updateSetting('pickupAddress.city', e.target.value)}
                      placeholder="Mumbai"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      State *
                    </label>
                    <input
                      type="text"
                      value={settings.pickupAddress?.state || ''}
                      onChange={(e) => updateSetting('pickupAddress.state', e.target.value)}
                      placeholder="Maharashtra"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={settings.pickupAddress?.pincode || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        updateSetting('pickupAddress.pincode', value)
                      }}
                      placeholder="400001"
                      maxLength={6}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.pickupAddress?.email || ''}
                      onChange={(e) => updateSetting('pickupAddress.email', e.target.value)}
                      placeholder="warehouse@example.com"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Costs */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Shipping Costs</h2>
                    <p className="text-sm text-neutral-500">Configure shipping charges</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Default Shipping Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultShippingCost || 49}
                      onChange={(e) => updateSetting('defaultShippingCost', Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Free Shipping Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={settings.freeShippingThreshold || 999}
                      onChange={(e) => updateSetting('freeShippingThreshold', Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Orders above this amount get free shipping</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-6 py-3 font-medium text-white transition-all hover:bg-[#2e1f15]/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setTrackingModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Tracking Details</h3>
                <button onClick={() => setTrackingModal(null)}>
                  <X className="h-5 w-5 text-neutral-400" />
                </button>
              </div>

              {trackingModal.shipment && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900">
                    <p className="text-sm text-neutral-500">AWB Number</p>
                    <p className="font-mono font-semibold text-neutral-900 dark:text-white">
                      {trackingModal.shipment.awbNumber}
                    </p>
                  </div>

                  <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900">
                    <p className="text-sm text-neutral-500">Current Status</p>
                    <p className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium ${getStatusColor(trackingModal.shipment.status)}`}>
                      {formatStatus(trackingModal.shipment.status)}
                    </p>
                  </div>

                  {trackingModal.shipment.trackingHistory?.length > 0 && (
                    <div>
                      <h4 className="mb-3 font-medium text-neutral-900 dark:text-white">Tracking History</h4>
                      <div className="space-y-3">
                        {trackingModal.shipment.trackingHistory.map((event: any, index: number) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-3 w-3 rounded-full bg-[#2e1f15]" />
                              {index < trackingModal.shipment.trackingHistory.length - 1 && (
                                <div className="w-0.5 flex-1 bg-neutral-200" />
                              )}
                            </div>
                            <div className="pb-4">
                              <p className="font-medium text-neutral-900 dark:text-white">{event.status}</p>
                              {event.location && (
                                <p className="text-sm text-neutral-500">{event.location}</p>
                              )}
                              {event.description && (
                                <p className="text-sm text-neutral-500">{event.description}</p>
                              )}
                              <p className="text-xs text-neutral-400">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {trackingModal.shipment.trackingUrl && (
                    <a
                      href={trackingModal.shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#2e1f15] py-3 font-medium text-white hover:bg-[#2e1f15]/90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Track on Courier Website
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
