'use client'

import { Activity, Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAnalyticsData, type AnalyticsData } from './analytics-actions'

const money = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value)

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chart, setChart] = useState<'revenue' | 'orders'>('revenue')
  const request = useRef(0)
  const load = useCallback(async () => {
    const id = ++request.current
    setLoading(true)
    setError('')
    try {
      const result = await getAnalyticsData(range)
      if (id !== request.current) return
      if (!result.success || !result.data) throw new Error('Analytics could not be loaded. Please retry.')
      setData(result.data)
    } catch (err) {
      if (id === request.current) {
        setData(null)
        setError(err instanceof Error ? err.message : 'Unable to load analytics')
      }
    } finally {
      if (id === request.current) setLoading(false)
    }
  }, [range])
  useEffect(() => {
    setData(null)
    void load()
    return () => {
      request.current++
    }
  }, [load])

  const exportReport = () => {
    if (!data) return
    const rows = [
      ['Report', range],
      ['Currency', 'AUD'],
      ['Timezone', 'Australia/Melbourne'],
      ['Metric', 'Value'],
      ['Paid revenue', data.revenue.total],
      ['Paid orders', data.orders.total],
      ['Registered customers', data.visitors.total],
      ['Average order value', data.averageOrderValue],
      ['Conversion rate', 'Unavailable'],
      ['Date', 'Revenue', 'Paid orders', 'Registered customers'],
      ...data.revenue.chartData.map((point, i) => [
        point.date,
        point.value,
        data.orders.chartData[i]?.value ?? 0,
        data.visitors.chartData[i]?.value ?? 0,
      ]),
      ['Category', 'Net product sales'],
      ...data.topCategories.filter((item) => item.sales > 0).map((item) => [item.name, item.sales]),
      ['Payment method', 'Share of paid orders (%)'],
      ...data.salesByChannel.filter((item) => item.value > 0).map((item) => [item.channel, item.value]),
    ]
    const csv = rows
      .map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'analytics-' + range + '.csv'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const metrics = data
    ? [
        { name: 'Paid revenue', value: money(data.revenue.total), change: data.revenue.change },
        { name: 'Paid orders', value: data.orders.total.toLocaleString(), change: data.orders.change },
        { name: 'Registered customers', value: data.visitors.total.toLocaleString(), change: data.visitors.change },
        { name: 'Average order value', value: money(data.averageOrderValue) },
      ]
    : []
  const points = data?.[chart].chartData || []
  return (
    <main className="min-h-screen min-w-0 space-y-8 bg-ivory p-6 text-cocoa md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="bake-eyebrow text-rose-accent">Store performance</p>
          <h1 className="mt-2 font-bake-display text-[32px] leading-tight font-medium md:text-[40px]">Analytics</h1>
          <p className="bake-body mt-2 text-cocoa-soft">Sales and customer activity · AUD · Melbourne time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/analytics/live-activity" className="inline-flex items-center gap-2 px-3 py-2 text-sm">
            <Activity size={16} />
            Live activity
          </Link>
          <select
            aria-label="Report period"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-full border border-line bg-cream px-4 py-2 text-[13px] text-cocoa focus:border-rose-accent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            title="Refresh report"
            aria-label="Refresh report"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-md border border-line p-2 disabled:opacity-40"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            title="Export CSV"
            aria-label="Export CSV"
            disabled={loading || !data}
            onClick={exportReport}
            className="rounded-md border border-line p-2 disabled:opacity-40"
          >
            <Download size={18} />
          </button>
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <button onClick={() => void load()} className="underline">
            Retry
          </button>
        </div>
      )}
      {loading && !data && (
        <p role="status" className="py-12 text-center text-sm text-taupe">
          Loading analytics...
        </p>
      )}
      {data && (
        <div aria-busy={loading} className={loading ? 'space-y-6 opacity-60' : 'space-y-6'}>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.name} className="bake-card min-w-0 p-6">
                <dt className="text-sm text-taupe">{metric.name}</dt>
                <dd className="mt-2 font-bake-display text-[32px] leading-tight font-medium break-words tabular-nums">
                  {metric.value}
                </dd>
                {metric.change !== undefined && (
                  <p className={'mt-2 text-xs ' + (metric.change < 0 ? 'text-red-600' : 'text-emerald-700')}>
                    {metric.change > 0 ? '+' : ''}
                    {metric.change.toFixed(1)}% vs previous period
                  </p>
                )}
              </div>
            ))}
          </dl>
          <section className="border-b border-line pb-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {chart === 'revenue' ? 'Paid revenue' : 'Paid orders'} over time
              </h2>
              <div role="group" aria-label="Chart metric" className="inline-flex rounded-md border border-line p-1">
                {(['revenue', 'orders'] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={chart === value}
                    onClick={() => setChart(value)}
                    className={
                      'rounded px-3 py-1.5 text-sm capitalize ' + (chart === value ? 'bg-cocoa text-ivory' : '')
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            {points.some((point) => point.value > 0) ? (
              <div className="h-72 w-full min-w-0" role="img" aria-label={chart + ' chart for selected period'}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={points} margin={{ left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} stroke="#e6d7ce" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
                    <YAxis width={65} tick={{ fontSize: 11 }} allowDecimals={chart === 'revenue'} />
                    <Tooltip
                      formatter={(value) =>
                        chart === 'revenue' ? money(Number(value)) : Number(value).toLocaleString()
                      }
                    />
                    <Bar
                      dataKey="value"
                      name={chart === 'revenue' ? 'Revenue (AUD)' : 'Paid orders'}
                      fill={chart === 'revenue' ? '#d97185' : '#6f8d65'}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="flex h-52 items-center justify-center text-sm text-taupe">No paid orders in this period.</p>
            )}
          </section>
          <div className="grid min-w-0 gap-8 lg:grid-cols-2">
            <section className="min-w-0">
              <h2 className="mb-4 text-base font-semibold">Category sales</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-taupe">
                    <tr>
                      <th className="py-2 font-medium">Category</th>
                      <th className="py-2 text-right font-medium">After discounts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.topCategories
                      .filter((item) => item.sales > 0)
                      .map((item) => (
                        <tr key={item.name}>
                          <td className="py-3 pr-4">{item.name}</td>
                          <td className="py-3 text-right whitespace-nowrap tabular-nums">{money(item.sales)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!data.topCategories.some((item) => item.sales > 0) && (
                <p className="py-6 text-sm text-taupe">No category sales.</p>
              )}
            </section>
            <section className="min-w-0">
              <h2 className="mb-4 text-base font-semibold">Payment methods</h2>
              {data.salesByChannel
                .filter((item) => item.value > 0)
                .map((item) => (
                  <div key={item.channel} className="mb-4">
                    <div className="mb-2 flex justify-between gap-4 text-sm">
                      <span>{item.channel}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-cream">
                      <div className="h-full bg-rose-accent" style={{ width: item.value + '%' }} />
                    </div>
                  </div>
                ))}
              {!data.salesByChannel.some((item) => item.value > 0) && (
                <p className="py-6 text-sm text-taupe">No paid orders.</p>
              )}
              <dl className="mt-6 flex justify-between gap-4 border-t border-line pt-4 text-sm">
                <dt>Visitor conversion</dt>
                <dd className="text-taupe">Unavailable</dd>
              </dl>
            </section>
          </div>
          <section className="border-t border-line pt-5">
            <h2 className="mb-3 text-base font-semibold">Recent activity · all time</h2>
            <ul className="divide-y divide-line">
              {data.recentActivity.map((item, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                  <span className="min-w-0 break-words">{item.description}</span>
                  <span className="shrink-0 text-xs text-taupe">{item.time}</span>
                </li>
              ))}
            </ul>
            {!data.recentActivity.length && <p className="py-6 text-sm text-taupe">No recent activity.</p>}
          </section>
        </div>
      )}
    </main>
  )
}
