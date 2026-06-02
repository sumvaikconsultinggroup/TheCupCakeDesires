// c:\Users\dell\Desktop\gibbon-ecomm\src\app\admin\combos\page.jsx

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Image as ImageIcon,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { deleteCombo, duplicateCombo, getCombos, updateCombo } from './combo-actions'

export default function CombosPage() {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCombos, setTotalCombos] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editImageCombo, setEditImageCombo] = useState(null)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [savingImage, setSavingImage] = useState(false)

  const combosPerPage = 12

  useEffect(() => {
    fetchCombos()
  }, [currentPage, statusFilter, searchQuery])

  const fetchCombos = async () => {
    setLoading(true)
    try {
      const result = await getCombos({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: combosPerPage,
      })

      if (result.success) {
        setCombos(result.combos || [])
        setTotalCombos(result.total || 0)
      } else {
        toast.error(result.message || 'Failed to load combos')
      }
    } catch (error) {
      console.error('Error fetching combos:', error)
      toast.error('Failed to load combos')
    }
    setLoading(false)
  }

  const handleDelete = async (handle) => {
    try {
      const result = await deleteCombo(handle)
      if (result.success) {
        toast.success('Combo deleted successfully')
        fetchCombos()
        setDeleteConfirm(null)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to delete combo')
    }
  }

  const handleDuplicate = async (handle) => {
    try {
      const result = await duplicateCombo(handle)
      if (result.success) {
        toast.success('Combo duplicated successfully')
        fetchCombos()
        setActionMenuOpen(null)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to duplicate combo')
    }
  }

  const handleSaveImage = async () => {
    if (!editImageCombo) return
    setSavingImage(true)
    try {
      const result = await updateCombo(editImageCombo.handle, { image: newImageUrl })
      if (result.success) {
        toast.success('Image updated successfully')
        fetchCombos()
        setEditImageCombo(null)
        setNewImageUrl('')
      } else {
        toast.error(result.message || 'Failed to update image')
      }
    } catch (error) {
      toast.error('Failed to update image')
    }
    setSavingImage(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImageUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const totalPages = Math.ceil(totalCombos / combosPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Product Combos</h1>
            <p className="text-sm text-neutral-500">Create and manage product combo deals</p>
          </div>

          <Link
            href="/admin/combos/new"
            className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2 text-white transition hover:bg-[#2e1f15]/90"
          >
            <Plus className="h-4 w-4" />
            Create Combo
          </Link>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search combos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-4 pl-10 focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Combos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#2e1f15]" />
          </div>
        ) : combos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="h-16 w-16 text-neutral-300" />
            <p className="mt-4 text-lg font-medium text-neutral-500">No combos found</p>
            <p className="text-sm text-neutral-400">Create your first combo to get started</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {combos.map((combo) => (
              <motion.div
                key={combo._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/50 transition hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-neutral-100">
                  {combo.image ? (
                    <Image
                      src={combo.image}
                      alt={combo.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-16 w-16 text-neutral-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        combo.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {combo.status}
                    </span>
                  </div>

                  {/* Discount Badge */}
                  {combo.discountPercentage > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        {combo.discountPercentage}% OFF
                      </span>
                    </div>
                  )}

                  {/* Actions Menu */}
                  <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === combo._id ? null : combo._id)}
                      className="rounded-lg bg-white p-2 shadow-lg"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <AnimatePresence>
                      {actionMenuOpen === combo._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-xl ring-1 ring-neutral-200"
                        >
                          <Link
                            href={`/admin/combos/${combo.handle}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setEditImageCombo(combo)
                              setNewImageUrl(combo.image || '')
                              setActionMenuOpen(null)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Edit Image
                          </button>
                          <button
                            onClick={() => handleDuplicate(combo.handle)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50"
                          >
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirm(combo.handle)
                              setActionMenuOpen(null)
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="line-clamp-2 font-semibold text-neutral-900">{combo.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{combo.totalQuantity} items</p>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-[#2e1f15]">₹{combo.totalPrice.toLocaleString()}</p>
                      {combo.savingsAmount > 0 && (
                        <p className="text-xs text-neutral-400 line-through">
                          ₹{combo.totalOriginalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {combo.savingsAmount > 0 && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-green-600">Save ₹{combo.savingsAmount}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-neutral-200 p-2 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm text-neutral-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-neutral-200 p-2 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

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
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Delete Combo</h3>
                  <p className="text-sm text-neutral-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Image Modal */}
      <AnimatePresence>
        {editImageCombo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditImageCombo(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <h3 className="mb-4 text-lg font-semibold text-neutral-900">Update Combo Image</h3>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-neutral-700">Combo Image</label>

                <label className="mb-4 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 transition hover:bg-neutral-100">
                  <div className="flex flex-col items-center justify-center py-6">
                    <UploadCloud className="mb-2 h-8 w-8 text-neutral-400" />
                    <p className="mb-1 text-sm text-neutral-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500">SVG, PNG, JPG or GIF</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500">Or use URL</span>
                  </div>
                </div>

                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              {newImageUrl && (
                <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                  <Image src={newImageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setEditImageCombo(null)}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveImage}
                  disabled={savingImage}
                  className="flex-1 rounded-lg bg-[#2e1f15] px-4 py-2 font-medium text-white hover:bg-[#2e1f15]/90 disabled:opacity-50"
                >
                  {savingImage ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}