'use client'

import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
  refundedTotal: number
  refundedCount: number
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
  const [revenueByGateway, setRevenueByGateway] = useState<
    { gateway: string; amount: number; percentage: number; count: number }[]
  >([])
  const [revenueByDay, setRevenueByDay] = useState<{ date: string; revenue: number; orders: number }[]>([])
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  useEffect(() => {
    fetchFinanceData()
  }, [dateRange])

  const fetchFinanceData = async () => {
    const id = ++requestId.current
    setError('')
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/finance?dateRange=${dateRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch finance data')
      }
      const data: FinanceData = await response.json()
      if (id !== requestId.current) return

      setMetrics(data.metrics)
      setRevenueByGateway(data.revenueByGateway)
      setRevenueByDay(data.revenueByDay)
      setTransactions(data.transactions)
      setFinanceData(data)
    } catch (error) {
      if (id !== requestId.current) return
      setError('Unable to load finance data. Retry or select another period.')
      setFinanceData(null)
      setMetrics([])
      setTransactions([])
      setRevenueByDay([])
      setRevenueByGateway([])
      console.error('Error fetching finance data:', error)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }

  const handleDownloadTaxReport = (report: any) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

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
                <td>Taxable Sales (Paid Orders)</td>
                <td>${report.orders} Orders</td>
                <td>$${report.sales.toLocaleString()}</td>
              </tr>
              <tr class="total">
                <td>GST (10%)</td>
                <td>-</td>
                <td>$${report.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 40px; font-size: 12px; color: #999;">
            This is an automatically generated tax report from The Cupcake Desire Admin.
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const handleDownloadAllTaxReports = () => {
    // Similar to above but with all months
    const printWindow = window.open('', '_blank')
    if (!printWindow || !financeData?.taxReport) return

    const rows = financeData.taxReport
      .map(
        (r) => `
      <tr>
        <td>${r.month}</td>
        <td>${r.orders}</td>
        <td>$${r.sales.toLocaleString()}</td>
        <td>$${r.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join('')

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
            <thead><tr><th>Month</th><th>Orders</th><th>Sales</th><th>GST (10%)</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'refund':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" /> Completed
          </span>
        )
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <Clock className="h-3 w-3" /> Pending
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        )
      default:
        return null
    }
  }

  const maxRevenue = Math.max(...(revenueByDay?.map((d) => d.revenue) || [0]), 0) || 1

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cocoa" />
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-0 space-y-8 bg-ivory p-6 text-cocoa md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="bake-eyebrow text-rose-accent">Financial overview</p>
          <h1 className="mt-2 font-bake-display text-[32px] leading-tight font-medium md:text-[40px]">Finance</h1>
          <p className="text-taupe">Revenue, transactions and GST reports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border border-line px-4 py-2 text-sm outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            disabled={!financeData || loading}
            onClick={() => {
              if (!financeData) return
              const rows = [
                ['Metric', 'Value (AUD)'],
                ...metrics.map((metric) => [metric.label, metric.value]),
                ['Transaction', 'Amount (AUD)', 'Status', 'Date'],
                ...transactions.map((transaction) => [
                  transaction.description,
                  transaction.amount,
                  transaction.status,
                  transaction.date,
                ]),
              ]
              const csv = rows
                .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','))
                .join('\r\n')
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
              const anchor = document.createElement('a')
              anchor.href = url
              anchor.download = 'finance-' + dateRange + '.csv'
              anchor.click()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
            className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-cream disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button onClick={fetchFinanceData} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['overview', 'transactions', 'taxes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
            className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'border-cocoa bg-cocoa text-ivory'
                : 'border-line bg-cream text-cocoa-soft hover:border-cocoa'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bake-card min-w-0 p-6"
              >
                <p className="text-sm text-taupe">{metric.label}</p>
                <p className="mt-2 font-bake-display text-[30px] leading-tight font-medium break-words text-cocoa">
                  {metric.prefix}
                  {metric.label.includes('Rate') ? `${metric.value}%` : metric.value?.toLocaleString()}
                </p>
                <div
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
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
            <div className="rounded-lg bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-cocoa">Revenue Trend</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cocoa" /> Revenue
                  </span>
                </div>
              </div>
              <div className="h-64 w-full min-w-0">
                {revenueByDay.some((day) => day.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByDay} margin={{ right: 8 }}>
                      <CartesianGrid vertical={false} stroke="#e6d7ce" strokeDasharray="3 3" />
                      <XAxis dataKey="date" minTickGap={32} tick={{ fontSize: 11 }} />
                      <YAxis width={60} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) =>
                          new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(value))
                        }
                      />
                      <Bar dataKey="revenue" name="Revenue (AUD)" fill="#d97185" maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-taupe">
                    No revenue in this period
                  </p>
                )}
              </div>
            </div>

            {/* Revenue by Payment Method */}
            <div className="bake-card min-w-0 p-6">
              <h3 className="mb-4 font-semibold text-cocoa">Revenue by Payment Method</h3>
              <div className="space-y-4">
                {revenueByGateway.length > 0 ? (
                  revenueByGateway.map((item) => (
                    <div key={item.gateway}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{item.gateway}</span>
                        <span className="text-taupe">${item.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-cream">
                        <div className="h-full rounded-full bg-cocoa" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-taupe">
                        {item.percentage}% of total · {item.count} orders
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-taupe">No payment data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bake-card min-w-0 p-6 text-cocoa">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cocoa-soft">Today's Revenue</p>
                  <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
                    ${financeData?.todayRevenue?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 opacity-50" />
              </div>
              <p className="mt-2 text-sm text-cocoa-soft">
                {financeData?.todayRevenueChangeType === 'increase' ? '+' : '-'}
                {financeData?.todayRevenueChange?.toFixed(1) || '0'}% from yesterday
              </p>
            </div>
            <div className="bake-card min-w-0 p-6 text-cocoa">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cocoa-soft">Refunded (period)</p>
                  <p className="mt-1 font-bake-display text-[32px] leading-tight font-medium break-words">
                    ${financeData?.refundedTotal?.toLocaleString() || '0'}
                  </p>
                </div>
                <Banknote className="h-10 w-10 opacity-50" />
              </div>
              <p className="mt-2 text-sm text-cocoa-soft">
                {financeData?.refundedCount || 0} refunded orders this period
              </p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="rounded-lg bg-white">
          <div className="border-b border-line p-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search transactions..."
                className="flex-1 rounded-md border border-line px-4 py-2 text-sm outline-none"
              />
              <select className="rounded-md border border-line px-4 py-2 text-sm outline-none">
                <option value="all">All Types</option>
                <option value="sale">Sales</option>
                <option value="refund">Refunds</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-taupe uppercase">Transaction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-taupe uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-taupe uppercase">Gateway</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-taupe uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-taupe uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-taupe uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-cream">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cream">
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div>
                          <p className="font-medium text-cocoa">{txn.description}</p>
                          <p className="text-xs text-taupe">{txn.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-cream px-2 py-1 text-xs font-medium capitalize">{txn.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-taupe">{txn.gateway || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                    <td className="px-4 py-3 text-sm text-taupe">{new Date(txn.date).toLocaleDateString()}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        txn.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
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
            <div className="bake-card min-w-0 p-6">
              <p className="text-sm text-taupe">Taxable Sales (Paid)</p>
              <p className="mt-1 text-2xl font-bold text-cocoa">
                ${financeData?.totalTaxableSales?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bake-card min-w-0 p-6">
              <p className="text-sm text-taupe">GST Collected (10%)</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                $
                {financeData?.totalTaxCollected?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || '0.00'}
              </p>
              <p className="text-xs text-taupe">Based on all paid orders</p>
            </div>
            <div className="bake-card min-w-0 p-6">
              <p className="text-sm text-taupe">BAS Lodgement</p>
              <p className="mt-1 text-2xl font-bold text-cocoa">Quarterly</p>
              <p className="text-xs text-taupe">Check ATO portal for due dates</p>
            </div>
          </div>

          <div className="bake-card min-w-0 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-cocoa">Monthly Tax Reports</h3>
              <button
                onClick={handleDownloadAllTaxReports}
                className="flex items-center gap-2 rounded-md bg-cocoa px-4 py-2 text-sm font-medium text-ivory hover:bg-[#2e1f15]/90"
              >
                <FileText className="h-4 w-4" /> Download All (CSV)
              </button>
            </div>
            <div className="space-y-2">
              {financeData?.taxReport?.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-line p-4 transition-colors hover:bg-cream"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream">
                      <FileText className="h-5 w-5 text-taupe" />
                    </div>
                    <div>
                      <p className="font-medium text-cocoa">{report.month}</p>
                      <p className="text-xs text-taupe">
                        Sales: ${report.sales.toLocaleString()} · Tax: ${report.tax.toLocaleString()} · {report.orders}{' '}
                        orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-cocoa">
                      ${report.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDownloadTaxReport(report)}
                      className="text-sm font-medium text-cocoa hover:underline"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}

              {(!financeData?.taxReport || financeData.taxReport.length === 0) && (
                <div className="py-10 text-center text-taupe">No tax data available for the selected period</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
