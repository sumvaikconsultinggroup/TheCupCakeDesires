'use client'

import ImageUpload from '@/components/ui/ImageUpload'
import {
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Layers,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Type,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getHeroSettings, updateHeroSettings } from './hero-actions'

interface CornerPair {
  line1: string
  line2: string
}

interface HeroState {
  enabled: boolean
  images: string[]
  topLeft: CornerPair
  topRight: CornerPair
  bottomLeft: CornerPair
  bottomRight: CornerPair
  center: { eyebrow: string; title: string; footer: string }
}

const DEFAULTS: HeroState = {
  enabled: true,
  images: [
    '/images/Banner-1.webp',
    '/images/Banner-2.webp',
    '/images/Banner-3.webp',
    '/images/Banner-4.webp',
  ],
  topLeft: { line1: 'Handcrafted Bakery', line2: 'Baked Fresh Daily' },
  topRight: { line1: 'The Cupcake Desire', line2: 'Est. 2012' },
  bottomLeft: { line1: 'Signatures', line2: 'Seasonal flavours' },
  bottomRight: { line1: 'Gift boxes', line2: 'Custom orders' },
  center: { eyebrow: 'We create', title: 'Sweet moments', footer: 'that delight.' },
}

const FRAME_CAPTIONS = [
  'Frame 1 — sits at the back, revealed last as you scroll',
  'Frame 2 — middle layer',
  'Frame 3 — middle layer',
  'Frame 4 — front layer, visible first',
]

export default function HomepageHeroAdmin() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<HeroState>(DEFAULTS)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getHeroSettings()
        if (res.success && res.settings) {
          const s = res.settings as any
          setState({
            enabled: s.enabled ?? true,
            images:
              Array.isArray(s.images) && s.images.length === 4 ? s.images : DEFAULTS.images,
            topLeft: { ...DEFAULTS.topLeft, ...(s.topLeft || {}) },
            topRight: { ...DEFAULTS.topRight, ...(s.topRight || {}) },
            bottomLeft: { ...DEFAULTS.bottomLeft, ...(s.bottomLeft || {}) },
            bottomRight: { ...DEFAULTS.bottomRight, ...(s.bottomRight || {}) },
            center: { ...DEFAULTS.center, ...(s.center || {}) },
          })
        } else {
          toast.error(res.message || 'Could not load hero settings')
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateHeroSettings(state)
      if (res.success) {
        toast.success(res.message || 'Hero saved')
      } else {
        toast.error(res.message || 'Failed to save')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (!confirm('Reset every field back to the original The Cupcake Desire copy + bundled banner images?')) {
      return
    }
    setState(DEFAULTS)
    toast('Reset to defaults — click Save to apply.', { icon: '↺' })
  }

  const setImage = (idx: number, url: string) => {
    setState((s) => {
      const next = [...s.images]
      next[idx] = url
      return { ...s, images: next }
    })
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">
            Homepage Hero
          </h1>
          <p className="text-sm text-neutral-600">
            Edit the four banner images and every visible line of text in the storefront
            scroll-mask hero. Saves are reflected on{' '}
            <Link
              href="/"
              target="_blank"
              className="text-cocoa underline decoration-rose-accent underline-offset-2 hover:text-rose-accent"
            >
              /
            </Link>{' '}
            within a minute.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Status card */}
      <SectionCard
        title="Status"
        description="Hide the entire hero from the storefront without losing its content."
        icon={Layers}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setState((s) => ({ ...s, enabled: !s.enabled }))}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              state.enabled ? 'bg-rose-accent' : 'bg-neutral-300'
            }`}
            aria-label="Toggle hero visibility"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                state.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-cocoa">
            {state.enabled
              ? 'Hero is live at the top of the homepage.'
              : 'Hero is hidden — the homepage starts at the section below.'}
          </span>
        </div>
      </SectionCard>

      {/* Banner images */}
      <SectionCard
        title="Banner images"
        description="Four frames are layered with a scroll-driven reveal animation. Use wide images (≥ 1600 × 900) for the best result."
        icon={ImageIcon}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {state.images.map((url, i) => (
            <div key={i}>
              <p className="font-bake-body mb-2 text-xs font-medium uppercase tracking-[0.08em] text-cocoa-soft">
                {FRAME_CAPTIONS[i]}
              </p>
              <ImageUpload
                value={url}
                onChange={(next) => setImage(i, next)}
                aspectRatio="video"
                placeholder={`Frame ${i + 1} image`}
                hint="JPG / PNG / WebP — max 5MB"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Centre text — the headline */}
      <SectionCard
        title="Centre headline"
        description="The big editorial type stacked in the middle of the hero."
        icon={Sparkles}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Eyebrow (script)"
            hint="Rendered in the script font, top-left of the centre stack."
          >
            <input
              type="text"
              value={state.center.eyebrow}
              onChange={(e) =>
                setState((s) => ({ ...s, center: { ...s.center, eyebrow: e.target.value } }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Main title" hint="The big display headline.">
            <input
              type="text"
              value={state.center.title}
              onChange={(e) =>
                setState((s) => ({ ...s, center: { ...s.center, title: e.target.value } }))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Footer (script)" hint="Bottom-right of the centre stack.">
            <input
              type="text"
              value={state.center.footer}
              onChange={(e) =>
                setState((s) => ({ ...s, center: { ...s.center, footer: e.target.value } }))
              }
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Corner copy */}
      <SectionCard
        title="Corner labels"
        description="Four tiny stat-style labels in each corner. Each is two short lines."
        icon={Type}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CornerEditor
            label="Top-left"
            value={state.topLeft}
            onChange={(v) => setState((s) => ({ ...s, topLeft: v }))}
          />
          <CornerEditor
            label="Top-right"
            value={state.topRight}
            onChange={(v) => setState((s) => ({ ...s, topRight: v }))}
          />
          <CornerEditor
            label="Bottom-left"
            value={state.bottomLeft}
            onChange={(v) => setState((s) => ({ ...s, bottomLeft: v }))}
          />
          <CornerEditor
            label="Bottom-right"
            value={state.bottomRight}
            onChange={(v) => setState((s) => ({ ...s, bottomRight: v }))}
          />
        </div>
      </SectionCard>

      {/* Reset */}
      <SectionCard
        title="Reset"
        description="Restore the bundled banner images and original copy. Doesn't save until you press Save."
        icon={RotateCcw}
      >
        <button
          onClick={resetToDefaults}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </button>
      </SectionCard>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
        <p className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          The legacy banner / sections builder has been replaced by this focused Hero editor. The
          old <code className="font-mono">/api/admin/home-banners</code> API still works for any
          orphaned data, but it&rsquo;s no longer linked from the admin.
        </p>
      </div>

      {/* Sticky save */}
      <div className="sticky bottom-4 mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-3 text-sm font-medium text-ivory shadow-lg transition hover:bg-rose-accent disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

/* ──────────────── Local UI helpers ──────────────── */

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bake-display text-[20px] font-medium text-cocoa">{title}</h2>
          {description && <p className="text-sm text-neutral-600">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cocoa">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  )
}

function CornerEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: CornerPair
  onChange: (v: CornerPair) => void
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <p className="font-bake-body mb-3 text-xs font-medium uppercase tracking-[0.08em] text-cocoa-soft">
        {label}
      </p>
      <div className="space-y-3">
        <Field label="Line 1">
          <input
            type="text"
            value={value.line1}
            onChange={(e) => onChange({ ...value, line1: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Line 2">
          <input
            type="text"
            value={value.line2}
            onChange={(e) => onChange({ ...value, line2: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  )
}
