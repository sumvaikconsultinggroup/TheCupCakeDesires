'use client'

import { SignInButton, useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'framer-motion'
import { LogIn, PenLine, Send, Star, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Pick a rating').max(5),
  title: z.string().trim().min(3, 'Title is too short').max(120, 'Title is too long'),
  content: z.string().trim().min(10, 'Tell us a bit more').max(2000, 'Review is too long'),
})

interface Props {
  productHandle: string
  productTitle: string
}

export default function ReviewForm({ productHandle, productTitle }: Props) {
  const { isLoaded, isSignedIn, user } = useUser()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Lock body scroll + close on Esc while modal is open
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

  const resetForm = () => {
    setRating(0)
    setHoverRating(0)
    setTitle('')
    setContent('')
    setError(null)
    setFieldErrors({})
    setSubmitted(false)
  }

  const closeModal = () => {
    setOpen(false)
    // Defer reset so the closing animation doesn't snap content
    setTimeout(resetForm, 250)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const parsed = reviewSchema.safeParse({ rating, title, content })
    if (!parsed.success) {
      const fe: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string
        if (!fe[key]) fe[key] = issue.message
      }
      setFieldErrors(fe)
      setError('Please fix the highlighted fields.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productHandle, ...parsed.data }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.message || 'Could not post your review')
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Trigger row (no inline form anywhere) ───
  const trigger = (() => {
    if (!isLoaded) {
      return (
        <div className="h-12 w-44 animate-pulse rounded-full bg-cream-deep" />
      )
    }
    if (!isSignedIn) {
      return (
        <SignInButton
          mode="modal"
          forceRedirectUrl={`/products/${productHandle}#reviews`}
        >
          <button className="bake-btn">
            <LogIn className="mr-2 h-4 w-4" strokeWidth={1.8} />
            Sign in to review
          </button>
        </SignInButton>
      )
    }
    return (
      <button
        onClick={() => setOpen(true)}
        className="bake-btn"
        aria-haspopup="dialog"
      >
        <PenLine className="mr-2 h-4 w-4" strokeWidth={1.8} />
        Write a review
      </button>
    )
  })()

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    'You'

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        {trigger}
        <p className="bake-caption text-taupe">
          Reviews are moderated before they appear — we read every one.
        </p>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-cocoa/55 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Write a review"
              className="font-bake-body fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-line bg-ivory shadow-[0_40px_100px_-20px_rgba(46,31,21,0.35)]"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between gap-4 border-b border-line px-7 py-5">
                <div>
                  <p className="bake-eyebrow">
                    <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                    Write a review
                  </p>
                  <h3 className="font-bake-display mt-1 text-[20px] font-medium text-cocoa">
                    {productTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>

              {/* Body — submitted success or form */}
              <div className="max-h-[78vh] overflow-y-auto">
                {submitted ? (
                  <div className="p-8 text-center">
                    <p className="bake-eyebrow text-rose-accent">
                      <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                      In the kitchen
                    </p>
                    <h3 className="font-bake-display mt-3 text-[24px] font-medium text-cocoa">
                      Thank you — your note is on the bench.
                    </h3>
                    <p className="bake-body-sm mt-3 max-w-[44ch] mx-auto text-cocoa-soft">
                      A human will read your review within a working day and approve it. You&rsquo;ll
                      see it show up here once it&rsquo;s through.
                    </p>
                    <button
                      onClick={closeModal}
                      className="bake-btn bake-btn-ghost mt-7"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-7 md:p-8">
                    <p className="bake-body-sm text-cocoa-soft">
                      Writing as <span className="font-medium text-cocoa">{userName}</span>
                    </p>

                    {/* Rating */}
                    <div className="mt-5">
                      <label className="bake-caption text-cocoa-soft">
                        Your rating <span className="text-rose-accent">*</span>
                      </label>
                      <div
                        className="mt-2 inline-flex items-center gap-1"
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((n) => {
                          const shown = hoverRating || rating
                          const filled = n <= shown
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRating(n)}
                              onMouseEnter={() => setHoverRating(n)}
                              aria-label={`${n} star${n > 1 ? 's' : ''}`}
                              className="rounded-md p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={
                                  filled
                                    ? 'fill-rose-accent text-rose-accent'
                                    : 'fill-none text-line'
                                }
                                width={30}
                                height={30}
                                strokeWidth={1.6}
                              />
                            </button>
                          )
                        })}
                      </div>
                      {fieldErrors.rating && (
                        <p className="bake-caption mt-2 text-rose-accent">
                          {fieldErrors.rating}
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <div className="mt-6">
                      <label htmlFor="rv-title" className="bake-caption text-cocoa-soft">
                        Title <span className="text-rose-accent">*</span>
                      </label>
                      <input
                        id="rv-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Summarise it in a line"
                        maxLength={120}
                        className="bake-input mt-2"
                      />
                      {fieldErrors.title && (
                        <p className="bake-caption mt-2 text-rose-accent">{fieldErrors.title}</p>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mt-5">
                      <label htmlFor="rv-content" className="bake-caption text-cocoa-soft">
                        Your review <span className="text-rose-accent">*</span>
                      </label>
                      <textarea
                        id="rv-content"
                        rows={5}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Texture, sweetness, how it travelled — anything helpful for the next person."
                        maxLength={2000}
                        className="bake-input mt-2 resize-y"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        {fieldErrors.content ? (
                          <p className="bake-caption text-rose-accent">{fieldErrors.content}</p>
                        ) : (
                          <span />
                        )}
                        <p className="bake-caption text-taupe">{content.length} / 2000</p>
                      </div>
                    </div>

                    {error && (
                      <p className="bake-body-sm mt-5 rounded-md border border-rose-accent/30 bg-rose px-4 py-3 text-cocoa">
                        {error}
                      </p>
                    )}

                    <div className="mt-7 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="bake-btn bake-btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bake-btn disabled:opacity-60"
                      >
                        <Send className="mr-2 h-4 w-4" strokeWidth={1.8} />
                        {submitting ? 'Sending…' : 'Submit for review'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Inline input styles to match the rest of the bake-* system */}
      <style jsx>{`
        :global(.bake-input) {
          font-family: var(--font-bake-body);
          font-size: 15px;
          color: var(--color-cocoa);
          background-color: #fff;
          border: 1px solid var(--color-line);
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        :global(.bake-input::placeholder) {
          color: var(--color-taupe);
        }
        :global(.bake-input:focus) {
          outline: none;
          border-color: var(--color-rose-accent);
          box-shadow: 0 0 0 4px rgba(217, 113, 133, 0.12);
        }
      `}</style>
    </>
  )
}
