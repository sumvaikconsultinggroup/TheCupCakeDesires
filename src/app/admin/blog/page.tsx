'use client'

import ImageUpload from '@/components/ui/ImageUpload'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  BookOpen,
  Calendar,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Globe,
  Newspaper,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: { url: string; alt?: string; caption?: string }
  author: { name: string; avatar?: string; bio?: string }
  category?: string
  tags?: string[]
  seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] }
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  publishedAt?: string
  scheduledAt?: string
  isFeatured: boolean
  showInFooter: boolean
  readingTime?: number
  viewCount: number
  allowComments: boolean
  createdAt: string
}

interface BlogCategory {
  _id: string
  name: string
  slug: string
  description?: string
  color?: string
  postCount: number
  isActive: boolean
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-neutral-100 text-neutral-700', icon: FileText },
  published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: Globe },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  archived: { label: 'Archived', color: 'bg-orange-100 text-orange-700', icon: Archive },
}

export default function BlogManagementPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'seo' | 'settings'>('content')

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: { url: '', alt: '', caption: '' },
    author: { name: 'Gibbon Nutrition', avatar: '', bio: '' },
    category: '',
    tags: [] as string[],
    seo: { metaTitle: '', metaDescription: '', keywords: [] as string[] },
    status: 'draft' as BlogPost['status'],
    scheduledAt: '',
    isFeatured: false,
    showInFooter: true,
    allowComments: true,
  })

  // Category form
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', color: '#3b82f6' })
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  const [tagInput, setTagInput] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/blog/posts'),
        fetch('/api/admin/blog/categories'),
      ])

      if (postsRes.ok) {
        const data = await postsRes.json()
        if (data.success) setPosts(data.data)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        if (data.success) setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: { url: '', alt: '', caption: '' },
      author: { name: 'Gibbon Nutrition', avatar: '', bio: '' },
      category: '',
      tags: [],
      seo: { metaTitle: '', metaDescription: '', keywords: [] },
      status: 'draft',
      scheduledAt: '',
      isFeatured: false,
      showInFooter: true,
      allowComments: true,
    })
    setActiveTab('content')
    setTagInput('')
  }

  const openModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post)
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content,
        featuredImage: {
          url: post.featuredImage?.url || '',
          alt: post.featuredImage?.alt || '',
          caption: post.featuredImage?.caption || '',
        },
        author: {
          name: post.author?.name || 'Gibbon Nutrition',
          avatar: post.author?.avatar || '',
          bio: post.author?.bio || '',
        },
        category: post.category || '',
        tags: post.tags || [],
        seo: {
          metaTitle: post.seo?.metaTitle || '',
          metaDescription: post.seo?.metaDescription || '',
          keywords: post.seo?.keywords || [],
        },
        status: post.status,
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
        isFeatured: post.isFeatured,
        showInFooter: post.showInFooter,
        allowComments: post.allowComments,
      })
    } else {
      setEditingPost(null)
      resetForm()
    }
    setShowModal(true)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: !editingPost ? generateSlug(title) : prev.slug,
    }))
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const savePost = async () => {
    if (!form.title) {
      toast.error('Title is required')
      return
    }
    if (!form.content) {
      toast.error('Content is required')
      return
    }

    setSaving(true)
    try {
      const url = editingPost ? `/api/admin/blog/posts/${editingPost._id}` : '/api/admin/blog/posts'

      const res = await fetch(url, {
        method: editingPost ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingPost ? 'Post updated!' : 'Post created!')
        setShowModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return

    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Post deleted!')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const toggleStatus = async (post: BlogPost, newStatus: 'published' | 'draft') => {
    try {
      await fetch(`/api/admin/blog/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchData()
      toast.success(newStatus === 'published' ? 'Post published!' : 'Post unpublished')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const saveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Category name is required')
      return
    }

    try {
      const url = editingCategory ? `/api/admin/blog/categories/${editingCategory._id}` : '/api/admin/blog/categories'

      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingCategory ? 'Category updated!' : 'Category created!')
        setShowCategoryModal(false)
        setCategoryForm({ name: '', slug: '', description: '', color: '#3b82f6' })
        setEditingCategory(null)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save category')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return

    try {
      await fetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' })
      toast.success('Category deleted!')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (statusFilter !== 'all' && post.status !== statusFilter) return false
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Stats
  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    views: posts.reduce((sum, p) => sum + p.viewCount, 0),
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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Blog Management</h1>
            <p className="text-sm text-neutral-500">Create and manage blog posts</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryForm({ name: '', slug: '', description: '', color: '#3b82f6' })
                setShowCategoryModal(true)
              }}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2.5 font-medium transition-colors hover:bg-neutral-100"
            >
              <FolderOpen className="h-4 w-4" />
              Categories
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1B198F] to-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              New Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Newspaper className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total Posts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-xs text-neutral-500">Published</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draft}</p>
              <p className="text-xs text-neutral-500">Drafts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.views.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">Total Views</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 border-t border-neutral-100 px-6 py-3 dark:border-neutral-800">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-lg border border-neutral-200 py-2 pr-4 pl-10 text-sm outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-20 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
              <BookOpen className="h-10 w-10 text-[#1B198F]" />
            </div>
            <h3 className="mt-6 text-xl font-bold">No blog posts yet</h3>
            <p className="mt-2 text-neutral-500">Create your first blog post</p>
            <button
              onClick={() => openModal()}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-3 font-semibold text-white"
            >
              <Plus className="h-5 w-5" />
              Create Post
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => {
              const statusConfig = STATUS_CONFIG[post.status]
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={post._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {/* Featured Image */}
                  <div className="aspect-video relative bg-neutral-100">
                    {post.featuredImage?.url ? (
                      <Image
                        src={post.featuredImage.url}
                        alt={post.featuredImage.alt || post.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-12 w-12 text-neutral-300" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div
                      className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig.color}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </div>
                    {/* Featured Badge */}
                    {post.isFeatured && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="line-clamp-2 font-bold text-neutral-900 dark:text-white">{post.title}</h3>
                        {post.excerpt && (
                          <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {post.author.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readingTime || 1} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.viewCount}
                      </span>
                      {post.category && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-700">
                          {categories.find((c) => c.slug === post.category)?.name || post.category}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-neutral-400">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 dark:border-neutral-700">
                    <span className="text-xs text-neutral-500">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1">
                      {post.status === 'draft' ? (
                        <button
                          onClick={() => toggleStatus(post, 'published')}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                          title="Publish"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      ) : (
                        post.status === 'published' && (
                          <button
                            onClick={() => toggleStatus(post, 'draft')}
                            className="rounded-lg p-2 text-orange-600 hover:bg-orange-50"
                            title="Unpublish"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        )
                      )}
                      <button
                        onClick={() => openModal(post)}
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletePost(post._id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Post Modal */}
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
              className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <div>
                  <h2 className="text-xl font-bold">{editingPost ? 'Edit Post' : 'Create New Post'}</h2>
                  <p className="text-sm text-neutral-500">Write and publish your blog content</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-neutral-200 px-6 dark:border-neutral-700">
                {(['content', 'media', 'seo', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-[#1B198F] text-[#1B198F]'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Title *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-lg font-medium outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Enter post title..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Slug</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="post-url-slug"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat.slug}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Excerpt</label>
                      <textarea
                        value={form.excerpt}
                        onChange={(e) => setForm({ ...form, excerpt: e.target.value.slice(0, 300) })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        rows={2}
                        placeholder="Brief description of the post..."
                      />
                      <p className="mt-1 text-xs text-neutral-500">{form.excerpt.length}/300</p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Content *</label>
                      <textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        rows={12}
                        placeholder="Write your blog post content... (HTML supported)"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        HTML formatting supported. Reading time: ~
                        {Math.ceil(form.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)} min
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Tags</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="Add tag..."
                        />
                        <button
                          onClick={addTag}
                          className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white"
                        >
                          Add
                        </button>
                      </div>
                      {form.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {form.tags.map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                            >
                              #{tag}
                              <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}  

                {activeTab === 'media' && (
                  <div className="space-y-6">
                    <ImageUpload
                      label="Featured Image"
                      value={form.featuredImage.url}
                      onChange={(url) => setForm({ ...form, featuredImage: { ...form.featuredImage, url } })}
                      aspectRatio="video"
                      hint="Recommended: 1200x630px for optimal social sharing"
                      base64={true}
                    />

                    {form.featuredImage.url && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium">Alt Text</label>
                          <input
                            type="text"
                            value={form.featuredImage.alt}
                            onChange={(e) =>
                              setForm({ ...form, featuredImage: { ...form.featuredImage, alt: e.target.value } })
                            }
                            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                            placeholder="Describe the image..."
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium">Caption</label>
                          <input
                            type="text"
                            value={form.featuredImage.caption}
                            onChange={(e) =>
                              setForm({ ...form, featuredImage: { ...form.featuredImage, caption: e.target.value } })
                            }
                            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                            placeholder="Image caption..."
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Author Name</label>
                      <input
                        type="text"
                        value={form.author.name}
                        onChange={(e) => setForm({ ...form, author: { ...form.author, name: e.target.value } })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Author name"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Meta Title</label>
                      <input
                        type="text"
                        value={form.seo.metaTitle}
                        onChange={(e) =>
                          setForm({ ...form, seo: { ...form.seo, metaTitle: e.target.value.slice(0, 70) } })
                        }
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="SEO title (defaults to post title)"
                      />
                      <p className="mt-1 text-xs text-neutral-500">{form.seo.metaTitle?.length || 0}/70</p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Meta Description</label>
                      <textarea
                        value={form.seo.metaDescription}
                        onChange={(e) =>
                          setForm({ ...form, seo: { ...form.seo, metaDescription: e.target.value.slice(0, 160) } })
                        }
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        rows={3}
                        placeholder="SEO description for search results..."
                      />
                      <p className="mt-1 text-xs text-neutral-500">{form.seo.metaDescription?.length || 0}/160</p>
                    </div>

                    {/* SEO Preview */}
                    <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-700">
                      <p className="text-sm font-medium text-neutral-500">Search Preview</p>
                      <div className="mt-3">
                        <p className="text-lg text-blue-600">{form.seo.metaTitle || form.title || 'Post Title'}</p>
                        <p className="text-sm text-green-700">gibbon.com/blog/{form.slug || 'post-slug'}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {form.seo.metaDescription || form.excerpt || 'Post description will appear here...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Status</label>
                      <div className="flex gap-3">
                        {(['draft', 'published', 'scheduled'] as const).map((status) => {
                          const config = STATUS_CONFIG[status]
                          const StatusIcon = config.icon
                          return (
                            <button
                              key={status}
                              onClick={() => setForm({ ...form, status })}
                              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all ${
                                form.status === status
                                  ? 'border-[#1B198F] bg-[#1B198F]/5 text-[#1B198F]'
                                  : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              <StatusIcon className="h-4 w-4" />
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {form.status === 'scheduled' && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Schedule Date & Time</label>
                        <input
                          type="datetime-local"
                          value={form.scheduledAt}
                          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.isFeatured}
                          onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                          className="h-5 w-5 rounded text-[#1B198F]"
                        />
                        <div>
                          <span className="font-medium">Featured Post</span>
                          <p className="text-sm text-neutral-500">Highlight this post on the blog</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.showInFooter}
                          onChange={(e) => setForm({ ...form, showInFooter: e.target.checked })}
                          className="h-5 w-5 rounded text-[#1B198F]"
                        />
                        <div>
                          <span className="font-medium">Show in Footer</span>
                          <p className="text-sm text-neutral-500">Display in website footer blog section</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.allowComments}
                          onChange={(e) => setForm({ ...form, allowComments: e.target.checked })}
                          className="h-5 w-5 rounded text-[#1B198F]"
                        />
                        <div>
                          <span className="font-medium">Allow Comments</span>
                          <p className="text-sm text-neutral-500">Let readers comment on this post</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2.5 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setForm({ ...form, status: 'draft' })
                      savePost()
                    }}
                    disabled={saving}
                    className="rounded-lg border border-neutral-300 px-4 py-2.5 font-medium hover:bg-neutral-100"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={savePost}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1B198F] to-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {editingPost ? 'Update' : form.status === 'published' ? 'Publish' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCategoryModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
            >
              <h3 className="text-lg font-bold">Manage Categories</h3>

              {/* Category List */}
              <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-sm text-neutral-500">({cat.postCount} posts)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat)
                          setCategoryForm({
                            name: cat.name,
                            slug: cat.slug,
                            description: cat.description || '',
                            color: cat.color || '#3b82f6',
                          })
                        }}
                        className="rounded p-1.5 hover:bg-neutral-200"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat._id)}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Form */}
              <div className="mt-4 space-y-3 border-t pt-4">
                <h4 className="font-medium">{editingCategory ? 'Edit Category' : 'Add Category'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value, slug: generateSlug(e.target.value) })
                    }
                    className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                    placeholder="Category name"
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="h-10 w-10 cursor-pointer rounded border"
                    />
                    <input
                      type="text"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-[#1B198F] dark:border-neutral-600 dark:bg-neutral-700"
                      placeholder="slug"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editingCategory && (
                    <button
                      onClick={() => {
                        setEditingCategory(null)
                        setCategoryForm({ name: '', slug: '', description: '', color: '#3b82f6' })
                      }}
                      className="rounded-lg px-3 py-2 text-neutral-600 hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                  )}
                  <button onClick={saveCategory} className="rounded-lg bg-[#1B198F] px-4 py-2 font-medium text-white">
                    {editingCategory ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowCategoryModal(false)}
                className="mt-4 w-full rounded-lg border border-neutral-300 py-2 font-medium hover:bg-neutral-100"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
