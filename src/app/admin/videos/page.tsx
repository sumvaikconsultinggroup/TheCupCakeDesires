'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Edit2,
  Eye,
  Heart,
  Home,
  Link as LinkIcon,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5"


interface ProductTag {
  productId: string
  productHandle: string
  productName: string
  productPrice: number
  productImage: string
  position?: { x: number; y: number }
}

interface VideoReel {
  id: string
  _id?: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  aspectRatio?: AspectRatio
  products: ProductTag[]
  influencer?: {
    name: string
    handle?: string
    avatarUrl?: string
    profileUrl?: string
  }
  stats: {
    views: number
    likes: number
    shares: number
  }
  tags: string[]
  category?: string
  isActive: boolean
  isFeatured: boolean
  displayOrder: number
  autoPlay: boolean
  showOnHomepage: boolean
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  active: number
  inactive: number
  featured: number
  onHomepage: number
  withProducts: number
  engagement: {
    totalViews: number
    totalLikes: number
    totalShares: number
    avgViews: number
  }
}

interface Product {
  id: string
  title: string
  handle: string
  price: number
  images: { url: string }[]
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoReel[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoReel | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 0,
    aspectRatio: '9:16' as AspectRatio,
    products: [] as ProductTag[],
    influencer: {
      name: '',
      handle: '',
      avatarUrl: '',
      profileUrl: '',
    },
    tags: [] as string[],
    category: '',
    isActive: true,
    isFeatured: false,
    autoPlay: false,
    showOnHomepage: true,
  })

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)

      const res = await fetch(`/api/admin/videos?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
        setCategories(data.filters?.categories || [])
      }
    } catch (error) {
      toast.error('Failed to fetch videos')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, categoryFilter])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/videos/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats')
    }
  }, [])

  // Fetch products for tagging
  const fetchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setProducts([])
      return
    }
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10&published=true`)
      if (res.ok) {
        const data = await res.json()
        // Transform products to match expected format
        const transformedProducts = (data.data || data.products || []).map((p: any) => ({
          id: p._id || p.id,
          title: p.title,
          handle: p.handle,
          price: p.variants?.[0]?.price || 0,
          images: p.images || [],
        }))
        setProducts(transformedProducts)
      } else {
        console.error('Product fetch failed:', res.status)
        setProducts([])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    }
  }, [])

  // Upload video file
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid video file (MP4, WebM, MOV, AVI)')
      return
    }

    // Max 100MB
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file must be less than 100MB')
      return
    }

    setUploadingVideo(true)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('type', 'video')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, videoUrl: data.url }))
        toast.success('Video uploaded successfully!')
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Upload failed:', res.status, errorData)
        toast.error(errorData.error || 'Failed to upload video')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error uploading video')
    } finally {
      setUploadingVideo(false)
    }
  }

  // Upload thumbnail file
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, WebP, GIF)')
      return
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be less than 5MB')
      return
    }

    setUploadingThumbnail(true)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    formDataUpload.append('type', 'image')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, thumbnailUrl: data.url })
        toast.success('Thumbnail uploaded successfully!')
      } else {
        toast.error('Failed to upload thumbnail')
      }
    } catch (error) {
      toast.error('Error uploading thumbnail')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  useEffect(() => {
    fetchVideos()
    fetchStats()
  }, [fetchVideos, fetchStats])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts(productSearch)
    }, 300)
    return () => clearTimeout(debounce)
  }, [productSearch, fetchProducts])

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      aspectRatio: '9:16' as AspectRatio,
      products: [],
      influencer: { name: '', handle: '', avatarUrl: '', profileUrl: '' },
      tags: [],
      category: '',
      isActive: true,
      isFeatured: false,
      autoPlay: false,
      showOnHomepage: true,
    })
    setEditingVideo(null)
  }

  // Open create/edit modal
  const openModal = (video?: VideoReel) => {
    if (video) {
      setEditingVideo(video)
      setFormData({
        title: video.title,
        description: video.description || '', 
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl || '',
        duration: video.duration || 0,
        aspectRatio: video.aspectRatio || ('9:16' as AspectRatio),
        products: video.products || [],
        influencer: {
          name: video.influencer?.name || '',
          handle: video.influencer?.handle || '',
          avatarUrl: video.influencer?.avatarUrl || '',
          profileUrl: video.influencer?.profileUrl || '',
        },
        tags: video.tags || [],
        category: video.category || '',
        isActive: video.isActive,
        isFeatured: video.isFeatured,
        autoPlay: video.autoPlay,
        showOnHomepage: video.showOnHomepage,
      })
    } else {
      resetForm()
    }
    setShowVideoModal(true)
  }

  // Save video
  const saveVideo = async () => {
    if (!formData.title) {
      toast.error('Title is required')
      return
    }

    if (!formData.videoUrl) {
      toast.error('Video is required - Please provide a URL or upload a file')
      return
    }

    try {
      const url = editingVideo ? `/api/admin/videos/${editingVideo.id || editingVideo._id}` : '/api/admin/videos'

      const res = await fetch(url, {
        method: editingVideo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(editingVideo ? 'Video updated!' : 'Video created!')
        setShowVideoModal(false)
        resetForm()
        fetchVideos()
        fetchStats()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save video')
      }
    } catch (error) {
      toast.error('Failed to save video')
    }
  }

  // Delete video
  const deleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    const video = videos.find((v) => (v.id || v._id) === id)

    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: video?.videoUrl,
          thumbnailUrl: video?.thumbnailUrl,
        }),
      })
      if (res.ok) {
        toast.success('Video deleted!')
        fetchVideos()
        fetchStats()
      }
    } catch (error) {
      toast.error('Failed to delete video')
    }
  }

  // Toggle video status
  const toggleStatus = async (id: string, field: 'isActive' | 'isFeatured' | 'showOnHomepage') => {
    const video = videos.find((v) => v.id === id || v._id === id)
    if (!video) return

    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !video[field] }),
      })

      if (res.ok) {
        toast.success('Status updated!')
        fetchVideos()
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  // Bulk action
  const bulkAction = async (action: string) => {
    if (selectedVideos.length === 0) {
      toast.error('No videos selected')
      return
    }

    try {
      const res = await fetch('/api/admin/videos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, videoIds: selectedVideos }),
      })

      if (res.ok) {
        toast.success('Bulk action completed!')
        setSelectedVideos([])
        fetchVideos()
        fetchStats()
      }
    } catch (error) {
      toast.error('Failed to perform bulk action')
    }
  }

  // Add product tag
  const addProductTag = (product: Product) => {
    if (formData.products.find((p) => p.productId === product.id)) {
      toast.error('Product already added')
      return
    }

    setFormData({
      ...formData,
      products: [
        ...formData.products,
        {
          productId: product.id,
          productHandle: product.handle,
          productName: product.title,
          productPrice: product.price,
          productImage: product.images?.[0]?.url || '',
          position: { x: 50, y: 50 },
        },
      ],
    })
    setProductSearch('')
    setProducts([])
  }

  // Remove product tag
  const removeProductTag = (productId: string) => {
    setFormData({
      ...formData,
      products: formData.products.filter((p) => p.productId !== productId),
    })
  }

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Video Reels</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage shoppable video content for your storefront
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Video
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Video} label="Total Videos" value={stats.total} />
          <StatCard icon={Eye} label="Active" value={stats.active} color="green" />
          <StatCard icon={Star} label="Featured" value={stats.featured} color="yellow" />
          <StatCard icon={Home} label="On Homepage" value={stats.onHomepage} color="blue" />
          <StatCard icon={Tag} label="With Products" value={stats.withProducts} color="purple" />
          <StatCard
            icon={TrendingUp}
            label="Total Views"
            value={formatNumber(stats.engagement.totalViews)}
            color="orange"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-4 pl-10 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {selectedVideos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">{selectedVideos.length} selected</span>
              <button
                onClick={() => bulkAction('activate')}
                className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
              >
                Activate
              </button>
              <button
                onClick={() => bulkAction('deactivate')}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Deactivate
              </button>
              <button
                onClick={() => bulkAction('delete')}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700">
          <Video className="h-12 w-12 text-neutral-300" />
          <p className="mt-2 text-sm text-neutral-500">No videos found</p>
          <button onClick={() => openModal()} className="mt-4 text-sm font-medium text-primary-600 hover:underline">
            Add your first video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id || video._id}
              video={video}
              isSelected={selectedVideos.includes(video.id || video._id || '')}
              onSelect={(id) => {
                setSelectedVideos((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
              }}
              onEdit={() => openModal(video)}
              onDelete={() => deleteVideo(video.id || video._id || '')}
              onToggleStatus={(field) => toggleStatus(video.id || video._id || '', field)}
            />
          ))}
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800">
                <h2 className="text-lg font-semibold">{editingVideo ? 'Edit Video' : 'Add New Video'}</h2>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Basic Information</h3>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                      placeholder="Video title"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                      placeholder="Video description"
                    />
                  </div>

                  {/* Video Upload Section */}
                  <div className="space-y-3">
                    <label className="mb-1 block text-sm font-medium">Video *</label>

                    {/* Toggle between URL and Upload */}
                    <div className="mb-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          uploadMode === 'url'
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400'
                        }`}
                      >
                        <LinkIcon className="h-4 w-4" />
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('upload')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          uploadMode === 'upload'
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-400'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>
                    </div>

                    {uploadMode === 'url' ? (
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="https://example.com/video.mp4"
                      />
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                          onChange={handleVideoUpload}
                          className="hidden"
                          id="video-upload"
                          disabled={uploadingVideo}
                        />
                        <label
                          htmlFor="video-upload"
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                            uploadingVideo
                              ? 'border-neutral-300 bg-neutral-50'
                              : 'border-neutral-300 hover:border-primary-500 hover:bg-primary-50/50 dark:border-neutral-600 dark:hover:border-primary-500'
                          }`}
                        >
                          {uploadingVideo ? (
                            <>
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
                              <span className="mt-2 text-sm text-neutral-500">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-neutral-400" />
                              <span className="mt-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Click to upload video
                              </span>
                              <span className="mt-1 text-xs text-neutral-400">MP4, WebM, MOV (max 100MB)</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {formData.videoUrl && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        Video URL set
                        <a
                          href={formData.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto underline"
                        >
                          Preview
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Upload */}
                  <div className="space-y-3">
                    <label className="mb-1 block text-sm font-medium">Thumbnail</label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="url"
                        value={formData.thumbnailUrl}
                        onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="Thumbnail URL"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                          id="thumbnail-upload"
                          disabled={uploadingThumbnail}
                        />
                        <label
                          htmlFor="thumbnail-upload"
                          className={`flex h-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm transition-colors ${
                            uploadingThumbnail
                              ? 'bg-neutral-50'
                              : 'hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {uploadingThumbnail ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-500" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                    {formData.thumbnailUrl && (formData.thumbnailUrl.startsWith('http') || formData.thumbnailUrl.startsWith('/')) && (
                      <div className="flex items-center gap-3">
                        <Image
                          src={formData.thumbnailUrl}
                          alt="Thumbnail preview"
                          width={60}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                        <span className="text-xs text-neutral-500">Thumbnail set</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Aspect Ratio</label>
                      <select
                        value={formData.aspectRatio}
                        onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value as any })}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="9:16">9:16 (Vertical)</option>
                        <option value="16:9">16:9 (Horizontal)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:5">4:5 (Portrait)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="e.g., Fitness, Recipes"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Tagging */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Product Tagging</h3>

                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 py-2 pr-4 pl-10 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                      placeholder="Search products to tag..."
                    />

                    {products.length > 0 && (
                      <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        {products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addProductTag(product)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700"
                          >
                            {product.images?.[0]?.url && (
                              <Image
                                src={product.images[0].url}
                                alt={product.title}
                                width={32}
                                height={32}
                                className="rounded"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">{product.title}</p>
                              <p className="text-xs text-neutral-500">₹{product.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {formData.products.length > 0 && (
                    <div className="space-y-2">
                      {formData.products.map((product, index) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between rounded-lg border border-neutral-200 p-2 dark:border-neutral-700"
                        >
                          <div className="flex items-center gap-2">
                            {product.productImage && (
                              <Image
                                src={product.productImage}
                                alt={product.productName}
                                width={40}
                                height={40}
                                className="rounded"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">{product.productName}</p>
                              <p className="text-xs text-neutral-500">₹{product.productPrice}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeProductTag(product.productId)}
                            className="rounded-full p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Influencer Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Influencer (Optional)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={formData.influencer.name}
                        onChange={(e) =>
                          setFormData({ ...formData, influencer: { ...formData.influencer, name: e.target.value } })
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="Influencer name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Handle</label>
                      <input
                        type="text"
                        value={formData.influencer.handle}
                        onChange={(e) =>
                          setFormData({ ...formData, influencer: { ...formData.influencer, handle: e.target.value } })
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="@handle"
                      />
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Settings</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm">Featured</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.autoPlay}
                        onChange={(e) => setFormData({ ...formData, autoPlay: e.target.checked })}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm">Auto Play</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.showOnHomepage}
                        onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-sm">Show on Homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={saveVideo}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  {editingVideo ? 'Save Changes' : 'Create Video'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color = 'neutral',
}: {
  icon: any
  label: string
  value: number | string
  color?: 'neutral' | 'green' | 'yellow' | 'blue' | 'purple' | 'orange'
}) {
  const colors = {
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className={`mb-2 inline-flex rounded-lg p-2 ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  )
}

// Video Card Component
function VideoCard({
  video,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  video: VideoReel
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: (field: 'isActive' | 'isFeatured' | 'showOnHomepage') => void
}) {
  const id = video.id || video._id || ''

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all ${
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-200'
          : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
      } bg-white dark:bg-neutral-800`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(id)}
          className="h-4 w-4 rounded border-white/50 bg-white/20 backdrop-blur-sm"
        />
      </div>

      {/* Thumbnail/Video Preview */}
      <div className="relative aspect-[9/16] bg-neutral-900">
        {video.thumbnailUrl ? (
          <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Video className="h-12 w-12 text-neutral-600" />
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {video.isFeatured && (
            <span className="rounded bg-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-white">FEATURED</span>
          )}
          {!video.isActive && (
            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">INACTIVE</span>
          )}
        </div>

        {/* Product Count */}
        {video.products.length > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-neutral-900">
            <Tag className="h-3 w-3" />
            {video.products.length} products
          </div>
        )}

        {/* Stats */}
        <div className="absolute right-2 bottom-2 flex items-center gap-2 text-white">
          <span className="flex items-center gap-1 text-xs">
            <Eye className="h-3 w-3" />
            {video.stats.views}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Heart className="h-3 w-3" />
            {video.stats.likes}
          </span>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-full bg-white p-2 text-neutral-900 hover:bg-neutral-100">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="rounded-full bg-white p-2 text-red-500 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-white">{video.title}</h3>
        {video.category && <p className="mt-0.5 text-xs text-neutral-500">{video.category}</p>}

        {/* Quick Toggles */}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => onToggleStatus('isActive')}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              video.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {video.isActive ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => onToggleStatus('showOnHomepage')}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              video.showOnHomepage ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {video.showOnHomepage ? 'Homepage' : 'Hidden'}
          </button>
        </div>
      </div>
    </div>
  )
}
