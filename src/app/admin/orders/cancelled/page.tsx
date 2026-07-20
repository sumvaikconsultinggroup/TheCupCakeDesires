'use client'

import { useEffect, useState } from 'react'
import { Search, XCircle, Eye, RotateCcw, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

interface Order {
  _id: string
  orderId: string
  userId: string
  user?: {
    billing_email?: string
    email?: string
  }
  deliveryAddress?: {
    email?: string
    firstName?: string
    lastName?: string
  }
  totalAmount: number
  status: string
  paymentDetails?: {
    paymentMethod?: string
    paymentStatus?: string
  }
  createdAt: string
  cancelledAt?: string
  cancellationReason?: string
}

export default function CancelledOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalOrders, setTotalOrders] = useState(0)

  const fetchCancelledOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/orders/cancelled?limit=200')
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders || [])
        setTotalOrders(data.pagination?.total || 0)
      } else {
        toast.error(data.message || 'Failed to fetch cancelled orders')
      }
    } catch (error) {
      console.error('Error fetching cancelled orders:', error)
      toast.error('Failed to fetch cancelled orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCancelledOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.orderId?.toLowerCase().includes(query) ||
      order.deliveryAddress?.email?.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query)
    )
  })

  const getCustomerEmail = (order: Order) => {
    return order.deliveryAddress?.email || order.user?.billing_email || order.user?.email || 'N/A'
  }

  const getCustomerName = (order: Order) => {
    if (order.deliveryAddress?.firstName || order.deliveryAddress?.lastName) {
      return `${order.deliveryAddress.firstName || ''} ${order.deliveryAddress.lastName || ''}`.trim()
    }
    return 'Customer'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Cancelled Orders
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View all cancelled orders and their refund status
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cancelled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {totalOrders}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">With Refunds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {orders.filter(o => o.status === 'refund_initiated' || o.status === 'refunded').length}
                </p>
              </div>
              <RotateCcw className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cancelled Value{orders.length < totalOrders ? ' (shown page)' : ''}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}
                </p>
              </div>
              <Package className="h-8 w-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No cancelled orders found' : 'No cancelled orders yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order ID
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
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cancelled At
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.orderId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getCustomerName(order)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getCustomerEmail(order)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            order.status === 'refund_initiated'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                              : order.status === 'refunded'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {order.status === 'refund_initiated' ? (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              Refund Initiated
                            </>
                          ) : order.status === 'refunded' ? (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              Refunded
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Cancelled
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {order.paymentDetails?.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {order.cancelledAt
                            ? format(new Date(order.cancelledAt), 'MMM dd, yyyy')
                            : format(new Date(order.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.cancelledAt
                            ? format(new Date(order.cancelledAt), 'hh:mm a')
                            : format(new Date(order.createdAt), 'hh:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.orderId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
