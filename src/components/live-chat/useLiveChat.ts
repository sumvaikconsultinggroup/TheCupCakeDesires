'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface LiveChatMessage {
  id: string
  from: 'customer' | 'team' | 'system'
  text: string
  createdAt: string
  pending?: boolean
}

export interface LiveChatConversation {
  id: string
  code: string
  name: string
  status: 'open' | 'closed'
  messages: LiveChatMessage[]
}

export interface LiveChatStartInput {
  name: string
  email: string
  phone: string
  company: string
  message: string
}

interface StoredSession {
  id: string
  token: string
}

/** Dispatch on window to open the chat bubble straight into "talk to our team" mode. */
export const OPEN_LIVE_CHAT_EVENT = 'tcd:open-live-chat'

export function openLiveChat() {
  window.dispatchEvent(new Event(OPEN_LIVE_CHAT_EVENT))
}

const SESSION_KEY = 'tcd-live-chat-session'
const DETAILS_KEY = 'tcd-live-chat-details'
const ACTIVE_POLL_MS = 4000
const BACKGROUND_POLL_MS = 25000

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.id && parsed?.token ? parsed : null
  } catch {
    return null
  }
}

export function readSavedDetails(): Partial<LiveChatStartInput> {
  try {
    return JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}')
  } catch {
    return {}
  }
}

function mergeMessages(existing: LiveChatMessage[], incoming: LiveChatMessage[]): LiveChatMessage[] {
  const confirmed = existing.filter((m) => !m.pending)
  const ids = new Set(confirmed.map((m) => m.id))
  const merged = [...confirmed, ...incoming.filter((m) => !ids.has(m.id))]
  const pending = existing.filter((m) => m.pending)
  return [...merged, ...pending]
}

/**
 * Website ↔ team live chat session. The chat survives page loads via a
 * per-browser token in localStorage; the team answers from WhatsApp.
 */
export function useLiveChat({ active }: { active: boolean }) {
  const [session, setSession] = useState<StoredSession | null>(null)
  const [conversation, setConversation] = useState<LiveChatConversation | null>(null)
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)
  const activeRef = useRef(active)
  const conversationRef = useRef<LiveChatConversation | null>(null)

  activeRef.current = active
  conversationRef.current = conversation

  useEffect(() => {
    setSession(readSession())
  }, [])

  useEffect(() => {
    if (active) setHasUnread(false)
  }, [active])

  const clear = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setConversation(null)
    setHasUnread(false)
    setError(null)
  }, [])

  const poll = useCallback(async () => {
    if (!session) return
    const current = conversationRef.current
    const last = current?.messages.filter((m) => !m.pending).slice(-1)[0]
    const query = current && last ? `?after=${encodeURIComponent(last.createdAt)}` : ''
    try {
      const res = await fetch(`/api/live-chat/${session.id}${query}`, {
        headers: { 'x-chat-token': session.token },
        cache: 'no-store',
      })
      if (res.status === 404) {
        clear()
        return
      }
      const data = await res.json()
      if (!data?.success) return
      const fresh: LiveChatConversation = data.conversation
      const incomingTeam = current ? fresh.messages.some((m) => m.from === 'team') : false
      setConversation((prev) =>
        prev ? { ...fresh, messages: mergeMessages(prev.messages, fresh.messages) } : fresh
      )
      if (incomingTeam && !activeRef.current) setHasUnread(true)
    } catch {
      // Network blips are retried on the next tick.
    }
  }, [session, clear])

  useEffect(() => {
    if (!session) return
    poll()
    const interval = window.setInterval(
      () => {
        if (!document.hidden) poll()
      },
      active ? ACTIVE_POLL_MS : BACKGROUND_POLL_MS
    )
    return () => window.clearInterval(interval)
  }, [session, active, poll])

  const start = useCallback(async (input: LiveChatStartInput) => {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, pageUrl: window.location.pathname }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Could not start the chat.')
      const next = { id: data.conversation.id, token: data.token }
      localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      localStorage.setItem(
        DETAILS_KEY,
        JSON.stringify({ name: input.name, email: input.email, phone: input.phone, company: input.company })
      )
      setConversation(data.conversation)
      setSession(next)
      return true
    } catch (e: any) {
      setError(e?.message || 'Could not start the chat.')
      return false
    } finally {
      setStarting(false)
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !session) return false
      const tempId = `pending-${Date.now()}`
      setError(null)
      setSending(true)
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              status: 'open',
              messages: [
                ...prev.messages,
                { id: tempId, from: 'customer', text: trimmed, createdAt: new Date().toISOString(), pending: true },
              ],
            }
          : prev
      )
      try {
        const res = await fetch(`/api/live-chat/${session.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-chat-token': session.token },
          body: JSON.stringify({ text: trimmed }),
        })
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Message not sent.')
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                messages: mergeMessages(
                  prev.messages.filter((m) => m.id !== tempId),
                  [data.message]
                ),
              }
            : prev
        )
        return true
      } catch (e: any) {
        setConversation((prev) =>
          prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev
        )
        setError(e?.message || 'Message not sent.')
        return false
      } finally {
        setSending(false)
      }
    },
    [session]
  )

  return {
    hasSession: Boolean(session),
    conversation,
    starting,
    sending,
    error,
    hasUnread,
    start,
    send,
    startOver: clear,
  }
}

export type LiveChatController = ReturnType<typeof useLiveChat>
