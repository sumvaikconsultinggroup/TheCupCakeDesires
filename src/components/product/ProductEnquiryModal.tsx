'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from 'react'

interface ProductEnquiryModalProps {
  open: boolean
  onClose: () => void
  productTitle: string
  productHandle: string
}

type FormState = {
  name: string
  email: string
  phone: string
  eventDate: string
  guestCount: string
  message: string
}

const INITIAL: FormState = {
  name: '',
  email: '',
  phone: '',
  eventDate: '',
  guestCount: '',
  message: '',
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-bake-body text-[15px] text-cocoa outline-none transition placeholder:text-taupe focus:border-rose-accent focus:shadow-[0_0_0_4px_rgba(217,113,133,0.12)]'

export default function ProductEnquiryModal({
  open,
  onClose,
  productTitle,
  productHandle,
}: ProductEnquiryModalProps) {
  const titleId = useId()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setIsSubmitted(false)
      setError('')
      setForm(INITIAL)
    }
  }, [open])

  const set =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const details = [
      `Product: ${productTitle}`,
      `Page: /products/${productHandle}`,
      form.eventDate ? `Event date: ${form.eventDate}` : null,
      form.guestCount ? `Approx. guests / cupcakes: ${form.guestCount}` : null,
      '',
      form.message.trim() || '(No additional notes)',
    ]
      .filter((line) => line !== null)
      .join('\n')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: `Wedding cupcake tier enquiry · ${productTitle}`,
          message: details,
        }),
      })

      if (!res.ok) {
        setError('Could not send your enquiry. Please try again or email info@thecupcakedesire.com.au.')
        return
      }

      setIsSubmitted(true)
      setForm(INITIAL)
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
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close enquiry form"
            className="absolute inset-0 bg-cocoa/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-h-[90vh] w-full max-w-[min(100%,28rem)] overflow-y-auto overscroll-contain rounded-3xl border border-line bg-ivory p-5 shadow-[0_30px_60px_-28px_rgba(46,31,21,0.45)] sm:max-h-none sm:max-w-xl sm:overflow-visible sm:p-6 md:max-w-2xl md:p-7 lg:max-w-3xl lg:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-cream text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>

            {isSubmitted ? (
              <div className="py-6 pr-8">
                <p className="bake-caption text-rose-accent">Enquiry sent</p>
                <h3
                  id={titleId}
                  className="font-bake-display mt-3 text-[28px] font-medium leading-tight text-cocoa"
                >
                  Thanks — we&rsquo;ll be in touch.
                </h3>
                <p className="bake-body mt-3 text-cocoa-soft">
                  Our wedding team usually replies within one working day with a tailored quote for
                  your cupcake tier.
                </p>
                <button type="button" onClick={onClose} className="bake-btn mt-8 w-full">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="pr-8 sm:pr-10">
                <p className="bake-caption text-rose-accent">Custom wedding tier</p>
                <h3
                  id={titleId}
                  className="font-bake-display mt-2 max-w-[22ch] text-[24px] font-medium leading-tight text-cocoa sm:text-[28px] md:text-[32px]"
                >
                  Tell us about your day.
                </h3>
                <p className="bake-body-sm mt-2 max-w-[52ch] text-cocoa-soft">
                  Enquiring about <span className="font-medium text-cocoa">{productTitle}</span>.
                  We&rsquo;ll reply with flavours, sizing and a quote.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3.5 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                  <label className="block sm:col-span-2">
                    <span className="bake-caption text-taupe">Name</span>
                    <input
                      required
                      name="name"
                      value={form.name}
                      onChange={set('name')}
                      className={fieldClass}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block">
                    <span className="bake-caption text-taupe">Email</span>
                    <input
                      required
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={set('email')}
                      className={fieldClass}
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block">
                    <span className="bake-caption text-taupe">Phone</span>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={set('phone')}
                      className={fieldClass}
                      placeholder="03 …"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block">
                    <span className="bake-caption text-taupe">Event date</span>
                    <input
                      type="date"
                      name="eventDate"
                      value={form.eventDate}
                      onChange={set('eventDate')}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="bake-caption text-taupe">Approx. guests / cupcakes</span>
                    <input
                      name="guestCount"
                      value={form.guestCount}
                      onChange={set('guestCount')}
                      className={fieldClass}
                      placeholder="e.g. 80 guests"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="bake-caption text-taupe">Details</span>
                    <textarea
                      required
                      name="message"
                      rows={3}
                      value={form.message}
                      onChange={set('message')}
                      className={`${fieldClass} min-h-[5.5rem] resize-y`}
                      placeholder="Colours, flavours, tier height, venue, anything custom…"
                    />
                  </label>
                </div>

                {error && (
                  <p className="bake-body-sm mt-4 text-rose-accent" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bake-btn mt-6 w-full disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                      Sending…
                    </span>
                  ) : (
                    'Send enquiry'
                  )}
                </button>
                <p className="bake-caption mt-3 text-center text-taupe">
                  Or email{' '}
                  <a
                    href="mailto:info@thecupcakedesire.com.au"
                    className="text-cocoa underline decoration-rose-accent underline-offset-4"
                  >
                    info@thecupcakedesire.com.au
                  </a>
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
