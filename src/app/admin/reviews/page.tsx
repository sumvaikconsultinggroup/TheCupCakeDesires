'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ui/ImageUpload'
import {
  Plus,
  Save,
  X,
  Search,
  Star,
  Check,
  CheckCircle,
  Download,
  Upload,
  MessageSquare,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  FileSpreadsheet,
  MoreVertical,
} from 'lucide-react'

const ITEMS_PER_PAGE = 20

type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface ReviewRow {
  _id: string
  productId: string
  productHandle: string
  productTitle: string
  productImage?: string
  customerName: string
  customerEmail: string
  rating: number
  title: string
  content: string
  images: string[]
  status: ReviewStatus
  isVerifiedPurchase: boolean
  source: 'website' | 'import' | 'manual'
  adminNotes?: string
  createdAt: string
}

interface ReviewStats {
  totalReviews: number
  approved: number
  pending: number
  rejected: number
}

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingReview, setEditingReview] = useState<ReviewRow | null>(null)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null)

  const [form, setForm] = useState({
    productHandle: '',
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    content: '',
    images: [] as string[],
    status: 'approved' as ReviewStatus,
    adminNotes: '',
  })

  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [importData, setImportData] = useState<Record<string, string>[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())

  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<
    { _id: string; handle: string; title: string; image: string; price: number }[]
  >([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{ handle: string; title: string } | null>(
    null
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: debouncedSearch,
        status: statusFilter,
        rating: ratingFilter,
      })

      const res = await fetch(`/api/admin/reviews?${params}`)
      if (!res.ok) return

      const data = await res.json()
      if (data.success) {
        setReviews(data.data)
        setStats(data.stats || { totalReviews: 0, approved: 0, pending: 0, rejected: 0 })
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalItems(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, ratingFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch.trim()) searchProducts(productSearch)
      else setProductOptions([])
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const searchProducts = async (query: string) => {
    setSearchingProducts(true)
    try {
      const res = await fetch(`/api/admin/reviews/products?search=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success) setProductOptions(data.data)
    } catch {
      setProductOptions([])
    } finally {
      setSearchingProducts(false)
    }
  }

  const selectProduct = (product: { handle: string; title: string }) => {
    setSelectedProduct(product)
    setForm((f) => ({ ...f, productHandle: product.handle }))
    setProductSearch('')
    setProductOptions([])
    setShowProductDropdown(false)
  }

  const resetForm = () => {
    setForm({
      productHandle: '',
      customerName: '',
      customerEmail: '',
      rating: 5,
      title: '',
      content: '',
      images: [],
      status: 'approved',
      adminNotes: '',
    })
    setSelectedProduct(null)
    setProductSearch('')
    setProductOptions([])
  }

  const openModal = (review?: ReviewRow) => {
    if (review) {
      setEditingReview(review)
      setSelectedProduct({ handle: review.productHandle, title: review.productTitle })
      setForm({
        productHandle: review.productHandle,
        customerName: review.customerName,
        customerEmail: review.customerEmail,
        rating: review.rating,
        title: review.title,
        content: review.content,
        images: review.images || [],
        status: review.status,
        adminNotes: review.adminNotes || '',
      })
    } else {
      setEditingReview(null)
      resetForm()
    }
    setShowModal(true)
  }

  const saveReview = async () => {
    if (!form.productHandle || !form.customerName || !form.customerEmail || !form.title || !form.content) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const url = editingReview ? `/api/admin/reviews/${editingReview._id}` : '/api/admin/reviews'
      const res = await fetch(url, {
        method: editingReview ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(editingReview ? 'Review updated' : 'Review created')
        setShowModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: ReviewStatus) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Review ${status}`)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Review deleted')
        fetchData()
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedReviews.size === 0) {
      toast.error('No reviews selected')
      return
    }
    if (action === 'delete' && !confirm(`Delete ${selectedReviews.size} reviews?`)) return

    try {
      const res = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewIds: Array.from(selectedReviews) }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSelectedReviews(new Set())
        fetchData()
      }
    } catch {
      toast.error('Bulk action failed')
    }
  }

  const handleGlobalAction = async (action: 'approve_all_pending' | 'reject_all_pending') => {
    const msg =
      action === 'approve_all_pending'
        ? 'Approve all pending reviews?'
        : 'Reject all pending reviews?'
    if (!confirm(msg)) return

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch {
      toast.error('Action failed')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedReviews((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set())
    } else {
      setSelectedReviews(new Set(reviews.map((r) => r._id)))
    }
  }

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter((line) => line.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const rows: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const values =
        lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((v) => v.replace(/^"|"$/g, '').trim()) ||
        []
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] || ''
      })
      rows.push(row)
    }
    return rows
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string)
      if (parsed.length === 0) {
        toast.error('No valid data found in CSV')
        return
      }
      setImportData(parsed)
      setImportStep('preview')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImportStep('importing')
    setImportProgress(0)
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      const res = await fetch('/api/admin/reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: importData, overwriteExisting }),
      })
      const data = await res.json()
      clearInterval(progressInterval)
      setImportProgress(100)

      if (data.success) {
        setImportResult({
          imported: data.imported,
          skipped: data.skipped,
          errors: data.errors || [],
        })
        setImportStep('complete')
        fetchData()
      } else {
        toast.error(data.error || 'Import failed')
        setImportStep('preview')
      }
    } catch {
      clearInterval(progressInterval)
      toast.error('Import failed')
      setImportStep('preview')
    }
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportStep('upload')
    setImportData([])
    setImportResult(null)
    setOverwriteExisting(false)
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const statusTabs = [
    { value: 'all' as const, label: 'All', count: stats.totalReviews },
    { value: 'pending' as const, label: 'Pending', count: stats.pending },
    { value: 'approved' as const, label: 'Approved', count: stats.approved },
    { value: 'rejected' as const, label: 'Rejected', count: stats.rejected },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Reviews</h1>
          <p className="text-sm text-neutral-500">
            {stats.pending > 0 ? (
              <>
                <span className="font-medium text-amber-700">{stats.pending} pending</span>
                <span className="mx-1.5 text-neutral-300">·</span>
              </>
            ) : null}
            {stats.totalReviews} total
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowHeaderMenu((v) => !v)}
              title="More actions"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showHeaderMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowHeaderMenu(false)} />
                <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setShowImportModal(true)
                      setShowHeaderMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cocoa hover:bg-cream/60"
                  >
                    <Upload className="h-4 w-4 text-neutral-400" />
                    Import CSV
                  </button>
                  <button
                    onClick={() => {
                      window.open('/api/admin/reviews/sample-csv', '_blank')
                      setShowHeaderMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-cocoa hover:bg-cream/60"
                  >
                    <Download className="h-4 w-4 text-neutral-400" />
                    Sample CSV
                  </button>
                  {stats.pending > 0 && (
                    <button
                      onClick={() => {
                        handleGlobalAction('approve_all_pending')
                        setShowHeaderMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve all pending
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add review</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews…"
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15 lg:w-36"
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {statusTabs.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value)
                setPage(1)
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s.value
                  ? 'border-cocoa bg-cocoa text-ivory'
                  : 'border-neutral-200 bg-white text-cocoa hover:border-rose-accent'
              }`}
            >
              {s.label}
              <span className={`ml-1.5 ${statusFilter === s.value ? 'text-ivory/80' : 'text-neutral-400'}`}>
                {s.count}
              </span>
            </button>
          ))}

          {selectedReviews.size > 0 && (
            <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-3">
              <span className="text-xs text-neutral-500">{selectedReviews.size} selected</span>
              <button
                onClick={() => handleBulkAction('approve')}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="text-xs font-medium text-red-700 hover:underline"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-xs font-medium text-neutral-600 hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Reviews table */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="hidden border-b border-neutral-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 lg:grid lg:grid-cols-[auto_2fr_1.5fr_auto] lg:items-center lg:gap-4">
          <span className="w-8">
            <input
              type="checkbox"
              checked={reviews.length > 0 && selectedReviews.size === reviews.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-neutral-300"
            />
          </span>
          <span>Review</span>
          <span>Product</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <ul className="divide-y divide-neutral-200">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-5">
                <div className="h-4 w-4 animate-pulse rounded bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 font-bake-display text-[18px] font-medium text-cocoa">No reviews found</p>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all'
                ? 'Try a different filter or search term.'
                : 'Customer reviews will appear here once submitted from product pages.'}
            </p>
            <button
              onClick={() => openModal()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2 text-sm font-medium text-ivory hover:bg-rose-accent"
            >
              <Plus className="h-4 w-4" />
              Add review manually
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {reviews.map((review, idx) => (
              <motion.li
                key={review._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.15) }}
                className="grid grid-cols-1 gap-4 px-6 py-5 transition-colors hover:bg-cream/40 lg:grid-cols-[auto_2fr_1.5fr_auto] lg:items-start lg:gap-4"
              >
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedReviews.has(review._id)}
                    onChange={() => toggleSelect(review._id)}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-cocoa">{review.customerName}</span>
                    <StarRating rating={review.rating} />
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[review.status]}`}
                    >
                      {review.status}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span title="Verified purchase">
                        <Shield className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">· {formatDate(review.createdAt)}</span>
                  </div>
                  <p className="mt-1 font-bake-display text-sm font-medium text-cocoa">{review.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{review.content}</p>
                  {review.images?.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {review.images.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="relative h-12 w-12 overflow-hidden rounded-lg border border-neutral-200"
                        >
                          <Image src={img} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 items-start gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                    {review.productImage ? (
                      <Image
                        src={review.productImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-4 w-4 text-cocoa-soft" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${review.productHandle}`}
                      className="font-bake-display block truncate text-sm font-medium text-cocoa transition hover:text-rose-accent"
                    >
                      {review.productTitle}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">{review.productHandle}</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-end gap-1">
                  {review.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(review._id, 'approved')}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => setOpenRowMenu(openRowMenu === review._id ? null : review._id)}
                    className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-cocoa"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openRowMenu === review._id && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setOpenRowMenu(null)} />
                      <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                        {review.status !== 'approved' && (
                          <button
                            onClick={() => {
                              updateStatus(review._id, 'approved')
                              setOpenRowMenu(null)
                            }}
                            className="flex w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                          >
                            Approve
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => {
                              updateStatus(review._id, 'rejected')
                              setOpenRowMenu(null)
                            }}
                            className="flex w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => {
                            openModal(review)
                            setOpenRowMenu(null)
                          }}
                          className="flex w-full px-3 py-2 text-left text-sm text-cocoa hover:bg-cream/60"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            deleteReview(review._id)
                            setOpenRowMenu(null)
                          }}
                          className="flex w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}

        {!loading && reviews.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 text-sm">
            <p className="text-neutral-600">
              {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalItems)} of{' '}
              {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-neutral-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="font-bake-display text-lg font-medium text-cocoa">
                  {editingReview ? 'Edit review' : 'Add review'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-cocoa"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Product */}
                  <div className="relative">
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Product *</label>
                    {editingReview || selectedProduct ? (
                      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-cream/30 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-cocoa-soft" />
                          <span className="font-medium text-cocoa">
                            {selectedProduct?.title || form.productHandle}
                          </span>
                        </div>
                        {!editingReview && (
                          <button
                            onClick={() => {
                              setSelectedProduct(null)
                              setForm((f) => ({ ...f, productHandle: '' }))
                            }}
                            className="text-neutral-400 hover:text-cocoa"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => {
                              setProductSearch(e.target.value)
                              setShowProductDropdown(true)
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                            placeholder="Search products…"
                            className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                          />
                          {searchingProducts && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
                          )}
                        </div>
                        {showProductDropdown && productOptions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg">
                            <div className="max-h-48 overflow-y-auto">
                              {productOptions.map((product) => (
                                <button
                                  key={product.handle}
                                  onClick={() => selectProduct(product)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cream/40"
                                >
                                  {product.image ? (
                                    <Image
                                      src={product.image}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className="rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-deep">
                                      <Package className="h-4 w-4 text-cocoa-soft" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-cocoa">{product.title}</p>
                                    <p className="text-xs text-neutral-500">
                                      ${product.price?.toLocaleString('en-AU')}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-cocoa">Customer name *</label>
                      <input
                        type="text"
                        value={form.customerName}
                        onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-cocoa">Email *</label>
                      <input
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Rating *</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setForm((f) => ({ ...f, rating: star }))}>
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              star <= form.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-neutral-200 text-neutral-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      maxLength={200}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Content *</label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                      rows={4}
                      maxLength={2000}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                    />
                    <p className="mt-1 text-xs text-neutral-400">{form.content.length}/2000</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Images</label>
                    {form.images.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="group relative h-16 w-16 overflow-hidden rounded-lg">
                            <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                            <button
                              onClick={() =>
                                setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
                              }
                              className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 opacity-0 transition group-hover:opacity-100"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ImageUpload
                      value=""
                      onChange={(url) => {
                        if (url && !form.images.includes(url)) {
                          setForm((f) => ({ ...f, images: [...f.images, url] }))
                        }
                      }}
                      placeholder="Add review image"
                      aspectRatio="square"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value as ReviewStatus }))
                      }
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-cocoa">Admin notes</label>
                    <textarea
                      value={form.adminNotes}
                      onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
                      rows={2}
                      placeholder="Internal notes (not shown to customers)"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReview}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingReview ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={closeImportModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cocoa/10">
                    <FileSpreadsheet className="h-5 w-5 text-cocoa" />
                  </span>
                  <div>
                    <h2 className="font-bake-display text-lg font-medium text-cocoa">Import reviews</h2>
                    <p className="text-sm text-neutral-500">
                      {importStep === 'upload' && 'Upload a CSV file'}
                      {importStep === 'preview' && `${importData.length} reviews ready`}
                      {importStep === 'importing' && 'Importing…'}
                      {importStep === 'complete' && 'Import complete'}
                    </p>
                  </div>
                </div>
                <button onClick={closeImportModal} className="rounded-lg p-2 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto p-6">
                {importStep === 'upload' && (
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        const file = e.dataTransfer.files[0]
                        if (file) handleFileSelect(file)
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition ${
                        isDragging
                          ? 'border-rose-accent bg-rose-accent/5'
                          : 'border-neutral-300 hover:border-cocoa hover:bg-cream/30'
                      }`}
                    >
                      <Upload className={`mb-3 h-10 w-10 ${isDragging ? 'text-rose-accent' : 'text-neutral-400'}`} />
                      <p className="font-medium text-cocoa">Drop CSV here or click to browse</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                    <div className="rounded-xl bg-cream/60 p-4 text-sm text-neutral-600">
                      <p className="font-medium text-cocoa">Required columns</p>
                      <p className="mt-1">product_handle, customer_name, email, rating, title, content</p>
                    </div>
                  </div>
                )}

                {importStep === 'preview' && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-emerald-700">
                      {importData.length} reviews parsed successfully
                    </p>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        className="h-4 w-4 rounded"
                      />
                      Overwrite existing reviews (same email + product)
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-neutral-200">
                      {importData.slice(0, 8).map((row, idx) => (
                        <div
                          key={idx}
                          className={`p-3 text-sm ${idx > 0 ? 'border-t border-neutral-100' : ''}`}
                        >
                          <p className="font-medium text-cocoa">{row.title || 'No title'}</p>
                          <p className="text-neutral-500">
                            {row.customer_name} · {row.product_handle}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importStep === 'importing' && (
                  <div className="flex flex-col items-center py-10">
                    <Loader2 className="h-12 w-12 animate-spin text-cocoa" />
                    <p className="mt-4 font-medium text-cocoa">Importing reviews…</p>
                    <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-neutral-200">
                      <motion.div
                        animate={{ width: `${importProgress}%` }}
                        className="h-full bg-cocoa"
                      />
                    </div>
                  </div>
                )}

                {importStep === 'complete' && importResult && (
                  <div className="flex flex-col items-center py-10">
                    <CheckCircle className="h-14 w-14 text-emerald-600" />
                    <p className="mt-4 font-bake-display text-xl font-medium text-cocoa">Import complete</p>
                    <p className="mt-2 text-sm text-neutral-600">
                      {importResult.imported} imported, {importResult.skipped} skipped
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
                <button
                  onClick={importStep === 'complete' ? closeImportModal : () => setImportStep('upload')}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  {importStep === 'complete' ? 'Close' : 'Back'}
                </button>
                {importStep === 'preview' && (
                  <button
                    onClick={handleImport}
                    className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-5 py-2 text-sm font-medium text-ivory hover:bg-rose-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Import {importData.length} reviews
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}
