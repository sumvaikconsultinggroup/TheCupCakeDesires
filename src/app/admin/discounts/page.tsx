'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Loader2,
  Percent,
  Plus,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface Discount {
  _id?: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number
  usageLimit?: number | null
  usageCount: number
  startsAt?: string | null
  expiresAt?: string | null
  isActive: boolean
  appliesTo: 'all' | 'products'
  productIds?: string[]
  createdAt?: string
}

interface Product {
  _id: string
  title: string
  handle: string
}

const emptyForm: Partial<Discount> = {
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  usageLimit: undefined,
  isActive: true,
  appliesTo: 'all',
  startsAt: '',
  expiresAt: '',
  productIds: [],
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'scheduled' | 'expired'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [formData, setFormData] = useState<Partial<Discount>>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchDiscounts()
  }, [])

  useEffect(() => {
    if (showModal) {
      fetchProducts()
    }
  }, [showModal])

  const fetchDiscounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promo-codes')
      const data = await res.json()
      if (res.ok && data.success) {
        setDiscounts(data.data || [])
      } else {
        toast.error(data.message || 'Failed to load discounts')
      }
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to load discounts')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?all=true')
      const data = await res.json()
      if (res.ok && data.success) setProducts(data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingDiscount(null)
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (d: Discount) => {
    setEditingDiscount(d)
    setFormData({
      ...d,
      startsAt: d.startsAt ? new Date(d.startsAt).toISOString().split('T')[0] : '',
      expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString().split('T')[0] : '',
      productIds: d.productIds || [],
      // Legacy 'categories' codes fall back to 'all' since categories were removed
      appliesTo: d.appliesTo === 'products' ? 'products' : 'all',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.discountValue) {
      toast.error('Code and discount value are required.')
      return
    }
    setSaving(true)
    try {
      const url = editingDiscount
        ? `/api/admin/promo-codes/${editingDiscount._id}`
        : '/api/admin/promo-codes'
      const method = editingDiscount ? 'PATCH' : 'POST'

      const payload: Record<string, unknown> = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        startsAt: formData.startsAt || undefined,
        expiresAt: formData.expiresAt || undefined,
        isActive: formData.isActive,
        appliesTo: formData.appliesTo,
        productIds:
          formData.appliesTo === 'products' ? formData.productIds || [] : undefined,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(editingDiscount ? 'Discount updated.' : 'Discount created.')
        setShowModal(false)
        fetchDiscounts()
      } else {
        toast.error(data.message || 'Something went wrong')
      }
    } catch (e: any) {
      console.error(e)
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (d: Discount) => {
    if (!confirm(`Delete ${d.code}? This can’t be undone.`)) return
    try {
      const res = await fetch(`/api/admin/promo-codes/${d._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Deleted')
        setDiscounts((prev) => prev.filter((x) => x._id !== d._id))
      } else {
        toast.error(data.message || 'Failed to delete')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete')
    }
  }

  const handleToggleActive = async (d: Discount) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${d._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !d.isActive }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setDiscounts((prev) => prev.map((x) => (x._id === d._id ? { ...x, isActive: !x.isActive } : x)))
      } else {
        toast.error(data.message || 'Failed')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed')
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`${code} copied`))
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toUpperCase()
    return discounts
      .filter((d) => (q ? d.code.includes(q) : true))
      .filter((d) => {
        if (statusFilter === 'all') return true
        const status = getStatus(d)
        return status === statusFilter
      })
  }, [discounts, searchQuery, statusFilter])

  const stats = useMemo(() => {
    const active = discounts.filter((d) => getStatus(d) === 'active').length
    const usage = discounts.reduce((acc, d) => acc + (d.usageCount || 0), 0)
    return {
      total: discounts.length,
      active,
      usage,
    }
  }, [discounts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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
            Discount Codes
          </h1>
          <p className="text-sm text-neutral-600">
            Create promo codes that customers redeem at checkout. Limits are enforced
            automatically on order creation.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
        >
          <Plus className="h-4 w-4" />
          New code
        </button>
      </div>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total codes" value={stats.total} icon={Tag} accent="bg-cocoa/5 text-cocoa" />
        <StatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Total redemptions"
          value={stats.usage}
          icon={Sparkles}
          accent="bg-rose-50 text-rose-700"
        />
      </section>

      {/* Toolbar */}
      <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code…"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'scheduled', 'expired', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? 'border-cocoa bg-cocoa text-ivory'
                  : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="hidden border-b border-neutral-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 lg:grid lg:grid-cols-[1.4fr_0.9fr_1fr_1fr_1fr_auto] lg:gap-4">
          <span>Code</span>
          <span>Discount</span>
          <span>Min order</span>
          <span>Usage</span>
          <span>Window</span>
          <span className="text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Percent className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 font-bake-display text-[18px] font-medium text-cocoa">
              {searchQuery ? 'No matches' : 'No discount codes yet'}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery
                ? 'Try a different keyword.'
                : 'Create your first code and it’ll be redeemable at checkout immediately.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
              >
                <Plus className="h-4 w-4" /> New code
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {filtered.map((d, idx) => (
              <motion.li
                key={d._id || idx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
                className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[1.4fr_0.9fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4"
              >
                {/* Code */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-bake-display rounded-lg bg-neutral-100 px-2.5 py-1 text-sm font-semibold tracking-wider text-cocoa">
                      {d.code}
                    </code>
                    <button
                      onClick={() => copyCode(d.code)}
                      title="Copy code"
                      className="text-neutral-400 transition hover:text-rose-accent"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <StatusPill discount={d} />
                </div>

                {/* Discount value */}
                <div className="flex items-baseline gap-1 text-sm text-cocoa">
                  <span className="text-lg font-semibold">
                    {d.discountType === 'percentage' ? `${d.discountValue}%` : `$${d.discountValue}`}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {d.appliesTo === 'products'
                      ? `${d.productIds?.length || 0} products`
                      : 'all items'}
                  </span>
                </div>

                {/* Min order */}
                <div className="text-sm text-cocoa">
                  {d.minOrderAmount ? `$${d.minOrderAmount}` : <span className="text-neutral-400">No minimum</span>}
                </div>

                {/* Usage */}
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-cocoa">
                    <span className="font-medium">{d.usageCount}</span>
                    <span className="text-neutral-400">/</span>
                    <span className="text-neutral-500">{d.usageLimit || '∞'}</span>
                  </div>
                  {d.usageLimit && (
                    <div className="mt-1 h-1 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-1 rounded-full bg-rose-accent transition-all"
                        style={{
                          width: `${Math.min((d.usageCount / d.usageLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Window */}
                <div className="text-xs text-neutral-600">
                  <DateRange startsAt={d.startsAt} expiresAt={d.expiresAt} />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => handleToggleActive(d)}
                    title={d.isActive ? 'Deactivate' : 'Activate'}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
                  >
                    {d.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(d)}
                    title="Edit"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    title="Delete"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-red-600 transition hover:border-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {showModal && (
          <DiscountModal
            editing={!!editingDiscount}
            form={formData}
            setForm={setFormData}
            products={products}
            saving={saving}
            onSubmit={handleSubmit}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ──────────────── helpers ──────────────── */

function getStatus(d: Discount): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (!d.isActive) return 'inactive'
  const now = Date.now()
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return 'scheduled'
  if (d.expiresAt && new Date(d.expiresAt).getTime() < now) return 'expired'
  if (d.usageLimit && d.usageCount >= d.usageLimit) return 'expired'
  return 'active'
}

function StatusPill({ discount }: { discount: Discount }) {
  const status = getStatus(discount)
  const cls: Record<string, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    scheduled: 'border-amber-200 bg-amber-50 text-amber-700',
    expired: 'border-neutral-200 bg-neutral-100 text-neutral-600',
    inactive: 'border-neutral-200 bg-neutral-100 text-neutral-500',
  }
  return (
    <span
      className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${cls[status]}`}
    >
      {status}
    </span>
  )
}

function DateRange({ startsAt, expiresAt }: { startsAt?: string | null; expiresAt?: string | null }) {
  const fmt = (s?: string | null) =>
    s ? new Date(s).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : null
  const a = fmt(startsAt)
  const b = fmt(expiresAt)
  if (!a && !b) return <span className="text-neutral-400">No limits</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <Calendar className="h-3 w-3" />
      {a || 'Now'} → {b || 'Forever'}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-cocoa">{value}</p>
    </div>
  )
}

/* ──────────────── modal ──────────────── */

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

function DiscountModal({
  editing,
  form,
  setForm,
  products,
  saving,
  onSubmit,
  onClose,
}: {
  editing: boolean
  form: Partial<Discount>
  setForm: (f: Partial<Discount>) => void
  products: Product[]
  saving: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  const generateCode = () => {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase()
    setForm({ ...form, code: `BAKE-${random}` })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-[0_30px_60px_-30px_rgba(46,31,21,0.45)]"
      >
        <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h3 className="font-bake-display text-[20px] font-medium text-cocoa">
              {editing ? 'Edit discount code' : 'New discount code'}
            </h3>
            <p className="text-sm text-neutral-600">
              Customers redeem this at checkout — discount is verified server-side.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-cocoa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Code + generate */}
          <Field label="Code *" hint="Letters, digits, hyphen and underscore. Auto-uppercased.">
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code || ''}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                className={`${inputCls} font-bake-display font-semibold tracking-wider`}
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate
              </button>
            </div>
          </Field>

          {/* Discount type + value */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount type *">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                {(['percentage', 'fixed'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, discountType: t })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      form.discountType === t
                        ? 'bg-cocoa text-ivory shadow-sm'
                        : 'text-cocoa-soft hover:text-cocoa'
                    }`}
                  >
                    {t === 'percentage' ? 'Percentage (%)' : 'Fixed (AUD)'}
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label="Discount value *"
              hint={
                form.discountType === 'percentage'
                  ? 'Max 100%'
                  : 'Flat AUD amount off the eligible subtotal.'
              }
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                  {form.discountType === 'percentage' ? '%' : '$'}
                </span>
                <input
                  type="number"
                  min={0}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={form.discountValue || ''}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  className={`${inputCls} pl-7`}
                  required
                />
              </div>
            </Field>
          </div>

          {/* Min order + usage limit */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimum order ($)" hint="Customer subtotal must be ≥ this to redeem.">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.minOrderAmount ?? 0}
                onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Usage limit" hint="Leave empty for unlimited.">
              <input
                type="number"
                min={1}
                value={form.usageLimit ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    usageLimit: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="∞"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Date window */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts on" hint="Leave empty to start now.">
              <input
                type="date"
                value={form.startsAt || ''}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Expires on" hint="Leave empty for no expiry.">
              <input
                type="date"
                value={form.expiresAt || ''}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Applies to */}
          <Field label="Applies to">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
              {(['all', 'products'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, appliesTo: t })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                    form.appliesTo === t
                      ? 'bg-cocoa text-ivory shadow-sm'
                      : 'text-cocoa-soft hover:text-cocoa'
                  }`}
                >
                  {t === 'all' ? 'All items' : 'Products'}
                </button>
              ))}
            </div>
          </Field>

          {form.appliesTo === 'products' && (
            <Field
              label="Choose products"
              hint={`${form.productIds?.length || 0} selected.`}
            >
              <div className="max-h-44 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2">
                {products.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-neutral-500">No products loaded.</p>
                ) : (
                  products.map((p) => {
                    const selected = (form.productIds || []).includes(p._id)
                    return (
                      <label
                        key={p._id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                          selected ? 'bg-rose-50 text-cocoa' : 'text-cocoa-soft hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const ids = form.productIds || []
                            setForm({
                              ...form,
                              productIds: selected
                                ? ids.filter((x) => x !== p._id)
                                : [...ids, p._id],
                            })
                          }}
                          className="h-4 w-4 accent-cocoa"
                        />
                        <span className="truncate">{p.title}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </Field>
          )}

          {/* Active toggle */}
          <Field label="Status">
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
            >
              <span className="text-sm text-cocoa">
                {form.isActive ? 'Active — customers can use this code' : 'Inactive — hidden from checkout'}
              </span>
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.isActive ? 'bg-rose-accent' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    form.isActive ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </Field>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              The discount is recalculated server-side at checkout, and{' '}
              <strong>usage count auto-increments</strong> on every successful redemption.
            </p>
          </div>

          <div className="flex gap-3 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create code'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
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
