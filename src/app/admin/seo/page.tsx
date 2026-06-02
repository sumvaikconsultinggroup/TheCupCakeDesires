'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, ChevronRight, Save, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Robots {
  index: boolean
  follow: boolean
  noarchive?: boolean
  nosnippet?: boolean
  noimageindex?: boolean
}

interface SEOItem {
  _id: string
  title: string
  handle?: string
  slug?: string
  seo?: {
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

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState<'product' | 'collection' | 'combo' | 'blog' | 'pages'>('product')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SEOItem[]>([])
  const [pages, setPages] = useState<PageSEOItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchItems = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pages') {
        const res = await fetch('/api/admin/page-seo')
        const data = await res.json()
        if (data.success) {
          setPages(data.pages)
        }
      } else {
        const res = await fetch(`/api/admin/seo?type=${activeTab}&query=${query}&page=${page}&limit=10`)
        const data = await res.json()
        if (data.success) {
          setItems(data.items)
          setTotalPages(data.totalPages)
        }
      }
    } catch (error) {
      toast.error('Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [activeTab, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchItems()
  }

  const updateSEO = async (id: string, payload: any) => {
    setSaving(id)
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id, ...payload })
      })
      const data = await res.json()
      if (data.success) {
        setItems(items.map(item => item._id === id ? { ...item, seo: { ...item.seo, ...payload } } : item))
        toast.success('SEO updated')
      } else {
        toast.error(data.message || 'Update failed')
      }
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setSaving(null)
    }
  }

  const updatePageSEO = async (pageId: string, payload: any) => {
    setSaving(pageId)
    try {
      const res = await fetch('/api/admin/page-seo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, ...payload })
      })
      const data = await res.json()
      if (data.success) {
        setPages(pages.map(p => p.pageId === pageId ? { ...p, ...payload } : p))
        toast.success('Page SEO updated')
      } else {
        toast.error(data.message || 'Update failed')
      }
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setSaving(null)
    }
  }

  const toggleRobot = (item: SEOItem, key: keyof Robots) => {
    const currentRobots = item.seo?.robots || { index: true, follow: true }
    const newRobots = { ...currentRobots, [key]: !currentRobots[key] }
    updateSEO(item._id, { robots: newRobots })
  }

  const togglePageRobot = (pageItem: PageSEOItem, key: keyof Robots) => {
    const currentRobots = pageItem.robots || { index: true, follow: true }
    const newRobots = { ...currentRobots, [key]: !currentRobots[key] }
    updatePageSEO(pageItem.pageId, { robots: newRobots })
  }

  const handleCanonicalBlur = (item: SEOItem, value: string) => {
    const currentCanonical = item.seo?.canonical || item.seo?.canonicalUrl || ''
    if (value === currentCanonical) return
    updateSEO(item._id, { canonical: value })
  }

  const handlePageCanonicalBlur = (pageItem: PageSEOItem, value: string) => {
    const currentCanonical = pageItem.canonical || ''
    if (value === currentCanonical) return
    updatePageSEO(pageItem.pageId, { canonical: value })
  }

  // Get the handle/slug for display
  const getItemHandle = (item: SEOItem) => item.handle || item.slug || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">SEO Management</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage robots tags and canonical URLs</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2e1f15]/10 text-[#2e1f15]">
          <Globe className="h-6 w-6" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl bg-white p-1 shadow-sm dark:bg-neutral-800">
        {[
          { id: 'product', label: 'Products' },
          { id: 'collection', label: 'Collections' },
          { id: 'combo', label: 'Combos' },
          { id: 'blog', label: 'Blog Posts' },
          { id: 'pages', label: 'Pages' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any)
              setPage(1)
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#2e1f15] text-white shadow-lg'
                : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search - hide for pages */}
      {activeTab !== 'pages' && (
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'blog' ? 'blog posts' : activeTab + 's'}...`}
            className="w-full rounded-2xl border border-neutral-200 bg-white py-4 pl-12 pr-4 outline-none transition-all focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </form>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#2e1f15]" />
          </div>
        ) : activeTab === 'pages' ? (
          pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 dark:bg-neutral-800">
              <AlertCircle className="mb-4 h-12 w-12 text-neutral-300" />
              <p className="text-neutral-500">No pages found</p>
            </div>
          ) : (
            pages.map((pageItem) => (
              <div
                key={pageItem.pageId}
                className="group flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-neutral-800 lg:p-8"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-lg font-bold text-neutral-900 dark:text-white">{pageItem.pageName}</h3>
                    <p className="truncate text-xs text-neutral-500">{pageItem.path}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <RobotsToggle
                      label="Index"
                      active={pageItem.robots?.index ?? true}
                      onToggle={() => togglePageRobot(pageItem, 'index')}
                      loading={saving === pageItem.pageId}
                    />
                    <RobotsToggle
                      label="Follow"
                      active={pageItem.robots?.follow ?? true}
                      onToggle={() => togglePageRobot(pageItem, 'follow')}
                      loading={saving === pageItem.pageId}
                    />
                    <RobotsToggle
                      label="NoArchive"
                      active={pageItem.robots?.noarchive ?? false}
                      onToggle={() => togglePageRobot(pageItem, 'noarchive')}
                      loading={saving === pageItem.pageId}
                    />
                    <RobotsToggle
                      label="NoSnippet"
                      active={pageItem.robots?.nosnippet ?? false}
                      onToggle={() => togglePageRobot(pageItem, 'nosnippet')}
                      loading={saving === pageItem.pageId}
                    />
                  </div>
                </div>

                {/* Canonical URL Input */}
                <div className="relative pt-4 border-t border-neutral-100 dark:border-neutral-700">
                  <label className="mb-2 block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Canonical URL Override
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      defaultValue={pageItem.canonical || ''}
                      onBlur={(e) => handlePageCanonicalBlur(pageItem, e.target.value)}
                      placeholder={`e.g., https://cupcakedesires.com${pageItem.path}`}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#2e1f15] focus:bg-white dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    {saving === pageItem.pageId && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#2e1f15]" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-neutral-400">
                    Leave empty to use the default self-referencing URL.
                  </p>
                </div>
              </div>
            ))
          )
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-12 dark:bg-neutral-800">
            <AlertCircle className="mb-4 h-12 w-12 text-neutral-300" />
            <p className="text-neutral-500">No {activeTab === 'blog' ? 'blog posts' : activeTab + 's'} found</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="group flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-neutral-800 lg:p-8"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-lg font-bold text-neutral-900 dark:text-white">{item.title}</h3>
                  <p className="truncate text-xs text-neutral-500">{getItemHandle(item)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <RobotsToggle
                    label="Index"
                    active={item.seo?.robots?.index ?? true}
                    onToggle={() => toggleRobot(item, 'index')}
                    loading={saving === item._id}
                  />
                  <RobotsToggle
                    label="Follow"
                    active={item.seo?.robots?.follow ?? true}
                    onToggle={() => toggleRobot(item, 'follow')}
                    loading={saving === item._id}
                  />
                  <RobotsToggle
                    label="NoArchive"
                    active={item.seo?.robots?.noarchive ?? false}
                    onToggle={() => toggleRobot(item, 'noarchive')}
                    loading={saving === item._id}
                  />
                  <RobotsToggle
                    label="NoSnippet"
                    active={item.seo?.robots?.nosnippet ?? false}
                    onToggle={() => toggleRobot(item, 'nosnippet')}
                    loading={saving === item._id}
                  />
                </div>
              </div>

              {/* Canonical URL Input */}
              <div className="relative pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <label className="mb-2 block text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Canonical URL Override
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    defaultValue={item.seo?.canonical || item.seo?.canonicalUrl || ''}
                    onBlur={(e) => handleCanonicalBlur(item, e.target.value)}
                    placeholder={`e.g., https://cupcakedesires.com/${activeTab === 'blog' ? 'blog' : activeTab + 's'}/${getItemHandle(item)}`}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#2e1f15] focus:bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  {saving === item._id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#2e1f15]" />
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-neutral-400">
                  Leave empty to use the default self-referencing URL.
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination - hide for pages */}
      {!loading && activeTab !== 'pages' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
          >
            Previous
          </button>
          <span className="text-sm font-medium">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function RobotsToggle({ label, active, onToggle, loading }: { label: string; active: boolean; onToggle: () => void; loading: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
        active
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
      }`}
    >
      <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-neutral-400'}`} />
      {label}
      {active ? <Check className="h-3 w-3" /> : null}
    </button>
  )
}
