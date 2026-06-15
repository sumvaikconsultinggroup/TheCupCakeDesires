'use client'

import {
  Download,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface Subscriber {
  _id: string
  email: string
  status: 'active' | 'unsubscribed'
  source?: string
  subscribedAt: string
  welcomeEmailSentAt?: string | null
}

interface Campaign {
  _id: string
  subject: string
  recipientCount: number
  successCount: number
  failedCount: number
  skippedCount: number
  sentByEmail: string
  sentAt: string
  attachmentNames?: string[]
}

export default function NewsletterMarketingPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState({ active: 0, unsubscribed: 0, total: 0 })
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [bodyHtml, setBodyHtml] = useState('<p>Hello from the bakery!</p>')
  const [attachments, setAttachments] = useState<FileList | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/newsletter/subscribers?limit=100')
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to load subscribers')
        return
      }
      setSubscribers(data.data.subscribers || [])
      setStats(data.data.stats || { active: 0, unsubscribed: 0, total: 0 })
      setCampaigns(data.data.recentCampaigns || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load newsletter data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const exportCsv = () => {
    const rows = [['email', 'status', 'source', 'subscribedAt', 'welcomeEmailSentAt']]
    subscribers.forEach((s) => {
      rows.push([
        s.email,
        s.status,
        s.source || '',
        s.subscribedAt,
        s.welcomeEmailSentAt || '',
      ])
    })
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error('Subject and message are required')
      return
    }
    if (!confirmSend) {
      toast.error('Tick the confirmation box before sending')
      return
    }

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('subject', subject.trim())
      formData.append('previewText', previewText.trim())
      formData.append('bodyHtml', bodyHtml.trim())
      formData.append('confirm', 'send')
      if (attachments) {
        Array.from(attachments).forEach((file) => formData.append('attachments', file))
      }

      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || 'Campaign failed to send')
        return
      }

      toast.success(data.message || 'Campaign sent')
      setConfirmSend(false)
      await loadData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const activePreview = useMemo(
    () => subscribers.filter((s) => s.status === 'active').slice(0, 8),
    [subscribers]
  )

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Marketing</p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-900">Newsletter subscribers</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Storefront sign-ups from The Wednesday letter are saved here. Send a custom campaign to all active
            subscribers via Resend, with optional attachments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Active subscribers', value: stats.active, icon: Users },
          { label: 'Unsubscribed', value: stats.unsubscribed, icon: Mail },
          { label: 'Campaigns sent', value: campaigns.length, icon: Send },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">{label}</p>
              <Icon className="h-4 w-4 text-rose-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-neutral-900">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900">Subscribers</h2>
          <p className="mt-1 text-sm text-neutral-500">Latest sign-ups from the homepage newsletter form.</p>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-neutral-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">No subscribers yet.</p>
          ) : (
            <ul className="mt-5 max-h-[420px] space-y-2 overflow-y-auto">
              {subscribers.map((subscriber) => (
                <li
                  key={subscriber._id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{subscriber.email}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(subscriber.subscribedAt).toLocaleDateString()} · {subscriber.source || 'homepage'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      subscriber.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {subscriber.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-3">
          <h2 className="text-lg font-semibold text-neutral-900">Send campaign</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Sends individually to {stats.active} active subscriber{stats.active === 1 ? '' : 's'} with unsubscribe
            links included.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                placeholder="This week's flavours are live"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">Preview text</label>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-rose-400"
                placeholder="Optional inbox preview line"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">Message (HTML)</label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={10}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-4 py-3 font-mono text-sm outline-none focus:border-rose-400"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Use simple HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;a href=&quot;...&quot;&gt;, and &lt;img&gt;.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">Attachments</label>
              <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 hover:border-rose-300 hover:bg-rose-50/40">
                <Paperclip className="h-4 w-4" />
                <span>{attachments?.length ? `${attachments.length} file(s) selected` : 'Add up to 5 files (10 MB each)'}</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setAttachments(e.target.files)}
                />
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={confirmSend}
                onChange={(e) => setConfirmSend(e.target.checked)}
                className="mt-1"
              />
              <span>
                I understand this will email all <strong>{stats.active}</strong> active subscribers immediately via
                Resend.
              </span>
            </label>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || stats.active === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending…' : 'Send to all subscribers'}
            </button>
          </div>
        </section>
      </div>

      {campaigns.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Recent campaigns</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium">Sent</th>
                  <th className="px-3 py-2 font-medium">Delivered</th>
                  <th className="px-3 py-2 font-medium">Failed</th>
                  <th className="px-3 py-2 font-medium">Attachments</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="border-b border-neutral-100">
                    <td className="px-3 py-3 font-medium text-neutral-900">{campaign.subject}</td>
                    <td className="px-3 py-3 text-neutral-600">
                      {new Date(campaign.sentAt).toLocaleString()}
                      <div className="text-xs text-neutral-400">{campaign.sentByEmail}</div>
                    </td>
                    <td className="px-3 py-3 text-emerald-700">{campaign.successCount}</td>
                    <td className="px-3 py-3 text-red-600">{campaign.failedCount}</td>
                    <td className="px-3 py-3 text-neutral-600">
                      {campaign.attachmentNames?.length ? campaign.attachmentNames.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activePreview.length > 0 && (
        <p className="text-xs text-neutral-500">
          Preview recipients include: {activePreview.map((s) => s.email).join(', ')}
          {stats.active > activePreview.length ? ` and ${stats.active - activePreview.length} more.` : '.'}
        </p>
      )}
    </div>
  )
}
