'use client'

import ImageUpload from '@/components/ui/ImageUpload'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { getCollections, getCollectionProducts } from '@/app/admin/collections/collection-actions'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, Eye, EyeOff, Image as ImageIcon, Layers, LayoutGrid, Plus, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface NavigationItem {
  _id: string
  type: 'category' | 'mega-product'
  name: string
  handle: string
  description?: string
  icon?: string
  image?: string
  link?: string
  isActive: boolean
  position: number
}

export default function NavigationManagementPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [items, setItems] = useState<NavigationItem[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'category' | 'mega-product'>('category')

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    type: 'category' as 'category' | 'mega-product',
    name: '',
    handle: '',
    description: '',
    image: '',
    link: '',
    isActive: true,
    position: 0,
  })

  const fetchNavigation = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/navigation')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setItems(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching navigation:', error)
      toast.error('Failed to load navigation items')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCollections = useCallback(async () => {
    try {
      const result = await getCollections({ limit: 200, published: true })
      if (result.success && result.collections) {
        setCollections(result.collections)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNavigation()
      fetchCollections()
    }
  }, [isAuthenticated, fetchNavigation, fetchCollections])

  const openModal = (item?: NavigationItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        type: item.type,
        name: item.name,
        handle: item.handle,
        description: item.description || '',
        image: item.image || '',
        link: item.link || '',
        isActive: item.isActive,
        position: item.position,
      })
    } else {
      setEditingItem(null)
      setFormData({
        type: activeTab,
        name: '',
        handle: '',
        description: '',
        image: '',
        link: '',
        isActive: true,
        position: items.filter((i) => i.type === activeTab).length,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.handle) {
      toast.error('Name and Handle are required')
      return
    }

    if (formData.type === 'category' && !formData.description) {
      toast.error('Description is required for categories')
      return
    }

    if (formData.type === 'mega-product' && (!formData.image || !formData.link)) {
      toast.error('Image and Link are required for mega menu products')
      return
    }

    setSaving(true)
    try {
      const url = editingItem ? `/api/admin/navigation/${editingItem._id}` : '/api/admin/navigation'

      // Prepare data based on type
      let dataToSubmit: any
      if (formData.type === 'category') {
        const { image, link, ...rest } = formData
        dataToSubmit = rest
      } else {
        const { description, ...rest } = formData
        dataToSubmit = rest
      }

      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingItem ? 'Item updated!' : 'Item created!')
        setShowModal(false)
        fetchNavigation()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return

    try {
      const res = await fetch(`/api/admin/navigation/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Item deleted!')
        fetchNavigation()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete item')
    }
  }

  const toggleActive = async (item: NavigationItem) => {
    try {
      await fetch(`/api/admin/navigation/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      fetchNavigation()
      toast.success(`Item ${item.isActive ? 'disabled' : 'enabled'}`)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const filteredItems = items.filter((item) => item.type === activeTab).sort((a, b) => a.position - b.position)

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky rounded-md top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto max-w-6xl px-6 py-6 ">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className=" text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                NAVIGATION
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Manage your main menu categories and mega menu promotions
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="group flex items-center gap-2 rounded-full bg-[#1B198F] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-[#2725a5] hover:shadow-indigo-500/30 active:scale-95"
            >
              <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Modern Tabs */}
          <div className="mt-8 flex w-full max-w-md rounded-full bg-neutral-100 p-1.5 dark:bg-neutral-800">
            <button
              onClick={() => setActiveTab('category')}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'category'
                  ? 'bg-white text-[#1B198F] shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('mega-product')}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === 'mega-product'
                  ? 'bg-white text-[#1B198F] shadow-sm dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Mega Menu
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl p-6">
        <motion.div layout className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                key={item._id}
                className={`group relative flex items-center gap-5 overflow-hidden rounded-2xl border bg-white p-4 transition-all hover:shadow-lg hover:shadow-neutral-200/50 dark:bg-neutral-900 dark:hover:shadow-none ${
                  !item.isActive
                    ? 'border-neutral-200 opacity-60 grayscale dark:border-neutral-800'
                    : 'border-neutral-200 hover:border-[#1B198F]/30 dark:border-neutral-800'
                }`}
              >
                {/* Icon/Image */}
                <div
                  className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
                    item.type === 'mega-product' ? 'bg-white' : 'bg-neutral-50 dark:bg-neutral-800'
                  } border-neutral-100 dark:border-neutral-700`}
                >
                  {item.type === 'mega-product' && item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-neutral-400">
                      {item.type === 'category' ? <Layers className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-neutral-900 transition-colors group-hover:text-[#1B198F] dark:text-white">
                      {item.name}
                    </h3>
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:bg-neutral-800">
                      {item.handle}
                    </span>
                    {!item.isActive && (
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {item.type === 'category' ? (
                      item.description
                    ) : (
                      <span className="flex items-center gap-1 text-[#1B198F] dark:text-blue-400">
                        <span className="text-neutral-500 opacity-50">Link:</span> {item.link}
                      </span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => toggleActive(item)}
                    className={`rounded-full p-2.5 transition-all ${
                      item.isActive
                        ? 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20'
                    }`}
                    title={item.isActive ? 'Hide Item' : 'Show Item'}
                  >
                    {item.isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                  <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
                  <button
                    onClick={() => openModal(item)}
                    className="rounded-full p-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    title="Edit"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="rounded-full p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center dark:border-neutral-700 dark:bg-neutral-800/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-800">
                <Layers className="h-8 w-8 text-neutral-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">No items found</h3>
              <p className="mt-2 max-w-sm text-sm text-neutral-500">
                Get started by adding your first {activeTab === 'category' ? 'category' : 'mega menu item'} to the
                navigation.
              </p>
              <button onClick={() => openModal()} className="mt-6 font-medium text-[#1B198F] hover:underline">
                Create New Item
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900"
            >
              <div className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {editingItem ? 'Edit Navigation Item' : 'Add New Item'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* Common Fields */}
                  <div className="grid gap-5">
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                            handle: !editingItem
                              ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                              : formData.handle,
                          })
                        }
                        placeholder="e.g. Protein Supplements"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#1B198F] focus:bg-white focus:ring-4 focus:ring-[#1B198F]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Handle (Unique ID)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-neutral-400">#</span>
                        <input
                          type="text"
                          value={formData.handle}
                          onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-8 pr-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#1B198F] focus:bg-white focus:ring-4 focus:ring-[#1B198F]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Specific */}
                  {formData.type === 'category' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#1B198F] focus:bg-white focus:ring-4 focus:ring-[#1B198F]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-blue-500"
                        rows={3}
                        placeholder="Brief description for the dropdown menu..."
                      />
                    </motion.div>
                  )}

                  {/* Mega Product Specific */}
                  {formData.type === 'mega-product' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Select Collection (Auto-fill)
                        </label>
                        <select
                          onChange={async (e) => {
                            const collection = collections.find((c) => c._id === e.target.value)
                            if (!collection) return

                            let image =
                              collection.image ||
                              collection.thumbnailImage ||
                              collection.bannerImage ||
                              ''

                            // Fallback: pull first product image from the collection
                            if (!image) {
                              try {
                                const result = await getCollectionProducts(collection.handle)
                                if (result.success && result.products?.length) {
                                  const firstWithImage = result.products.find(
                                    (p: any) => p.images?.[0]?.src || p.image
                                  )
                                  image =
                                    firstWithImage?.images?.[0]?.src ||
                                    firstWithImage?.image ||
                                    ''
                                }
                              } catch (err) {
                                console.error('Error fetching collection products:', err)
                              }
                            }

                            setFormData({
                              ...formData,
                              name: collection.title,
                              handle: collection.handle,
                              link: `/collections/${collection.handle}`,
                              image,
                            })
                          }}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#1B198F] focus:bg-white focus:ring-4 focus:ring-[#1B198F]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-blue-500"
                        >
                          <option value="">Select a collection...</option>
                          {collections.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Destination Link
                        </label>
                        <input
                          type="text"
                          value={formData.link}
                          onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-[#1B198F] focus:bg-white focus:ring-4 focus:ring-[#1B198F]/10 dark:border-neutral-700 dark:bg-neutral-800 dark:focus:border-blue-500"
                          placeholder="/collections/your-collection-handle"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-500">
                          Collection Image
                        </label>
                        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                          <ImageUpload
                            value={formData.image}
                            onChange={(url) => setFormData({ ...formData, image: url })}
                            aspectRatio="square"
                            base64={true}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                    <label className="flex cursor-pointer items-center gap-3">
                      <div
                        className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-[#1B198F]' : 'bg-neutral-300 dark:bg-neutral-600'}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Visible on Site
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Sort Order</span>
                      <input
                        type="number"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                        className="w-20 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-center text-sm font-bold outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-[#2725a5] hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  {saving && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
