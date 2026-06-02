'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  Download,
  Heart,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CustomerData, CustomerStats, getCustomerDetails, getCustomers } from './customers-actions'

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
        limit: 20,
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

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgOrderValue = stats?.averageOrderValue || 0

  const handleExport = () => {
    if (customers.length === 0) return

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Gender',
      'Date of Birth',
      'Total Orders',
      'Total Spent',
      'Joined Date',
      'Last Order Date',
    ]

    const csvContent = [
      headers.join(','),
      ...customers.map((customer) =>
        [
          `"${(customer.name || '').replace(/"/g, '""')}"`,
          `"${(customer.email || '').replace(/"/g, '""')}"`,
          `"${(customer.phone || '').replace(/"/g, '""')}"`,
          `"${(customer.gender || '').replace(/"/g, '""')}"`,
          `"${customer.dob ? new Date(customer.dob).toLocaleDateString('en-IN') : ''}"`,
          customer.totalOrders,
          customer.totalSpent,
          `"${new Date(customer.createdAt).toLocaleDateString('en-IN')}"`,
          `"${customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString('en-IN') : ''}"`,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'customers_export.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Customers</h1>
          <p className="text-neutral-500">{stats?.totalCustomers || 0} customers registered</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Customers</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{stats?.totalCustomers || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Avg Order Value</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                ₹{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:bg-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pr-4 pl-10 text-sm transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No customers found</p>
            <p className="mt-1 text-neutral-500">Customers will appear here when they sign up</p>
          </div>
        ) : (
          customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              onClick={() => handleCustomerClick(customer.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:bg-neutral-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cocoa to-rose-accent text-lg font-bold text-white">
                    {customer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{customer.name}</h3>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                )}
                {customer.gender && (
                  <div className="flex items-center gap-2 text-neutral-500 capitalize">
                    <Users className="h-4 w-4" />
                    {customer.gender}
                  </div>
                )}
                {customer.dob && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(customer.dob).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <div>
                  <p className="text-xs text-neutral-500">Orders</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{customer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Total Spent</p>
                  <p className="font-bold text-green-600">₹{customer.totalSpent.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                </span>
                {customer.lastOrder && (
                  <span>Last order: {new Date(customer.lastOrder).toLocaleDateString('en-IN')}</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Customer Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-neutral-800"
          >
            <button
              onClick={() => setIsDetailsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>

            {detailsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            ) : selectedCustomer ? (
              <div className="p-6 sm:p-8">
                <div className="mb-8 flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cocoa to-rose-accent text-3xl font-bold text-white">
                    {selectedCustomer.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{selectedCustomer.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedCustomer.email}
                      </span>
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {selectedCustomer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Addresses */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                      <MapPin className="h-5 w-5 text-neutral-500" />
                      Addresses
                    </h3>
                    <div className="space-y-3">
                      {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                        selectedCustomer.addresses.map((addr: any, i: number) => (
                          <div key={i} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                            <div className="mb-1 font-medium capitalize">{addr.billing_address_type || 'Address'}</div>
                            <div className="text-sm text-neutral-500">
                              {addr.billing_addressLine}, {addr.billing_city}
                              <br />
                              {addr.billing_state}, {addr.billing_country} - {addr.billing_pincode}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">No addresses found</p>
                      )}
                    </div>
                  </div>

                  {/* Order Stats */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                      <Package className="h-5 w-5 text-neutral-500" />
                      Order Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900">
                        <div className="text-sm text-neutral-500">Total Orders</div>
                        <div className="text-xl font-bold text-neutral-900 dark:text-white">
                          {selectedCustomer.totalOrders}
                        </div>
                      </div>
                      <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900">
                        <div className="text-sm text-neutral-500">Total Spent (Paid)</div>
                        <div className="text-xl font-bold text-green-600">
                          ₹{selectedCustomer.totalSpent.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="col-span-full space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                      <Package className="h-5 w-5 text-neutral-500" />
                      Recent Orders
                    </h3>
                    {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomer.orders.map((order: any) => (
                          <div key={order.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-neutral-900 dark:text-white">{order.orderId}</div>
                                <div className="mt-1 text-sm text-neutral-500">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-neutral-900 dark:text-white">
                                  ₹{order.totalAmount.toLocaleString()}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                                    'bg-neutral-100 text-neutral-700'
                                  }`}>
                                    {order.status}
                                  </span>
                                  <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
                                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {order.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No orders found</p>
                    )}
                  </div>

                  {/* Wishlist */}
                  <div className="col-span-full space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                      <Heart className="h-5 w-5 text-neutral-500" />
                      Wishlist ({selectedCustomer.wishlist?.length || 0})
                    </h3>
                    {selectedCustomer.wishlist && selectedCustomer.wishlist.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedCustomer.wishlist.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                            {item.image && (
                              <img src={item.image} alt={item.productName} className="h-12 w-12 rounded-lg object-cover" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{item.productName}</div>
                              {item.variant && (
                                <div className="text-xs text-neutral-500">
                                  {[item.variant.option1Value, item.variant.option2Value].filter(Boolean).join(' / ')}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-neutral-900 dark:text-white">
                                  ₹{(item.variant?.price || item.price).toLocaleString()}
                                </span>
                                {item.variant?.compareAtPrice > (item.variant?.price || 0) && (
                                  <span className="line-through text-neutral-400">
                                    ₹{item.variant.compareAtPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No items in wishlist</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </div>
  )
}