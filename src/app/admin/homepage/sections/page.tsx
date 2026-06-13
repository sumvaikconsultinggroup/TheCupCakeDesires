'use client'

import ImageUpload from '@/components/ui/ImageUpload'
import {
  getDefaultHomepageSectionsConfig,
  HOMEPAGE_PRODUCT_SECTION_META,
  HOMEPAGE_SHOWCASE_SECTION_META,
  type HomepageProductSectionConfig,
  type HomepageProductSectionKey,
  type HomepageSectionsConfig,
  type HomepageShowcaseSectionConfig,
  type HomepageShowcaseSectionKey,
  type HomepageShowcaseTile,
} from '@/lib/homepage-sections-defaults'
import {
  Eye,
  GripVertical,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getHomepageSectionsSettings,
  getPublishedCollectionsForPicker,
  updateHomepageSectionsSettings,
} from '../sections-actions'

type CollectionOption = { handle: string; title: string; image: string }

function collectionCtaFromOption(col: CollectionOption | undefined) {
  if (!col) {
    return { ctaLabel: 'View collection', ctaHref: '' }
  }
  return {
    ctaLabel: `See all ${col.title.toLowerCase()}`,
    ctaHref: `/collections/${col.handle}`,
  }
}

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

export default function HomepageSectionsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sections, setSections] = useState<HomepageSectionsConfig>(
    getDefaultHomepageSectionsConfig()
  )
  const [collections, setCollections] = useState<CollectionOption[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [settingsRes, collectionsRes] = await Promise.all([
          getHomepageSectionsSettings(),
          getPublishedCollectionsForPicker(),
        ])
        if (settingsRes.success && settingsRes.settings?.sections) {
          setSections(settingsRes.settings.sections)
        } else {
          toast.error(settingsRes.message || 'Could not load homepage sections')
        }
        if (collectionsRes.success && collectionsRes.collections) {
          setCollections(collectionsRes.collections as CollectionOption[])
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateHomepageSectionsSettings(sections)
      if (res.success) {
        toast.success(res.message || 'Saved')
        if (res.settings?.sections) setSections(res.settings.sections)
      } else {
        toast.error(res.message || 'Failed to save')
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const updateProductSection = (
    key: HomepageProductSectionKey,
    patch: Partial<HomepageProductSectionConfig>
  ) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }))
  }

  const updateShowcaseSection = (
    key: HomepageShowcaseSectionKey,
    patch: Partial<HomepageShowcaseSectionConfig>
  ) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }))
  }

  const updateShowcaseTile = (
    sectionKey: HomepageShowcaseSectionKey,
    index: number,
    patch: Partial<HomepageShowcaseTile>
  ) => {
    setSections((prev) => {
      const section = prev[sectionKey]
      const tiles = section.tiles.map((tile, i) =>
        i === index ? { ...tile, ...patch } : tile
      )
      return { ...prev, [sectionKey]: { ...section, tiles } }
    })
  }

  const addShowcaseTile = (sectionKey: HomepageShowcaseSectionKey) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        tiles: [
          ...prev[sectionKey].tiles,
          {
            collectionHandle: collections[0]?.handle || '',
            imageOverride: '',
            tagline: '',
            blurb: '',
            badge: '',
            span: 'short',
          },
        ],
      },
    }))
  }

  const removeShowcaseTile = (sectionKey: HomepageShowcaseSectionKey, index: number) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        tiles: prev[sectionKey].tiles.filter((_, i) => i !== index),
      },
    }))
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">
            Homepage Sections
          </h1>
          <p className="text-sm text-neutral-600">
            Choose which collections appear in each homepage block and how they display. Collections
            themselves are managed under{' '}
            <Link href="/admin/collections" className="text-cocoa underline underline-offset-2">
              Catalog → Collections
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent"
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
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
        <p className="flex items-start gap-2">
          <Layers className="mt-0.5 h-4 w-4 shrink-0 text-rose-accent" />
          <span>
            <strong className="text-cocoa">Product sections</strong> show products from a single
            collection (grid or carousel). <strong className="text-cocoa">Showcase sections</strong>{' '}
            link to multiple collections as image tiles.
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {(Object.keys(HOMEPAGE_PRODUCT_SECTION_META) as HomepageProductSectionKey[]).map(
          (key) => (
            <ProductSectionEditor
              key={key}
              meta={HOMEPAGE_PRODUCT_SECTION_META[key]}
              config={sections[key]}
              collections={collections}
              onChange={(patch) => updateProductSection(key, patch)}
            />
          )
        )}

        {(Object.keys(HOMEPAGE_SHOWCASE_SECTION_META) as HomepageShowcaseSectionKey[]).map(
          (key) => (
            <ShowcaseSectionEditor
              key={key}
              meta={HOMEPAGE_SHOWCASE_SECTION_META[key]}
              config={sections[key]}
              collections={collections}
              onSectionChange={(patch) => updateShowcaseSection(key, patch)}
              onTileChange={(index, patch) => updateShowcaseTile(key, index, patch)}
              onAddTile={() => addShowcaseTile(key)}
              onRemoveTile={(index) => removeShowcaseTile(key, index)}
            />
          )
        )}
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-3 text-sm font-medium text-ivory shadow-lg transition hover:bg-rose-accent disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save all sections'}
        </button>
      </div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-rose-accent' : 'bg-neutral-300'
      }`}
      aria-label={label}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function CopyFields({
  config,
  onChange,
}: {
  config: Pick<
    HomepageProductSectionConfig,
    'eyebrow' | 'title' | 'titleAccent' | 'description' | 'ctaLabel' | 'ctaHref'
  >
  onChange: (patch: Partial<HomepageProductSectionConfig>) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Eyebrow">
        <input
          className={inputCls}
          value={config.eyebrow}
          onChange={(e) => onChange({ eyebrow: e.target.value })}
        />
      </Field>
      <Field label="Title">
        <input
          className={inputCls}
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>
      <Field label="Title accent (italic part)">
        <input
          className={inputCls}
          value={config.titleAccent}
          onChange={(e) => onChange({ titleAccent: e.target.value })}
        />
      </Field>
      <Field label="CTA label">
        <input
          className={inputCls}
          value={config.ctaLabel}
          onChange={(e) => onChange({ ctaLabel: e.target.value })}
        />
      </Field>
      <Field label="CTA link" className="sm:col-span-2">
        <input
          className={inputCls}
          value={config.ctaHref}
          onChange={(e) => onChange({ ctaHref: e.target.value })}
          placeholder="/collections/bestsellers"
        />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea
          className={inputCls}
          rows={3}
          value={config.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>
    </div>
  )
}

function ProductSectionEditor({
  meta,
  config,
  collections,
  onChange,
}: {
  meta: { label: string; description: string }
  config: HomepageProductSectionConfig
  collections: CollectionOption[]
  onChange: (patch: Partial<HomepageProductSectionConfig>) => void
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bake-display text-[20px] font-medium text-cocoa">{meta.label}</h2>
          <p className="text-sm text-neutral-600">{meta.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-cocoa">{config.enabled ? 'Visible' : 'Hidden'}</span>
          <Toggle
            checked={config.enabled}
            onChange={(enabled) => onChange({ enabled })}
            label={`Toggle ${meta.label}`}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Collection">
            <select
              className={inputCls}
              value={config.collectionHandle}
              onChange={(e) => {
                const handle = e.target.value
                const col = collections.find((c) => c.handle === handle)
                const cta = collectionCtaFromOption(col)
                onChange({
                  collectionHandle: handle,
                  ctaLabel: cta.ctaLabel,
                  ctaHref: cta.ctaHref,
                })
              }}
            >
              <option value="">— Select collection —</option>
              {collections.map((c) => (
                <option key={c.handle} value={c.handle}>
                  {c.title} ({c.handle})
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Layout">
              <select
                className={inputCls}
                value={config.layoutStyle}
                onChange={(e) =>
                  onChange({ layoutStyle: e.target.value as 'grid' | 'carousel' })
                }
              >
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
              </select>
            </Field>
            <Field label="Items per row">
              <input
                type="number"
                min={1}
                max={6}
                className={inputCls}
                value={config.itemsPerRow}
                onChange={(e) => onChange({ itemsPerRow: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max items">
              <input
                type="number"
                min={1}
                max={50}
                className={inputCls}
                value={config.maxItems}
                onChange={(e) => onChange({ maxItems: Number(e.target.value) })}
              />
            </Field>
          </div>
        </div>

        <CopyFields config={config} onChange={onChange} />
      </div>
    </section>
  )
}

function ShowcaseSectionEditor({
  meta,
  config,
  collections,
  onSectionChange,
  onTileChange,
  onAddTile,
  onRemoveTile,
}: {
  meta: { label: string; description: string }
  config: HomepageShowcaseSectionConfig
  collections: CollectionOption[]
  onSectionChange: (patch: Partial<HomepageShowcaseSectionConfig>) => void
  onTileChange: (index: number, patch: Partial<HomepageShowcaseTile>) => void
  onAddTile: () => void
  onRemoveTile: (index: number) => void
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bake-display text-[20px] font-medium text-cocoa">{meta.label}</h2>
          <p className="text-sm text-neutral-600">{meta.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-cocoa">{config.enabled ? 'Visible' : 'Hidden'}</span>
          <Toggle
            checked={config.enabled}
            onChange={(enabled) => onSectionChange({ enabled })}
            label={`Toggle ${meta.label}`}
          />
        </div>
      </div>

      <CopyFields config={config} onChange={onSectionChange} />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-cocoa">Collection tiles</h3>
          <button
            type="button"
            onClick={onAddTile}
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-cocoa hover:border-rose-accent"
          >
            <Plus className="h-4 w-4" />
            Add tile
          </button>
        </div>

        <div className="space-y-4">
          {config.tiles.map((tile, index) => (
            <div
              key={`${tile.collectionHandle}-${index}`}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  <GripVertical className="h-4 w-4" />
                  Tile {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveTile(index)}
                  className="text-neutral-400 hover:text-red-500"
                  aria-label="Remove tile"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <Field label="Collection">
                    <select
                      className={inputCls}
                      value={tile.collectionHandle}
                      onChange={(e) =>
                        onTileChange(index, { collectionHandle: e.target.value })
                      }
                    >
                      <option value="">— Select —</option>
                      {collections.map((c) => (
                        <option key={c.handle} value={c.handle}>
                          {c.title} ({c.handle})
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tagline">
                    <input
                      className={inputCls}
                      value={tile.tagline}
                      onChange={(e) => onTileChange(index, { tagline: e.target.value })}
                    />
                  </Field>
                  <Field label="Blurb">
                    <textarea
                      className={inputCls}
                      rows={2}
                      value={tile.blurb}
                      onChange={(e) => onTileChange(index, { blurb: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Badge">
                      <input
                        className={inputCls}
                        value={tile.badge}
                        onChange={(e) => onTileChange(index, { badge: e.target.value })}
                      />
                    </Field>
                    <Field label="Tile width">
                      <select
                        className={inputCls}
                        value={tile.span}
                        onChange={(e) =>
                          onTileChange(index, { span: e.target.value as 'short' | 'wide' })
                        }
                      >
                        <option value="short">Standard</option>
                        <option value="wide">Wide</option>
                      </select>
                    </Field>
                  </div>
                </div>
                <Field label="Image override (optional — leave empty to use collection image)">
                  <ImageUpload
                    value={tile.imageOverride}
                    onChange={(url) => onTileChange(index, { imageOverride: url })}
                    aspectRatio="video"
                    placeholder="Collection tile image"
                  />
                </Field>
              </div>
            </div>
          ))}

          {config.tiles.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-500">
              No tiles yet — add a collection tile above.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-cocoa">{label}</span>
      {children}
    </label>
  )
}
