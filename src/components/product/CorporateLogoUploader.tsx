'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Check, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, type ReactNode } from 'react'
import { MAX_CORPORATE_LOGOS } from '@/lib/corporate-logos'

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024

const TRIM_MATCH_NOTE = (
  <span className="font-semibold italic text-rose-accent">
    The cake trim will be matched to your logo.
  </span>
)

interface Props {
  /** Uploaded logo URLs. */
  value?: string[]
  onChange: (urls: string[]) => void
  /** What the logo is printed onto. */
  itemNoun?: 'cupcake' | 'slice' | 'cake'
  maxLogos?: number
  helperText?: ReactNode
}

export default function CorporateLogoUploader({
  value = [],
  onChange,
  itemNoun = 'cupcake',
  maxLogos = MAX_CORPORATE_LOGOS,
  helperText,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const logos = value.filter(Boolean)
  const atLimit = logos.length >= maxLogos
  const nounPlural = itemNoun === 'slice' ? 'slices' : itemNoun === 'cake' ? 'cake' : 'cupcakes'

  const handleFile = async (file: File) => {
    setError(null)

    if (atLimit) {
      setError(`You can add up to ${maxLogos} logo${maxLogos === 1 ? '' : 's'}.`)
      return
    }

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
      onChange([...logos, data.url])
    } catch {
      setError('Upload failed — please check your connection and try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (index: number) => {
    onChange(logos.filter((_, i) => i !== index))
    setError(null)
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
            {helperText ||
              (itemNoun === 'cake' ? (
                <>
                  Upload one logo — we print it on the cake.{' '}
                  {TRIM_MATCH_NOTE}
                </>
              ) : (
                `Upload up to ${maxLogos} logos — we'll print each on edible discs and mix them across your ${nounPlural}.`
              ))}
          </p>
        </div>
      </div>

      {logos.length > 0 && (
        <div className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {logos.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 rounded-xl border border-rose-accent/40 bg-ivory p-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                  <Image
                    src={url}
                    alt={`Logo ${index + 1}`}
                    fill
                    sizes="56px"
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cocoa">
                    <Check className="h-3.5 w-3.5 text-rose-accent" strokeWidth={2.2} />
                    Logo {index + 1} attached
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-taupe">
                    {itemNoun === 'cake' ? (
                      <>
                        Printed on this cake.{' '}
                        {TRIM_MATCH_NOTE}
                      </>
                    ) : logos.length === 1 ? (
                      `It will be printed on every ${itemNoun} in this box.`
                    ) : (
                      'Mixed across the box with your other logos.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove logo ${index + 1}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-cocoa-soft transition-colors hover:border-rose-accent hover:text-rose-accent"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!atLimit && (
        <div className={logos.length > 0 ? 'mt-2' : 'mt-3'}>
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
                {logos.length > 0 ? (
                  <Plus className="h-5 w-5 text-cocoa-soft" strokeWidth={1.8} />
                ) : (
                  <Upload className="h-5 w-5 text-cocoa-soft" strokeWidth={1.8} />
                )}
                <span className="text-[13px] font-medium text-cocoa">
                  {logos.length > 0 ? 'Add another logo' : 'Upload your logo'}
                </span>
                <span className="text-[11.5px] text-taupe">
                  PNG, JPG or WEBP · max 4MB · {logos.length}/{maxLogos} added
                </span>
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
        </div>
      )}

      {error && <p className="mt-2 text-[12px] font-medium text-rose-accent">{error}</p>}
    </div>
  )
}
