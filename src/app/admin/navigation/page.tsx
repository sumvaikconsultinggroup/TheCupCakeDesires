'use client'

import { VIRTUAL_COLLECTION_HANDLES, hrefForTarget, isValidCustomHref } from '@/lib/mega-menu-links'
import type {
  MegaMenuColumn,
  MegaMenuConfig,
  MegaMenuFeaturedCard,
  MegaMenuLink,
  MegaMenuLinkType,
  MegaMenuSlug,
} from '@/types/mega-menu'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Columns3,
  ExternalLink,
  ImageIcon,
  Layers,
  Link2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

const MENU_TABS: { slug: MegaMenuSlug; label: string }[] = [
  { slug: 'cupcakes', label: 'Cupcakes' },
  { slug: 'cakes', label: 'Cakes' },
  { slug: 'event', label: 'Event' },
  { slug: 'macarons', label: 'Other' },
]

const MAX_COLUMNS = { 'columns-featured': 4, 'product-list': 3 } as const
const MAX_FEATURED = 3

interface CatalogueItem {
  handle: string
  title: string
  description: string
  image: string
  visible: boolean
  productCount?: number
  category?: string
}

interface Catalogue {
  collections: CatalogueItem[]
  products: CatalogueItem[]
}

type PickedTarget =
  | { type: 'collection' | 'product'; item: CatalogueItem }
  | { type: 'custom'; label: string; href: string }

const TYPE_STYLE: Record<MegaMenuLinkType, { label: string; className: string }> = {
  collection: { label: 'Collection', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  product: { label: 'Product', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  custom: { label: 'Link', className: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
}

function targetKey(type?: MegaMenuLinkType, handle?: string) {
  return type && handle ? `${type}:${handle}` : ''
}

function entryKey(entry: MegaMenuLink | MegaMenuFeaturedCard) {
  return targetKey(entry.type, entry.collectionHandle || entry.productHandle)
}

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function NavigationManagementPage() {
  const [menus, setMenus] = useState<MegaMenuConfig[]>([])
  const [activeSlug, setActiveSlug] = useState<MegaMenuSlug>('event')
  const [form, setForm] = useState<MegaMenuConfig | null>(null)
  const [catalogue, setCatalogue] = useState<Catalogue>({ collections: [], products: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchCatalogue = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mega-menu/options', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setCatalogue(data.data)
      else toast.error(data.error || 'Failed to load collections and products')
    } catch {
      toast.error('Failed to load collections and products')
    }
  }, [])

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/mega-menu', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setMenus(data.data)
      else toast.error(data.error || 'Failed to load navigation')
    } catch {
      toast.error('Failed to load navigation')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenus()
    fetchCatalogue()
  }, [fetchMenus, fetchCatalogue])

  const savedMenu = menus.find((m) => m.slug === activeSlug)

  useEffect(() => {
    if (savedMenu) setForm(structuredClone(savedMenu))
  }, [savedMenu])

  const isDirty = Boolean(form && savedMenu && JSON.stringify(form) !== JSON.stringify(savedMenu))

  useEffect(() => {
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const collectionByHandle = useMemo(
    () => new Map(catalogue.collections.map((c) => [c.handle, c])),
    [catalogue.collections]
  )
  const productByHandle = useMemo(
    () => new Map(catalogue.products.map((p) => [p.handle, p])),
    [catalogue.products]
  )

  const lookup = useCallback(
    (entry: { type?: MegaMenuLinkType; collectionHandle?: string; productHandle?: string }) => {
      if (entry.type === 'collection' && entry.collectionHandle) {
        if (VIRTUAL_COLLECTION_HANDLES.has(entry.collectionHandle)) {
          return { item: undefined, warning: undefined }
        }
        const item = collectionByHandle.get(entry.collectionHandle)
        if (!item) return { item, warning: 'Collection not found — hidden on the site' }
        if (!item.visible) return { item, warning: 'Collection is unpublished — hidden on the site' }
        return { item, warning: undefined }
      }
      if (entry.type === 'product' && entry.productHandle) {
        const item = productByHandle.get(entry.productHandle)
        if (!item) return { item, warning: 'Product not found — hidden on the site' }
        if (!item.visible) return { item, warning: 'Product is not active/published — hidden on the site' }
        return { item, warning: undefined }
      }
      return { item: undefined, warning: undefined }
    },
    [collectionByHandle, productByHandle]
  )

  const selectTab = (slug: MegaMenuSlug) => {
    if (slug === activeSlug) return
    if (isDirty && !window.confirm('You have unsaved changes on this menu. Discard them?')) return
    setActiveSlug(slug)
  }

  const update = (mutate: (draft: MegaMenuConfig) => void) => {
    setForm((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      mutate(next)
      return next
    })
  }

  const discardChanges = () => {
    if (savedMenu) setForm(structuredClone(savedMenu))
  }

  const saveMenu = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/mega-menu/${form.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${form.label} menu saved — live on the site now`)
        setMenus((prev) => prev.map((m) => (m.slug === form.slug ? data.data : m)))
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cocoa" />
      </div>
    )
  }

  const isEventLayout = form.layout === 'columns-featured'
  const maxColumns = MAX_COLUMNS[form.layout]

  const pickedToLink = (picked: PickedTarget): MegaMenuLink =>
    picked.type === 'custom'
      ? { label: picked.label, href: picked.href, type: 'custom' }
      : {
          label: picked.item.title,
          href: hrefForTarget(picked.type, picked.item.handle),
          type: picked.type,
          ...(picked.type === 'collection'
            ? { collectionHandle: picked.item.handle }
            : { productHandle: picked.item.handle }),
        }

  const pickedToFeatured = (picked: PickedTarget): MegaMenuFeaturedCard | null => {
    if (picked.type === 'custom') return null
    return {
      title: picked.item.title,
      subtitle: picked.item.description.slice(0, 80),
      href: hrefForTarget(picked.type, picked.item.handle),
      image: picked.item.image,
      type: picked.type,
      ...(picked.type === 'collection'
        ? { collectionHandle: picked.item.handle }
        : { productHandle: picked.item.handle }),
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-28">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-bake-display text-[26px] font-medium text-cocoa sm:text-[28px]">Navigation</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Build each header menu from your{' '}
            <Link href="/admin/collections" className="font-medium text-cocoa underline hover:text-rose-accent">
              collections
            </Link>
            ,{' '}
            <Link href="/admin/products" className="font-medium text-cocoa underline hover:text-rose-accent">
              products
            </Link>{' '}
            or any page link. Saving updates the live site straight away.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (isDirty && !window.confirm('Discard unsaved changes and reload?')) return
              fetchMenus()
              fetchCatalogue()
            }}
            title="Reload"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-cocoa hover:border-rose-accent"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-cocoa hover:border-rose-accent"
          >
            Preview store
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={saveMenu}
            disabled={saving || !isDirty}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cocoa px-4 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-2xl border border-neutral-200 bg-white p-1">
          {MENU_TABS.map((tab) => {
            const menu = menus.find((m) => m.slug === tab.slug)
            return (
              <button
                key={tab.slug}
                onClick={() => selectTab(tab.slug)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeSlug === tab.slug ? 'bg-cocoa text-ivory shadow-sm' : 'text-cocoa hover:bg-cream'
                }`}
              >
                {menu?.label || tab.label}
                {menu && !menu.isActive && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      activeSlug === tab.slug ? 'bg-ivory/20 text-ivory' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    Hidden
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-6">
        <SectionCard
          icon={<Settings2 className="h-4 w-4" />}
          title="Menu settings"
          hint="The name in the header, the intro text on the left of the dropdown and its “Shop all” link."
          action={
            <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-neutral-200 py-1.5 pl-3 pr-1.5 text-sm text-cocoa">
              Show in header
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => update((d) => void (d.isActive = e.target.checked))}
                  className="peer sr-only"
                />
                <span className="h-5 w-9 rounded-full bg-neutral-200 transition peer-checked:bg-cocoa" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
              </span>
            </label>
          }
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Menu name">
                <input
                  value={form.label}
                  onChange={(e) => update((d) => void (d.label = e.target.value))}
                  maxLength={40}
                  className={inputClass}
                />
              </Field>
              <Field label="“Shop all” link">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={form.href}
                    onChange={(e) => update((d) => void (d.href = e.target.value))}
                    placeholder="/collections/…"
                    className={`${inputClass} sm:flex-1`}
                  />
                  <select
                    value=""
                    onChange={(e) => e.target.value && update((d) => void (d.href = e.target.value))}
                    className={`${inputClass} sm:w-56`}
                  >
                    <option value="">Pick a collection…</option>
                    {catalogue.collections.map((c) => (
                      <option key={c.handle} value={`/collections/${c.handle}`}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                {!isValidCustomHref(form.href) && (
                  <p className="mt-1 text-xs text-red-600">Use a path like /collections/… or a full https:// URL.</p>
                )}
              </Field>
            </div>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => update((d) => void (d.description = e.target.value))}
                rows={7}
                maxLength={600}
                className={inputClass}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Columns3 className="h-4 w-4" />}
          title="Columns"
          hint={`Each column has a heading and a list of collections, products or links. Up to ${maxColumns} columns.`}
          action={
            form.columns.length < maxColumns ? (
              <button
                onClick={() => update((d) => void d.columns.push({ heading: 'New column', links: [] }))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-cocoa hover:border-cocoa"
              >
                <Plus className="h-4 w-4" />
                Add column
              </button>
            ) : (
              <span className="text-xs text-neutral-400">
                {form.columns.length}/{maxColumns} columns
              </span>
            )
          }
        >
          <div className="grid items-start gap-4 md:grid-cols-2">
            {form.columns.map((col, colIndex) => (
              <ColumnEditor
                key={colIndex}
                column={col}
                index={colIndex}
                total={form.columns.length}
                catalogue={catalogue}
                lookup={lookup}
                onChange={(column) => update((d) => void (d.columns[colIndex] = column))}
                onMove={(dir) => update((d) => void (d.columns = move(d.columns, colIndex, colIndex + dir)))}
                onRemove={() => {
                  if (col.links.length && !window.confirm(`Remove the “${col.heading}” column and its ${col.links.length} links?`)) return
                  update((d) => void d.columns.splice(colIndex, 1))
                }}
                onAdd={(picked) => update((d) => void d.columns[colIndex].links.push(pickedToLink(picked)))}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={<ImageIcon className="h-4 w-4" />}
          title={isEventLayout ? 'Featured cards' : 'Menu image'}
          hint={
            isEventLayout
              ? `Image cards on the right of the dropdown. Pick up to ${MAX_FEATURED} collections or products.`
              : 'Shown on the right of the dropdown; it swaps to each item’s photo on hover.'
          }
          action={
            isEventLayout && form.featured.length < MAX_FEATURED ? (
              <AddButton
                label="Add card"
                variant="toolbar"
                pickerTitle="Add a featured card"
                catalogue={catalogue}
                allowCustom={false}
                exclude={new Set(form.featured.map(entryKey))}
                onPick={(picked) => {
                  const card = pickedToFeatured(picked)
                  if (!card) return
                  if (!card.image) {
                    toast.error(`“${card.title}” has no photo yet — add one in the admin first`)
                    return
                  }
                  update((d) => void d.featured.push(card))
                }}
              />
            ) : isEventLayout ? (
              <span className="text-xs text-neutral-400">
                {form.featured.length}/{MAX_FEATURED} cards
              </span>
            ) : null
          }
        >
          {isEventLayout ? (
            form.featured.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {form.featured.map((card, cardIndex) => (
                  <FeaturedCardEditor
                    key={`${entryKey(card) || card.href}-${cardIndex}`}
                    card={card}
                    index={cardIndex}
                    total={form.featured.length}
                    warning={lookup(card).warning}
                    onChange={(next) => update((d) => void (d.featured[cardIndex] = next))}
                    onMove={(dir) => update((d) => void (d.featured = move(d.featured, cardIndex, cardIndex + dir)))}
                    onRemove={() => update((d) => void d.featured.splice(cardIndex, 1))}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="No featured cards — the dropdown shows just the columns." />
            )
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative aspect-4/3 w-full max-w-xs shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-cream-deep">
                {form.heroImage ? (
                  <Thumb src={form.heroImage} className="h-full w-full rounded-none" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
                    No image yet
                  </span>
                )}
              </div>
              <div className="space-y-2 sm:max-w-xs">
                <p className="text-sm text-neutral-600">
                  {form.heroImageAlt ? (
                    <>
                      Using the photo from <span className="font-medium text-cocoa">{form.heroImageAlt}</span>.
                    </>
                  ) : (
                    'Pick a collection or product to use its photo.'
                  )}
                </p>
                <AddButton
                  label={form.heroImage ? 'Change image' : 'Choose image'}
                  variant="toolbar"
                  pickerTitle="Choose the menu image"
                  catalogue={catalogue}
                  allowCustom={false}
                  exclude={new Set()}
                  onPick={(picked) => {
                    if (picked.type === 'custom') return
                    if (!picked.item.image) {
                      toast.error(`“${picked.item.title}” has no photo yet`)
                      return
                    }
                    update((d) => {
                      d.heroImage = picked.item.image
                      d.heroImageAlt = picked.item.title
                    })
                  }}
                />
              </div>
            </div>
          )}
        </SectionCard>

        <div className="rounded-2xl border border-line bg-cream/40 p-4 text-sm text-neutral-600">
          <span className="font-medium text-cocoa">How it stays in sync:</span> collection and product
          entries are checked on every page load. If one is unpublished or deleted it disappears from the
          menu automatically and comes back when it is live again. Hover <strong>{form.label}</strong> on
          the storefront after saving to preview.
        </div>
      </div>

      {isDirty && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            <span className="text-sm font-medium text-cocoa">Unsaved changes</span>
            <button
              onClick={discardChanges}
              disabled={saving}
              className="rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={saveMenu}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

function SectionCard({
  icon,
  title,
  hint,
  action,
  children,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-cocoa">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="font-bake-display text-lg font-medium text-cocoa">{title}</h2>
            <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</label>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-500">
      {text}
    </p>
  )
}

function Thumb({ src, className = 'h-10 w-10' }: { src?: string; className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-cream-deep ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Package className="absolute inset-0 m-auto h-4 w-4 text-cocoa-soft" />
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: MegaMenuLinkType }) {
  const style = TYPE_STYLE[type]
  return (
    <span className={`shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium ${style.className}`}>
      {style.label}
    </span>
  )
}

function IconButton({
  onClick,
  disabled,
  title,
  danger,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition disabled:pointer-events-none disabled:opacity-25 ${
        danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-neutral-100 hover:text-cocoa'
      }`}
    >
      {children}
    </button>
  )
}

type Lookup = (entry: { type?: MegaMenuLinkType; collectionHandle?: string; productHandle?: string }) => {
  item?: CatalogueItem
  warning?: string
}

function ColumnEditor({
  column,
  index,
  total,
  catalogue,
  lookup,
  onChange,
  onMove,
  onRemove,
  onAdd,
}: {
  column: MegaMenuColumn
  index: number
  total: number
  catalogue: Catalogue
  lookup: Lookup
  onChange: (column: MegaMenuColumn) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onAdd: (picked: PickedTarget) => void
}) {
  const updateLink = (linkIndex: number, patch: Partial<MegaMenuLink>) =>
    onChange({
      ...column,
      links: column.links.map((l, i) => (i === linkIndex ? { ...l, ...patch } : l)),
    })

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-neutral-200 bg-cream/30">
      <div className="flex items-center gap-2 border-b border-neutral-200 p-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-cocoa ring-1 ring-neutral-200">
          {index + 1}
        </span>
        <input
          value={column.heading}
          onChange={(e) => onChange({ ...column, heading: e.target.value })}
          placeholder="Column heading"
          maxLength={80}
          aria-label="Column heading"
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-medium text-cocoa focus:border-rose-accent focus:outline-none"
        />
        <div className="flex shrink-0 items-center">
          <IconButton title="Move column left" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowLeft className="h-4 w-4" />
          </IconButton>
          <IconButton title="Move column right" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ArrowRight className="h-4 w-4" />
          </IconButton>
          <IconButton title="Remove column" onClick={onRemove} disabled={total <= 1} danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 space-y-2 p-3">
        {column.links.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white/60 p-4 text-center text-xs text-neutral-500">
            Empty column — it stays hidden on the site until you add something.
          </p>
        )}
        {column.links.map((link, linkIndex) => {
          const { item, warning } = lookup(link)
          const type = link.type || 'custom'
          return (
            <div
              key={`${entryKey(link) || link.href}-${linkIndex}`}
              className={`group rounded-xl border bg-white p-2.5 transition hover:shadow-sm ${
                warning ? 'border-amber-300' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Thumb src={item?.image} />
                <div className="min-w-0 flex-1">
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(linkIndex, { label: e.target.value })}
                    maxLength={120}
                    aria-label="Link name"
                    title={link.label}
                    className="-ml-1.5 w-[calc(100%+0.375rem)] truncate rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium text-cocoa hover:border-neutral-200 focus:border-rose-accent focus:outline-none"
                  />
                  <div className="mt-1 flex min-w-0 items-center gap-1.5">
                    <TypeBadge type={type} />
                    {type !== 'custom' && (
                      <span className="truncate text-[11px] text-neutral-400" title={link.href}>
                        {link.href}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center">
                  <IconButton
                    title="Move up"
                    onClick={() => onChange({ ...column, links: move(column.links, linkIndex, linkIndex - 1) })}
                    disabled={linkIndex === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    title="Move down"
                    onClick={() => onChange({ ...column, links: move(column.links, linkIndex, linkIndex + 1) })}
                    disabled={linkIndex === column.links.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    title="Remove"
                    onClick={() => onChange({ ...column, links: column.links.filter((_, i) => i !== linkIndex) })}
                    danger
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>
              {type === 'custom' && (
                <input
                  value={link.href}
                  onChange={(e) => updateLink(linkIndex, { href: e.target.value })}
                  aria-label="Link URL"
                  placeholder="/page or https://…"
                  className={`mt-2 w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none ${
                    isValidCustomHref(link.href)
                      ? 'border-neutral-200 text-neutral-600 focus:border-rose-accent'
                      : 'border-red-300 text-red-600'
                  }`}
                />
              )}
              {warning && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {warning}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="p-3 pt-0">
        <AddButton
          label="Add to column"
          pickerTitle={`Add to “${column.heading || 'column'}”`}
          catalogue={catalogue}
          allowCustom
          exclude={new Set(column.links.map(entryKey).filter(Boolean))}
          onPick={onAdd}
        />
      </div>
    </div>
  )
}

function FeaturedCardEditor({
  card,
  index,
  total,
  warning,
  onChange,
  onMove,
  onRemove,
}: {
  card: MegaMenuFeaturedCard
  index: number
  total: number
  warning?: string
  onChange: (card: MegaMenuFeaturedCard) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}) {
  const fieldClass =
    'w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 focus:border-rose-accent focus:outline-none'
  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white ${
        warning ? 'border-amber-300' : 'border-neutral-200'
      }`}
    >
      <div className="relative aspect-16/9 bg-cream-deep">
        <Thumb src={card.image} className="h-full w-full rounded-none" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-cocoa shadow-sm">
            {index + 1}
          </span>
          <TypeBadge type={card.type || 'custom'} />
        </div>
        <div className="absolute right-2 top-2 flex items-center rounded-lg bg-white/90 shadow-sm">
          <IconButton title="Move left" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton title="Move right" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ArrowRight className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton title="Remove card" onClick={onRemove} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <input
          value={card.title}
          onChange={(e) => onChange({ ...card, title: e.target.value })}
          placeholder="Title"
          maxLength={120}
          aria-label="Card title"
          className={`${fieldClass} text-sm font-medium text-cocoa`}
        />
        <input
          value={card.subtitle}
          onChange={(e) => onChange({ ...card, subtitle: e.target.value })}
          placeholder="Short line under the title"
          maxLength={160}
          aria-label="Card subtitle"
          className={`${fieldClass} text-xs`}
        />
        <input
          value={card.badge || ''}
          onChange={(e) => onChange({ ...card, badge: e.target.value || undefined })}
          placeholder="Badge (optional, e.g. Most loved)"
          maxLength={40}
          aria-label="Card badge"
          className={`${fieldClass} text-xs`}
        />
        <p className="truncate text-[11px] text-neutral-400" title={card.href}>
          {card.href}
        </p>
        {warning && (
          <p className="flex items-center gap-1.5 text-[11px] text-amber-700">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {warning}
          </p>
        )}
      </div>
    </div>
  )
}

function AddButton({
  label,
  pickerTitle,
  variant = 'dashed',
  catalogue,
  allowCustom,
  exclude,
  onPick,
}: {
  label: string
  pickerTitle: string
  variant?: 'dashed' | 'toolbar'
  catalogue: Catalogue
  allowCustom: boolean
  exclude: Set<string>
  onPick: (picked: PickedTarget) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === 'toolbar'
            ? 'inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-cocoa hover:border-cocoa'
            : 'flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-white/60 py-2.5 text-sm font-medium text-cocoa hover:border-cocoa hover:bg-white'
        }
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>
      {open && (
        <ItemPicker
          title={pickerTitle}
          catalogue={catalogue}
          allowCustom={allowCustom}
          exclude={exclude}
          onClose={() => setOpen(false)}
          onPick={(picked) => {
            onPick(picked)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

function ItemPicker({
  title,
  catalogue,
  allowCustom,
  exclude,
  onPick,
  onClose,
}: {
  title: string
  catalogue: Catalogue
  allowCustom: boolean
  exclude: Set<string>
  onPick: (picked: PickedTarget) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<MegaMenuLinkType>('collection')
  const [query, setQuery] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [customHref, setCustomHref] = useState('/')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const source = tab === 'collection' ? catalogue.collections : catalogue.products
  const q = query.trim().toLowerCase()
  const results = source.filter(
    (item) =>
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.handle.includes(q) ||
      item.category?.toLowerCase().includes(q)
  )

  const tabs: { id: MegaMenuLinkType; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'collection', label: 'Collections', count: catalogue.collections.length, icon: <Layers className="h-4 w-4" /> },
    { id: 'product', label: 'Products', count: catalogue.products.length, icon: <Package className="h-4 w-4" /> },
    ...(allowCustom ? [{ id: 'custom' as const, label: 'Custom link', icon: <Link2 className="h-4 w-4" /> }] : []),
  ]

  const customValid = customLabel.trim() && isValidCustomHref(customHref.trim())

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-cocoa/40 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <h3 className="truncate font-bake-display text-lg font-medium text-cocoa">{title}</h3>
          <IconButton title="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="space-y-3 border-b border-neutral-100 px-5 py-3">
          <div className={`grid gap-1 rounded-xl bg-neutral-100 p-1 ${tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition ${
                  tab === t.id ? 'bg-white text-cocoa shadow-sm' : 'text-neutral-500 hover:text-cocoa'
                }`}
              >
                <span className="hidden sm:inline">{t.icon}</span>
                <span className="truncate">{t.label}</span>
                {typeof t.count === 'number' && (
                  <span className="rounded-full bg-neutral-200/70 px-1.5 text-[10px] text-neutral-600">{t.count}</span>
                )}
              </button>
            ))}
          </div>
          {tab !== 'custom' && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${tab === 'collection' ? 'collections' : 'products'}…`}
                className={`${inputClass} pl-9`}
                autoFocus
              />
            </div>
          )}
        </div>

        {tab === 'custom' ? (
          <div className="space-y-4 p-5">
            <Field label="Link name">
              <input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Make Your Own Box"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="URL">
              <input
                value={customHref}
                onChange={(e) => setCustomHref(e.target.value)}
                placeholder="/cupcake-builder or https://…"
                className={inputClass}
              />
              {customHref.trim() && !isValidCustomHref(customHref.trim()) && (
                <p className="mt-1 text-xs text-red-600">Use a path like /page or a full https:// URL.</p>
              )}
            </Field>
            <button
              type="button"
              disabled={!customValid}
              onClick={() => onPick({ type: 'custom', label: customLabel.trim(), href: customHref.trim() })}
              className="w-full rounded-xl bg-cocoa py-2.5 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-40"
            >
              Add link
            </button>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {results.length === 0 && <li className="p-8 text-center text-sm text-neutral-500">Nothing matches “{query}”</li>}
            {results.map((item) => {
              const added = exclude.has(targetKey(tab, item.handle))
              return (
                <li key={item.handle}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => onPick({ type: tab as 'collection' | 'product', item })}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-cream disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Thumb src={item.image} className="h-11 w-11" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-cocoa">{item.title}</span>
                      <span className="block truncate text-xs text-neutral-400">
                        {tab === 'collection' && typeof item.productCount === 'number'
                          ? `${item.productCount} products · ${item.handle}`
                          : item.category || item.handle}
                      </span>
                    </span>
                    {added ? (
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500">Added</span>
                    ) : (
                      <>
                        {!item.visible && (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">Hidden</span>
                        )}
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-cocoa opacity-60 transition group-hover:border-cocoa group-hover:bg-cocoa group-hover:text-ivory group-hover:opacity-100">
                          <Plus className="h-4 w-4" />
                        </span>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body
  )
}
