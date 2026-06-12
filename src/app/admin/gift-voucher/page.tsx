'use client'

import {
  ExternalLink,
  Eye,
  Gift,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  GiftVoucherSettingsPayload,
  getGiftVoucherSettings,
  updateGiftVoucherSettings,
} from './gift-voucher-actions'

type Tier = NonNullable<GiftVoucherSettingsPayload['tiers']>[number]
type Benefit = NonNullable<GiftVoucherSettingsPayload['benefits']>[number]
type Step = NonNullable<GiftVoucherSettingsPayload['howItWorks']>[number]
type Faq = NonNullable<GiftVoucherSettingsPayload['faqs']>[number]

const ICON_OPTIONS = ['Mail', 'Clock', 'Sparkles', 'Heart', 'Gift', 'Star', 'Shield', 'Truck']

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

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

export default function GiftVoucherSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [productHandle, setProductHandle] = useState('gift-voucher')
  const [hero, setHero] = useState({
    eyebrow: '',
    scriptWord: '',
    headline: '',
    subheadline: '',
    image: '',
    ctaText: '',
  })
  const [closing, setClosing] = useState({
    eyebrow: '',
    headline: '',
    body: '',
    ctaText: '',
  })
  const [tiers, setTiers] = useState<Tier[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [terms, setTerms] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getGiftVoucherSettings()
        if (res.success && res.settings) {
          const s = res.settings as any
          setEnabled(s.enabled ?? true)
          setProductHandle(s.productHandle || 'gift-voucher')
          setHero({
            eyebrow: s.hero?.eyebrow || '',
            scriptWord: s.hero?.scriptWord || '',
            headline: s.hero?.headline || '',
            subheadline: s.hero?.subheadline || '',
            image: s.hero?.image || '',
            ctaText: s.hero?.ctaText || '',
          })
          setClosing({
            eyebrow: s.closing?.eyebrow || '',
            headline: s.closing?.headline || '',
            body: s.closing?.body || '',
            ctaText: s.closing?.ctaText || '',
          })
          setTiers(s.tiers || [])
          setBenefits(s.benefits || [])
          setSteps(s.howItWorks || [])
          setFaqs(s.faqs || [])
          setTerms(s.termsContent || '')
        } else {
          toast.error(res.message || 'Could not load settings')
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateGiftVoucherSettings({
        enabled,
        productHandle,
        hero,
        closing,
        tiers,
        benefits,
        howItWorks: steps,
        faqs,
        termsContent: terms,
      })
      if (res.success) {
        toast.success(res.message || 'Saved')
      } else {
        toast.error(res.message || 'Save failed')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
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
            Gift Voucher Page
          </h1>
          <p className="text-sm text-neutral-600">
            Everything on the public{' '}
            <Link
              href="/gift-voucher"
              target="_blank"
              className="inline-flex items-center gap-1 text-cocoa underline decoration-rose-accent underline-offset-2 hover:text-rose-accent"
            >
              /gift-voucher <ExternalLink className="h-3 w-3" />
            </Link>{' '}
            page is edited here. Tier amounts must match variants on the linked product.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/gift-voucher"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Status / toggle */}
      <SectionCard
        title="Status"
        description="Hide the page from customers without deleting the content."
        icon={Gift}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              enabled ? 'bg-rose-accent' : 'bg-neutral-300'
            }`}
            aria-label="Toggle gift voucher page"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-cocoa">
            {enabled ? 'Page is live at /gift-voucher' : 'Page returns 404'}
          </span>
        </div>
        <div className="mt-5">
          <Field
            label="Linked product handle"
            hint="The Product record that holds the actual voucher variants. Don't change this unless you renamed the product."
          >
            <input
              type="text"
              value={productHandle}
              onChange={(e) => setProductHandle(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Hero */}
      <SectionCard
        title="Hero"
        description="The first thing visitors see when they land on the page."
        icon={ImageIcon}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={hero.eyebrow}
              onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Script word" hint="Rendered in italic script accent.">
            <input
              type="text"
              value={hero.scriptWord}
              onChange={(e) => setHero({ ...hero, scriptWord: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Headline" hint="Use the script word verbatim inside the headline.">
            <input
              type="text"
              value={hero.headline}
              onChange={(e) => setHero({ ...hero, headline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="CTA button text">
            <input
              type="text"
              value={hero.ctaText}
              onChange={(e) => setHero({ ...hero, ctaText: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Subheadline">
            <textarea
              rows={3}
              value={hero.subheadline}
              onChange={(e) => setHero({ ...hero, subheadline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Hero image URL" hint="Use an Unsplash or hosted image.">
            <input
              type="url"
              value={hero.image}
              onChange={(e) => setHero({ ...hero, image: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Tiers */}
      <SectionCard
        title="Voucher tiers"
        description="Each tier maps to a variant of the linked product (the amount must match)."
        icon={Sparkles}
      >
        <div className="space-y-3">
          {tiers.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <GripVertical className="h-3.5 w-3.5" />
                  Tier {i + 1}
                </span>
                <button
                  onClick={() => setTiers(tiers.filter((_, idx) => idx !== i))}
                  className="text-neutral-400 transition hover:text-red-500"
                  aria-label="Remove tier"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Amount (AUD)">
                  <input
                    type="number"
                    min={1}
                    value={t.amount}
                    onChange={(e) => {
                      const next = [...tiers]
                      next[i] = { ...t, amount: Number(e.target.value) }
                      setTiers(next)
                    }}
                    className={inputCls}
                  />
                </Field>
                <Field label="Display label">
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => {
                      const next = [...tiers]
                      next[i] = { ...t, label: e.target.value }
                      setTiers(next)
                    }}
                    className={inputCls}
                  />
                </Field>
                <Field label="Recipient suggestion">
                  <input
                    type="text"
                    value={t.recipientSuggestion || ''}
                    onChange={(e) => {
                      const next = [...tiers]
                      next[i] = { ...t, recipientSuggestion: e.target.value }
                      setTiers(next)
                    }}
                    className={inputCls}
                  />
                </Field>
                <div className="flex items-end">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-cocoa">
                    <input
                      type="checkbox"
                      checked={!!t.popular}
                      onChange={(e) => {
                        const next = [...tiers]
                        next[i] = { ...t, popular: e.target.checked }
                        setTiers(next)
                      }}
                      className="h-4 w-4 rounded border-neutral-300 text-rose-accent focus:ring-rose-accent"
                    />
                    Mark as popular
                  </label>
                </div>
                <div className="sm:col-span-4">
                  <Field label="Blurb">
                    <textarea
                      rows={2}
                      value={t.blurb}
                      onChange={(e) => {
                        const next = [...tiers]
                        next[i] = { ...t, blurb: e.target.value }
                        setTiers(next)
                      }}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setTiers([
              ...tiers,
              { amount: 50, label: '$50', blurb: '', popular: false, recipientSuggestion: '' },
            ])
          }
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-rose-accent hover:text-rose-accent"
        >
          <Plus className="h-4 w-4" /> Add tier
        </button>
      </SectionCard>

      {/* Benefits */}
      <SectionCard
        title="Why buy a voucher"
        description="Up to four short reasons. Each gets an icon and a one-line description."
        icon={Sparkles}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Benefit {i + 1}
                </span>
                <button
                  onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))}
                  className="text-neutral-400 transition hover:text-red-500"
                  aria-label="Remove benefit"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Icon">
                  <select
                    value={b.icon}
                    onChange={(e) => {
                      const next = [...benefits]
                      next[i] = { ...b, icon: e.target.value }
                      setBenefits(next)
                    }}
                    className={inputCls}
                  >
                    {ICON_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={b.title}
                    onChange={(e) => {
                      const next = [...benefits]
                      next[i] = { ...b, title: e.target.value }
                      setBenefits(next)
                    }}
                    className={inputCls}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={2}
                    value={b.description}
                    onChange={(e) => {
                      const next = [...benefits]
                      next[i] = { ...b, description: e.target.value }
                      setBenefits(next)
                    }}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            setBenefits([
              ...benefits,
              { icon: 'Sparkles', title: '', description: '' },
            ])
          }
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-rose-accent hover:text-rose-accent"
        >
          <Plus className="h-4 w-4" /> Add benefit
        </button>
      </SectionCard>

      {/* How it works */}
      <SectionCard
        title="How it works"
        description="Step-by-step explanation. Steps are numbered automatically."
        icon={Sparkles}
      >
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Step {i + 1}
                </span>
                <button
                  onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                  className="text-neutral-400 transition hover:text-red-500"
                  aria-label="Remove step"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Title">
                  <input
                    type="text"
                    value={s.title}
                    onChange={(e) => {
                      const next = [...steps]
                      next[i] = { ...s, title: e.target.value }
                      setSteps(next)
                    }}
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <input
                      type="text"
                      value={s.description}
                      onChange={(e) => {
                        const next = [...steps]
                        next[i] = { ...s, description: e.target.value }
                        setSteps(next)
                      }}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setSteps([...steps, { title: '', description: '' }])}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-rose-accent hover:text-rose-accent"
        >
          <Plus className="h-4 w-4" /> Add step
        </button>
      </SectionCard>

      {/* FAQs */}
      <SectionCard
        title="FAQs"
        description="Answers to common questions about vouchers."
        icon={HelpCircle}
      >
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Q {i + 1}
                </span>
                <button
                  onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                  className="text-neutral-400 transition hover:text-red-500"
                  aria-label="Remove FAQ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Question">
                  <input
                    type="text"
                    value={f.question}
                    onChange={(e) => {
                      const next = [...faqs]
                      next[i] = { ...f, question: e.target.value }
                      setFaqs(next)
                    }}
                    className={inputCls}
                  />
                </Field>
                <Field label="Answer">
                  <textarea
                    rows={2}
                    value={f.answer}
                    onChange={(e) => {
                      const next = [...faqs]
                      next[i] = { ...f, answer: e.target.value }
                      setFaqs(next)
                    }}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-rose-accent hover:text-rose-accent"
        >
          <Plus className="h-4 w-4" /> Add FAQ
        </button>
      </SectionCard>

      {/* Closing CTA */}
      <SectionCard
        title="Closing CTA"
        description="The wrap-up card shown right before the FAQ block."
        icon={Sparkles}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow">
            <input
              type="text"
              value={closing.eyebrow}
              onChange={(e) => setClosing({ ...closing, eyebrow: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Headline">
            <input
              type="text"
              value={closing.headline}
              onChange={(e) => setClosing({ ...closing, headline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Body">
            <textarea
              rows={3}
              value={closing.body}
              onChange={(e) => setClosing({ ...closing, body: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="CTA button">
            <input
              type="text"
              value={closing.ctaText}
              onChange={(e) => setClosing({ ...closing, ctaText: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Terms */}
      <SectionCard
        title="Terms & conditions"
        description="Shown small at the bottom of the page."
        icon={HelpCircle}
      >
        <textarea
          rows={5}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          className={inputCls}
        />
      </SectionCard>

      {/* Footer save */}
      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-3 text-sm font-medium text-ivory shadow-lg transition hover:bg-rose-accent disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
