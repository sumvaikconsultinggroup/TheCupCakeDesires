'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Edit,
  Eye,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteCollection, getCollections, getCollectionStats } from './collection-actions'

interface Collection {
  _id: string
  handle: string
  title: string
  description?: string
  image?: string
  collectionType: 'manual' | 'automated'
  published: boolean
  productCount?: number
  createdAt?: string
}

interface Stats {
  total: number
  published: number
  draft: number
  manual: number
  automated: number
}

const PER_PAGE = 12

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'manual' | 'automated'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCollections, setTotalCollections] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    published: 0,
    draft: 0,
    manual: 0,
    automated: 0,
  })

  useEffect(() => {
    fetchCollections()
    fetchStats()
  }, [currentPage, searchQuery])

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const result = await getCollections({
        search: searchQuery || undefined,
        page: currentPage,
        limit: PER_PAGE,
      })
      if (result.success) {
        setCollections(result.collections || [])
        setTotalCollections(result.total || 0)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const s = await getCollectionStats()
      setStats(s)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDelete = async (handle: string) => {
    try {
      const result = await deleteCollection(handle)
      if (result.success) {
        toast.success('Collection deleted')
        fetchCollections()
        fetchStats()
        setDeleteConfirm(null)
      } else {
        toast.error('Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error('Failed to delete collection')
    }
  }

  // Status filtering happens client-side over the fetched page
  const filtered = useMemo(() => {
    return collections.filter((c) => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'published') return c.published
      if (statusFilter === 'draft') return !c.published
      if (statusFilter === 'manual') return c.collectionType === 'manual'
      if (statusFilter === 'automated') return c.collectionType === 'automated'
      return true
    })
  }, [collections, statusFilter])

  const totalPages = Math.max(1, Math.ceil(totalCollections / PER_PAGE))

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">Collections</h1>
          <p className="text-sm text-neutral-600">
            Group products into edits for the storefront — by occasion, range, or seasonal pick.
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
        >
          <Plus className="h-4 w-4" />
          New collection
        </Link>
      </div>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total"
          value={stats.total}
          icon={FolderOpen}
          accent="bg-cocoa/5 text-cocoa"
        />
        <StatCard
          label="Published"
          value={stats.published}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Draft"
          value={stats.draft}
          icon={FileText}
          accent="bg-amber-50 text-amber-700"
        />
        <StatCard label="Manual" value={stats.manual} icon={Layers} accent="bg-cocoa/5 text-cocoa" />
        <StatCard
          label="Automated"
          value={stats.automated}
          icon={Zap}
          accent="bg-rose-50 text-rose-700"
        />
      </section>

      {/* Toolbar */}
      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by title…"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
              { value: 'manual', label: 'Manual' },
              { value: 'automated', label: 'Auto' },
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="aspect-[4/3] animate-pulse bg-cream-deep" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="font-bake-display mt-3 text-[18px] font-medium text-cocoa">
            {searchQuery || statusFilter !== 'all' ? 'No matches' : 'No collections yet'}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try a different filter or search term.'
              : 'Create your first edit to organise products for the storefront.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/admin/collections/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
            >
              <Plus className="h-4 w-4" /> New collection
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((collection, idx) => (
            <CollectionCard
              key={collection._id}
              collection={collection}
              index={idx}
              menuOpen={actionMenuOpen === collection._id}
              onToggleMenu={() =>
                setActionMenuOpen(actionMenuOpen === collection._id ? null : collection._id)
              }
              onCloseMenu={() => setActionMenuOpen(null)}
              onDelete={() => {
                setActionMenuOpen(null)
                setDeleteConfirm(collection.handle)
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm">
          <p className="text-neutral-600">
            Showing {(currentPage - 1) * PER_PAGE + 1}–
            {Math.min(currentPage * PER_PAGE, totalCollections)} of{' '}
            {totalCollections.toLocaleString('en-AU')}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </div>
      )}

      {/* Click-outside layer for action menu */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
      )}

      {/* Delete confirmation modal */}
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
                Delete this collection?
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Products inside this collection are <strong>not</strong> deleted — they just stop
                appearing under this edit on the storefront.
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
    </div>
  )
}

/* ──────────────── Card ──────────────── */

function CollectionCard({
  collection,
  index,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onDelete,
}: {
  collection: Collection
  index: number
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.18) }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-[0_18px_36px_-22px_rgba(46,31,21,0.25)]"
    >
      {/* Image */}
      <Link
        href={`/admin/collections/${collection.handle}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream-deep"
      >
        {collection.image ? (
          <Image
            src={collection.image}
            alt={collection.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Folder className="h-9 w-9 text-cocoa-soft" />
          </div>
        )}
        {/* Type pill */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-line bg-ivory/95 px-2.5 py-1 text-[10px] font-medium tracking-[0.04em] text-cocoa backdrop-blur">
          {collection.collectionType === 'automated' ? (
            <>
              <Zap className="h-3 w-3 text-rose-accent" />
              Auto
            </>
          ) : (
            <>
              <Layers className="h-3 w-3 text-cocoa-soft" />
              Manual
            </>
          )}
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/admin/collections/${collection.handle}`}
              className="font-bake-display block truncate text-[15px] font-medium text-cocoa transition-colors hover:text-rose-accent"
            >
              {collection.title}
            </Link>
            <p className="mt-0.5 text-xs text-neutral-500">
              {collection.productCount || 0} product{collection.productCount === 1 ? '' : 's'} ·{' '}
              <span className="font-mono text-[11px]">{collection.handle}</span>
            </p>
          </div>

          <div className="relative">
            <button
              onClick={onToggleMenu}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-cocoa-soft transition hover:bg-cream hover:text-cocoa"
              aria-label="Open actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-[0_18px_36px_-22px_rgba(46,31,21,0.35)]"
                >
                  <Link
                    href={`/admin/collections/${collection.handle}`}
                    onClick={onCloseMenu}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-cocoa transition hover:bg-cream/60"
                  >
                    <Edit className="h-4 w-4 text-cocoa-soft" /> Edit
                  </Link>
                  <Link
                    href={`/collections/${collection.handle}`}
                    target="_blank"
                    onClick={onCloseMenu}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-cocoa transition hover:bg-cream/60"
                  >
                    <Eye className="h-4 w-4 text-cocoa-soft" /> View on site
                  </Link>
                  <hr className="my-1 border-neutral-100" />
                  <button
                    onClick={onDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status row */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          {collection.published ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <Check className="h-3 w-3" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <X className="h-3 w-3" />
              Draft
            </span>
          )}
        </div>
      </div>
    </motion.div>
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
  const window = 1
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - window && i <= currentPage + window)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
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
