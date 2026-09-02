'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { getCollections } from '@/app/admin/collections/collection-actions'
import { FAQ_PAGES, buildFaqPreviewPath, type FaqPageId } from '@/lib/faq-pages'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

interface FAQCategory {
  _id: string
  name: string
  order: number
  isActive: boolean
}

interface FAQ {
  _id: string
  question: string
  answer: string
  page: FaqPageId | string
  pageRef?: string
  category: FAQCategory | string | null
  order: number
  isActive: boolean
}

type RefOption = { handle: string; title: string }

const inputClass =
  'w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-cocoa focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

export default function FAQsPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'faqs' | 'categories'>('faqs')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'hidden'>('all')
  const [pageFilter, setPageFilter] = useState<FaqPageId>('homepage')
  const [pageRef, setPageRef] = useState('')
  const [collectionRefs, setCollectionRefs] = useState<RefOption[]>([])
  const [productRefs, setProductRefs] = useState<RefOption[]>([])
  const [storefrontCount, setStorefrontCount] = useState(0)

  const activePageDef = useMemo(() => FAQ_PAGES.find((p) => p.id === pageFilter), [pageFilter])
  const refOptions = pageFilter === 'collection' ? collectionRefs : pageFilter === 'product' ? productRefs : []

  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)

  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    page: 'homepage' as FaqPageId,
    pageRef: '',
    category: '',
    order: 0,
    isActive: true,
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    order: 0,
    isActive: true,
  })

  const getCategoryForFaq = useCallback(
    (faq: FAQ) => {
      const catId = typeof faq.category === 'object' ? faq.category?._id : faq.category
      if (!catId) return undefined
      return categories.find((c) => String(c._id) === String(catId))
    },
    [categories]
  )

  const isLiveOnStore = useCallback(
    (faq: FAQ) => {
      if (!faq.isActive) return false
      const faqPage = faq.page || 'homepage'
      if (faqPage !== 'homepage') return true
      const cat = getCategoryForFaq(faq)
      return Boolean(cat?.isActive)
    },
    [getCategoryForFaq]
  )

  const refreshStorefrontCount = useCallback(async (page: string, ref: string) => {
    if ((page === 'collection' || page === 'product') && !ref) {
      setStorefrontCount(0)
      return
    }
    const params = new URLSearchParams({ page })
    if (ref) params.set('ref', ref)
    const storeRes = await fetch(`/api/faqs?${params}`, { cache: 'no-store' })
    const storeData = await storeRes.json()
    if (storeData.success) setStorefrontCount(storeData.data?.faqs?.length ?? 0)
  }, [])

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const [catRes, faqRes] = await Promise.all([
        fetch('/api/admin/faq-categories'),
        fetch('/api/admin/faqs'),
      ])
      const catData = await catRes.json()
      const faqData = await faqRes.json()
      if (catData.success) setCategories(catData.data)
      if (faqData.success) setFaqs(faqData.data)
    } catch {
      toast.error('Failed to load FAQs')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    refreshStorefrontCount(pageFilter, pageRef)
  }, [pageFilter, pageRef, refreshStorefrontCount])

  useEffect(() => {
    async function loadRefs() {
      try {
        const [colResult, prodRes] = await Promise.all([
          getCollections({ limit: 500 }),
          fetch('/api/products?all=true'),
        ])
        if (colResult.success && colResult.collections) {
          setCollectionRefs(
            colResult.collections.map((c: { handle: string; title: string }) => ({
              handle: c.handle,
              title: c.title,
            }))
          )
        }
        const prodData = await prodRes.json()
        const list = prodData.products || prodData.data || []
        if (Array.isArray(list)) {
          setProductRefs(
            list.map((p: { handle: string; title: string }) => ({
              handle: p.handle,
              title: p.title,
            }))
          )
        }
      } catch {
        /* optional */
      }
    }
    loadRefs()
  }, [])

  const getCategoryName = (faq: FAQ) => {
    if (!faq.category) return 'Uncategorised'
    if (typeof faq.category === 'string') {
      return categories.find((c) => c._id === faq.category)?.name || 'Uncategorised'
    }
    return faq.category.name
  }

  const pageFaqs = faqs.filter((faq) => {
    const faqPage = faq.page || 'homepage'
    if (faqPage !== pageFilter) return false
    if (activePageDef?.needsRef) return faq.pageRef === pageRef
    return true
  })

  const filteredFaqs = pageFaqs.filter((faq) => {
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const catId = typeof faq.category === 'object' ? faq.category?._id : faq.category
    const matchesCategory =
      pageFilter !== 'homepage' || categoryFilter === 'all' || catId === categoryFilter
    const live = isLiveOnStore(faq)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'live' && live) ||
      (statusFilter === 'hidden' && !live)
    return matchesSearch && matchesCategory && matchesStatus
  })

  const saveFAQ = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error('Question and answer are required')
      return
    }
    if (faqForm.page === 'homepage' && !faqForm.category) {
      toast.error('Category is required for homepage FAQs')
      return
    }
    if ((faqForm.page === 'collection' || faqForm.page === 'product') && !faqForm.pageRef) {
      toast.error('Select a collection or product for this FAQ')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/faqs', {
        method: editingFAQ ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingFAQ
            ? { ...faqForm, _id: editingFAQ._id, category: faqForm.category || undefined }
            : { ...faqForm, category: faqForm.category || undefined }
        ),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingFAQ ? 'FAQ updated' : 'FAQ created')
        setShowFAQModal(false)
        await fetchData({ silent: true })
        await refreshStorefrontCount(pageFilter, pageRef)
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save FAQ')
    } finally {
      setSaving(false)
    }
  }

  const toggleFAQActive = async (faq: FAQ) => {
    const wasLive = isLiveOnStore(faq)
    const wantLive = !wasLive
    const faqPage = faq.page || 'homepage'
    const cat = getCategoryForFaq(faq)
    const categoryWasInactive = Boolean(cat && !cat.isActive)

    setFaqs((prev) =>
      prev.map((f) => (f._id === faq._id ? { ...f, isActive: wantLive } : f))
    )
    if (wantLive && faqPage === 'homepage' && categoryWasInactive && cat) {
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, isActive: true } : c))
      )
    }

    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: faq._id,
          isActive: wantLive,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update FAQ')
      }

      if (wantLive && faqPage === 'homepage' && categoryWasInactive && cat) {
        const catRes = await fetch('/api/admin/faq-categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: cat._id, isActive: true }),
        })
        const catData = await catRes.json()
        if (!catData.success) {
          throw new Error(catData.error || 'Failed to enable category')
        }
      }

      setFaqs((prev) => prev.map((f) => (f._id === faq._id ? { ...f, ...data.data } : f)))
      await refreshStorefrontCount(pageFilter, pageRef)
      toast.success(wantLive ? 'FAQ visible on storefront' : 'FAQ hidden')
    } catch (error) {
      setFaqs((prev) =>
        prev.map((f) => (f._id === faq._id ? { ...f, isActive: faq.isActive } : f))
      )
      if (wantLive && faqPage === 'homepage' && categoryWasInactive && cat) {
        setCategories((prev) =>
          prev.map((c) => (c._id === cat._id ? { ...c, isActive: false } : c))
        )
      }
      toast.error(error instanceof Error ? error.message : 'Failed to update')
    }
  }

  const deleteFAQ = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('FAQ deleted')
        await fetchData({ silent: true })
        await refreshStorefrontCount(pageFilter, pageRef)
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/faq-categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingCategory ? { ...categoryForm, _id: editingCategory._id } : categoryForm
        ),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created')
        setShowCategoryModal(false)
        await fetchData({ silent: true })
        await refreshStorefrontCount(pageFilter, pageRef)
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const toggleCategoryActive = async (cat: FAQCategory) => {
    const next = !cat.isActive
    setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: next } : c)))
    try {
      const res = await fetch('/api/admin/faq-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: cat._id, isActive: next }),
      })
      const data = await res.json()
      if (data.success) {
        await refreshStorefrontCount(pageFilter, pageRef)
      } else {
        setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: !next } : c)))
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: !next } : c)))
      toast.error('Failed to update')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? FAQs in it may show as uncategorised on the storefront.')) return
    try {
      const res = await fetch(`/api/admin/faq-categories?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Category deleted')
        await fetchData({ silent: true })
        await refreshStorefrontCount(pageFilter, pageRef)
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const openFAQModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq)
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        page: (faq.page as FaqPageId) || 'homepage',
        pageRef: faq.pageRef || '',
        category: faq.category && typeof faq.category === 'object' ? faq.category._id : String(faq.category || ''),
        order: faq.order,
        isActive: faq.isActive,
      })
    } else {
      setEditingFAQ(null)
      setFaqForm({
        question: '',
        answer: '',
        page: pageFilter,
        pageRef: activePageDef?.needsRef ? pageRef : '',
        category: categories[0]?._id || '',
        order: pageFaqs.length,
        isActive: true,
      })
    }
    setShowFAQModal(true)
  }

  const openCategoryModal = (cat?: FAQCategory) => {
    if (cat) {
      setEditingCategory(cat)
      setCategoryForm({ name: cat.name, order: cat.order, isActive: cat.isActive })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', order: categories.length, isActive: true })
    }
    setShowCategoryModal(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-cocoa" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">FAQs</h1>
          <p className="text-sm text-neutral-500">
            Manage every FAQ section on the site. {activePageDef?.label}: {storefrontCount} visible
            on the storefront right now.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => fetchData()}
            title="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-cocoa hover:border-rose-accent"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href={buildFaqPreviewPath(pageFilter, pageRef)}
            target="_blank"
            className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-cocoa hover:border-rose-accent sm:inline-flex"
          >
            Preview page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => openCategoryModal()}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa hover:border-rose-accent"
          >
            <Plus className="h-4 w-4" />
            Category
          </button>
          <button
            onClick={() => openFAQModal()}
            disabled={
              (pageFilter === 'homepage' && categories.length === 0) ||
              (Boolean(activePageDef?.needsRef) && !pageRef)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FAQ_PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPageFilter(p.id)
              setPageRef('')
              setCategoryFilter('all')
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              pageFilter === p.id
                ? 'border-cocoa bg-cocoa text-ivory'
                : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {activePageDef?.needsRef && (
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            {activePageDef.refLabel}
          </label>
          <select
            value={pageRef}
            onChange={(e) => setPageRef(e.target.value)}
            className="w-full max-w-md rounded-xl border border-neutral-200 px-3 py-2.5 text-sm sm:w-96"
          >
            <option value="">Select {activePageDef.refLabel?.toLowerCase()}…</option>
            {refOptions.map((r) => (
              <option key={r.handle} value={r.handle}>
                {r.title} ({r.handle})
              </option>
            ))}
          </select>
        </div>
      )}

      {pageFaqs.length === 0 && !(activePageDef?.needsRef && !pageRef) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">No FAQs for {activePageDef?.label} yet</p>
          <p className="mt-1 text-amber-800">Use &ldquo;Add FAQ&rdquo; to create one for this page.</p>
        </div>
      )}

      {pageFilter === 'homepage' && categories.length === 0 && pageFaqs.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Add a category before creating new homepage FAQs.
        </div>
      )}

      {activePageDef?.needsRef && !pageRef && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          Select a {activePageDef.refLabel?.toLowerCase()} above to manage its FAQs.
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="On storefront" value={String(storefrontCount)} />
        <StatCard
          label={pageFilter === 'homepage' ? 'Categories' : 'Page'}
          value={pageFilter === 'homepage' ? String(categories.length) : activePageDef?.label || '—'}
        />
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            activeTab === 'faqs'
              ? 'border-cocoa bg-cocoa text-ivory'
              : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
          }`}
        >
          FAQs ({pageFaqs.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
            activeTab === 'categories'
              ? 'border-cocoa bg-cocoa text-ivory'
              : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'faqs' ? (
        <>
          <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or answers…"
                  className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                />
              </div>
              {pageFilter === 'homepage' && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3 py-2.5 text-sm sm:w-48"
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { value: 'all', label: 'All' },
                  { value: 'live', label: 'On storefront' },
                  { value: 'hidden', label: 'Hidden' },
                ] as const
              ).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === s.value
                      ? 'border-cocoa bg-cocoa text-ivory'
                      : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {filteredFaqs.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-neutral-300" />
                <p className="mt-3 font-bake-display text-lg font-medium text-cocoa">No FAQs yet</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try a different search or filter.'
                    : 'Add your first FAQ to show on the homepage.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {filteredFaqs.map((faq, idx) => (
                  <motion.li
                    key={faq._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.12) }}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isLiveOnStore(faq)
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                          }`}
                        >
                          {isLiveOnStore(faq) ? 'On storefront' : 'Hidden'}
                        </span>
                        <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-cocoa">
                          {getCategoryName(faq)}
                        </span>
                        <span className="text-[10px] text-neutral-400">Order {faq.order}</span>
                      </div>
                      <p className="mt-2 font-bake-display text-sm font-medium text-cocoa">{faq.question}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{faq.answer}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => toggleFAQActive(faq)}
                        title={isLiveOnStore(faq) ? 'Hide from storefront' : 'Show on storefront'}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-cocoa"
                      >
                        {isLiveOnStore(faq) ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openFAQModal(faq)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-cocoa hover:bg-cream"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteFAQ(faq._id)}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-neutral-300" />
              <p className="mt-3 font-bake-display text-lg font-medium text-cocoa">No categories</p>
              <button
                onClick={() => openCategoryModal()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory"
              >
                <Plus className="h-4 w-4" />
                Add category
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {categories.map((cat) => (
                <li
                  key={cat._id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-cocoa">{cat.name}</p>
                    <p className="text-xs text-neutral-500">
                      Order {cat.order} · {faqs.filter((f) => getCategoryName(f) === cat.name).length} FAQs
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleCategoryActive(cat)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                    >
                      {cat.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openCategoryModal(cat)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-cream"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(cat._id)}
                      className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Modal open={showFAQModal} onClose={() => setShowFAQModal(false)} title={editingFAQ ? 'Edit FAQ' : 'Add FAQ'}>
        <div className="space-y-4">
          <Field label="Question *">
            <input
              value={faqForm.question}
              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Answer *">
            <textarea
              rows={5}
              value={faqForm.answer}
              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
              className={inputClass}
              placeholder="Plain text or simple HTML (e.g. We&rsquo;re bake-to-order…)"
            />
          </Field>
          <Field label="Page *">
            <select
              value={faqForm.page}
              onChange={(e) =>
                setFaqForm({
                  ...faqForm,
                  page: e.target.value as FaqPageId,
                  pageRef: '',
                  category: '',
                })
              }
              className={inputClass}
            >
              {FAQ_PAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          {(faqForm.page === 'collection' || faqForm.page === 'product') && (
            <Field label={faqForm.page === 'collection' ? 'Collection *' : 'Product *'}>
              <select
                value={faqForm.pageRef}
                onChange={(e) => setFaqForm({ ...faqForm, pageRef: e.target.value })}
                className={inputClass}
              >
                <option value="">Select…</option>
                {(faqForm.page === 'collection' ? collectionRefs : productRefs).map((r) => (
                  <option key={r.handle} value={r.handle}>
                    {r.title} ({r.handle})
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            {faqForm.page === 'homepage' && (
              <Field label="Category *">
                <select
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Sort order">
              <input
                type="number"
                value={faqForm.order}
                onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={faqForm.isActive}
              onChange={(e) => setFaqForm({ ...faqForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            Show on storefront
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setShowFAQModal(false)} className="rounded-xl px-4 py-2 text-sm hover:bg-neutral-100">
            Cancel
          </button>
          <button
            onClick={saveFAQ}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-2 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </Modal>

      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit category' : 'Add category'}
      >
        <div className="space-y-4">
          <Field label="Name *">
            <input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Delivery, Diet, Custom Orders"
            />
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              value={categoryForm.order}
              onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={categoryForm.isActive}
              onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            Active on storefront
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setShowCategoryModal(false)}
            className="rounded-xl px-4 py-2 text-sm hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            onClick={saveCategory}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-2 text-sm font-medium text-ivory hover:bg-rose-accent disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </Modal>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 font-bake-display text-2xl font-medium text-cocoa">{value}</p>
    </div>
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

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bake-display text-lg font-medium text-cocoa">{title}</h2>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
