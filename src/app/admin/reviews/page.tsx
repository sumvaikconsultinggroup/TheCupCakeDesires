'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ui/ImageUpload'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Search,
  Star, Calendar, Clock, Tag, User, Check, XCircle,
  MoreVertical, Download, Upload, Filter, ChevronDown,
  MessageSquare, ThumbsUp, Shield, FileSpreadsheet,
  CheckCircle, AlertCircle, Loader2, Package, Image as ImageIcon
} from 'lucide-react'

interface ReviewItem {
  _id: string
  star: number
  reviewerName: string
  reviewDescription: string
  image?: string
  isApproved: boolean
  helpfulCount: number
  createdAt: string
}

interface ProductWithReviews {
  _id: string
  title: string
  handle: string
  images: { src: string }[]
  reviews: ReviewItem[]
}


export default function ReviewsManagementPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [products, setProducts] = useState<ProductWithReviews[]>([])
  const [stats, setStats] = useState({ totalReviews: 0, approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null)
  
  // Form state
  const [form, setForm] = useState({
    productHandle: '',
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    content: '',
    images: [] as string[],
    isApproved: true,
    adminNotes: ''
  })
  
  // Import state
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [importData, setImportData] = useState<any[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Bulk selection
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set())
  
  // Product search for create/edit modal
  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<{_id: string; handle: string; title: string; image: string; price: number}[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{handle: string; title: string} | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedSearch || ''
      })
      
      const res = await fetch(`/api/admin/reviews?${params}`)
      
      // Check if response is OK
      if (!res.ok) {
        console.error('API returned error status:', res.status)
        return // Don't show error toast, just leave empty state
      }
      
      // Check content type before parsing
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType)
        return
      }
      
      const data = await res.json()
      
      if (data.success) {
        setProducts(data.data)
        setStats(data.stats || { totalReviews: 0, approved: 0, pending: 0 })
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      // Don't show toast for network errors - page will show empty state
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated, fetchData])

  // Product search function
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setProductOptions([])
      return
    }
    
    setSearchingProducts(true)
    try {
      const res = await fetch(`/api/admin/reviews/products?search=${encodeURIComponent(query)}`)
      
      if (!res.ok) {
        console.error('Product search failed:', res.status)
        setProductOptions([])
        return
      }
      
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type')
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

  // Debounce product search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch) {
        searchProducts(productSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const selectProduct = (product: {handle: string; title: string}) => {
    setSelectedProduct(product)
    setForm({ ...form, productHandle: product.handle })
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
      isApproved: true,
      adminNotes: ''
    })
    setSelectedProduct(null)
    setProductSearch('')
    setProductOptions([])
  }

  const openModal = (review?: ReviewItem) => {
    if (review) {
      setEditingReview(review)
      setForm({
        productHandle: '', // Not editable for existing review in this context easily without product info
        customerName: review.reviewerName,
        customerEmail: '', // Not stored in embedded review
        rating: review.star,
        title: '', // Not stored in embedded review
        content: review.reviewDescription,
        images: review.image ? [review.image] : [],
        isApproved: review.isApproved,
        adminNotes: ''
      })
      // setSelectedProduct({ handle: review.productHandle, title: review.productTitle })
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
      const url = editingReview 
        ? `/api/admin/reviews/${editingReview._id}`
        : '/api/admin/reviews'
      
      const res = await fetch(url, {
        method: editingReview ? 'PUT' : 'POST',
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
        toast.success(editingReview ? 'Review updated!' : 'Review created!')
        setShowModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  // const deleteReview = async (id: string) => {
  //   if (!confirm('Delete this review?')) return
    
  //   try {
  //     const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
  //     if (res.ok) {
  //       toast.success('Review deleted!')
  //       fetchData()
  //     }
  //   } catch (error) {
  //     toast.error('Failed to delete')
  //   }
  // }

  const updateStatus = async (productId: string, reviewId: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, reviewId, isApproved })
      })
      
      if (res.ok) {
        toast.success(`Review ${isApproved ? 'approved' : 'rejected'}!`)
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to update status')
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
        body: JSON.stringify({ action, reviewIds: Array.from(selectedReviews) })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setSelectedReviews(new Set())
        fetchData()
      }
    } catch (error) {
      toast.error('Bulk action failed')
    }
  }

  const handleGlobalAction = async (action: 'approve_all_pending' | 'reject_all_pending') => {
    const confirmMessage = action === 'approve_all_pending' 
      ? 'Are you sure you want to approve ALL pending reviews?' 
      : 'Are you sure you want to reject (delete) ALL pending reviews? This cannot be undone.'
    
    if (!confirm(confirmMessage)) return

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (error) {
      toast.error('Action failed')
    }
  }

  // CSV Import handlers
  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const reviews = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
      const review: any = {}
      
      headers.forEach((header, idx) => {
        review[header] = values[idx] || ''
      })
      
      reviews.push(review)
    }
    
    return reviews
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const parsed = parseCSV(content)
      
      if (parsed.length === 0) {
        toast.error('No valid data found in CSV')
        return
      }
      
      setImportData(parsed)
      setImportStep('preview')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleImport = async () => {
    setImportStep('importing')
    setImportProgress(0)
    
    const progressInterval = setInterval(() => {
      setImportProgress(prev => Math.min(prev + 10, 90))
    }, 200)
    
    try {
      const res = await fetch('/api/admin/reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: importData, overwriteExisting })
      })
      
      const data = await res.json()
      
      clearInterval(progressInterval)
      setImportProgress(100)
      
      if (data.success) {
        setImportResult({
          imported: data.imported,
          skipped: data.skipped,
          errors: data.errors || []
        })
        setImportStep('complete')
        fetchData()
      } else {
        toast.error(data.error || 'Import failed')
        setImportStep('preview')
      }
    } catch (error) {
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

  const downloadSampleCSV = () => {
    window.open('/api/admin/reviews/sample-csv', '_blank')
  }

  const addImageToForm = (url: string) => {
    if (url && !form.images.includes(url)) {
      setForm({ ...form, images: [...form.images, url] })
    }
  }

  const removeImageFromForm = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
  }

  if (authLoading || initialLoad) {
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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reviews Management</h1>
            <p className="text-sm text-neutral-500">Manage product reviews and ratings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 font-medium transition-colors hover:bg-neutral-100"
            >
              <Download className="h-4 w-4" />
              Sample CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 font-medium transition-colors hover:bg-neutral-100"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1B198F] to-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Add Review
            </button>
          </div>
        </div>

        {/* Stats & Global Actions */}
        <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 px-6 py-4 md:grid-cols-4 dark:border-neutral-800">
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Reviews</p>
              <p className="text-xl font-bold">{stats.totalReviews}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Approved</p>
              <p className="text-xl font-bold">{stats.approved}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <button
              onClick={() => handleGlobalAction('approve_all_pending')}
              disabled={stats.pending === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Approve All Pending
            </button>
            <button
              onClick={() => handleGlobalAction('reject_all_pending')}
              disabled={stats.pending === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject All Pending
            </button>
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
              placeholder="Search products..."
              className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          
          {/* Bulk Actions */}
          {selectedReviews.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-neutral-500">{selectedReviews.size} selected</span>
              <button
                onClick={() => handleBulkAction('approve')}
                className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className={`p-6 transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`}>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-20 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
              <MessageSquare className="h-10 w-10 text-[#1B198F]" />
            </div>
            <h3 className="mt-6 text-xl font-bold">No reviews yet</h3>
            <p className="mt-2 text-neutral-500">Add reviews manually or import from CSV</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 rounded-xl border border-neutral-300 px-6 py-3 font-semibold"
              >
                <Upload className="h-5 w-5" />
                Import CSV
              </button>
              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-3 font-semibold text-white"
              >
                <Plus className="h-5 w-5" />
                Add Review
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {products.map((product) => {
              return (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden"
                >
                  {/* Product Header */}
                  <div className="flex items-center gap-4 border-b border-neutral-100 bg-neutral-50/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700">
                      {product.images?.[0]?.src ? (
                        <Image src={product.images[0].src} alt={product.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                          <Package className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">{product.title}</h3>
                      <p className="text-sm text-neutral-500">{product.reviews.length} reviews</p>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {product.reviews.map((review) => (
                      <div key={review._id} className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-900 dark:text-white">{review.reviewerName}</span>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3.5 w-3.5 ${i < review.star ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  review.isApproved 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                  {review.isApproved ? 'Approved' : 'Pending'}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{review.reviewDescription}</p>
                            
                            {review.image && (
                              <div className="mt-3 relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <Image src={review.image} alt="Review" fill className="object-cover" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!review.isApproved ? (
                              <button
                                onClick={() => updateStatus(product._id, review._id, true)}
                                className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => updateStatus(product._id, review._id, false)}
                                className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            )}
                            {/* <button
                              onClick={() => openModal(review)}
                              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button> */}
                          </div>
                        </div>
                      </div>
                    ))}
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

      {/* Create/Edit Modal */}
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
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <h2 className="text-xl font-bold">{editingReview ? 'Edit Review' : 'Add Review'}</h2>
                <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Product Selection */}
                  <div className="relative">
                    <label className="mb-1.5 block text-sm font-medium">Product *</label>
                    {editingReview ? (
                      <div className="flex items-center gap-3 rounded-lg border border-neutral-300 px-4 py-2.5 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700">
                        <Package className="h-5 w-5 text-neutral-400" />
                        <span className="font-medium">{selectedProduct?.title || form.productHandle}</span>
                      </div>
                    ) : (
                      <>
                        {selectedProduct ? (
                          <div className="flex items-center justify-between rounded-lg border border-[#1B198F] bg-[#1B198F]/5 px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <Package className="h-5 w-5 text-[#1B198F]" />
                              <span className="font-medium">{selectedProduct.title}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProduct(null)
                                setForm({ ...form, productHandle: '' })
                              }}
                              className="text-neutral-400 hover:text-neutral-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={productSearch}
                              onChange={(e) => {
                                setProductSearch(e.target.value)
                                setShowProductDropdown(true)
                              }}
                              onFocus={() => setShowProductDropdown(true)}
                              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 pl-10 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                              placeholder="Search products..."
                            />
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                            {searchingProducts && (
                              <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-neutral-400" />
                            )}
                          </div>
                        )}
                        
                        {/* Product Dropdown */}
                        {showProductDropdown && productOptions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                            <div className="max-h-60 overflow-y-auto">
                              {productOptions.map((product) => (
                                <button
                                  key={product.handle}
                                  onClick={() => selectProduct(product)}
                                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                  {product.image ? (
                                    <Image
                                      src={product.image}
                                      alt={product.title}
                                      width={40}
                                      height={40}
                                      className="rounded-md object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-700">
                                      <Package className="h-5 w-5 text-neutral-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{product.title}</p>
                                    <p className="text-sm text-neutral-500">₹{product.price?.toLocaleString()}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Customer Name *</label>
                      <input
                        type="text"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Email *</label>
                      <input
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      />
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Rating *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setForm({ ...form, rating: star })}
                          className="p-1"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= form.rating ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Review Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      maxLength={200}
                    />
                  </div>
                  
                  {/* Content */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Review Content *</label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      rows={4}
                      maxLength={2000}
                    />
                    <p className="mt-1 text-xs text-neutral-500">{form.content.length}/2000</p>
                  </div>
                  
                  {/* Images */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Images</label>
                    {form.images.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-lg">
                            <Image src={img} alt="Review" fill className="object-cover" />
                            <button
                              onClick={() => removeImageFromForm(idx)}
                              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ImageUpload
                      value=""
                      onChange={addImageToForm}
                      placeholder="Add review image"
                      aspectRatio="square"
                    />
                  </div>
                  
                  {/* Status & Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Approval Status</label>
                      <select
                        value={form.isApproved ? 'approved' : 'pending'}
                        onChange={(e) => setForm({ ...form, isApproved: e.target.value === 'approved' })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Admin Notes */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Admin Notes (Internal)</label>
                    <textarea
                      value={form.adminNotes}
                      onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      rows={2}
                      placeholder="Internal notes..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2.5 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReview}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-2.5 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
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
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={closeImportModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F]/10">
                    <FileSpreadsheet className="h-5 w-5 text-[#1B198F]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Import Reviews from CSV</h2>
                    <p className="text-sm text-neutral-500">
                      {importStep === 'upload' && 'Upload your CSV file'}
                      {importStep === 'preview' && `${importData.length} reviews ready to import`}
                      {importStep === 'importing' && 'Importing...'}
                      {importStep === 'complete' && 'Import complete!'}
                    </p>
                  </div>
                </div>
                <button onClick={closeImportModal} className="rounded-full p-2 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {/* Upload Step */}
                {importStep === 'upload' && (
                  <div className="space-y-6">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
                        isDragging
                          ? 'border-[#1B198F] bg-[#1B198F]/5'
                          : 'border-neutral-300 hover:border-[#1B198F] hover:bg-neutral-50'
                      }`}
                    >
                      <Upload className={`mb-4 h-12 w-12 ${isDragging ? 'text-[#1B198F]' : 'text-neutral-400'}`} />
                      <p className="font-medium">Drop your CSV here or click to browse</p>
                      <p className="mt-1 text-sm text-neutral-500">Supports standard CSV format</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <h4 className="font-medium text-blue-700">CSV Format</h4>
                      <p className="mt-1 text-sm text-blue-600">
                        Required columns: product_handle, customer_name, email, rating, title, content
                      </p>
                      <p className="mt-1 text-sm text-blue-600">
                        Optional columns: image_url, verified, created_at
                      </p>
                      <button
                        onClick={downloadSampleCSV}
                        className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download Sample CSV
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Preview Step */}
                {importStep === 'preview' && (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                      <p className="font-medium text-green-700">
                        {importData.length} reviews parsed successfully
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-700">
                      <input
                        type="checkbox"
                        id="overwrite"
                        checked={overwriteExisting}
                        onChange={(e) => setOverwriteExisting(e.target.checked)}
                        className="h-4 w-4 rounded"
                      />
                      <label htmlFor="overwrite" className="text-sm">
                        Overwrite existing reviews (same email + product)
                      </label>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                      {importData.slice(0, 10).map((review, idx) => (
                        <div key={idx} className={`p-3 ${idx > 0 ? 'border-t border-neutral-100 dark:border-neutral-700' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{review.title || 'No title'}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < parseInt(review.rating) ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-neutral-500">
                            {review.customer_name} • {review.product_handle}
                          </p>
                        </div>
                      ))}
                      {importData.length > 10 && (
                        <div className="p-3 text-center text-sm text-neutral-500">
                          +{importData.length - 10} more reviews
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Importing Step */}
                {importStep === 'importing' && (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="h-16 w-16 animate-spin text-[#1B198F]" />
                    <p className="mt-6 text-lg font-medium">Importing reviews...</p>
                    <div className="mt-4 w-full max-w-sm">
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${importProgress}%` }}
                          className="h-full bg-[#1B198F]"
                        />
                      </div>
                      <p className="mt-2 text-center text-sm text-neutral-500">{importProgress}%</p>
                    </div>
                  </div>
                )}
                
                {/* Complete Step */}
                {importStep === 'complete' && importResult && (
                  <div className="flex flex-col items-center py-12">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold">Import Complete!</h3>
                    <div className="mt-4 flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                        <p className="text-sm text-neutral-500">Imported</p>
                      </div>
                      {importResult.skipped > 0 && (
                        <div className="text-center">
                          <p className="text-3xl font-bold text-amber-600">{importResult.skipped}</p>
                          <p className="text-sm text-neutral-500">Skipped</p>
                        </div>
                      )}
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-6 w-full max-w-md rounded-xl bg-amber-50 p-4">
                        <p className="text-sm font-medium text-amber-700">{importResult.errors.length} errors:</p>
                        <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-amber-600">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <button
                  onClick={importStep === 'complete' ? closeImportModal : () => setImportStep('upload')}
                  className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  {importStep === 'complete' ? 'Close' : 'Back'}
                </button>
                {importStep === 'preview' && (
                  <button
                    onClick={handleImport}
                    className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-2 font-medium text-white"
                  >
                    <Upload className="h-4 w-4" />
                    Import {importData.length} Reviews
                  </button>
                )}
                {importStep === 'complete' && (
                  <button
                    onClick={closeImportModal}
                    className="rounded-xl bg-[#1B198F] px-6 py-2 font-medium text-white"
                  >
                    Done
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
