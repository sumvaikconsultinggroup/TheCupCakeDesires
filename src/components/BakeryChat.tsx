'use client'

import { useAside } from '@/components/aside/aside'
import LiveChatPanel from '@/components/live-chat/LiveChatPanel'
import { OPEN_LIVE_CHAT_EVENT, useLiveChat } from '@/components/live-chat/useLiveChat'
import { useCart } from '@/components/useCartStore'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  Headphones,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  SquarePen,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface AssistantProduct {
  id: string
  handle: string
  title: string
  price: number
  compareAtPrice?: number
  image?: string
  category?: string
  shortDescription?: string
  inStock: boolean
  isVegan?: boolean
  isEggless?: boolean
  isGlutenFree?: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: AssistantProduct[]
}

const SUGGESTIONS = [
  { label: 'Browse cakes', prompt: 'Show me the cakes you have right now.' },
  { label: 'Explore cupcakes', prompt: 'What cupcakes do you make?' },
  { label: 'See gift boxes', prompt: 'I want to send a gift box. What do you have?' },
  { label: 'Vegan options', prompt: 'What vegan options are on the menu?' },
]

function nanoid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function BakeryChat() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'ai' | 'team'>('ai')
  const liveChat = useLiveChat({ active: open && mode === 'team' })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addItem, items } = useCart()
  const { open: openAside } = useAside()
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  // Some pages own their own bottom-centre sticky CTA (e.g. /corporate has the
  // "Get a quote in 24h" pill). On those routes we shift the AI trigger to the
  // bottom-right so both pills can coexist without overlapping.
  const pathname = usePathname()
  const triggerAtRight = pathname?.startsWith('/corporate') ?? false

  // Contact page buttons and reply emails (?livechat=1) open the team chat directly.
  useEffect(() => {
    const openTeamChat = () => {
      setMode('team')
      setOpen(true)
    }
    window.addEventListener(OPEN_LIVE_CHAT_EVENT, openTeamChat)
    if (new URLSearchParams(window.location.search).get('livechat') === '1') openTeamChat()
    return () => window.removeEventListener(OPEN_LIVE_CHAT_EVENT, openTeamChat)
  }, [])

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Autoscroll to latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, busy])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 250)
    }
  }, [open])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    setError(null)
    const userMsg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: trimmed,
    }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'The assistant is having a moment.')
      }
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: data.message,
          products: data.products,
        },
      ])
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const requestNewChat = () => {
    if (messages.length === 0) return
    setConfirmReset(true)
  }

  const confirmNewChat = () => {
    setMessages([])
    setInput('')
    setError(null)
    setConfirmReset(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleAddToCart = (p: AssistantProduct) => {
    // We don't have full variant info here — push a minimal cart item.
    addItem({
      productId: p.id,
      name: p.title,
      price: p.price,
      imageUrl: p.image,
      handle: p.handle,
      // Drives the delivery lead-time tier at checkout (cakes need more notice).
      category: p.category,
      variant: {
        id: p.id,
        name: 'Default',
        price: p.price,
      } as any,
      quantity: 1,
    } as any)
  }

  return (
    <>
      {/* ─── Floating trigger — centered horizontally with a hover-only running gradient ring ─── */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="chat-trigger"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed z-40 ${
              triggerAtRight
                ? // On /corporate: sit just LEFT of the page midline so the
                  // "Get a quote in 24h" CTA can sit just RIGHT of it.
                  'bottom-6 right-[calc(50%+0.375rem)] md:bottom-10'
                : 'bottom-5 left-1/2 -translate-x-1/2 md:bottom-6'
            }`}
          >
            <button
              onClick={() => {
                if (liveChat.hasUnread) setMode('team')
                setOpen(true)
              }}
              aria-label={liveChat.hasUnread ? 'Open new reply from our team' : 'Open Shop with AI'}
              className="shop-ai-trigger font-bake-body group relative flex items-center gap-2.5 rounded-full bg-cocoa py-2 pl-2.5 pr-5 text-ivory shadow-[0_22px_50px_-18px_rgba(46,31,21,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-18px_rgba(217,113,133,0.55)]"
            >
              {/* Animated conic gradient ring — fades in on hover */}
              <span
                aria-hidden
                className="shop-ai-ring pointer-events-none absolute -inset-[2px] rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
              {/* Inner cocoa fill so the ring shows as a border only */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-cocoa"
              />

              {/* Button content sits above the layers */}
              <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ivory text-cocoa">
                {liveChat.hasUnread ? (
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Sparkles
                    className="shop-ai-icon h-4 w-4 transition-transform"
                    strokeWidth={1.8}
                  />
                )}
                {liveChat.hasUnread && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-cocoa bg-rose-accent"
                  />
                )}
              </span>
              <span className="relative z-10 text-[14px] font-medium tracking-[0.02em]">
                {liveChat.hasUnread ? 'New reply from our team' : 'Shop with AI'}
              </span>
            </button>

            {/* Conic gradient + spin keyframe.
                @property lets us animate the gradient's angle (the only way to
                visibly rotate a gradient on a perfect circle without rotating
                the whole element and warping its content). Falls back gracefully
                in browsers that don't support it (no animation, ring still
                shows). */}
            <style jsx global>{`
              @property --shop-ai-angle {
                syntax: '<angle>';
                initial-value: 0deg;
                inherits: false;
              }
              @keyframes shop-ai-spin {
                to {
                  --shop-ai-angle: 360deg;
                }
              }
              .shop-ai-ring {
                background: conic-gradient(
                  from var(--shop-ai-angle, 0deg),
                  var(--color-rose-accent) 0deg,
                  var(--color-rose-deep) 90deg,
                  var(--color-cream) 180deg,
                  var(--color-rose-accent) 270deg,
                  var(--color-rose-accent) 360deg
                );
                animation: shop-ai-spin 2.4s linear infinite;
              }
              @keyframes shop-ai-icon-spin {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }
              .shop-ai-trigger:hover .shop-ai-icon {
                animation: shop-ai-icon-spin 2.4s linear infinite;
              }
              @media (prefers-reduced-motion: reduce) {
                .shop-ai-ring,
                .shop-ai-trigger:hover .shop-ai-icon {
                  animation: none;
                }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Chat panel ─── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-cocoa/40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              key="chat-panel"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={mode === 'team' ? 'Chat with The Cupcake Desire team' : 'The Cupcake Desire shopping assistant'}
              className="font-bake-body fixed inset-x-3 bottom-3 top-16 z-60 mx-auto flex max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[440px] flex-col overflow-hidden rounded-3xl border border-line bg-ivory shadow-[0_40px_100px_-20px_rgba(46,31,21,0.45)] md:bottom-6 md:left-auto md:right-6 md:top-auto md:mx-0 md:h-[640px] md:max-h-[calc(100vh-3rem)] md:translate-x-0"
            >
              {/* Header */}
              <header className="flex items-center justify-between gap-3 border-b border-line bg-cream px-5 py-4">
                <div className="flex items-center gap-3">
                  {mode === 'team' && (
                    <button
                      onClick={() => setMode('ai')}
                      aria-label="Back to the AI assistant"
                      title="Back to AI assistant"
                      className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-cocoa"
                    >
                      <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  )}
                  <span
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ivory ${
                      mode === 'team' ? 'bg-rose-accent' : 'bg-cocoa'
                    }`}
                  >
                    {mode === 'team' ? (
                      <Headphones className="h-4 w-4" strokeWidth={1.8} />
                    ) : (
                      <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                    )}
                    <span
                      aria-hidden
                      className={`absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-cream ${
                        mode === 'team' ? 'bg-emerald-500' : 'bg-rose-accent'
                      }`}
                    />
                  </span>
                  <div>
                    <p className="font-bake-display text-[15px] font-medium leading-tight text-cocoa">
                      {mode === 'team' ? 'The Cupcake Desire team' : 'The Cupcake Desire AI'}
                    </p>
                    <p className="bake-caption text-taupe">
                      {mode === 'team' ? 'Real people, quick replies' : 'Friendly shopping concierge'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {mode === 'ai' && (
                    <>
                      <button
                        onClick={() => setMode('team')}
                        aria-label="Talk to our team"
                        title="Talk to our team"
                        className="relative flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-rose-accent"
                      >
                        <Headphones className="h-4 w-4" strokeWidth={1.8} />
                        {liveChat.hasUnread && (
                          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-accent ring-2 ring-cream" />
                        )}
                      </button>
                      <button
                        onClick={requestNewChat}
                        aria-label="Start a new chat"
                        title="New chat"
                        disabled={messages.length === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-cocoa-soft"
                      >
                        <SquarePen className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openAside('cart')}
                    aria-label="Open cart"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-cocoa"
                  >
                    <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                    {cartCount > 0 && (
                      <span className="font-bake-body absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-accent px-1 text-[10px] font-semibold text-white ring-2 ring-cream">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-soft transition-colors hover:bg-cream-deep hover:text-cocoa"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </header>

              {/* New-chat confirmation overlay */}
              <AnimatePresence>
                {confirmReset && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-cocoa/30 backdrop-blur-sm"
                    onClick={() => setConfirmReset(false)}
                  >
                    <motion.div
                      initial={{ y: 12, scale: 0.97, opacity: 0 }}
                      animate={{ y: 0, scale: 1, opacity: 1 }}
                      exit={{ y: 8, scale: 0.98, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      onClick={(e) => e.stopPropagation()}
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="reset-chat-title"
                      className="font-bake-body mx-5 w-full max-w-[320px] rounded-3xl border border-line bg-ivory p-6 shadow-[0_30px_60px_-20px_rgba(46,31,21,0.45)]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-rose-accent">
                        <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <h3
                        id="reset-chat-title"
                        className="font-bake-display mt-4 text-[18px] font-medium leading-snug text-cocoa"
                      >
                        Start a new chat?
                      </h3>
                      <p className="bake-body-sm mt-2 text-cocoa-soft">
                        This will clear the current conversation. You can&rsquo;t undo this
                        action.
                      </p>
                      <div className="mt-6 flex gap-2">
                        <button
                          onClick={() => setConfirmReset(false)}
                          className="font-bake-body flex-1 rounded-full border border-line bg-ivory px-4 py-2.5 text-[13px] font-medium text-cocoa-soft transition-colors hover:text-cocoa"
                        >
                          Keep chatting
                        </button>
                        <button
                          onClick={confirmNewChat}
                          className="font-bake-body flex-1 rounded-full bg-cocoa px-4 py-2.5 text-[13px] font-medium text-ivory transition-colors hover:bg-rose-accent"
                        >
                          Start fresh
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'team' ? (
                <LiveChatPanel chat={liveChat} />
              ) : (
              <>
              {/* Body */}
              <div
                ref={listRef}
                className="hidden-scrollbar flex-1 overflow-y-auto bg-ivory px-5 py-6"
              >
                {messages.length === 0 ? (
                  <WelcomeState onPick={(p) => sendMessage(p)} onTalkToTeam={() => setMode('team')} />
                ) : (
                  <ul className="space-y-5">
                    {messages.map((m) => (
                      <li key={m.id}>
                        {m.role === 'user' ? (
                          <UserBubble content={m.content} />
                        ) : (
                          <AssistantBubble
                            content={m.content}
                            products={m.products}
                            onAdd={handleAddToCart}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {busy && <ThinkingDots />}
                {error && (
                  <p className="font-bake-body mt-4 rounded-2xl border border-rose-accent/30 bg-rose/30 px-4 py-3 text-[13px] text-cocoa">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer / input */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-line bg-cream/60 px-4 py-3"
              >
                <div className="flex items-end gap-2 rounded-2xl border border-line bg-ivory px-3 py-2 transition-colors focus-within:border-rose-accent focus-within:ring-4 focus-within:ring-rose-accent/15">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage(input)
                      }
                    }}
                    placeholder="Ask me anything about the bakery…"
                    rows={1}
                    className="font-bake-body max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-[14px] leading-snug text-cocoa placeholder:text-taupe focus:outline-none"
                    disabled={busy}
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    aria-label="Send"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory transition-all hover:bg-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                    ) : (
                      <ArrowUp className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
                <p className="bake-caption mt-2 px-1 text-taupe">
                  AI replies use real product data.{' '}
                  <button
                    type="button"
                    onClick={() => setMode('team')}
                    className="underline underline-offset-2 hover:text-cocoa"
                  >
                    Talk to a person
                  </button>
                </p>
              </form>
              </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Sub-components ─── */

function WelcomeState({
  onPick,
  onTalkToTeam,
}: {
  onPick: (prompt: string) => void
  onTalkToTeam: () => void
}) {
  return (
    <div>
      <p className="bake-eyebrow text-taupe">
        <span className="inline-block h-px w-6 align-middle bg-rose-accent mr-2" />
        Welcome
      </p>
      <h2 className="font-bake-display mt-2 text-[22px] font-medium leading-tight text-cocoa">
        Hi — how can I help you{' '}
        <span className="bake-display-italic text-rose-accent">today?</span>
      </h2>
      <p className="bake-body-sm mt-3 text-cocoa-soft">
        Ask about a flavour, an occasion, or what we&rsquo;ve baked today. I&rsquo;ll pull real
        products from the menu.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.prompt)}
            className="font-bake-body rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa-soft transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onTalkToTeam}
        className="group mt-8 flex w-full items-center gap-3 rounded-2xl border border-line bg-cream px-4 py-3.5 text-left transition-all hover:border-rose-accent hover:shadow-[0_18px_36px_-22px_rgba(46,31,21,0.35)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-accent text-white">
          <Headphones className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-bake-display block text-[15px] font-medium text-cocoa">
            Prefer a real person?
          </span>
          <span className="bake-body-sm block text-cocoa-soft">
            Chat with our team — great for corporate &amp; custom orders.
          </span>
        </span>
        <ChevronRight className="h-4 w-4 text-cocoa-soft transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} />
      </button>

      <div className="mt-4 rounded-2xl border border-dashed border-line bg-cream/60 px-4 py-3">
        <p className="bake-caption text-rose-accent">A small thing to know</p>
        <p className="bake-body-sm mt-1 text-cocoa-soft">
          Every order is baked fresh. Order by noon for next-day delivery after 2pm (Melbourne
          Metro, weekdays) — wedding and corporate boxes usually need a week.
        </p>
      </div>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="font-bake-body max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-cocoa px-4 py-2.5 text-[14px] leading-relaxed text-ivory">
        {content}
      </div>
    </div>
  )
}

function AssistantBubble({
  content,
  products,
  onAdd,
}: {
  content: string
  products?: AssistantProduct[]
  onAdd: (p: AssistantProduct) => void
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <div className="flex-1 space-y-3">
        {content && (
          <div className="font-bake-body max-w-[95%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-line bg-cream px-4 py-2.5 text-[14px] leading-relaxed text-cocoa">
            {content}
          </div>
        )}
        {products && products.length > 0 && (
          <div className="space-y-2.5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => onAdd(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onAdd,
}: {
  product: AssistantProduct
  onAdd: () => void
}) {
  const dietBadge = product.isVegan
    ? 'Vegan'
    : product.isGlutenFree
      ? 'Gluten-free'
      : product.isEggless
        ? 'Eggless'
        : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex gap-3 rounded-2xl border border-line bg-ivory p-2.5 transition-all hover:border-rose-accent/60 hover:shadow-[0_18px_36px_-22px_rgba(46,31,21,0.35)]"
    >
      <Link
        href={`/products/${product.handle}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep"
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cocoa-soft">
            <Sparkles className="h-4 w-4" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {product.category && (
              <p className="bake-caption truncate text-taupe">{product.category}</p>
            )}
            <Link
              href={`/products/${product.handle}`}
              className="font-bake-display block text-[14px] font-medium leading-tight text-cocoa transition-colors hover:text-rose-accent"
            >
              {product.title}
            </Link>
          </div>
          {dietBadge && (
            <span className="font-bake-body shrink-0 rounded-full border border-line bg-cream px-2 py-0.5 text-[10px] font-medium tracking-[0.04em] text-cocoa-soft">
              {dietBadge}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bake-display text-[15px] font-semibold text-cocoa">
              ${product.price.toLocaleString()}
            </span>
            {typeof product.compareAtPrice === 'number' &&
              product.compareAtPrice > product.price && (
              <span className="bake-caption text-taupe line-through">
                ${product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>
          {product.inStock ? (
            <button
              onClick={onAdd}
              className="font-bake-body inline-flex items-center gap-1.5 rounded-full bg-cocoa px-3 py-1.5 text-[11px] font-medium text-ivory transition-colors hover:bg-rose-accent"
            >
              <ShoppingBag className="h-3 w-3" strokeWidth={1.8} />
              Add
            </button>
          ) : (
            <span className="font-bake-body rounded-full border border-line bg-ivory px-2.5 py-1 text-[11px] font-medium text-taupe">
              Sold out
            </span>
          )}
        </div>
      </div>
      <Link
        href={`/products/${product.handle}`}
        aria-label="View product"
        className="flex items-center text-cocoa-soft transition-colors hover:text-rose-accent"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </Link>
    </motion.div>
  )
}

function ThinkingDots() {
  return (
    <div className="mt-4 flex items-center gap-2 px-1">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      <div className="flex gap-1 rounded-full border border-line bg-cream px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0.3, y: 0 }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            className="h-1.5 w-1.5 rounded-full bg-cocoa-soft"
          />
        ))}
      </div>
    </div>
  )
}
