'use client'

import { getCollections } from '@/app/admin/collections/collection-actions'
import type {
  MegaMenuColumn,
  MegaMenuConfig,
  MegaMenuFeaturedCard,
  MegaMenuSlug,
} from '@/types/mega-menu'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  GripVertical,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const MENU_TABS: { slug: MegaMenuSlug; label: string }[] = [
  { slug: 'event', label: 'Event' },
  { slug: 'cupcakes', label: 'Cupcakes' },
  { slug: 'cakes', label: 'Cakes' },
  { slug: 'macarons', label: 'Macarons' },
]

interface CollectionOption {
  handle: string
  title: string
  description?: string
  image?: string
}

function collectionToLink(col: CollectionOption) {
  return {
    label: col.title,
    href: `/collections/${col.handle}`,
    collectionHandle: col.handle,
  }
}

function collectionToFeatured(col: CollectionOption, badge?: string): MegaMenuFeaturedCard {
  return {
    title: col.title,
    subtitle: col.description || '',
    href: `/collections/${col.handle}`,
    image: col.image || '',
    collectionHandle: col.handle,
    badge,
  }
}

export default function NavigationManagementPage() {
  const [menus, setMenus] = useState<MegaMenuConfig[]>([])
  const [activeSlug, setActiveSlug] = useState<MegaMenuSlug>('event')
  const [form, setForm] = useState<MegaMenuConfig | null>(null)
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchCollections = useCallback(async () => {
    const r = await getCollections({ limit: 500 })
    if (r.success && r.collections) {
      setCollections(
        r.collections.map(
          (c: { handle: string; title: string; description?: string; image?: string }) => ({
            handle: c.handle,
            title: c.title,
            description: c.description,
            image: c.image,
          })
        )
      )
    }
  }, [])

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/mega-menu')
      const data = await res.json()
      if (data.success) setMenus(data.data)
    } catch {
      toast.error('Failed to load navigation')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMenus()
    fetchCollections()
  }, [fetchMenus, fetchCollections])

  const selectTab = (slug: MegaMenuSlug) => {
    setActiveSlug(slug)
    const menu = menus.find((m) => m.slug === slug)
    if (menu) setForm(structuredClone(menu))
  }

  useEffect(() => {
    if (menus.length) {
      const menu = menus.find((m) => m.slug === activeSlug)
      if (menu) setForm(structuredClone(menu))
    }
  }, [menus, activeSlug])

  const getCollection = (handle: string) => collections.find((c) => c.handle === handle)

  const setShopAllCollection = (handle: string) => {
    if (!form) return
    const col = getCollection(handle)
    if (!col) return
    setForm({
      ...form,
      href: `/collections/${col.handle}`,
    })
  }

  const shopAllHandle =
    form?.href?.match(/^\/collections\/([^/?]+)/)?.[1] || ''

  const setHeroCollection = (handle: string) => {
    if (!form) return
    const col = getCollection(handle)
    if (!col) return
    setForm({
      ...form,
      href: `/collections/${col.handle}`,
      heroImage: col.image || form.heroImage,
      heroImageAlt: col.title,
    })
  }

  const heroHandle =
    form?.heroImage && shopAllHandle ? shopAllHandle : shopAllHandle

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
        toast.success(`${form.label} menu saved`)
        setMenus((prev) => prev.map((m) => (m.slug === form.slug ? data.data : m)))
        setForm(structuredClone(data.data))
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addCollectionToColumn = (colIndex: number, handle: string) => {
    if (!form) return
    const col = getCollection(handle)
    if (!col) return
    const exists = form.columns[colIndex].links.some((l) => l.collectionHandle === handle)
    if (exists) {
      toast.error('Collection already in this column')
      return
    }
    const next = structuredClone(form)
    next.columns[colIndex].links.push(collectionToLink(col))
    setForm(next)
  }

  const addFeaturedCollection = (handle: string) => {
    if (!form) return
    const col = getCollection(handle)
    if (!col) return
    if (form.featured.some((f) => f.collectionHandle === handle)) {
      toast.error('Collection already featured')
      return
    }
    const next = structuredClone(form)
    next.featured.push(collectionToFeatured(col))
    setForm(next)
  }

  if (loading || !form) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cocoa" />
      </div>
    )
  }

  const isEventLayout = form.layout === 'columns-featured'

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Navigation</h1>
          <p className="text-sm text-neutral-500">
            Pick collections from your catalogue — create them in{' '}
            <Link href="/admin/collections" className="font-medium text-cocoa underline hover:text-rose-accent">
              Collections
            </Link>{' '}
            first, then assign them to header menus here.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => {
              fetchMenus()
              fetchCollections()
            }}
            title="Refresh"
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
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {collections.length === 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No collections found.{' '}
          <Link href="/admin/collections" className="font-medium underline">
            Create collections
          </Link>{' '}
          before setting up navigation.
        </div>
      )}

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
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Left — intro text" hint="Menu name shows as the eyebrow label on the storefront.">
          <Field label="Shop all collection">
            <CollectionSelect
              collections={collections}
              value={shopAllHandle}
              onChange={setShopAllCollection}
              placeholder="Select collection for Shop all link…"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className={inputClass}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Centre — collections"
          hint="Choose which collections appear as links in each column."
        >
          <div className="space-y-4">
            {form.columns.map((col, colIndex) => (
              <ColumnEditor
                key={colIndex}
                column={col}
                collections={collections}
                excludeHandles={new Set(
                  col.links.map((l) => l.collectionHandle).filter(Boolean) as string[]
                )}
                onHeadingChange={(heading) => {
                  const next = structuredClone(form)
                  next.columns[colIndex].heading = heading
                  setForm(next)
                }}
                onAddCollection={(handle) => addCollectionToColumn(colIndex, handle)}
                onRemoveLink={(linkIndex) => {
                  const next = structuredClone(form)
                  next.columns[colIndex].links.splice(linkIndex, 1)
                  setForm(next)
                }}
                onRemoveColumn={() => {
                  const next = structuredClone(form)
                  next.columns.splice(colIndex, 1)
                  setForm(next)
                }}
                canRemoveColumn={form.columns.length > 1}
                getCollection={getCollection}
              />
            ))}
            {isEventLayout && (
              <button
                onClick={() => {
                  const next = structuredClone(form)
                  next.columns.push({ heading: 'New column', links: [] })
                  setForm(next)
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 py-2.5 text-sm text-cocoa hover:border-cocoa"
              >
                <Plus className="h-4 w-4" />
                Add column
              </button>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={isEventLayout ? 'Right — featured collections' : 'Right — hero collection'}
          hint={
            isEventLayout
              ? 'Pick up to 3 collections to show as image cards.'
              : 'Pick a collection — its image becomes the hero on the right.'
          }
        >
          {isEventLayout ? (
            <div className="space-y-3">
              {form.featured.map((card, cardIndex) => (
                <FeaturedCardRow
                  key={card.collectionHandle || cardIndex}
                  card={card}
                  collection={card.collectionHandle ? getCollection(card.collectionHandle) : undefined}
                  onBadgeChange={(badge) => {
                    const next = structuredClone(form)
                    next.featured[cardIndex].badge = badge || undefined
                    setForm(next)
                  }}
                  onRemove={() => {
                    const next = structuredClone(form)
                    next.featured.splice(cardIndex, 1)
                    setForm(next)
                  }}
                />
              ))}
              {form.featured.length < 3 && (
                <CollectionSelect
                  collections={collections.filter(
                    (c) => !form.featured.some((f) => f.collectionHandle === c.handle)
                  )}
                  value=""
                  onChange={addFeaturedCollection}
                  placeholder="+ Add featured collection…"
                />
              )}
            </div>
          ) : (
            <>
              <Field label="Hero collection">
                <CollectionSelect
                  collections={collections}
                  value={heroHandle}
                  onChange={setHeroCollection}
                  placeholder="Select collection for hero image…"
                />
              </Field>
              {form.heroImage && (
                <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-neutral-200">
                  <Image src={form.heroImage} alt="" fill className="object-cover" sizes="300px" />
                </div>
              )}
              {form.heroImage && (
                <p className="text-xs text-neutral-500">
                  Image from collection. Update the collection image in{' '}
                  <Link href="/admin/collections" className="text-cocoa underline">
                    Collections
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </SectionCard>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-6 rounded-2xl border border-line bg-cream/40 p-4 text-sm text-neutral-600"
      >
        <span className="font-medium text-cocoa">Tip:</span> Link labels, URLs, and images come from
        your collections automatically. Hover <strong>{form.label}</strong> on the storefront after
        saving to preview.
      </motion.div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-cocoa focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
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
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      {children}
    </div>
  )
}

function CollectionSelect({
  collections,
  value,
  onChange,
  placeholder,
}: {
  collections: CollectionOption[]
  value: string
  onChange: (handle: string) => void
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className={inputClass}
    >
      <option value="">{placeholder}</option>
      {collections.map((c) => (
        <option key={c.handle} value={c.handle}>
          {c.title}
        </option>
      ))}
    </select>
  )
}

function CollectionChip({
  title,
  image,
  handle,
  onRemove,
  legacy,
}: {
  title: string
  image?: string
  handle?: string
  onRemove: () => void
  legacy?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
        legacy ? 'border-amber-200 bg-amber-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-cream-deep">
        {image ? (
          <Image src={image} alt="" fill className="object-cover" sizes="32px" />
        ) : (
          <Package className="absolute inset-0 m-auto h-3.5 w-3.5 text-cocoa-soft" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-cocoa">{title}</p>
        {handle && <p className="truncate text-[10px] text-neutral-400">{handle}</p>}
        {legacy && (
          <p className="text-[10px] text-amber-700">Not linked — remove and re-add from collections</p>
        )}
      </div>
      <button onClick={onRemove} className="shrink-0 text-neutral-400 hover:text-red-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function ColumnEditor({
  column,
  collections,
  excludeHandles,
  onHeadingChange,
  onAddCollection,
  onRemoveLink,
  onRemoveColumn,
  canRemoveColumn,
  getCollection,
}: {
  column: MegaMenuColumn
  collections: CollectionOption[]
  excludeHandles: Set<string>
  onHeadingChange: (heading: string) => void
  onAddCollection: (handle: string) => void
  onRemoveLink: (index: number) => void
  onRemoveColumn: () => void
  canRemoveColumn: boolean
  getCollection: (handle: string) => CollectionOption | undefined
}) {
  const available = collections.filter((c) => !excludeHandles.has(c.handle))

  return (
    <div className="rounded-xl border border-neutral-100 bg-cream/20 p-3">
      <div className="mb-3 flex items-center gap-2">
        <GripVertical className="h-4 w-4 shrink-0 text-neutral-300" />
        <input
          value={column.heading}
          onChange={(e) => onHeadingChange(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm font-medium text-cocoa"
        />
        {canRemoveColumn && (
          <button onClick={onRemoveColumn} className="text-neutral-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {column.links.map((link, linkIndex) => {
          const col = link.collectionHandle ? getCollection(link.collectionHandle) : undefined
          return (
            <CollectionChip
              key={`${link.collectionHandle || link.href}-${linkIndex}`}
              title={col?.title || link.label}
              image={col?.image}
              handle={link.collectionHandle}
              legacy={!link.collectionHandle}
              onRemove={() => onRemoveLink(linkIndex)}
            />
          )
        })}
      </div>
      <div className="mt-3">
        <CollectionSelect
          collections={available}
          value=""
          onChange={onAddCollection}
          placeholder="+ Add collection…"
        />
      </div>
    </div>
  )
}

function FeaturedCardRow({
  card,
  collection,
  onBadgeChange,
  onRemove,
}: {
  card: MegaMenuFeaturedCard
  collection?: CollectionOption
  onBadgeChange: (badge: string) => void
  onRemove: () => void
}) {
  const image = collection?.image || card.image
  const title = collection?.title || card.title

  return (
    <div className="rounded-xl border border-neutral-100 bg-cream/20 p-3">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-cream-deep">
          {image ? (
            <Image src={image} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <Package className="absolute inset-0 m-auto h-5 w-5 text-cocoa-soft" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-cocoa">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
            {collection?.description || card.subtitle}
          </p>
          <input
            value={card.badge || ''}
            onChange={(e) => onBadgeChange(e.target.value)}
            placeholder="Badge (optional, e.g. Most loved)"
            className="mt-2 w-full rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
        </div>
        <button onClick={onRemove} className="shrink-0 self-start text-neutral-400 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
