'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  Plus, Edit2, Trash2, Save, X, Search, Package,
  Sparkles, ShoppingBag, Eye, EyeOff, Loader2,
  ChevronDown, ChevronUp, GripVertical, CheckCircle,
  ArrowRight, Layers, Settings, Filter, Zap, Info
} from 'lucide-react'

interface RecommendedProduct {
  productId: string
  productHandle: string
  productTitle: string
  productImage: string
  productPrice: number
  position: number
}

interface AutoPreviewProduct {
  _id: string
  handle: string
  title: string
  image: string
  price: number
  frequency: number
  percentage: number
}

interface Recommendation {
  _id: string
  productId: string
  productHandle: string
  productTitle: string
  type: 'you_may_also_like' | 'bought_together'
  recommendations: RecommendedProduct[]
  isActive: boolean
  displayLimit: number
  createdAt: string
  updatedAt: string
}

interface ProductOption {
  _id: string
  handle: string
  title: string
  image: string
  price: number
}

interface Stats {
  total: number
  youMayAlsoLike: number
  boughtTogether: number
  active: number
}

const TYPE_CONFIG = {
  you_may_also_like: {
    label: 'You May Also Like',
    description: 'Similar or complementary products',
    color: 'bg-purple-100 text-purple-700',
    icon: Sparkles
  },
  bought_together: {
    label: 'Frequently Bought Together',
    description: 'Products often purchased together',
    color: 'bg-blue-100 text-blue-700',
    icon: ShoppingBag
  }
}

export default function RecommendationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, youMayAlsoLike: 0, boughtTogether: 0, active: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null)
  
  // Form state
  const [form, setForm] = useState({
    productHandle: '',
    type: 'you_may_also_like' as Recommendation['type'],
    recommendedHandles: [] as string[],
    displayLimit: 4,
    isActive: true
  })
  
  // Product search
  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([])
  const [sourceProduct, setSourceProduct] = useState<ProductOption | null>(null)
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Auto-preview state for "Bought Together"
  const [autoPreviewProducts, setAutoPreviewProducts] = useState<AutoPreviewProduct[]>([])
  const [autoPreviewLoading, setAutoPreviewLoading] = useState(false)
  const [autoPreviewStats, setAutoPreviewStats] = useState<{ ordersAnalyzed: number; message: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        type: typeFilter,
        status: statusFilter,
        search: searchQuery
      })
      
      const res = await fetch(`/api/admin/recommendations?${params}`)
      
      // Check if response is OK
      if (!res.ok) {
        console.error('API returned error status:', res.status)
        return
      }
      
      // Check content type before parsing
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType)
        return
      }
      
      const data = await res.json()
      
      if (data.success) {
        setRecommendations(data.data)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      // Don't show toast for network errors
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter, searchQuery])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) fetchData()
  }, [isAuthenticated, fetchData])

  const searchProducts = async (query: string, excludeHandles: string[] = []) => {
    if (!query.trim()) {
      setProductOptions([])
      return
    }
    
    setSearchingProducts(true)
    try {
      const exclude = [...excludeHandles, form.productHandle].filter(Boolean).join(',')
      const res = await fetch(`/api/admin/recommendations/products?search=${encodeURIComponent(query)}&exclude=${exclude}`)
      
      if (!res.ok) {
        console.error('Product search failed:', res.status)
        setProductOptions([])
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType)
        setProductOptions([])
        return
      }
      
      const data = await res.json()
      if (data.success) {
        setProductOptions(data.data)
      }
    } catch (error) {
      console.error('Error searching products:', error)
      setProductOptions([])
    } finally {
      setSearchingProducts(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch) {
        searchProducts(productSearch, selectedProducts.map(p => p.handle))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const resetForm = () => {
    setForm({
      productHandle: '',
      type: 'you_may_also_like',
      recommendedHandles: [],
      displayLimit: 4,
      isActive: true
    })
    setSourceProduct(null)
    setSelectedProducts([])
    setProductSearch('')
    setProductOptions([])
    setAutoPreviewProducts([])
    setAutoPreviewStats(null)
  }

  // Fetch automated "Bought Together" suggestions based on order history
  const fetchAutoPreview = async (handle: string) => {
    if (!handle) return
    
    setAutoPreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/recommendations/auto-preview?handle=${encodeURIComponent(handle)}&limit=6`)
      if (!res.ok) {
        setAutoPreviewProducts([])
        return
      }
      
      const data = await res.json()
      if (data.success) {
        setAutoPreviewProducts(data.data || [])
        setAutoPreviewStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching auto preview:', error)
      setAutoPreviewProducts([])
    } finally {
      setAutoPreviewLoading(false)
    }
  }

  // Add all auto-suggested products to selection
  const addAllAutoSuggestions = () => {
    const newProducts = autoPreviewProducts
      .filter(ap => !selectedProducts.find(sp => sp.handle === ap.handle))
      .map(ap => ({
        _id: ap._id,
        handle: ap.handle,
        title: ap.title,
        image: ap.image,
        price: ap.price
      }))
    
    setSelectedProducts([...selectedProducts, ...newProducts])
    setForm({ 
      ...form, 
      recommendedHandles: [...form.recommendedHandles, ...newProducts.map(p => p.handle)]
    })
    toast.success(`Added ${newProducts.length} suggested products`)
  }

  const openModal = async (rec?: Recommendation) => {
    if (rec) {
      setEditingRec(rec)
      setForm({
        productHandle: rec.productHandle,
        type: rec.type,
        recommendedHandles: rec.recommendations.map(r => r.productHandle),
        displayLimit: rec.displayLimit,
        isActive: rec.isActive
      })
      setSourceProduct({
        _id: rec.productId,
        handle: rec.productHandle,
        title: rec.productTitle,
        image: '',
        price: 0
      })
      setSelectedProducts(rec.recommendations.map(r => ({
        _id: r.productId,
        handle: r.productHandle,
        title: r.productTitle,
        image: r.productImage,
        price: r.productPrice
      })))
    } else {
      setEditingRec(null)
      resetForm()
    }
    setShowModal(true)
  }

  const selectSourceProduct = (product: ProductOption) => {
    setSourceProduct(product)
    setForm({ ...form, productHandle: product.handle })
    setProductSearch('')
    setProductOptions([])
    setShowProductDropdown(false)
    
    // Auto-fetch suggestions for "Bought Together"
    if (form.type === 'bought_together') {
      fetchAutoPreview(product.handle)
    }
  }

  const addRecommendedProduct = (product: ProductOption) => {
    if (!selectedProducts.find(p => p.handle === product.handle)) {
      setSelectedProducts([...selectedProducts, product])
      setForm({ ...form, recommendedHandles: [...form.recommendedHandles, product.handle] })
    }
    setProductSearch('')
    setProductOptions([])
  }

  const removeRecommendedProduct = (handle: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.handle !== handle))
    setForm({ ...form, recommendedHandles: form.recommendedHandles.filter(h => h !== handle) })
  }

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...selectedProducts]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newProducts.length) return
    
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]]
    setSelectedProducts(newProducts)
    setForm({ ...form, recommendedHandles: newProducts.map(p => p.handle) })
  }

  const saveRecommendation = async () => {
    if (!form.productHandle) {
      toast.error('Please select a source product')
      return
    }
    if (form.recommendedHandles.length === 0) {
      toast.error('Please add at least one recommended product')
      return
    }

    setSaving(true)
    try {
      const url = editingRec 
        ? `/api/admin/recommendations/${editingRec._id}`
        : '/api/admin/recommendations'
      
      const res = await fetch(url, {
        method: editingRec ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) {
        toast.error('Server error. Please try again.')
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        toast.error('Server error. Please try again.')
        return
      }

      const data = await res.json()
      
      if (data.success) {
        toast.success(editingRec ? 'Recommendation updated!' : 'Recommendation created!')
        setShowModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save recommendation')
    } finally {
      setSaving(false)
    }
  }

  const deleteRecommendation = async (id: string) => {
    if (!confirm('Delete this recommendation?')) return
    
    try {
      const res = await fetch(`/api/admin/recommendations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Recommendation deleted!')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const toggleStatus = async (rec: Recommendation) => {
    try {
      const res = await fetch(`/api/admin/recommendations/${rec._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rec.isActive })
      })
      
      if (res.ok) {
        toast.success(rec.isActive ? 'Recommendation disabled' : 'Recommendation enabled')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Product Recommendations</h1>
            <p className="text-sm text-neutral-500">Manage "You May Also Like" and "Bought Together" sections</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1B198F] to-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Recommendation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.youMayAlsoLike}</p>
              <p className="text-xs text-neutral-500">You May Also Like</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.boughtTogether}</p>
              <p className="text-xs text-neutral-500">Bought Together</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-neutral-500">Active</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product..."
              className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-[#1B198F]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Types</option>
            <option value="you_may_also_like">You May Also Like</option>
            <option value="bought_together">Bought Together</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-20">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
              <Layers className="h-10 w-10 text-[#1B198F]" />
            </div>
            <h3 className="mt-6 text-xl font-bold">No recommendations yet</h3>
            <p className="mt-2 text-neutral-500">Create product recommendations to boost sales</p>
            <button
              onClick={() => openModal()}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-3 font-semibold text-white"
            >
              <Plus className="h-5 w-5" />
              Create First Recommendation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const typeConfig = TYPE_CONFIG[rec.type]
              const TypeIcon = typeConfig.icon
              
              return (
                <motion.div
                  key={rec._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${typeConfig.color.split(' ')[0]}`}>
                        <TypeIcon className={`h-6 w-6 ${typeConfig.color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-neutral-900">{rec.productTitle}</h3>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                          {!rec.isActive && (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">
                          {rec.recommendations.length} products • Shows {rec.displayLimit}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(rec)}
                        className={`rounded-lg p-2 transition-colors ${rec.isActive ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'}`}
                        title={rec.isActive ? 'Disable' : 'Enable'}
                      >
                        {rec.isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => openModal(rec)}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
                        title="Edit"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteRecommendation(rec._id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Recommended Products Preview */}
                  <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                    <span className="text-sm text-neutral-500 whitespace-nowrap">Recommends:</span>
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                    {rec.recommendations.slice(0, 6).map((product, idx) => (
                      <div
                        key={product.productHandle}
                        className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm"
                      >
                        {product.productImage && (
                          <div className="relative h-6 w-6 overflow-hidden rounded">
                            <Image src={product.productImage} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <span className="max-w-[120px] truncate">{product.productTitle}</span>
                      </div>
                    ))}
                    {rec.recommendations.length > 6 && (
                      <span className="text-sm text-neutral-500">+{rec.recommendations.length - 6} more</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-4 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 text-sm">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border px-4 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="text-xl font-bold">
                  {editingRec ? 'Edit Recommendation' : 'Create Recommendation'}
                </h2>
                <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="max-h-[65vh] overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Recommendation Type */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Recommendation Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                        const Icon = config.icon
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setForm({ ...form, type: key as Recommendation['type'] })
                              // Auto-fetch suggestions when switching to bought_together
                              if (key === 'bought_together' && sourceProduct) {
                                fetchAutoPreview(sourceProduct.handle)
                              }
                            }}
                            disabled={!!editingRec}
                            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                              form.type === key
                                ? 'border-[#1B198F] bg-[#1B198F]/5'
                                : 'border-neutral-200 hover:border-neutral-300'
                            } ${editingRec ? 'opacity-50' : ''}`}
                          >
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color.split(' ')[0]}`}>
                              <Icon className={`h-5 w-5 ${config.color.split(' ')[1]}`} />
                            </div>
                            <div>
                              <p className="font-semibold">{config.label}</p>
                              <p className="text-xs text-neutral-500">{config.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Source Product */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">Source Product *</label>
                    {sourceProduct ? (
                      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-neutral-400" />
                          <span className="font-medium">{sourceProduct.title}</span>
                          <span className="text-sm text-neutral-500">({sourceProduct.handle})</span>
                        </div>
                        {!editingRec && (
                          <button
                            onClick={() => { setSourceProduct(null); setForm({ ...form, productHandle: '' }) }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
                          onFocus={() => setShowProductDropdown(true)}
                          className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 outline-none focus:border-[#1B198F]"
                          placeholder="Search for a product..."
                        />
                        {showProductDropdown && productOptions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                            {productOptions.map((product) => (
                              <button
                                key={product.handle}
                                onClick={() => selectSourceProduct(product)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                              >
                                {product.image && (
                                  <div className="relative h-8 w-8 overflow-hidden rounded">
                                    <Image src={product.image} alt="" fill className="object-cover" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{product.title}</p>
                                  <p className="text-xs text-neutral-500">{product.handle}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Auto-Suggestions for Bought Together */}
                  {form.type === 'bought_together' && sourceProduct && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Auto-Suggested Products</h4>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Based on Order History
                          </span>
                        </div>
                        {!autoPreviewLoading && autoPreviewProducts.length > 0 && (
                          <button
                            onClick={addAllAutoSuggestions}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            <Plus className="h-3 w-3" />
                            Add All
                          </button>
                        )}
                      </div>
                      
                      {autoPreviewLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-blue-700">Analyzing order history...</span>
                        </div>
                      ) : autoPreviewProducts.length > 0 ? (
                        <>
                          {autoPreviewStats && (
                            <p className="mb-3 text-xs text-blue-700">
                              <Info className="mr-1 inline h-3 w-3" />
                              {autoPreviewStats.message}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {autoPreviewProducts.map((product) => {
                              const isAlreadySelected = selectedProducts.some(p => p.handle === product.handle)
                              return (
                                <button
                                  key={product.handle}
                                  onClick={() => !isAlreadySelected && addRecommendedProduct({
                                    _id: product._id,
                                    handle: product.handle,
                                    title: product.title,
                                    image: product.image,
                                    price: product.price
                                  })}
                                  disabled={isAlreadySelected}
                                  className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                                    isAlreadySelected
                                      ? 'border-green-300 bg-green-50 opacity-60'
                                      : 'border-blue-200 bg-white hover:border-blue-400'
                                  }`}
                                >
                                  {product.image && (
                                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
                                      <Image src={product.image} alt="" fill className="object-cover" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium">{product.title}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-neutral-500">₹{product.price}</span>
                                      <span className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700">
                                        {product.percentage}% co-purchased
                                      </span>
                                    </div>
                                  </div>
                                  {isAlreadySelected ? (
                                    <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                                  ) : (
                                    <Plus className="h-4 w-4 shrink-0 text-blue-600" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="py-3 text-center text-sm text-blue-700">
                          <Info className="mx-auto mb-1 h-5 w-5" />
                          {autoPreviewStats?.message || 'No order history found for this product. You can manually add recommendations below.'}
                        </div>
                      )}
                      
                      {!autoPreviewLoading && (
                        <button
                          onClick={() => fetchAutoPreview(sourceProduct.handle)}
                          className="mt-3 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Refresh Suggestions
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Recommended Products */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      {form.type === 'bought_together' ? 'Manual Override Products' : 'Recommended Products'} * ({selectedProducts.length} selected)
                    </label>
                    <p className="mb-2 text-xs text-neutral-500">
                      {form.type === 'bought_together' 
                        ? 'These manually selected products will override the automated suggestions on the product page.'
                        : 'Select products to recommend for this item.'}
                    </p>
                    
                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {selectedProducts.map((product, index) => (
                          <div
                            key={product.handle}
                            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3"
                          >
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveProduct(index, 'up')}
                                disabled={index === 0}
                                className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => moveProduct(index, 'down')}
                                disabled={index === selectedProducts.length - 1}
                                className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-xs font-bold">
                              {index + 1}
                            </span>
                            {product.image && (
                              <div className="relative h-10 w-10 overflow-hidden rounded">
                                <Image src={product.image} alt="" fill className="object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{product.title}</p>
                              <p className="text-xs text-neutral-500">₹{product.price}</p>
                            </div>
                            <button
                              onClick={() => removeRecommendedProduct(product.handle)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Add Product Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 outline-none focus:border-[#1B198F]"
                        placeholder="Search products to add..."
                      />
                      {searchingProducts && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
                      )}
                      {productSearch && productOptions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
                          {productOptions.map((product) => (
                            <button
                              key={product.handle}
                              onClick={() => addRecommendedProduct(product)}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                            >
                              {product.image && (
                                <div className="relative h-8 w-8 overflow-hidden rounded">
                                  <Image src={product.image} alt="" fill className="object-cover" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{product.title}</p>
                                <p className="text-xs text-neutral-500">₹{product.price}</p>
                              </div>
                              <Plus className="h-4 w-4 text-[#1B198F]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Display Limit</label>
                      <select
                        value={form.displayLimit}
                        onChange={(e) => setForm({ ...form, displayLimit: parseInt(e.target.value) })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F]"
                      >
                        {[2, 3, 4, 5, 6, 8].map(n => (
                          <option key={n} value={n}>{n} products</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2.5 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRecommendation}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {editingRec ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
