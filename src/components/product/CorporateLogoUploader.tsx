'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Check, Loader2, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

interface Props {
  /** Current logo URL (lifted state — the product page owns it). */
  value?: string
  onChange: (url: string | undefined) => void
  /** What the logo is printed onto. Cupcakes by default; slices on cake-slice pages. */
  itemNoun?: 'cupcake' | 'slice'
}

export default function CorporateLogoUploader({ value, onChange, itemNoun = 'cupcake' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)

    // Validate client-side too so the customer gets an instant answer — the
    // API re-validates regardless, this is purely for UX.
    if (!ALLOWED.includes(file.type)) {
      setError('Please upload a PNG, JPG or WEBP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('That file is too large — please keep your logo under 4MB.')
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload/logo', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok || !data?.success || !data?.url) {
        setError(data?.error || 'We could not upload that image. Please try again.')
        return
      }
      onChange(data.url)
    } catch {
      setError('Upload failed — please check your connection and try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-cream/40 p-4">
      <div className="flex items-start gap-2.5">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-accent" strokeWidth={1.8} />
        <div>
          <p className="font-bake-display text-[14px] font-medium text-cocoa">
            Add your company logo{' '}
            <span className="font-bake-body text-[12.5px] font-normal text-taupe">(optional)</span>
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-cocoa-soft">
            We&rsquo;ll print your logo on an edible disc and top each {itemNoun} with it — perfect for corporate
            events and client gifting.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-3 rounded-xl border border-rose-accent/40 bg-ivory p-3"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
              {/* Cloudinary-hosted; unoptimized keeps transparency crisp in preview */}
              <Image src={value} alt="Your uploaded logo" fill sizes="56px" className="object-contain p-1" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cocoa">
                <Check className="h-3.5 w-3.5 text-rose-accent" strokeWidth={2.2} />
                Logo attached
              </p>
              <p className="mt-0.5 truncate text-[11.5px] text-taupe">
                It will be printed on every {itemNoun} in this box.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setError(null)
              }}
              aria-label="Remove logo"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-cocoa-soft transition-colors hover:border-rose-accent hover:text-rose-accent"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3"
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f)
              }}
              className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 transition-colors ${
                dragging
                  ? 'border-rose-accent bg-rose/20'
                  : 'border-taupe/40 bg-ivory hover:border-rose-accent hover:bg-rose/10'
              } disabled:opacity-60`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-rose-accent" strokeWidth={1.8} />
                  <span className="text-[13px] font-medium text-cocoa">Uploading your logo…</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-cocoa-soft" strokeWidth={1.8} />
                  <span className="text-[13px] font-medium text-cocoa">Upload your logo</span>
                  <span className="text-[11.5px] text-taupe">PNG, JPG or WEBP · max 4MB</span>
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-2 text-[12px] font-medium text-rose-accent">{error}</p>}
    </div>
  )
}
