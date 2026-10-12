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
  ExternalLink,
  Layers,
  Link2,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
    <div className="p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Navigation</h1>
          <p className="text-sm text-neutral-500">
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
        <div className="flex shrink-0 items-center gap-2">
          {isDirty && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              Unsaved changes
            </span>
          )}
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
            className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-cocoa hover:border-rose-accent sm:inline-flex"
          >
            Preview store
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={saveMenu}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {MENU_TABS.map((tab) => (
          <button
            key={tab.slug}
            onClick={() => selectTab(tab.slug)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeSlug === tab.slug
                ? 'border-cocoa bg-cocoa text-ivory'
                : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
            }`}
          >
            {menus.find((m) => m.slug === tab.slug)?.label || tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        <SectionCard title="Left — intro" hint="The menu name, the text under it and the “Shop all” link.">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2.5">
            <span className="text-sm font-medium text-cocoa">Show this menu in the header</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update((d) => void (d.isActive = e.target.checked))}
              className="h-4 w-4 accent-cocoa"
            />
          </label>
          <Field label="Menu name">
            <input
              value={form.label}
              onChange={(e) => update((d) => void (d.label = e.target.value))}
              maxLength={40}
              className={inputClass}
            />
          </Field>
          <Field label="“Shop all” link">
            <input
              value={form.href}
              onChange={(e) => update((d) => void (d.href = e.target.value))}
              placeholder="/collections/…"
              className={inputClass}
            />
            <select
              value=""
              onChange={(e) => e.target.value && update((d) => void (d.href = e.target.value))}
              className={`${inputClass} mt-2`}
            >
              <option value="">…or point it at a collection</option>
              {catalogue.collections.map((c) => (
                <option key={c.handle} value={`/collections/${c.handle}`}>
                  {c.title}
                </option>
              ))}
            </select>
            {!isValidCustomHref(form.href) && (
              <p className="mt-1 text-xs text-red-600">Use a path like /collections/… or a full https:// URL.</p>
            )}
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update((d) => void (d.description = e.target.value))}
              rows={5}
              maxLength={600}
              className={inputClass}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Centre — columns"
          hint={`Each column has a heading and a list of collections, products or links. Up to ${maxColumns} columns.`}
        >
          <div className="grid gap-4 md:grid-cols-2">
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
          {form.columns.length < maxColumns && (
            <button
              onClick={() => update((d) => void d.columns.push({ heading: 'New column', links: [] }))}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm text-cocoa hover:border-cocoa"
            >
              <Plus className="h-4 w-4" />
              Add column
            </button>
          )}
        </SectionCard>

        <SectionCard
          title={isEventLayout ? 'Right — featured cards' : 'Right — image'}
          hint={
            isEventLayout
              ? `Image cards beside the columns. Pick up to ${MAX_FEATURED} collections or products.`
              : 'Shown beside the columns; it swaps to each item’s photo on hover.'
          }
        >
          {isEventLayout ? (
            <div className="space-y-3">
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
              {form.featured.length < MAX_FEATURED && (
                <AddButton
                  label="Add featured card"
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
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {form.heroImage ? (
                <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-neutral-200 bg-cream-deep">
                  <Thumb src={form.heroImage} className="h-full w-full" />
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
                  No image yet
                </p>
              )}
              <AddButton
                label={form.heroImage ? 'Change image' : 'Choose image'}
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
          )}
        </SectionCard>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-cream/40 p-4 text-sm text-neutral-600">
        <span className="font-medium text-cocoa">How it stays in sync:</span> collection and product
        entries are checked on every page load. If one is unpublished or deleted it disappears from the
        menu automatically and comes back when it is live again. Hover <strong>{form.label}</strong> on
        the storefront after saving to preview.
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-cocoa focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

function SectionCard({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="font-bake-display text-base font-medium text-cocoa">{title}</h2>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      <div className="mt-4 space-y-4">{children}</div>
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

function Thumb({ src, className = 'h-9 w-9' }: { src?: string; className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-cream-deep ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Package className="absolute inset-0 m-auto h-3.5 w-3.5 text-cocoa-soft" />
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
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition disabled:opacity-30 ${
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
    <div className="rounded-xl border border-neutral-200 bg-cream/20 p-3">
      <div className="mb-3 flex items-center gap-1">
        <input
          value={column.heading}
          onChange={(e) => onChange({ ...column, heading: e.target.value })}
          placeholder="Column heading"
          maxLength={80}
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm font-medium text-cocoa"
        />
        <IconButton title="Move column left" onClick={() => onMove(-1)} disabled={index === 0}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton title="Move column right" onClick={() => onMove(1)} disabled={index === total - 1}>
          <ArrowRight className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton title="Remove column" onClick={onRemove} disabled={total <= 1} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <div className="space-y-1.5">
        {column.links.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-500">
            Empty column — it stays hidden on the site until you add something.
          </p>
        )}
        {column.links.map((link, linkIndex) => {
          const { item, warning } = lookup(link)
          const type = link.type || 'custom'
          return (
            <div
              key={`${entryKey(link) || link.href}-${linkIndex}`}
              className={`rounded-lg border bg-white p-2 ${warning ? 'border-amber-300' : 'border-neutral-200'}`}
            >
              <div className="flex items-center gap-2">
                <Thumb src={item?.image} />
                <div className="min-w-0 flex-1">
                  <input
                    value={link.label}
                    onChange={(e) => updateLink(linkIndex, { label: e.target.value })}
                    maxLength={120}
                    aria-label="Link name"
                    className="w-full rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium text-cocoa hover:border-neutral-200 focus:border-rose-accent focus:outline-none"
                  />
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 px-1.5">
                    <TypeBadge type={type} />
                    {type === 'custom' ? (
                      <input
                        value={link.href}
                        onChange={(e) => updateLink(linkIndex, { href: e.target.value })}
                        aria-label="Link URL"
                        className={`min-w-0 flex-1 rounded border px-1 text-[11px] ${
                          isValidCustomHref(link.href) ? 'border-neutral-200 text-neutral-500' : 'border-red-300 text-red-600'
                        }`}
                      />
                    ) : (
                      <span className="truncate text-[11px] text-neutral-400">{link.href}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <IconButton
                    title="Move up"
                    onClick={() => onChange({ ...column, links: move(column.links, linkIndex, linkIndex - 1) })}
                    disabled={linkIndex === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </IconButton>
                  <IconButton
                    title="Move down"
                    onClick={() => onChange({ ...column, links: move(column.links, linkIndex, linkIndex + 1) })}
                    disabled={linkIndex === column.links.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </IconButton>
                </div>
                <IconButton
                  title="Remove"
                  onClick={() => onChange({ ...column, links: column.links.filter((_, i) => i !== linkIndex) })}
                  danger
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
              {warning && (
                <p className="mt-1.5 flex items-center gap-1 px-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {warning}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3">
        <AddButton
          label="Add to column"
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
  return (
    <div className={`rounded-xl border bg-cream/20 p-3 ${warning ? 'border-amber-300' : 'border-neutral-200'}`}>
      <div className="flex gap-3">
        <Thumb src={card.image} className="h-16 w-16 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <TypeBadge type={card.type || 'custom'} />
            <span className="truncate text-[11px] text-neutral-400">{card.href}</span>
          </div>
          <input
            value={card.title}
            onChange={(e) => onChange({ ...card, title: e.target.value })}
            placeholder="Title"
            maxLength={120}
            className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-sm font-medium text-cocoa"
          />
          <input
            value={card.subtitle}
            onChange={(e) => onChange({ ...card, subtitle: e.target.value })}
            placeholder="Short line under the title"
            maxLength={160}
            className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
          <input
            value={card.badge || ''}
            onChange={(e) => onChange({ ...card, badge: e.target.value || undefined })}
            placeholder="Badge (optional, e.g. Most loved)"
            maxLength={40}
            className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
        </div>
        <div className="flex flex-col">
          <IconButton title="Move up" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowUp className="h-3 w-3" />
          </IconButton>
          <IconButton title="Move down" onClick={() => onMove(1)} disabled={index === total - 1}>
            <ArrowDown className="h-3 w-3" />
          </IconButton>
          <IconButton title="Remove card" onClick={onRemove} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      {warning && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-700">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {warning}
        </p>
      )}
    </div>
  )
}

function AddButton({
  label,
  catalogue,
  allowCustom,
  exclude,
  onPick,
}: {
  label: string
  catalogue: Catalogue
  allowCustom: boolean
  exclude: Set<string>
  onPick: (picked: PickedTarget) => void
}) {
  const [open, setOpen] = useState(false)
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-sm text-cocoa hover:border-cocoa"
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>
    )
  }
  return (
    <ItemPicker
      catalogue={catalogue}
      allowCustom={allowCustom}
      exclude={exclude}
      onClose={() => setOpen(false)}
      onPick={(picked) => {
        onPick(picked)
        setOpen(false)
      }}
    />
  )
}

function ItemPicker({
  catalogue,
  allowCustom,
  exclude,
  onPick,
  onClose,
}: {
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

  const source = tab === 'collection' ? catalogue.collections : catalogue.products
  const q = query.trim().toLowerCase()
  const results = source.filter(
    (item) => !q || item.title.toLowerCase().includes(q) || item.handle.includes(q) || item.category?.toLowerCase().includes(q)
  )

  const tabs: { id: MegaMenuLinkType; label: string; icon: React.ReactNode }[] = [
    { id: 'collection', label: `Collections (${catalogue.collections.length})`, icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'product', label: `Products (${catalogue.products.length})`, icon: <Package className="h-3.5 w-3.5" /> },
    ...(allowCustom ? [{ id: 'custom' as const, label: 'Custom link', icon: <Link2 className="h-3.5 w-3.5" /> }] : []),
  ]

  const customValid = customLabel.trim() && isValidCustomHref(customHref.trim())

  return (
    <div className="rounded-xl border border-rose-accent/40 bg-white p-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
              tab === t.id ? 'bg-cocoa text-ivory' : 'text-cocoa hover:bg-neutral-100'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <IconButton title="Close" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      {tab === 'custom' ? (
        <div className="space-y-2">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Link name, e.g. Make Your Own Box"
            className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
            autoFocus
          />
          <input
            value={customHref}
            onChange={(e) => setCustomHref(e.target.value)}
            placeholder="/cupcake-builder or https://…"
            className="w-full rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={!customValid}
            onClick={() => onPick({ type: 'custom', label: customLabel.trim(), href: customHref.trim() })}
            className="w-full rounded-lg bg-cocoa py-1.5 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-40"
          >
            Add link
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab === 'collection' ? 'collections' : 'products'}…`}
              className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-2.5 text-sm"
              autoFocus
            />
          </div>
          <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
            {results.length === 0 && <li className="p-3 text-center text-xs text-neutral-500">Nothing matches</li>}
            {results.map((item) => {
              const added = exclude.has(targetKey(tab, item.handle))
              return (
                <li key={item.handle}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => onPick({ type: tab as 'collection' | 'product', item })}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-cream disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <Thumb src={item.image} className="h-8 w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-cocoa">{item.title}</span>
                      <span className="block truncate text-[10px] text-neutral-400">
                        {item.handle}
                        {tab === 'collection' && typeof item.productCount === 'number' ? ` · ${item.productCount} products` : ''}
                      </span>
                    </span>
                    {added ? (
                      <span className="shrink-0 text-[10px] text-neutral-500">Added</span>
                    ) : !item.visible ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-1.5 text-[10px] text-amber-700">Hidden</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
