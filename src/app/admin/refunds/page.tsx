'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getRefundsAction,
  approveRefundAction,
  rejectRefundAction,
  initiatePayURefundAction,
  markRefundCompletedAction,
  updateRefundStatusAction,
} from './refund-actions'

interface Refund {
  _id: string
  refundId: string
  orderId: string
  userId: string
  userEmail: string
  userName: string
  userPhone: string
  paymentGateway: string
  transactionId: string
  mihpayid: string
  refundAmount: number
  orderAmount: number
  refundType: 'full' | 'partial'
  status: string
  cancelledBy: 'user' | 'admin'
  cancellationReason: string
  cancellationDate: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  refundInitiatedAt?: string
  refundCompletedAt?: string
  estimatedRefundDate: string
  payuRefundId?: string
  payuRefundStatus?: string
  createdAt: string
  updatedAt: string
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRefunds, setTotalRefunds] = useState(0)
  const [stats, setStats] = useState<any[]>([])

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRefundedModal, setShowRefundedModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionCategory, setRejectionCategory] = useState('invalid_request')
  const [refundReferenceNumber, setRefundReferenceNumber] = useState('')
  const [refundMethod, setRefundMethod] = useState('original_method')
  const [selectedStatus, setSelectedStatus] = useState('')

  const rejectionReasons = [
    { value: 'order_shipped', label: 'Order Already Shipped - Cannot process refund as order is shipped' },
    { value: 'order_delivered', label: 'Order Delivered - Refund window expired' },
    { value: 'invalid_request', label: 'Invalid Request - Does not meet refund criteria' },
    { value: 'fraud_suspected', label: 'Fraud Suspected - Unusual activity detected' },
    { value: 'policy_violation', label: 'Policy Violation - Against our refund policy' },
    { value: 'duplicate_request', label: 'Duplicate Request - Already processed' },
    { value: 'other', label: 'Other - Specify in notes' },
  ]

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      const result = await getRefundsAction({
        status: statusFilter,
        search: searchQuery,
        page: currentPage,
        limit: 20,
      })

      if (result.success) {
        setRefunds(result.refunds || [])
        setTotalPages(result.pagination?.totalPages || 1)
        setTotalRefunds(result.pagination?.totalRefunds || 0)
        setStats(result.stats || [])
      } else {
        toast.error(result.error || 'Failed to fetch refunds')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch refunds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefunds()
  }, [statusFilter, currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchRefunds()
  }

  const handleApprove = async (refundId: string) => {
    setActionLoading(refundId)
    try {
      const result = await approveRefundAction(refundId, 'admin') // Replace with actual admin ID
      if (result.success) {
        toast.success(result.message || 'Refund approved successfully')
        fetchRefunds()
      } else {
        toast.error(result.error || 'Failed to approve refund')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve refund')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectClick = (refund: Refund) => {
    setSelectedRefund(refund)
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedRefund || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setActionLoading(selectedRefund.refundId)
    try {
      const result = await updateRefundStatusAction(
        selectedRefund.refundId,
        'rejected',
        'admin',
        rejectionReason,
        { rejectionCategory }
      )
      if (result.success) {
        toast.success(result.message || 'Refund rejected successfully')
        setShowRejectModal(false)
        setRejectionReason('')
        setRejectionCategory('invalid_request')
        setSelectedRefund(null)
        fetchRefunds()
      } else {
        toast.error(result.error || 'Failed to reject refund')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject refund')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefundedConfirm = async () => {
    if (!selectedRefund || !refundReferenceNumber.trim()) {
      toast.error('Please provide a refund reference number')
      return
    }

    setActionLoading(selectedRefund.refundId)
    try {
      const result = await updateRefundStatusAction(
        selectedRefund.refundId,
        'refunded',
        'admin',
        `Refund completed. Reference: ${refundReferenceNumber}`,
        { refundReferenceNumber, refundMethod }
      )
      if (result.success) {
        toast.success(result.message || 'Refund marked as completed')
        setShowRefundedModal(false)
        setRefundReferenceNumber('')
        setRefundMethod('original_method')
        setSelectedRefund(null)
        fetchRefunds()
      } else {
        toast.error(result.error || 'Failed to mark refund as completed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark refund as completed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = (refund: Refund, newStatus: string) => {
    setSelectedRefund(refund)
    setSelectedStatus(newStatus)
    
    // Show specific modals for rejection and refunded
    if (newStatus === 'rejected') {
      setShowRejectModal(true)
    } else if (newStatus === 'refunded') {
      setShowRefundedModal(true)
    } else {
      // For other statuses, update directly
      handleStatusUpdate(refund.refundId, newStatus)
    }
  }

  const handleInitiatePayU = async (refundId: string) => {
    if (!confirm('Are you sure you want to initiate PayU refund? This action will process the refund through the payment gateway.')) {
      return
    }

    setActionLoading(`payu-${refundId}`)

    try {
      toast.loading('Processing PayU refund...', { id: 'payu-processing' })
      
      const result = await initiatePayURefundAction(refundId, 'admin') // Replace with actual admin ID
      
      toast.dismiss('payu-processing')

      if (result.success) {
        toast.success(result.message || 'PayU refund initiated successfully', { duration: 5000 })
        fetchRefunds()
      } else {
        console.error('❌ PayU failed:', result)
        toast.error(`Failed: ${result.error || result.message || 'Unknown error'}`, { duration: 8000 })
      }
    } catch (error: any) {
      console.error('❌ Exception in PayU process:', error)
      toast.dismiss('payu-processing')
      toast.error(`Error: ${error.message || 'Failed to initiate PayU refund'}`, { duration: 8000 })
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusUpdate = async (refundId: string, newStatus: string, note?: string) => {
    setActionLoading(`status-${refundId}`)
    try {
      const result = await updateRefundStatusAction(refundId, newStatus, 'admin', note)
      if (result.success) {
        toast.success(result.message || 'Refund status updated successfully')
        fetchRefunds()
      } else {
        toast.error(result.error || 'Failed to update refund status')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update refund status')
    } finally {
      setActionLoading(null)
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    refund_initiated: { label: 'Initiated', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
    pending_approval: { label: 'Pending Approval', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400', icon: RefreshCw },
    refunded: { label: 'Refunded', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400', icon: CheckCircle },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
    rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400', icon: XCircle },
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Refund Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage refund requests and process PayU refunds
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {stats.map((stat) => {
            const config = statusConfig[stat._id] || { label: stat._id, color: 'bg-gray-100', icon: DollarSign }
            const Icon = config.icon
            return (
              <div key={stat._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.count}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{config.label}</p>
                <p className="text-xs font-medium text-gray-900 dark:text-white">
                  {formatCurrency(stat.totalAmount)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by refund ID, order ID, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="refund_initiated">Initiated</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Refunds Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No refunds found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Refund Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cancelled By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {refunds.map((refund) => {
                    const StatusIcon = statusConfig[refund.status]?.icon || Clock
                    return (
                      <tr key={refund._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/refunds/${refund.refundId}`}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {refund.refundId}
                          </Link>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Order: {refund.orderId}
                          </div>
                          {refund.payuRefundId && (
                            <div className="text-xs text-gray-400 mt-1">
                              PayU: {refund.payuRefundId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {refund.userName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {refund.userEmail}
                          </div>
                          {refund.userPhone && (
                            <div className="text-xs text-gray-400">{refund.userPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(refund.refundAmount)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {refund.refundType === 'full' ? 'Full Refund' : 'Partial Refund'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[refund.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[refund.status]?.label || refund.status}
                          </span>
                          {refund.payuRefundStatus && (
                            <div className="text-xs text-gray-400 mt-1">
                              PayU: {refund.payuRefundStatus}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white capitalize">
                            {refund.cancelledBy}
                          </div>
                          {refund.cancellationReason && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                              {refund.cancellationReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(refund.cancellationDate)}
                          </div>
                          {refund.estimatedRefundDate && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Est: {formatDate(refund.estimatedRefundDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Status Update Dropdown */}
                            {refund.status !== 'refunded' && (
                              <select
                                value={refund.status}
                                onChange={(e) => handleStatusChange(refund, e.target.value)}
                                disabled={actionLoading === refund.refundId}
                                className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Update Status...</option>
                                <option value="refund_initiated">Initiated</option>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="approved">Approved</option>
                                <option value="processing">Processing</option>
                                <option value="refunded">Refunded</option>
                                <option value="rejected">Rejected</option>
                                <option value="failed">Failed</option>
                              </select>
                            )}

                            {/* Initiate PayU Refund Button */}
                            {refund.status === 'approved' && (
                              <button
                                onClick={() => handleInitiatePayU(refund.refundId)}
                                disabled={actionLoading === `payu-${refund.refundId}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              >
                                {actionLoading === `payu-${refund.refundId}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>PayU</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* View Details Button */}
                            <Link
                              href={`/admin/refunds/${refund.refundId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalRefunds)} of {totalRefunds} refunds
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject Refund Request
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Refund ID: <span className="font-medium">{selectedRefund?.refundId}</span>
            </p>
            
            {/* Rejection Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={rejectionCategory}
                onChange={(e) => {
                  setRejectionCategory(e.target.value)
                  const selected = rejectionReasons.find(r => r.value === e.target.value)
                  if (selected) {
                    setRejectionReason(selected.label)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {rejectionReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Add additional details..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setRejectionCategory('invalid_request')
                  setSelectedRefund(null)
                }}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!!actionLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Reject Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refunded Modal */}
      {showRefundedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mark Refund as Completed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Refund ID: <span className="font-medium">{selectedRefund?.refundId}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Amount: <span className="font-medium">{selectedRefund && formatCurrency(selectedRefund.refundAmount)}</span>
            </p>
            
            {/* Refund Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refund Method <span className="text-red-500">*</span>
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="original_method">Original Payment Method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="wallet">Wallet Credit</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Reference Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference/Transaction Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={refundReferenceNumber}
                onChange={(e) => setRefundReferenceNumber(e.target.value)}
                placeholder="Enter bank/payment reference number..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This will be visible to the customer as proof of refund
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRefundedModal(false)
                  setRefundReferenceNumber('')
                  setRefundMethod('original_method')
                  setSelectedRefund(null)
                }}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundedConfirm}
                disabled={!!actionLoading || !refundReferenceNumber.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Complete Refund'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
