'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Archive,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ImportModal from './ImportModal'
import {
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  deleteProduct,
  duplicateProduct,
  getProducts,
  getProductStats,
} from './product-actions'

interface Product {
  _id: string
  handle: string
  title: string
  description?: string
  images?: { src: string }[]
  variants?: {
    price: number
    compareAtPrice?: number
    inventoryQty?: number
    option1Value?: string
  }[]
  published?: boolean
  status?: string
  productCategory?: string
  createdAt?: string
}

interface Stats {
  total: number
  active: number
  draft: number
  archived: number
  lowStock: number
}

const PRODUCTS_PER_PAGE = 12

const aud = (n: number) =>
  `$${Number(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [currentPage, statusFilter, searchQuery])

  useEffect(() => {
    getProductStats().then(setStats).catch(() => {})
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const result = await getProducts({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      })
      if (result.success) {
        setProducts(result.products || [])
        setTotalProducts(result.total || 0)
      } else {
        console.error('Error fetching products:', result.message)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (handle: string) => {
    try {
      const result = await deleteProduct(handle)
      if (result.success) {
        fetchProducts()
        getProductStats().then(setStats).catch(() => {})
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleDuplicate = async (handle: string) => {
    try {
      const result = await duplicateProduct(handle)
      if (result.success) {
        fetchProducts()
        setActionMenuOpen(null)
      } else {
        console.error('Error duplicating product:', result.message)
      }
    } catch (error) {
      console.error('Error duplicating product:', error)
    }
  }

  const handleBulkAction = async (action: 'delete' | 'publish' | 'unpublish') => {
    if (selectedProducts.size === 0) return
    setBusy(true)
    try {
      const handles = Array.from(selectedProducts)
      let result
      if (action === 'delete') {
        if (!confirm(`Delete ${handles.length} product${handles.length === 1 ? '' : 's'}? This can’t be undone.`)) {
          setBusy(false)
          return
        }
        result = await bulkDeleteProducts(handles)
      } else if (action === 'publish') {
        result = await bulkUpdateProductStatus(handles, 'active')
      } else if (action === 'unpublish') {
        result = await bulkUpdateProductStatus(handles, 'draft')
      }
      if (result?.success) {
        setSelectedProducts(new Set())
        await fetchProducts()
        getProductStats().then(setStats).catch(() => {})
      }
    } catch (error) {
      console.error('Bulk action error:', error)
    } finally {
      setBusy(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length && products.length > 0) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map((p) => p.handle)))
    }
  }

  const toggleSelect = (handle: string) => {
    const next = new Set(selectedProducts)
    if (next.has(handle)) next.delete(handle)
    else next.add(handle)
    setSelectedProducts(next)
  }

  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE))
  const allChecked = products.length > 0 && selectedProducts.size === products.length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Products</h1>
          <p className="text-sm text-neutral-600">
            {(stats?.total ?? totalProducts).toLocaleString('en-AU')} products in the catalogue.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
          >
            <Plus className="h-4 w-4" />
            New product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats?.total ?? 0} icon={Boxes} accent="bg-cocoa/5 text-cocoa" />
        <StatCard
          label="Active"
          value={stats?.active ?? 0}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Draft"
          value={stats?.draft ?? 0}
          icon={FileText}
          accent="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="Archived"
          value={stats?.archived ?? 0}
          icon={Archive}
          accent="bg-neutral-100 text-neutral-600"
        />
        <StatCard
          label="Low stock"
          value={stats?.lowStock ?? 0}
          icon={AlertTriangle}
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
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by product title…"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'archived', label: 'Archived' },
            ] as const
          ).map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setStatusFilter(s.value)
                setCurrentPage(1)
              }}
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

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedProducts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-cocoa/15 bg-cream/60 px-4 py-3"
          >
            <span className="text-sm font-medium text-cocoa">
              {selectedProducts.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:border-emerald-300 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:border-amber-300 disabled:opacity-50"
              >
                <Archive className="h-3.5 w-3.5" />
                Unpublish
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:border-red-300 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="ml-auto text-xs font-medium text-cocoa-soft underline decoration-rose-300 underline-offset-4 hover:text-rose-accent"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="hidden border-b border-neutral-200 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 lg:grid lg:grid-cols-[auto_2fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleSelectAll}
            className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-cocoa"
            aria-label="Select all on page"
          />
          <span>Product</span>
          <span>Status</span>
          <span>Inventory</span>
          <span className="text-right">Price</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <ul className="divide-y divide-neutral-200">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-4 animate-pulse rounded bg-neutral-100" />
                <div className="h-12 w-12 animate-pulse rounded-lg bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-1/5 animate-pulse rounded bg-neutral-100" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100" />
              </li>
            ))}
          </ul>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-3 font-bake-display text-[18px] font-medium text-cocoa">
              {searchQuery || statusFilter !== 'all' ? 'No matches' : 'No products yet'}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try a different filter or search term.'
                : 'Get started by adding your first product.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link
                href="/admin/products/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
              >
                <Plus className="h-4 w-4" /> New product
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {products.map((product, idx) => {
              const price = product.variants?.[0]?.price || 0
              const compareAt = product.variants?.[0]?.compareAtPrice
              const inventory = product.variants?.reduce((sum, v) => sum + (v.inventoryQty || 0), 0) || 0
              const isSelected = selectedProducts.has(product.handle)

              return (
                <motion.li
                  key={product._id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.02, 0.18) }}
                  className={`grid grid-cols-1 gap-3 px-6 py-4 transition-colors lg:grid-cols-[auto_2fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4 ${
                    isSelected ? 'bg-cream/40' : 'hover:bg-cream/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(product.handle)}
                    className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-cocoa"
                    aria-label={`Select ${product.title}`}
                  />

                  {/* Product */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-cream-deep">
                      {product.images?.[0]?.src ? (
                        <Image
                          src={product.images[0].src}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-5 w-5 text-cocoa-soft" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${product.handle}`}
                        className="font-bake-display block truncate text-sm font-medium text-cocoa transition-colors hover:text-rose-accent"
                      >
                        {product.title}
                      </Link>
                      <p className="truncate text-xs text-neutral-500">
                        {product.productCategory || 'Uncategorised'} · {product.handle}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusPill status={product.status} />
                  </div>

                  {/* Inventory */}
                  <div className="text-sm">
                    <span
                      className={`font-medium ${
                        inventory === 0
                          ? 'text-red-600'
                          : inventory < 10
                            ? 'text-amber-600'
                            : 'text-cocoa'
                      }`}
                    >
                      {inventory}
                    </span>
                    <span className="ml-1.5 text-xs text-neutral-500">in stock</span>
                  </div>

                  {/* Price */}
                  <div className="text-sm lg:text-right">
                    <div className="font-semibold text-cocoa">{aud(price)}</div>
                    {typeof compareAt === 'number' && compareAt > price && (
                      <div className="text-xs text-neutral-400 line-through">{aud(compareAt)}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="relative flex justify-end">
                    <button
                      onClick={() =>
                        setActionMenuOpen(actionMenuOpen === product._id ? null : product._id)
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {actionMenuOpen === product._id && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-[0_18px_36px_-22px_rgba(46,31,21,0.35)]"
                        >
                          <Link
                            href={`/admin/products/${product.handle}`}
                            onClick={() => setActionMenuOpen(null)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-cocoa transition hover:bg-cream/60"
                          >
                            <Edit className="h-4 w-4 text-cocoa-soft" /> Edit
                          </Link>
                          <Link
                            href={`/products/${product.handle}`}
                            target="_blank"
                            onClick={() => setActionMenuOpen(null)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-cocoa transition hover:bg-cream/60"
                          >
                            <Eye className="h-4 w-4 text-cocoa-soft" /> View on site
                          </Link>
                          <button
                            onClick={() => handleDuplicate(product.handle)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-cocoa transition hover:bg-cream/60"
                          >
                            <Copy className="h-4 w-4 text-cocoa-soft" /> Duplicate
                          </button>
                          <hr className="my-1 border-neutral-100" />
                          <button
                            onClick={() => {
                              setActionMenuOpen(null)
                              setDeleteConfirm(product.handle)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}

        {/* Pagination */}
        {!loading && products.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 text-sm">
            <p className="text-neutral-600">
              Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–
              {Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)} of{' '}
              {totalProducts.toLocaleString('en-AU')}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setDeleteConfirm(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(46,31,21,0.45)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="font-bake-display mt-4 text-[20px] font-medium text-cocoa">
                Delete this product?
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                This is a soft delete — the row is hidden from the storefront and admin lists but
                the data stays in MongoDB.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-outside layer for action menu */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          fetchProducts()
          getProductStats().then(setStats).catch(() => {})
          setShowImportModal(false)
        }}
      />
    </div>
  )
}

/* ──────────────── Helpers ──────────────── */

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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-cocoa">{value.toLocaleString('en-AU')}</p>
    </div>
  )
}

function StatusPill({ status }: { status?: string }) {
  const cls: Record<string, string> = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    draft: 'border-amber-200 bg-amber-50 text-amber-700',
    archived: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  }
  const label = status === 'active' ? 'Active' : status === 'draft' ? 'Draft' : 'Archived'
  const icon =
    status === 'active' ? (
      <Check className="h-3 w-3" />
    ) : status === 'draft' ? (
      <X className="h-3 w-3" />
    ) : (
      <Archive className="h-3 w-3" />
    )
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        cls[status || 'archived']
      }`}
    >
      {icon}
      {label}
    </span>
  )
}

/** Smart pagination — shows first/last + window around the current page,
 *  with ellipses when there's a gap. Avoids the old "render N buttons" footgun.
 */
function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const pages: (number | 'ellipsis')[] = []
  const add = (n: number | 'ellipsis') => pages.push(n)
  const window = 1

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - window && i <= currentPage + window)
    ) {
      add(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      add('ellipsis')
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-2 text-xs text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
              currentPage === p
                ? 'bg-cocoa text-ivory'
                : 'border border-neutral-200 text-cocoa hover:border-rose-accent hover:text-rose-accent'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
