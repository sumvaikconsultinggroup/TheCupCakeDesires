'use client'

import { CheckCircle2, Clock, XCircle, RotateCcw, AlertTriangle, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface TimelineEvent {
  status: string
  timestamp: string
  note?: string
  updatedBy?: string
}

interface RefundTimelineProps {
  statusHistory: TimelineEvent[]
  currentStatus: string
  estimatedRefundDate?: string
  onStatusUpdate?: (newStatus: string, note: string) => void
  isAdmin?: boolean
}

const statusConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
  refund_initiated: {
    label: 'Refund Initiated',
    icon: RotateCcw,
    color: 'yellow',
    description: 'Refund request has been created and is awaiting admin review',
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: Clock,
    color: 'orange',
    description: 'Waiting for admin to approve the refund request',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'green',
    description: 'Refund approved by admin. Ready to process with payment gateway',
  },
  processing: {
    label: 'Processing',
    icon: DollarSign,
    color: 'blue',
    description: 'Refund is being processed through PayU payment gateway',
  },
  refunded: {
    label: 'Refunded',
    icon: CheckCircle2,
    color: 'green',
    description: 'Refund completed successfully. Amount credited to your account',
  },
  failed: {
    label: 'Failed',
    icon: AlertTriangle,
    color: 'red',
    description: 'Refund processing failed. Admin will retry or process manually',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'red',
    description: 'Refund request was rejected by admin',
  },
}

export default function RefundTimeline({
  statusHistory,
  currentStatus,
  estimatedRefundDate,
  onStatusUpdate,
  isAdmin = false,
}: RefundTimelineProps) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; ring: string }> = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        border: 'border-blue-500',
        text: 'text-blue-700 dark:text-blue-400',
        ring: 'ring-blue-500/20',
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        border: 'border-green-500',
        text: 'text-green-700 dark:text-green-400',
        ring: 'ring-green-500/20',
      },
      yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        border: 'border-yellow-500',
        text: 'text-yellow-700 dark:text-yellow-400',
        ring: 'ring-yellow-500/20',
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        border: 'border-red-500',
        text: 'text-red-700 dark:text-red-400',
        ring: 'ring-red-500/20',
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        border: 'border-orange-500',
        text: 'text-orange-700 dark:text-orange-400',
        ring: 'ring-orange-500/20',
      },
    }
    return colors[color] || colors.yellow
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Refund Status</h3>
        {estimatedRefundDate && currentStatus !== 'refunded' && currentStatus !== 'rejected' && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Estimated: {new Date(estimatedRefundDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Current Status Card */}
      {statusConfig[currentStatus] && (
        <div
          className={`rounded-lg border-2 p-4 ${getColorClasses(statusConfig[currentStatus].color).border} ${
            getColorClasses(statusConfig[currentStatus].color).bg
          }`}
        >
          <div className="flex items-start gap-3">
            {React.createElement(statusConfig[currentStatus].icon, {
              className: `h-6 w-6 ${getColorClasses(statusConfig[currentStatus].color).text}`,
            })}
            <div className="flex-1">
              <h4 className={`font-semibold ${getColorClasses(statusConfig[currentStatus].color).text}`}>
                {statusConfig[currentStatus].label}
              </h4>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {statusConfig[currentStatus].description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {statusHistory.map((event, index) => {
          const config = statusConfig[event.status]
          if (!config) return null

          const Icon = config.icon
          const colors = getColorClasses(config.color)
          const isLatest = index === statusHistory.length - 1

          return (
            <div key={index} className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg} ${
                  isLatest ? `ring-4 ${colors.ring}` : ''
                }`}
              >
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${isLatest ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {config.label}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {event.note && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {event.note}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <span>{new Date(event.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  {event.updatedBy && (
                    <>
                      <span>•</span>
                      <span>by {event.updatedBy}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Expected Timeline */}
      {currentStatus === 'processing' && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
          <h4 className="font-medium text-blue-900 dark:text-blue-400">Expected Timeline</h4>
          <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• PayU Processing: 3-5 business days</li>
            <li>• Bank Processing: 2-5 business days</li>
            <li>• Total Expected: 3-7 business days</li>
          </ul>
        </div>
      )}
    </div>
  )
}

// Import React for createElement
import React from 'react'
