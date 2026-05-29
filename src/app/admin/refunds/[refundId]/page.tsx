'use client'

import { useEffect, useState } from 'react'
import { use } from 'react'
import { ArrowLeft, Loader2, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'
import RefundTimeline from '@/components/refund/RefundTimeline'
import {
  getRefundDetailsAction,
  approveRefundAction,
  rejectRefundAction,
  initiatePayURefundAction,
  markRefundCompletedAction,
  updateRefundStatusAction,
} from '../refund-actions'

interface PageProps {
  params: Promise<{ refundId: string }>
}

export default function RefundDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [refund, setRefund] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionCategory, setRejectionCategory] = useState('invalid_request')
  const [showRefundedModal, setShowRefundedModal] = useState(false)
  const [refundReferenceNumber, setRefundReferenceNumber] = useState('')
  const [refundMethod, setRefundMethod] = useState('original_method')

  const fetchRefundDetails = async () => {
    setLoading(true)
    try {
      const result = await getRefundDetailsAction(resolvedParams.refundId)
      if (result.success) {
        setRefund(result.refund)
        setOrder(result.order)
      } else {
        toast.error(result.error || 'Failed to fetch refund details')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch refund details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefundDetails()
  }, [resolvedParams.refundId])

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this refund?')) return
    
    setActionLoading(true)
    try {
      const result = await approveRefundAction(refund.refundId, 'admin')
      if (result.success) {
        toast.success('Refund approved successfully')
        fetchRefundDetails()
      } else {
        toast.error(result.error || 'Failed to approve refund')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve refund')
    } finally {
      setActionLoading(false)
    }
  }

  const handleInitiatePayU = async () => {
    if (!confirm('Are you sure you want to initiate PayU refund?')) return
    
    setActionLoading(true)
    try {
      const result = await initiatePayURefundAction(refund.refundId, 'admin')
      if (result.success) {
        toast.success(result.message || 'PayU refund initiated successfully')
        fetchRefundDetails()
      } else {
        toast.error(result.error || 'Failed to initiate PayU refund')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate PayU refund')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setActionLoading(true)
    try {
      const result = await updateRefundStatusAction(
        refund.refundId,
        'rejected',
        'admin',
        rejectionReason,
        { rejectionCategory }
      )
      if (result.success) {
        toast.success('Refund rejected successfully')
        setShowRejectModal(false)
        setRejectionReason('')
        setRejectionCategory('invalid_request')
        fetchRefundDetails()
      } else {
        toast.error(result.error || 'Failed to reject refund')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject refund')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefundedConfirm = async () => {
    if (!refundReferenceNumber.trim()) {
      toast.error('Please provide a refund reference number')
      return
    }

    setActionLoading(true)
    try {
      const result = await updateRefundStatusAction(
        refund.refundId,
        'refunded',
        'admin',
        `Refund completed via ${refundMethod}. Reference: ${refundReferenceNumber}`,
        { refundReferenceNumber, refundMethod }
      )
      if (result.success) {
        toast.success('Refund marked as completed')
        setShowRefundedModal(false)
        setRefundReferenceNumber('')
        setRefundMethod('original_method')
        fetchRefundDetails()
      } else {
        toast.error(result.error || 'Failed to mark refund as completed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark refund as completed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string, note?: string) => {
    // Show specific modals for rejection and refunded
    if (newStatus === 'rejected') {
      setShowRejectModal(true)
      return
    } else if (newStatus === 'refunded') {
      setShowRefundedModal(true)
      return
    }

    // For other statuses, update directly
    setActionLoading(true)
    try {
      const result = await updateRefundStatusAction(refund.refundId, newStatus, 'admin', note)
      if (result.success) {
        toast.success(result.message || 'Refund status updated successfully')
        fetchRefundDetails()
      } else {
        toast.error(result.error || 'Failed to update refund status')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update refund status')
    } finally {
      setActionLoading(false)
    }
  }

  const rejectionReasons = [
    { value: 'order_shipped', label: 'Order Already Shipped - Cannot process refund as order is shipped' },
    { value: 'order_delivered', label: 'Order Delivered - Refund window expired' },
    { value: 'invalid_request', label: 'Invalid Request - Does not meet refund criteria' },
    { value: 'fraud_suspected', label: 'Fraud Suspected - Unusual activity detected' },
    { value: 'policy_violation', label: 'Policy Violation - Against our refund policy' },
    { value: 'duplicate_request', label: 'Duplicate Request - Already processed' },
    { value: 'other', label: 'Other - Specify in notes' },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!refund) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Refund not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/refunds"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Refunds
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Refund Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {refund.refundId}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <RefundTimeline
                statusHistory={refund.statusHistory || []}
                currentStatus={refund.status}
                estimatedRefundDate={refund.estimatedRefundDate}
                isAdmin={true}
              />
            </div>

            {/* Order Items */}
            {refund.orderSnapshot?.items && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {refund.orderSnapshot.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cancellation Details
              </h3>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Cancelled By
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                    {refund.cancelledBy}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Reason
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {refund.cancellationReason || 'No reason provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Cancelled At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(refund.cancellationDate), 'MMM dd, yyyy hh:mm a')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Update Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Status
                  </label>
                  <select
                    value={refund.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={actionLoading || refund.status === 'refunded'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="refund_initiated">Refund Initiated</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="processing">Processing</option>
                    <option value="refunded">Refunded</option>
                    <option value="rejected">Rejected</option>
                    <option value="failed">Failed</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Current: <span className="font-medium capitalize">{refund.status.replace(/_/g, ' ')}</span>
                  </p>
                  {refund.status === 'processing' && (
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      ℹ️ When set to "Processing", system auto-adds "Approved" to timeline if missing
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Refund Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Refund Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Refund Amount
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(refund.refundAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Refund Type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                    {refund.refundType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Payment Gateway
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {refund.paymentGateway}
                  </dd>
                </div>
                {refund.payuRefundId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      PayU Refund ID
                    </dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                      {refund.payuRefundId}
                    </dd>
                  </div>
                )}
                {refund.refundReferenceNumber && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Refund Reference Number
                    </dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                      {refund.refundReferenceNumber}
                    </dd>
                  </div>
                )}
                {refund.refundMethod && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Refund Method
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {refund.refundMethod.replace(/_/g, ' ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Customer Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Customer
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {refund.userName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {refund.userEmail}
                  </dd>
                </div>
                {refund.userPhone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {refund.userPhone}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-3">
                {(refund.status === 'refund_initiated' || refund.status === 'pending_approval') && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Approve Refund
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Refund
                    </button>
                  </>
                )}

                {refund.status === 'approved' && (
                  <button
                    onClick={handleInitiatePayU}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        Process PayU Refund
                      </>
                    )}
                  </button>
                )}

                {(refund.status === 'processing' || refund.status === 'failed') && (
                  <button
                    onClick={() => setShowRefundedModal(true)}
                    disabled={actionLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Completed
                  </button>
                )}

                {order && (
                  <Link
                    href={`/admin/orders/${order.orderId}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    View Order
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject Refund
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refunded Modal */}
      {showRefundedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mark Refund as Completed
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refund Reference Number
                </label>
                <input
                  type="text"
                  value={refundReferenceNumber}
                  onChange={(e) => setRefundReferenceNumber(e.target.value)}
                  placeholder="Enter refund reference number..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refund Method
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original">Original Payment Method</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="wallet">Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundedModal(false)
                  setRefundReferenceNumber('')
                  setRefundMethod('original')
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundedConfirm}
                disabled={actionLoading || !refundReferenceNumber.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Mark as Completed'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
