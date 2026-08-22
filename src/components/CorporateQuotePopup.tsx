'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
}

export default function CorporateQuotePopup({ open, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    quantity: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  /* Close on ESC */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: '',
          message:
            form.message.trim() ||
            `Corporate quote request${form.company ? ` for ${form.company}` : ''}${
              form.quantity ? ` · approx ${form.quantity} cupcakes` : ''
            }.`,
          subject: `Corporate enquiry (popup) · ${form.quantity || 'qty?'} cupcakes for ${form.company || 'company?'}`,
        }),
      })
      if (res.ok) {
        setIsSubmitted(true)
        setForm({ name: '', company: '', email: '', quantity: '', message: '' })
      } else {
        setError('Failed to send. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quote-popup-title"
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute inset-0 cursor-default bg-cocoa/65 backdrop-blur-sm"
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="font-bake-body relative z-10 w-full max-w-[600px] overflow-hidden rounded-3xl border border-line bg-ivory shadow-[0_40px_80px_-30px_rgba(46,31,21,0.45)]"
          >
            {/* Top accent strip */}
            <div className="h-1.5 w-full bg-linear-to-r from-rose-accent via-rose-deep to-rose-accent" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close popup"
              className="absolute right-5 top-7 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6 L 18 18 M 18 6 L 6 18" />
              </svg>
            </button>

            <div className="px-8 py-10 md:px-10 md:py-12">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Success state */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-accent text-rose-accent">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13 L 9 17 L 19 7" />
                    </svg>
                  </div>
                  <h3
                    id="quote-popup-title"
                    className="font-bake-display mt-6 text-center text-[28px] font-medium leading-tight text-cocoa md:text-[32px]"
                  >
                    Your brief is on its way.
                  </h3>
                  <p className="bake-body mt-4 text-center text-cocoa-soft">
                    Our corporate team will reply within{' '}
                    <span className="font-medium text-cocoa">24 hours</span> with a tailored quote
                    and mock-ups if you asked for custom branding.
                  </p>
                  <button
                    onClick={onClose}
                    className="bake-btn mt-8 mx-auto block"
                  >
                    Close
                  </button>
                </motion.div>
              ) : (
                <>
                  <p className="bake-eyebrow">
                    <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                    Quick quote · 30 seconds
                  </p>
                  <h3
                    id="quote-popup-title"
                    className="bake-display-md mt-4 max-w-[22ch]"
                  >
                    Let&rsquo;s plan your{' '}
                    <span className="bake-display-italic text-rose-accent">corporate order.</span>
                  </h3>
                  <p className="bake-body mt-4 max-w-[48ch] text-cocoa-soft">
                    Tell us the basics — we&rsquo;ll come back with pricing and a mock-up within
                    24 hours. Price-match guarantee &amp; 5% better than any competing quote.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Name" required>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="popup-input"
                        />
                      </Field>
                      <Field label="Company" required>
                        <input
                          type="text"
                          required
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          className="popup-input"
                        />
                      </Field>
                      <Field label="Work email" required>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="popup-input"
                        />
                      </Field>
                      <Field label="Cupcake quantity" required>
                        <input
                          type="number"
                          min={50}
                          required
                          placeholder="e.g. 250"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                          className="popup-input"
                        />
                      </Field>
                    </div>
                    <Field label="What's the occasion? (optional)">
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="popup-input resize-y"
                        placeholder="Product launch, client gifting, team event…"
                      />
                    </Field>

                    {error && (
                      <p className="rounded-md border border-rose-accent/40 bg-rose px-4 py-3 text-[14px] text-cocoa">
                        {error}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bake-btn bake-btn-rose disabled:opacity-60"
                      >
                        {isSubmitting ? 'Sending…' : 'Send quote request'}{' '}
                        <span aria-hidden>→</span>
                      </button>
                      <p className="bake-caption text-taupe">
                        24h reply · NDA-friendly
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>

            <style jsx>{`
              :global(.popup-input) {
                font-family: var(--font-bake-body);
                font-size: 15px;
                color: var(--color-cocoa);
                background-color: #fff;
                border: 1px solid var(--color-line);
                border-radius: 12px;
                padding: 12px 14px;
                width: 100%;
                transition:
                  border-color 200ms ease,
                  box-shadow 200ms ease;
              }
              :global(.popup-input::placeholder) {
                color: var(--color-taupe);
              }
              :global(.popup-input:focus) {
                outline: none;
                border-color: var(--color-rose-accent);
                box-shadow: 0 0 0 4px rgba(217, 113, 133, 0.12);
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="bake-caption text-cocoa-soft">
        {label}
        {required && <span className="ml-1 text-rose-accent">*</span>}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  )
}
