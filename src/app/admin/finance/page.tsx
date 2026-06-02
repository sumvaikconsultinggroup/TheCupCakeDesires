'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  BarChart3,
  DollarSign,
  Receipt,
  Banknote,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Percent,
  FileText,
  Loader2,
} from 'lucide-react'

interface FinanceMetric {
  label: string
  value: number
  change: number
  changeType: 'increase' | 'decrease'
  prefix?: string
}

interface Transaction {
  id: string
  type: 'sale' | 'refund' | 'payout' | 'fee'
  description: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  orderId?: string
  gateway?: string
}

interface FinanceData {
  metrics: FinanceMetric[]
  revenueByGateway: { gateway: string; amount: number; percentage: number; count: number }[]
  revenueByDay: { date: string; revenue: number; orders: number }[]
  transactions: Transaction[]
  todayRevenue: number
  todayRevenueChange: number
  todayRevenueChangeType: 'increase' | 'decrease'
  codPending: number
  codPendingCount: number
  avgFeeRate: number
  taxReport?: { month: string; sales: number; tax: number; orders: number }[]
  totalTaxCollected?: number
  totalTaxableSales?: number
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'taxes'>('overview')

  const [metrics, setMetrics] = useState<FinanceMetric[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [revenueByGateway, setRevenueByGateway] = useState<{ gateway: string; amount: number; percentage: number; count: number }[]>([])
  const [revenueByDay, setRevenueByDay] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)

  useEffect(() => {
    fetchFinanceData()
  }, [dateRange])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/finance?dateRange=${dateRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch finance data')
      }
      const data: FinanceData = await response.json()

      setMetrics(data.metrics)
      setRevenueByGateway(data.revenueByGateway)
      setRevenueByDay(data.revenueByDay)
      setTransactions(data.transactions)
      setFinanceData(data)
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTaxReport = (report: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Tax Report - ${report.month}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #2e1f15; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #2e1f15; }
            .meta { margin-top: 10px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f4f4f4; padding: 12px; border: 1px solid #ddd; }
            td { padding: 12px; border: 1px solid #ddd; }
            .total { font-weight: bold; background: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Monthly Tax Report</div>
            <div class="meta">Month: ${report.month} | Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Taxable Sales (Delivered Orders)</td>
                <td>${report.orders} Orders</td>
                <td>₹${report.sales.toLocaleString()}</td>
              </tr>
              <tr class="total">
                <td>GST (5%)</td>
                <td>-</td>
                <td>₹${report.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 40px; font-size: 12px; color: #999;">
            This is an automatically generated tax report from CupCake Desires Admin.
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  const handleDownloadAllTaxReports = () => {
    // Similar to above but with all months
    const printWindow = window.open('', '_blank');
    if (!printWindow || !financeData?.taxReport) return;

    const rows = financeData.taxReport.map(r => `
      <tr>
        <td>${r.month}</td>
        <td>${r.orders}</td>
        <td>₹${r.sales.toLocaleString()}</td>
        <td>₹${r.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Full Tax Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .header { border-bottom: 2px solid #2e1f15; padding-bottom: 20px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Annual Tax Report</h1></div>
          <table>
            <thead><tr><th>Month</th><th>Orders</th><th>Sales</th><th>GST (5%)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'refund': return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Completed</span>
      case 'pending': return <span className="flex items-center gap-1 text-xs text-yellow-600"><Clock className="h-3 w-3" /> Pending</span>
      case 'failed': return <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" /> Failed</span>
      default: return null
    }
  }

  const maxRevenue = Math.max(...(revenueByDay?.map(d => d.revenue) || [0]))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#2e1f15]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Finance & Reports</h1>
          <p className="text-neutral-500">Track revenue, payouts, and financial health</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {(['overview', 'transactions', 'taxes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${activeTab === tab
                ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800"
              >
                <p className="text-sm text-neutral-500">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                  {metric.prefix}{metric.label.includes('Rate') ? `${metric.value}%` : metric.value?.toLocaleString()}
                </p>
                <div className={`mt-1 flex items-center gap-1 text-xs ${metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {metric.changeType === 'increase' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {metric.change}% vs last period
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Chart */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Revenue Trend</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#2e1f15]" /> Revenue</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Orders</span>
                </div>
              </div>
              <div className="flex h-64 items-end gap-2">
                {revenueByDay.length > 0 ? revenueByDay.map((day) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full">
                      <div
                        className="w-full rounded-t-lg bg-[#2e1f15] transition-all hover:bg-[#2e1f15]/80"
                        style={{ height: `${(day.revenue / maxRevenue) * 200}px` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500">{day.date}</span>
                  </div>
                )) : (
                  <div className="flex w-full items-center justify-center text-sm text-neutral-500">No chart data</div>
                )}
              </div>
            </div>

            {/* Revenue by Payment Method */}
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
              <h3 className="mb-4 font-semibold text-neutral-900 dark:text-white">Revenue by Payment Method</h3>
              <div className="space-y-4">
                {revenueByGateway.length > 0 ? (
                  revenueByGateway.map((item) => (
                    <div key={item.gateway}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{item.gateway}</span>
                        <span className="text-neutral-500">₹{item.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                        <div
                          className="h-full rounded-full bg-[#2e1f15]"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">{item.percentage}% of total · {item.count} orders</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-neutral-500">No payment data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Today's Revenue</p>
                  <p className="mt-1 text-3xl font-bold">
                    ₹{financeData?.todayRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
                <IndianRupee className="h-10 w-10 opacity-50" />
              </div>
              <p className="mt-2 text-sm text-green-100">
                {financeData?.todayRevenueChangeType === 'increase' ? '+' : '-'}
                {financeData?.todayRevenueChange?.toFixed(1) || '0'}% from yesterday
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">COD Pending</p>
                  <p className="mt-1 text-3xl font-bold">
                    ₹{financeData?.codPending?.toLocaleString() || '0'}
                  </p>
                </div>
                <Banknote className="h-10 w-10 opacity-50" />
              </div>
              <p className="mt-2 text-sm text-purple-100">
                {financeData?.codPendingCount || 0} orders awaiting delivery
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Processing Fees</p>
                  <p className="mt-1 text-3xl font-bold">
                    {financeData?.avgFeeRate?.toFixed(1) || '2.0'}%
                  </p>
                </div>
                <Percent className="h-10 w-10 opacity-50" />
              </div>
              <p className="mt-2 text-sm text-orange-100">Avg fee rate this period</p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
          <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search transactions..."
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900"
              />
              <select className="rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900">
                <option value="all">All Types</option>
                <option value="sale">Sales</option>
                <option value="refund">Refunds</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Transaction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Gateway</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{txn.description}</p>
                          <p className="text-xs text-neutral-500">{txn.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium capitalize dark:bg-neutral-700">
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{txn.gateway || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'taxes' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
              <p className="text-sm text-neutral-500">Taxable Sales (Delivered)</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                ₹{financeData?.totalTaxableSales?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
              <p className="text-sm text-neutral-500">GST Collected (5%)</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                ₹{financeData?.totalTaxCollected?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="text-xs text-neutral-500">Based on delivered orders only</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
              <p className="text-sm text-neutral-500">Next Filing Due</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">Mar 10, 2026</p>
              <p className="text-xs text-neutral-500">GSTR-1 Monthly</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-neutral-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Monthly Tax Reports</h3>
              <button 
                onClick={handleDownloadAllTaxReports}
                className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e1f15]/90"
              >
                <FileText className="h-4 w-4" /> Download All (CSV)
              </button>
            </div>
            <div className="space-y-2">
              {financeData?.taxReport?.map((report, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      <FileText className="h-5 w-5 text-neutral-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{report.month}</p>
                      <p className="text-xs text-neutral-500">
                        Sales: ₹{report.sales.toLocaleString()} · Tax: ₹{report.tax.toLocaleString()} · {report.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      ₹{report.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={() => handleDownloadTaxReport(report)}
                      className="text-sm font-medium text-[#2e1f15] hover:underline"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}

              {(!financeData?.taxReport || financeData.taxReport.length === 0) && (
                <div className="py-10 text-center text-neutral-500">
                  No tax data available for the selected period
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
