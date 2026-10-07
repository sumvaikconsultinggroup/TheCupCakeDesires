'use client'

import { ArrowUp, Loader2, MessageCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { readSavedDetails, type LiveChatController, type LiveChatStartInput } from './useLiveChat'

const EMPTY_FORM: LiveChatStartInput = { name: '', email: '', phone: '', company: '', message: '' }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

export default function LiveChatPanel({ chat }: { chat: LiveChatController }) {
  if (chat.hasSession && !chat.conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-ivory">
        <Loader2 className="h-5 w-5 animate-spin text-taupe" strokeWidth={1.8} />
      </div>
    )
  }
  return chat.conversation ? <ConversationView chat={chat} /> : <StartForm chat={chat} />
}

/* ─── Before the chat starts: who are you + first message ─── */

function StartForm({ chat }: { chat: LiveChatController }) {
  const [form, setForm] = useState<LiveChatStartInput>(EMPTY_FORM)

  useEffect(() => {
    setForm((f) => ({ ...f, ...readSavedDetails(), message: f.message }))
  }, [])

  const set = (key: keyof LiveChatStartInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const canSubmit = form.name.trim() && (form.email.trim() || form.phone.trim()) && form.message.trim()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit && !chat.starting) chat.start(form)
  }

  const inputClass =
    'font-bake-body w-full rounded-xl border border-line bg-ivory px-3.5 py-2.5 text-[14px] text-cocoa placeholder:text-taupe transition-colors focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

  return (
    <form onSubmit={submit} className="hidden-scrollbar flex-1 overflow-y-auto bg-ivory px-5 py-6">
      <p className="bake-eyebrow text-taupe">
        <span className="mr-2 inline-block h-px w-6 bg-rose-accent align-middle" />
        Real people
      </p>
      <h2 className="font-bake-display mt-2 text-[22px] font-medium leading-tight text-cocoa">
        Chat with{' '}
        <span className="bake-display-italic text-rose-accent">our team.</span>
      </h2>
      <p className="bake-body-sm mt-3 text-cocoa-soft">
        Ask about custom or corporate orders, delivery, or anything else. No app needed — we reply
        right here, and by email if you&rsquo;ve left the page.
      </p>

      <div className="mt-6 space-y-3">
        <input className={inputClass} placeholder="Your name *" value={form.name} onChange={set('name')} autoComplete="name" required maxLength={120} />
        <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={200} />
        <input className={inputClass} type="tel" placeholder="Phone" value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={40} />
        <input className={inputClass} placeholder="Company (for corporate orders)" value={form.company} onChange={set('company')} autoComplete="organization" maxLength={160} />
        <textarea
          className={`${inputClass} min-h-[96px] resize-none`}
          placeholder="How can we help? *"
          value={form.message}
          onChange={set('message')}
          required
          maxLength={2000}
        />
        <p className="bake-caption text-taupe">Email or phone is needed so we can reach you.</p>
      </div>

      {chat.error && (
        <p className="font-bake-body mt-4 rounded-2xl border border-rose-accent/30 bg-rose/30 px-4 py-3 text-[13px] text-cocoa">
          {chat.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || chat.starting}
        className="font-bake-body mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-cocoa px-5 py-3 text-[14px] font-medium text-ivory transition-colors hover:bg-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {chat.starting ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        ) : (
          <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
        )}
        Start chat
      </button>
    </form>
  )
}

/* ─── Active conversation ─── */

function ConversationView({ chat }: { chat: LiveChatController }) {
  const conversation = chat.conversation!
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const awaitingTeam = !conversation.messages.some((m) => m.from === 'team')

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversation.messages.length])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 250)
  }, [])

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input
    if (!text.trim() || chat.sending) return
    setInput('')
    const ok = await chat.send(text)
    if (!ok) setInput(text)
  }

  return (
    <>
      <div ref={listRef} className="hidden-scrollbar flex-1 overflow-y-auto bg-ivory px-5 py-6">
        <ul className="space-y-4">
          {conversation.messages.map((m) => (
            <li key={m.id}>
              {m.from === 'customer' ? (
                <div className="flex flex-col items-end">
                  <div
                    className={`font-bake-body max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-cocoa px-4 py-2.5 text-[14px] leading-relaxed text-ivory ${
                      m.pending ? 'opacity-60' : ''
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="bake-caption mt-1 text-taupe">
                    {m.pending ? 'Sending…' : formatTime(m.createdAt)}
                  </span>
                </div>
              ) : m.from === 'team' ? (
                <div className="flex gap-3">
                  <span className="font-bake-display mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-accent text-[11px] font-semibold text-white">
                    TCD
                  </span>
                  <div>
                    <div className="font-bake-body max-w-[95%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-line bg-cream px-4 py-2.5 text-[14px] leading-relaxed text-cocoa">
                      {m.text}
                    </div>
                    <span className="bake-caption mt-1 block text-taupe">
                      The Cupcake Desire · {formatTime(m.createdAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="bake-caption mx-auto max-w-[85%] text-center text-taupe">{m.text}</p>
              )}
            </li>
          ))}
        </ul>

        {awaitingTeam && (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-cream/60 px-4 py-3">
            <p className="bake-caption text-rose-accent">Message sent to our team</p>
            <p className="bake-body-sm mt-1 text-cocoa-soft">
              We usually reply within a few minutes during opening hours. You can close this window —
              your chat is saved, and we&rsquo;ll email you if you&rsquo;re away.
            </p>
          </div>
        )}

        {chat.error && (
          <p className="font-bake-body mt-4 rounded-2xl border border-rose-accent/30 bg-rose/30 px-4 py-3 text-[13px] text-cocoa">
            {chat.error}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-line bg-cream/60 px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-ivory px-3 py-2 transition-colors focus-within:border-rose-accent focus-within:ring-4 focus-within:ring-rose-accent/15">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={conversation.status === 'closed' ? 'Send a message to reopen the chat…' : 'Type your message…'}
            rows={1}
            maxLength={2000}
            className="font-bake-body max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-[14px] leading-snug text-cocoa placeholder:text-taupe focus:outline-none"
          />
          <button
            type="submit"
            disabled={chat.sending || !input.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory transition-all hover:bg-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {chat.sending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
        <p className="bake-caption mt-2 px-1 text-taupe">
          Chat #{conversation.code} ·{' '}
          <button type="button" onClick={chat.startOver} className="underline underline-offset-2 hover:text-cocoa">
            start a new chat
          </button>
        </p>
      </form>
    </>
  )
}
