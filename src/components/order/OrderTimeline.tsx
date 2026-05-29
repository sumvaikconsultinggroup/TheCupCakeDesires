'use client'

import { CheckCircle2, Clock, Package, Truck, XCircle, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

interface TimelineEvent {
  status: string
  timestamp: string
  message?: string
  icon?: 'check' | 'clock' | 'package' | 'truck' | 'cancel' | 'refund'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'gray'
}

interface OrderTimelineProps {
  status: string
  statusLogs?: Array<{
    status?: string
    timestamp?: string
    message?: string
  }>
  createdAt: string
  shiprocketStatus?: string
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  order_created: { label: 'Order Placed', icon: Package, color: 'blue' },
  paid: { label: 'Payment Confirmed', icon: CheckCircle2, color: 'green' },
  cod: { label: 'COD Order Placed', icon: Package, color: 'yellow' },
  pending: { label: 'Processing', icon: Clock, color: 'yellow' },
  confirmed: { label: 'Order Confirmed', icon: CheckCircle2, color: 'blue' },
  processing: { label: 'Processing Order', icon: Clock, color: 'blue' },
  shipped: { label: 'Shipped', icon: Truck, color: 'blue' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'green' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'red' },
  refund_initiated: { label: 'Refund Initiated', icon: RotateCcw, color: 'orange' },
  refunded: { label: 'Refunded', icon: CheckCircle2, color: 'green' },
}

export default function OrderTimeline({ status, statusLogs, createdAt, shiprocketStatus }: OrderTimelineProps) {
  // Build timeline events from status logs
  const events: TimelineEvent[] = []

  // Add order created event
  events.push({
    status: 'order_created',
    timestamp: createdAt,
    message: 'Your order has been placed successfully',
  })

  // Add events from status logs
  if (statusLogs && statusLogs.length > 0) {
    statusLogs.forEach((log) => {
      if (log.status && log.timestamp) {
        events.push({
          status: log.status,
          timestamp: log.timestamp,
          message: log.message,
        })
      }
    })
  }

  // Ensure delivered status is shown if order is delivered
  if (status === 'delivered') {
    const hasDeliveredEvent = events.some(e => e.status === 'delivered')
    
    if (!hasDeliveredEvent) {
      // Find the latest timestamp from existing events to place delivered event after
      const latestTimestamp = events.length > 0 
        ? events[events.length - 1].timestamp 
        : createdAt
      
      events.push({
        status: 'delivered',
        timestamp: new Date(new Date(latestTimestamp).getTime() + 1000).toISOString(),
        message: 'Order has been delivered',
      })
    }
  }

  // Ensure cancelled status is shown if order is cancelled
  // Check if current status is cancelled but not in timeline yet
  if (status === 'cancelled' || status === 'refund_initiated' || status === 'refunded') {
    const hasCancelledEvent = events.some(e => 
      e.status === 'cancelled' || e.status === 'refund_initiated' || e.status === 'refunded'
    )
    
    if (!hasCancelledEvent) {
      // Find the latest timestamp from existing events to place cancelled event after
      const latestTimestamp = events.length > 0 
        ? events[events.length - 1].timestamp 
        : createdAt
      
      // Add cancelled status event if not already in timeline
      // Use a timestamp slightly after the latest event
      const cancelledTimestamp = new Date(new Date(latestTimestamp).getTime() + 1000).toISOString()
      
      events.push({
        status: status,
        timestamp: cancelledTimestamp,
        message: status === 'refund_initiated' 
          ? 'Order cancelled - Refund initiated' 
          : status === 'refunded'
          ? 'Order cancelled - Refund completed'
          : 'Order cancelled',
      })
    }
  }

  // Sort events by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const getIconAndColor = (eventStatus: string) => {
    const config = statusConfig[eventStatus] || { icon: Clock, color: 'gray' }
    return config
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-400' },
      green: { bg: 'bg-green-100 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-400' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
      red: { bg: 'bg-red-100 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-400' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-400' },
      gray: { bg: 'bg-gray-100 dark:bg-gray-900/20', border: 'border-gray-500', text: 'text-gray-700 dark:text-gray-400' },
    }
    return colors[color] || colors.gray
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Timeline</h3>
      
      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {events.map((event, index) => {
          const config = getIconAndColor(event.status)
          const Icon = config.icon
          const colors = getColorClasses(config.color)
          const isLast = index === events.length - 1

          return (
            <div key={index} className="relative flex items-start gap-4">
              {/* Icon */}
              <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg}`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {config.label}
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {event.message && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {event.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          )
        })}

        {/* Shiprocket live status */}
        {shiprocketStatus && status === 'shipped' && (
          <div className="relative flex items-start gap-4">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/20">
              <Truck className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Shipment Update
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {shiprocketStatus}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
