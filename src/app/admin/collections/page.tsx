'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Folder,
  FolderOpen,
  AlertTriangle,
  Loader2,
  Layers,
  Zap,
  Package,
} from 'lucide-react'
import { getCollections, deleteCollection, getCollectionStats } from './collection-actions'

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

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCollections, setTotalCollections] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, manual: 0, automated: 0 })

  const collectionsPerPage = 10

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
        limit: collectionsPerPage,
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
        fetchCollections()
        fetchStats()
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  const totalPages = Math.ceil(totalCollections / collectionsPerPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Collections</h1>
          <p className="text-neutral-500">Organize products into groups for your customers</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1B198F]/90"
        >
          <Plus className="h-4 w-4" />
          Create Collection
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F]/10">
              <FolderOpen className="h-5 w-5 text-[#1B198F]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-neutral-500">Total Collections</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.published}</p>
              <p className="text-sm text-neutral-500">Published</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.manual}</p>
              <p className="text-sm text-neutral-500">Manual</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.automated}</p>
              <p className="text-sm text-neutral-500">Automated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
              <div className="aspect-video rounded-xl bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-4 h-5 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))
        ) : collections.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <FolderOpen className="mx-auto h-16 w-16 text-neutral-300" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No collections yet</h3>
            <p className="mt-2 text-neutral-500">Create your first collection to organize your products</p>
            <Link
              href="/admin/collections/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Create Collection
            </Link>
          </div>
        ) : (
          collections.map((collection) => (
            
            <motion.div
              key={collection._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-800"
            >
              <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-neutral-100 dark:bg-neutral-700">
                {collection.image ? (
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Folder className="h-12 w-12 text-neutral-300" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      collection.collectionType === 'automated'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {collection.collectionType === 'automated' ? (
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Auto</span>
                    ) : (
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Manual</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/admin/collections/${collection.handle}`}
                      className="font-semibold text-neutral-900 hover:text-[#1B198F] dark:text-white"
                    >
                      {collection.title}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-500">
                      {collection.productCount || 0} products
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === collection._id ? null : collection._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <AnimatePresence>
                      {actionMenuOpen === collection._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl bg-white py-2 shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
                        >
                          <Link
                            href={`/admin/collections/${collection.handle}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </Link>
                          <Link
                            href={`/collections/${collection.handle}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            <Eye className="h-4 w-4" /> View
                          </Link>
                          <hr className="my-2 border-neutral-200 dark:border-neutral-700" />
                          <button
                            onClick={() => setDeleteConfirm(collection.handle)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      collection.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {collection.published ? (
                      <><Check className="h-3 w-3" /> Published</>
                    ) : (
                      <><X className="h-3 w-3" /> Draft</>
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm dark:bg-neutral-800">
          <p className="text-sm text-neutral-500">
            Showing {(currentPage - 1) * collectionsPerPage + 1} to{' '}
            {Math.min(currentPage * collectionsPerPage, totalCollections)} of {totalCollections} collections
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-50 dark:border-neutral-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-[#1B198F] text-white'
                    : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-50 dark:border-neutral-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Delete Collection</h3>
              <p className="mt-2 text-neutral-500">
                Are you sure you want to delete this collection? Products in this collection will not be deleted.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setActionMenuOpen(null)} />
      )}
    </div>
  )
}
