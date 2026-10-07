'use client'

import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type Filter = 'open' | 'closed' | 'all'

interface ChatSummary {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: 'open' | 'closed'
  unread: number
  whatsappDeliveryFailed: boolean
  lastMessage: { from: string; text: string; createdAt: string } | null
  updatedAt: string
}

interface ChatMessage {
  id: string
  from: 'customer' | 'team' | 'system'
  text: string
  via: 'web' | 'whatsapp' | 'admin_panel'
  authorName?: string
  createdAt: string
}

interface ChatDetail {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  company?: string
  pageUrl?: string
  status: 'open' | 'closed'
  whatsappDeliveryFailed: boolean
  lastCustomerSeenAt?: string
  createdAt: string
  messages: ChatMessage[]
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
]

function fmtWhen(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay
    ? d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) +
        ' ' +
        d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

function viaLabel(m: ChatMessage) {
  if (m.from === 'customer') return 'Website'
  if (m.via === 'whatsapp') return `WhatsApp${m.authorName ? ` · ${m.authorName}` : ''}`
  return m.authorName ? `Admin · ${m.authorName}` : 'Admin panel'
}

function LiveChatInbox() {
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<Filter>('open')
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [counts, setCounts] = useState({ open: 0, unread: 0 })
  const [whatsappConfigured, setWhatsappConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('c'))
  const [detail, setDetail] = useState<ChatDetail | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  const loadList = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/live-chat?status=${filter}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setChats(data.conversations)
        setCounts(data.counts)
        setWhatsappConfigured(data.whatsappConfigured)
      }
    } finally {
      setLoading(false)
    }
  }, [filter])

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/live-chat/${id}`, { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setDetail(data.conversation)
  }, [])

  useEffect(() => {
    loadList()
    const t = window.setInterval(() => !document.hidden && loadList(), 10000)
    return () => window.clearInterval(t)
  }, [loadList])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    loadDetail(selectedId)
    const t = window.setInterval(() => !document.hidden && loadDetail(selectedId), 5000)
    return () => window.clearInterval(t)
  }, [selectedId, loadDetail])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [detail?.messages.length])

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail || !reply.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/live-chat/${detail.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setDetail(data.conversation)
      setReply('')
      loadList()
    } catch (err: any) {
      toast.error(err?.message || 'Reply not sent')
    } finally {
      setSending(false)
    }
  }

  const setStatus = async (action: 'close' | 'reopen') => {
    if (!detail) return
    const res = await fetch(`/api/admin/live-chat/${detail.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (data.success) {
      setDetail(data.conversation)
      loadList()
      toast.success(action === 'close' ? 'Chat closed' : 'Chat reopened')
    } else {
      toast.error(data.message || 'Could not update chat')
    }
  }

  const customerOnline =
    detail?.lastCustomerSeenAt && Date.now() - new Date(detail.lastCustomerSeenAt).getTime() < 45000

  return (
    <div className="min-h-screen bg-ivory p-6 text-cocoa md:p-8">
      <Link href="/admin/customers" className="inline-flex items-center gap-2 text-[13px] text-taupe hover:text-cocoa">
        <ArrowLeft className="h-4 w-4" />
        Customers
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            Website chat
          </p>
          <h1 className="font-bake-display mt-2 text-[32px] font-medium leading-tight md:text-[40px]">Live chat</h1>
          <p className="bake-body mt-2 max-w-[62ch] text-cocoa-soft">
            Customers chat from the website; every message is forwarded to the team&rsquo;s WhatsApp. Reply on
            WhatsApp by swiping on the message, or reply here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bake-badge">{counts.open} open</span>
          {counts.unread > 0 && <span className="bake-badge bake-badge-rose">{counts.unread} unread</span>}
          <button type="button" onClick={() => loadList()} className="bake-btn bake-btn-sm">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {!whatsappConfigured && (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-gold/40 bg-cream px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-accent" />
          <p className="bake-body-sm text-cocoa-soft">
            WhatsApp isn&rsquo;t connected yet, so new chat messages are sent to the enquiries email instead. Add the
            WhatsApp environment variables to start receiving them on WhatsApp.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inbox */}
        <section className="overflow-hidden rounded-[14px] border border-line bg-white">
          <div className="flex gap-2 border-b border-line bg-cream/60 p-3">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === f.id
                    ? 'border-cocoa bg-cocoa text-ivory'
                    : 'border-line bg-cream text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-taupe" />
            </div>
          ) : chats.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <MessageCircle className="mx-auto h-9 w-9 text-taupe" />
              <p className="font-bake-display mt-3 text-[18px]">No chats here</p>
              <p className="bake-body-sm mt-1 text-cocoa-soft">New website chats will appear automatically.</p>
            </div>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              {chats.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full px-4 py-3.5 text-left transition-colors hover:bg-cream/60 ${
                      selectedId === c.id ? 'bg-cream' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-cocoa">
                        {c.name}
                        {c.company ? <span className="font-normal text-taupe"> · {c.company}</span> : null}
                      </p>
                      <span className="shrink-0 text-[12px] text-taupe">{fmtWhen(c.updatedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="line-clamp-1 flex-1 text-[13px] text-cocoa-soft">
                        {c.lastMessage?.from === 'team' ? 'You: ' : ''}
                        {c.lastMessage?.text}
                      </p>
                      {c.whatsappDeliveryFailed && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-accent" aria-label="WhatsApp alert failed" />
                      )}
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-accent px-1.5 text-[11px] font-semibold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-taupe">
                      #{c.code} · {c.status}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Conversation */}
        <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-[14px] border border-line bg-white">
          {!detail ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="h-10 w-10 text-taupe" />
              <p className="font-bake-display mt-3 text-[20px]">Select a chat</p>
              <p className="bake-body-sm mt-1 text-cocoa-soft">Pick a conversation from the list to read and reply.</p>
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-cream/60 px-6 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bake-display text-[22px] font-medium">{detail.name}</h2>
                    <span className="bake-badge">#{detail.code}</span>
                    {detail.status === 'closed' ? (
                      <span className="bake-badge">Closed</span>
                    ) : (
                      <span className="bake-badge bake-badge-mint">Open</span>
                    )}
                    {customerOnline && <span className="bake-badge bake-badge-mint">On the site now</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-cocoa-soft">
                    {detail.company && <span>{detail.company}</span>}
                    {detail.email && (
                      <a href={`mailto:${detail.email}`} className="inline-flex items-center gap-1.5 hover:text-rose-accent">
                        <Mail className="h-3.5 w-3.5" />
                        {detail.email}
                      </a>
                    )}
                    {detail.phone && (
                      <a href={`tel:${detail.phone}`} className="inline-flex items-center gap-1.5 hover:text-rose-accent">
                        <Phone className="h-3.5 w-3.5" />
                        {detail.phone}
                      </a>
                    )}
                    {detail.pageUrl && <span className="text-taupe">Started on {detail.pageUrl}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus(detail.status === 'closed' ? 'reopen' : 'close')}
                  className="bake-btn bake-btn-ghost bake-btn-sm"
                >
                  {detail.status === 'closed' ? 'Reopen chat' : 'Close chat'}
                </button>
              </header>

              <div className="max-h-[55vh] flex-1 space-y-4 overflow-y-auto px-6 py-6">
                {detail.messages.map((m) =>
                  m.from === 'system' ? (
                    <p key={m.id} className="text-center text-[12px] text-taupe">
                      {m.text} · {fmtWhen(m.createdAt)}
                    </p>
                  ) : (
                    <div key={m.id} className={`flex flex-col ${m.from === 'team' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                          m.from === 'team'
                            ? 'rounded-br-md bg-cocoa text-ivory'
                            : 'rounded-bl-md border border-line bg-cream text-cocoa'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="mt-1 text-[11px] text-taupe">
                        {viaLabel(m)} · {fmtWhen(m.createdAt)}
                      </span>
                    </div>
                  )
                )}
                <div ref={listEndRef} />
              </div>

              <form onSubmit={sendReply} className="border-t border-line bg-cream/60 px-4 py-3">
                <div className="flex items-end gap-2 rounded-2xl border border-line bg-ivory px-3 py-2 focus-within:border-rose-accent">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendReply(e as unknown as React.FormEvent)
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder={`Reply to ${detail.name.split(' ')[0]}…`}
                    className="max-h-40 flex-1 resize-none bg-transparent px-1 py-1.5 text-[14px] text-cocoa placeholder:text-taupe focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    aria-label="Send reply"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory transition-colors hover:bg-rose-accent disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 px-1 text-[12px] text-taupe">
                  {customerOnline
                    ? 'The customer is on the site and will see this instantly.'
                    : detail.email
                      ? 'The customer has left the page — they’ll also get this reply by email.'
                      : 'The customer has left the page and gave no email; they’ll see this next time they open the chat.'}
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default function LiveChatAdminPage() {
  return (
    <Suspense fallback={null}>
      <LiveChatInbox />
    </Suspense>
  )
}
