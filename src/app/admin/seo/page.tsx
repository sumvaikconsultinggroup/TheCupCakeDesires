'use client'

import { siteConfig } from '@/lib/seo'
import {
  AlertCircle,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Loader2,
  Newspaper,
  Package,
  Search,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

type SeoTab = 'product' | 'collection' | 'blog' | 'pages'

interface Robots {
  index: boolean
  follow: boolean
  noarchive?: boolean
  nosnippet?: boolean
  noimageindex?: boolean
}

interface CatalogSeoItem {
  _id: string
  title: string
  handle?: string
  slug?: string
  status?: string
  seo?: {
    title?: string
    description?: string
    metaTitle?: string
    metaDescription?: string
    robots?: Robots
    canonical?: string
    canonicalUrl?: string
  }
}

interface PageSEOItem {
  _id?: string
  pageId: string
  pageName: string
  path: string
  robots: Robots
  canonical?: string
}

const TABS: { id: SeoTab; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'product', label: 'Products', icon: Package, hint: 'Product detail pages' },
  { id: 'collection', label: 'Collections', icon: Layers, hint: 'Collection listing pages' },
  { id: 'blog', label: 'Blog', icon: Newspaper, hint: 'Published & draft stories' },
  { id: 'pages', label: 'Static pages', icon: FileText, hint: 'Home, policies, contact, etc.' },
]

const ROBOT_FIELDS: { key: keyof Robots; label: string; hint: string; inverted?: boolean }[] = [
  { key: 'index', label: 'Index', hint: 'Allow search engines to index this URL' },
  { key: 'follow', label: 'Follow', hint: 'Allow crawlers to follow links on this page' },
  { key: 'noarchive', label: 'No archive', hint: 'Discourage cached copies in search results', inverted: true },
  { key: 'nosnippet', label: 'No snippet', hint: 'Hide text snippets in search results', inverted: true },
  { key: 'noimageindex', label: 'No image index', hint: 'Prevent images from appearing in image search', inverted: true },
]

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

const defaultRobots: Robots = { index: true, follow: true, noarchive: false, nosnippet: false, noimageindex: false }

function getItemPath(tab: SeoTab, item: CatalogSeoItem) {
  const slug = item.handle || item.slug || ''
  if (tab === 'product') return `/products/${slug}`
  if (tab === 'collection') return `/collections/${slug}`
  return `/blog/${slug}`
}

function getMetaTitle(tab: SeoTab, item: CatalogSeoItem) {
  if (tab === 'blog') return item.seo?.metaTitle || ''
  return item.seo?.title || ''
}

function getMetaDescription(tab: SeoTab, item: CatalogSeoItem) {
  if (tab === 'blog') return item.seo?.metaDescription || ''
  return item.seo?.description || ''
}

function getCanonical(item: CatalogSeoItem) {
  return item.seo?.canonical || item.seo?.canonicalUrl || ''
}

function defaultCanonical(tab: SeoTab, item: CatalogSeoItem) {
  return `${siteConfig.url}${getItemPath(tab, item)}`
}

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState<SeoTab>('product')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [items, setItems] = useState<CatalogSeoItem[]>([])
  const [pages, setPages] = useState<PageSEOItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'pages') {
        const res = await fetch('/api/admin/page-seo')
        const data = await res.json()
        if (data.success) {
          setPages(data.pages)
          setTotal(data.pages.length)
        } else {
          toast.error(data.message || 'Failed to load static pages')
        }
      } else {
        const params = new URLSearchParams({
          type: activeTab,
          query: debouncedQuery,
          page: String(page),
          limit: '10',
        })
        const res = await fetch(`/api/admin/seo?${params}`)
        const data = await res.json()
        if (data.success) {
          setItems(data.items)
          setTotalPages(data.totalPages)
          setTotal(data.total)
        } else {
          toast.error(data.message || 'Failed to load items')
        }
      }
    } catch {
      toast.error('Failed to fetch SEO data')
    } finally {
      setLoading(false)
    }
  }, [activeTab, debouncedQuery, page])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const patchCatalogItem = async (id: string, payload: Record<string, unknown>) => {
    setSaving(id)
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id, ...payload }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message || 'Update failed')
        return false
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item._id !== id) return item
          const nextSeo = { ...item.seo }
          if (payload.robots) nextSeo.robots = payload.robots as Robots
          if (payload.canonical !== undefined) {
            if (activeTab === 'blog') nextSeo.canonicalUrl = String(payload.canonical)
            else nextSeo.canonical = String(payload.canonical)
          }
          if (payload.title !== undefined) nextSeo.title = String(payload.title)
          if (payload.description !== undefined) nextSeo.description = String(payload.description)
          if (payload.metaTitle !== undefined) nextSeo.metaTitle = String(payload.metaTitle)
          if (payload.metaDescription !== undefined) {
            nextSeo.metaDescription = String(payload.metaDescription)
          }
          return { ...item, seo: nextSeo }
        })
      )
      toast.success('SEO saved')
      return true
    } catch {
      toast.error('Update failed')
      return false
    } finally {
      setSaving(null)
    }
  }

  const patchPageItem = async (pageId: string, payload: Record<string, unknown>) => {
    setSaving(pageId)
    try {
      const res = await fetch('/api/admin/page-seo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, ...payload }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message || 'Update failed')
        return false
      }
      setPages((prev) =>
        prev.map((p) => (p.pageId === pageId ? { ...p, ...payload } as PageSEOItem : p))
      )
      toast.success('Page SEO saved')
      return true
    } catch {
      toast.error('Update failed')
      return false
    } finally {
      setSaving(null)
    }
  }

  const indexedCount = useMemo(() => {
    if (activeTab === 'pages') {
      return pages.filter((p) => p.robots?.index !== false).length
    }
    return items.filter((i) => i.seo?.robots?.index !== false).length
  }, [activeTab, items, pages])

  const filteredPages = useMemo(() => {
    if (!debouncedQuery) return pages
    const q = debouncedQuery.toLowerCase()
    return pages.filter(
      (p) => p.pageName.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
    )
  }, [pages, debouncedQuery])

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">SEO Manager</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Control meta titles, descriptions, robots directives, and canonical URLs across products,
            collections, blog posts, and static storefront pages.
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-accent">
          <Globe className="h-6 w-6" />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Active tab" value={TABS.find((t) => t.id === activeTab)?.label || ''} />
        <StatCard
          label={activeTab === 'pages' ? 'Static pages' : 'Items loaded'}
          value={String(activeTab === 'pages' ? filteredPages.length : total)}
        />
        <StatCard label="Indexable" value={String(indexedCount)} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
                setQuery('')
                setDebouncedQuery('')
              }}
              className={`inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-cocoa text-ivory shadow-sm'
                  : 'text-cocoa-soft hover:bg-cream/70 hover:text-cocoa'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (activeTab !== 'pages') setPage(1)
          }}
          placeholder={
            activeTab === 'pages'
              ? 'Filter static pages…'
              : `Search ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}…`
          }
          className={`${inputCls} py-3.5 pl-11 pr-11`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-cocoa"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <p className="mt-2 text-xs text-neutral-500">
          {TABS.find((t) => t.id === activeTab)?.hint}
        </p>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-neutral-200 bg-white py-16">
            <Loader2 className="h-7 w-7 animate-spin text-rose-accent" />
          </div>
        ) : activeTab === 'pages' ? (
          filteredPages.length === 0 ? (
            <EmptyState label="No static pages match your search." />
          ) : (
            filteredPages.map((pageItem) => (
              <PageSeoCard
                key={pageItem.pageId}
                item={pageItem}
                saving={saving === pageItem.pageId}
                onToggleRobot={(key) => {
                  const current = pageItem.robots || defaultRobots
                  patchPageItem(pageItem.pageId, {
                    robots: { ...current, [key]: !current[key] },
                  })
                }}
                onCanonicalBlur={(value) => {
                  if (value === (pageItem.canonical || '')) return
                  patchPageItem(pageItem.pageId, { canonical: value })
                }}
              />
            ))
          )
        ) : items.length === 0 ? (
          <EmptyState label={`No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} found.`} />
        ) : (
          items.map((item) => (
            <CatalogSeoCard
              key={item._id}
              tab={activeTab}
              item={item}
              saving={saving === item._id}
              onToggleRobot={(key) => {
                const current = item.seo?.robots || defaultRobots
                patchCatalogItem(item._id, {
                  robots: { ...current, [key]: !current[key] },
                })
              }}
              onMetaTitleBlur={(value) => {
                const current = getMetaTitle(activeTab, item)
                if (value === current) return
                patchCatalogItem(
                  item._id,
                  activeTab === 'blog' ? { metaTitle: value } : { title: value }
                )
              }}
              onMetaDescriptionBlur={(value) => {
                const current = getMetaDescription(activeTab, item)
                if (value === current) return
                patchCatalogItem(
                  item._id,
                  activeTab === 'blog' ? { metaDescription: value } : { description: value }
                )
              }}
              onCanonicalBlur={(value) => {
                if (value === getCanonical(item)) return
                patchCatalogItem(item._id, { canonical: value })
              }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && activeTab !== 'pages' && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-cocoa transition hover:border-rose-accent disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-cocoa transition hover:border-rose-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">{label}</p>
      <p className="mt-1 font-bake-display text-xl font-medium text-cocoa">{value}</p>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16">
      <AlertCircle className="mb-3 h-10 w-10 text-neutral-300" />
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  )
}

function RobotsRow({
  robots,
  saving,
  onToggle,
}: {
  robots: Robots
  saving: boolean
  onToggle: (key: keyof Robots) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROBOT_FIELDS.map(({ key, label, hint, inverted }) => {
        const raw = robots[key] ?? (inverted ? false : true)
        const active = inverted ? !raw : Boolean(raw)
        return (
          <button
            key={key}
            type="button"
            title={hint}
            disabled={saving}
            onClick={() => onToggle(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
              active
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function CatalogSeoCard({
  tab,
  item,
  saving,
  onToggleRobot,
  onMetaTitleBlur,
  onMetaDescriptionBlur,
  onCanonicalBlur,
}: {
  tab: SeoTab
  item: CatalogSeoItem
  saving: boolean
  onToggleRobot: (key: keyof Robots) => void
  onMetaTitleBlur: (value: string) => void
  onMetaDescriptionBlur: (value: string) => void
  onCanonicalBlur: (value: string) => void
}) {
  const path = getItemPath(tab, item)
  const robots = item.seo?.robots || defaultRobots
  const metaTitle = getMetaTitle(tab, item)
  const metaDescription = getMetaDescription(tab, item)
  const canonical = getCanonical(item)

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-neutral-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bake-display text-lg font-medium text-cocoa">{item.title}</h3>
            {tab === 'blog' && item.status ? (
              <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cocoa-soft">
                {item.status}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-neutral-500">{item.handle || item.slug}</p>
        </div>
        <Link
          href={path}
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
        >
          Preview
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <Field label="Meta title" hint="Leave empty to use the item title on the storefront.">
          <input
            key={`${item._id}-title-${metaTitle}`}
            className={inputCls}
            defaultValue={metaTitle}
            placeholder={item.title}
            onBlur={(e) => onMetaTitleBlur(e.target.value.trim())}
          />
        </Field>
        <Field label="Meta description" hint="Recommended 150–160 characters.">
          <textarea
            key={`${item._id}-desc-${metaDescription}`}
            className={inputCls}
            rows={2}
            defaultValue={metaDescription}
            placeholder="Search engine description…"
            onBlur={(e) => onMetaDescriptionBlur(e.target.value.trim())}
          />
        </Field>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
          Robots directives
        </p>
        <RobotsRow robots={robots} saving={saving} onToggle={onToggleRobot} />
      </div>

      <Field
        label="Canonical URL override"
        hint={`Leave empty to use ${defaultCanonical(tab, item)}`}
      >
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            key={`${item._id}-canon-${canonical}`}
            className={`${inputCls} pl-10`}
            defaultValue={canonical}
            placeholder={defaultCanonical(tab, item)}
            onBlur={(e) => onCanonicalBlur(e.target.value.trim())}
          />
          {saving ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-rose-accent" />
          ) : null}
        </div>
      </Field>
    </article>
  )
}

function PageSeoCard({
  item,
  saving,
  onToggleRobot,
  onCanonicalBlur,
}: {
  item: PageSEOItem
  saving: boolean
  onToggleRobot: (key: keyof Robots) => void
  onCanonicalBlur: (value: string) => void
}) {
  const robots = item.robots || defaultRobots
  const canonical = item.canonical || ''
  const defaultCanon = `${siteConfig.url}${item.path}`

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-neutral-100 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="font-bake-display text-lg font-medium text-cocoa">{item.pageName}</h3>
          <p className="mt-1 text-xs text-neutral-500">{item.path}</p>
        </div>
        <Link
          href={item.path}
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
        >
          Preview
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
          Robots directives
        </p>
        <RobotsRow robots={robots} saving={saving} onToggle={onToggleRobot} />
      </div>

      <Field label="Canonical URL override" hint={`Leave empty to use ${defaultCanon}`}>
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            key={`${item.pageId}-canon-${canonical}`}
            className={`${inputCls} pl-10`}
            defaultValue={canonical}
            placeholder={defaultCanon}
            onBlur={(e) => onCanonicalBlur(e.target.value.trim())}
          />
          {saving ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-rose-accent" />
          ) : null}
        </div>
      </Field>
    </article>
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
      {hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  )
}
