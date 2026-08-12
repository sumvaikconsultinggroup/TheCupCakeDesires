'use client'

import {
  CUSTOM_DRESS_CAKE_FLAVOURS,
  CUSTOM_DRESS_CAKE_PRICE,
  CUSTOM_DRESS_CAKE_STYLES,
  type CustomDressCakeFlavour,
  type CustomDressCakeStyle,
} from '@/lib/custom-dress-cake'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ImagePlus, Loader2, Mail, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-bake-body text-[15px] text-cocoa outline-none transition placeholder:text-taupe focus:border-rose-accent focus:shadow-[0_0_0_4px_rgba(217,113,133,0.12)]'

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

export default function CustomDressCakeClient() {
  const [style, setStyle] = useState<CustomDressCakeStyle | ''>('')
  const [flavour, setFlavour] = useState<CustomDressCakeFlavour>('Vanilla')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isCustomStyle = style === 'Something else (tell us below)'

  const handleFile = async (file: File) => {
    setUploadError(null)
    if (!ALLOWED.includes(file.type)) {
      setUploadError('Please upload a PNG, JPG or WEBP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError('That file is too large — please keep your photo under 4MB.')
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload/enquiry-image', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok || !data?.success || !data?.url) {
        setUploadError(data?.error || 'We could not upload that image. Please try again.')
        return
      }
      setImageUrl(data.url)
    } catch {
      setUploadError('Upload failed — please check your connection and try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!style) {
      setError('Please choose a dress cake style.')
      return
    }
    if (isCustomStyle && !notes.trim() && !imageUrl) {
      setError('For a custom style, please add a short description or an inspiration photo.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const details = [
      'Custom dress cake enquiry',
      `Style: ${style}`,
      `Flavour: ${flavour}`,
      `Guide price: $${CUSTOM_DRESS_CAKE_PRICE} (same for all listed styles)`,
      eventDate ? `Event / delivery date: ${eventDate}` : null,
      imageUrl ? `Inspiration photo: ${imageUrl}` : 'Inspiration photo: (none)',
      '',
      notes.trim() || '(No additional notes)',
    ]
      .filter((line) => line !== null)
      .join('\n')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: `Custom dress cake enquiry · ${style}`,
          message: details,
        }),
      })

      if (!res.ok) {
        setError('Could not send your enquiry. Please try again or email info@thecupcakedesire.com.au.')
        return
      }

      setIsSubmitted(true)
      setStyle('')
      setFlavour('Vanilla')
      setName('')
      setEmail('')
      setPhone('')
      setEventDate('')
      setNotes('')
      setImageUrl(undefined)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bake-canvas">
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-cream via-ivory to-rose/20">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rose-accent/15 blur-3xl" />
        <div className="mx-auto max-w-[920px] px-6 py-14 md:px-10 md:py-20">
          <p className="bake-eyebrow text-rose-accent">Princess dress cakes</p>
          <h1 className="font-bake-display mt-3 max-w-[18ch] text-[34px] font-medium leading-[1.1] tracking-tight text-cocoa md:text-[48px]">
            Design your custom dress cake
          </h1>
          <p className="bake-body mt-4 max-w-[52ch] text-cocoa-soft">
            Choose a style and flavour — all listed dress cakes are the same guide price of{' '}
            <span className="font-medium text-cocoa">${CUSTOM_DRESS_CAKE_PRICE}</span>. Prefer something
            different? Tell us in the notes and attach a photo. We&rsquo;ll reply with a quote.
          </p>
          <p className="bake-caption mt-3 text-taupe">
            Already browsing ready-made options?{' '}
            <Link href="/collections/dress-cakes" className="font-medium text-rose-accent underline-offset-2 hover:underline">
              See our dress cakes collection →
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[920px] px-6 py-12 md:px-10 md:py-16">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center md:px-10"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check className="h-6 w-6" strokeWidth={2} />
              </span>
              <h2 className="font-bake-display mt-4 text-[24px] font-medium text-cocoa">Enquiry sent</h2>
              <p className="bake-body-sm mt-2 text-cocoa-soft">
                Thanks — we&rsquo;ll be in touch shortly about your dress cake.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="bake-btn mt-6"
              >
                Send another enquiry
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-3xl border border-line bg-ivory shadow-[0_18px_40px_-28px_rgba(46,31,21,0.35)]"
            >
              <div className="border-b border-line bg-cream/50 px-6 py-5 md:px-8">
                <h2 className="font-bake-display text-[20px] font-medium text-cocoa">Your dress cake</h2>
                <p className="bake-caption mt-1 text-taupe">Style, flavour, then a few details so we can quote you.</p>
              </div>

              <div className="space-y-7 px-6 py-7 md:px-8">
                <div>
                  <label htmlFor="dress-style" className="bake-caption text-taupe">
                    Dress cake style <span className="text-rose-accent">*</span>
                  </label>
                  <select
                    id="dress-style"
                    required
                    value={style}
                    onChange={(e) => setStyle(e.target.value as CustomDressCakeStyle | '')}
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      Choose a style…
                    </option>
                    {CUSTOM_DRESS_CAKE_STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {style && !isCustomStyle && (
                    <p className="bake-caption mt-2 text-taupe">
                      Guide price <span className="font-medium text-cocoa">${CUSTOM_DRESS_CAKE_PRICE}</span> — same for
                      every listed style.
                    </p>
                  )}
                </div>

                <div>
                  <p className="bake-caption text-taupe">
                    Flavour <span className="text-rose-accent">*</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {CUSTOM_DRESS_CAKE_FLAVOURS.map((f) => {
                      const active = flavour === f
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFlavour(f)}
                          className={classNames(
                            'font-bake-body rounded-full border px-4 py-2 text-[13px] font-medium transition-all',
                            active
                              ? 'border-cocoa bg-cocoa text-ivory'
                              : 'border-line bg-white text-cocoa-soft hover:border-cocoa hover:text-cocoa'
                          )}
                        >
                          {f}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dress-name" className="bake-caption text-taupe">
                      Your name <span className="text-rose-accent">*</span>
                    </label>
                    <input
                      id="dress-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={fieldClass}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="dress-email" className="bake-caption text-taupe">
                      Email <span className="text-rose-accent">*</span>
                    </label>
                    <input
                      id="dress-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                      placeholder="you@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="dress-phone" className="bake-caption text-taupe">
                      Phone
                    </label>
                    <input
                      id="dress-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={fieldClass}
                      placeholder="04xx xxx xxx"
                    />
                  </div>
                  <div>
                    <label htmlFor="dress-date" className="bake-caption text-taupe">
                      Event / delivery date
                    </label>
                    <input
                      id="dress-date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dress-notes" className="bake-caption text-taupe">
                    Notes {isCustomStyle ? <span className="text-rose-accent">*</span> : '(optional)'}
                  </label>
                  <textarea
                    id="dress-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${fieldClass} resize-none`}
                    placeholder={
                      isCustomStyle
                        ? 'Describe the dress cake you have in mind — colours, character, name/age piping…'
                        : 'Name & age to pipe, colour tweaks, allergens, or anything else that helps us quote accurately.'
                    }
                  />
                </div>

                {/* Inspiration photo */}
                <div className="rounded-2xl border border-line bg-cream/40 p-4">
                  <div className="flex items-start gap-2.5">
                    <ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-rose-accent" strokeWidth={1.8} />
                    <div>
                      <p className="font-bake-display text-[14px] font-medium text-cocoa">
                        Inspiration photo{' '}
                        <span className="font-bake-body text-[12.5px] font-normal text-taupe">
                          {isCustomStyle ? '(recommended)' : '(optional)'}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-cocoa-soft">
                        Share a reference image if you want something else — or to match colours and details.
                      </p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {imageUrl ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 flex items-center gap-3 rounded-xl border border-rose-accent/40 bg-ivory p-3"
                      >
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-cream">
                          <Image src={imageUrl} alt="Inspiration" fill className="object-cover" sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-cocoa">Photo attached</p>
                          <p className="bake-caption text-taupe">We&rsquo;ll include this with your enquiry.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageUrl(undefined)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-cocoa-soft hover:border-rose-accent hover:text-rose-accent"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                        <label
                          className={classNames(
                            'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ivory px-4 py-6 text-center transition hover:border-rose-accent',
                            uploading && 'pointer-events-none opacity-60'
                          )}
                        >
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-cocoa" strokeWidth={1.8} />
                          ) : (
                            <Upload className="h-5 w-5 text-cocoa-soft" strokeWidth={1.8} />
                          )}
                          <span className="mt-2 text-[13px] font-medium text-cocoa">
                            {uploading ? 'Uploading…' : 'Upload a photo'}
                          </span>
                          <span className="bake-caption mt-1 text-taupe">PNG, JPG or WEBP · under 4MB</span>
                          <input
                            ref={inputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0]
                              if (file) void handleFile(file)
                            }}
                          />
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {uploadError && <p className="mt-2 text-sm font-medium text-rose-accent">{uploadError}</p>}
                </div>

                {error && <p className="text-sm font-medium text-rose-accent">{error}</p>}

                <button type="submit" disabled={isSubmitting} className="bake-btn w-full disabled:opacity-60">
                  <span className="inline-flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                    ) : (
                      <Mail className="h-4 w-4" strokeWidth={1.8} />
                    )}
                    {isSubmitting ? 'Sending…' : 'Send enquiry'}
                  </span>
                </button>
                <p className="bake-caption text-center text-taupe">
                  We usually reply within one business day. Cakes need at least 3 days&rsquo; notice.
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}
