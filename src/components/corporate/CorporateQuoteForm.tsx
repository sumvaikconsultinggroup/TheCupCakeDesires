'use client'

/**
 * Shared /corporate quote form (same fields and /api/contact endpoint).
 * Used on /corporate and /corporate/christmas without new APIs or actions.
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

type Props = {
  /** Prefix for the contact subject line. */
  subjectLabel?: string
}

export default function CorporateQuoteForm({ subjectLabel = 'Corporate enquiry' }: Props) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    date: '',
    quantity: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

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
          subject: `${subjectLabel} · ${form.quantity || 'qty?'} cupcakes for ${form.company || 'company?'}`,
        }),
      })
      if (res.ok) {
        setIsSubmitted(true)
        setForm({ name: '', company: '', email: '', phone: '', date: '', quantity: '', message: '' })
      } else {
        setError('Failed to send. Please try again or email info@thecupcakedesire.com.au.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-line bg-cream p-10"
      >
        <span className="bake-caption text-rose-accent">Quote request received</span>
        <h3 className="font-bake-display mt-3 text-[28px] font-medium leading-tight text-cocoa">
          Your brief is with our corporate team.
        </h3>
        <p className="bake-body mt-5 max-w-[52ch]">
          You&rsquo;ll hear back within one working day with pricing and a mock-up if you asked for
          custom branding.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="bake-btn">
            Back to home <span aria-hidden>→</span>
          </Link>
          <button type="button" onClick={() => setIsSubmitted(false)} className="bake-btn bake-btn-ghost">
            Send another enquiry
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-cream p-8 md:p-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Your name" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bake-input"
          />
        </Field>
        <Field label="Company" required>
          <input
            type="text"
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="bake-input"
          />
        </Field>
        <Field label="Work email" required>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bake-input"
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="bake-input"
          />
        </Field>
        <Field label="Event date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="bake-input"
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
            className="bake-input"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Brief: flavours, branding, delivery venues" required>
          <textarea
            rows={5}
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="bake-input resize-y"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-5 rounded-md border border-rose-accent/30 bg-rose px-4 py-3 text-[14px] text-cocoa">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={isSubmitting} className="bake-btn bake-btn-rose disabled:opacity-60">
          {isSubmitting ? 'Sending…' : 'Send quote request'} <span aria-hidden>→</span>
        </button>
        <p className="bake-caption text-taupe">No spam, ever</p>
      </div>

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
    </form>
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
