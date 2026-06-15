'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Plus,
  X,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Folder,
  Zap,
  Layers,
  Package,
  Search,
  GripVertical,
  List,
  FileText,
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  ),
})
import {
  getCollectionByHandle,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionProducts,
  addProductsToCollection,
  removeProductsFromCollection,
} from '../collection-actions'
import { getProducts } from '../../products/product-actions'

type DisplayLocation = string

interface DisplaySettings {
  locations: DisplayLocation[]
  priority: number
  showOnMobile: boolean
  showOnDesktop: boolean
  layoutStyle: 'grid' | 'carousel'
  itemsPerRow: number
  maxItems: number
  showTitle: boolean
  showDescription: boolean
  showProductCount: boolean
  category?: string
  backgroundColor?: string
  textColor?: string
}

interface CollectionFormData {
  title: string
  handle: string
  description: string
  contentDescription: string
  image: string
  bannerImage: string
  mobileImage: string
  thumbnailImage: string
  seo: {
    title?: string
    description?: string
  }
  sortOrder: string
  collectionType: 'manual' | 'automated'
  conditions: {
    field: string
    operator: string
    value: string
  }[]
  conditionMatch: 'all' | 'any'
  productHandles: string[]
  displaySettings: DisplaySettings
  isFeatured: boolean
  featuredOrder: number
  published: boolean
  faq: { question: string; answer: string }[]
}

interface Product {
  handle: string
  title: string
  images?: { src: string }[]
  variants?: { price: number; inventoryQty?: number }[]
}

const conditionFields = [
  { value: 'title', label: 'Product title' },
  { value: 'type', label: 'Product type' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'tag', label: 'Product tag' },
  { value: 'price', label: 'Price' },
  { value: 'compare_at_price', label: 'Compare at price' },
  { value: 'inventory_stock', label: 'Inventory stock' },
  { value: 'category', label: 'Category' },
]

const conditionOperators = [
  { value: 'equals', label: 'is equal to' },
  { value: 'not_equals', label: 'is not equal to' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
]

const sortOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'title-asc', label: 'Alphabetically, A-Z' },
  { value: 'title-desc', label: 'Alphabetically, Z-A' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'date-asc', label: 'Date, old to new' },
  { value: 'date-desc', label: 'Date, new to old' },
]

export default function CollectionEditPage() {
  const router = useRouter()
  const params = useParams()
  const handle = params.handle as string
  const isNew = handle === 'new'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CollectionFormData>({
    title: '',
    handle: '',
    description: '',
    contentDescription: '',
    image: '',
    bannerImage: '',
    mobileImage: '',
    thumbnailImage: '',
    seo: { title: '', description: '' },
    sortOrder: 'manual',
    collectionType: 'manual',
    conditions: [{ field: 'tag', operator: 'equals', value: '' }],
    conditionMatch: 'all',
    productHandles: [],
    displaySettings: {
      locations: [],
      priority: 0,
      showOnMobile: true,
      showOnDesktop: true,
      layoutStyle: 'grid',
      itemsPerRow: 4,
      maxItems: 12,
      showTitle: true,
      showDescription: false,
      showProductCount: true,
      category: '',
    },
    isFeatured: false,
    featuredOrder: 0,
    published: false,
    faq: [],
  })

  useEffect(() => {
    if (!isNew) {
      fetchCollection()
    }
    fetchAllProducts()
  }, [handle])

  const fetchCollection = async () => {
    try {
      const result = await getCollectionByHandle(handle)
      if (result.success && result.collection) {
        const col = result.collection
        setFormData({
          title: col.title || '',
          handle: col.handle || '',
          description: col.description || '',
          contentDescription: col.contentDescription || '',
          image: col.image || '',
          bannerImage: col.bannerImage || '',
          mobileImage: col.mobileImage || '',
          thumbnailImage: col.thumbnailImage || '',
          seo: col.seo || { title: '', description: '' },
          sortOrder: col.sortOrder || 'manual',
          collectionType: col.collectionType || 'manual',
          conditions: col.conditions?.length > 0
            ? col.conditions
            : [{ field: 'tag', operator: 'equals', value: '' }],
          conditionMatch: col.conditionMatch || 'all',
          productHandles: col.productHandles || [],
          displaySettings: col.displaySettings || {
            locations: [],
            priority: 0,
            showOnMobile: true,
            showOnDesktop: true,
            layoutStyle: 'grid',
            itemsPerRow: 4,
            maxItems: 12,
            showTitle: true,
            showDescription: false,
            showProductCount: true,
            category: col.displaySettings?.category || '',
          },
          isFeatured: col.isFeatured ?? false,
          featuredOrder: col.featuredOrder || 0,
          published: col.published ?? false,
          faq: col.faq || [],
        })

        // Fetch products in collection
        const productsResult = await getCollectionProducts(handle)
        if (productsResult.success && productsResult.products) {
          setCollectionProducts(productsResult.products)
        }
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Collection not found' })
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
      setSaveMessage({ type: 'error', text: 'Failed to load collection' })
    }
    setLoading(false)
  }

  const fetchAllProducts = async () => {
    try {
      const result = await getProducts({ limit: 100 })
      if (result.success && result.products) {
        setAllProducts(result.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSaving(true)
    setSaveMessage(null)

    try {
      const {
        displaySettings: _displaySettings,
        isFeatured: _isFeatured,
        featuredOrder: _featuredOrder,
        ...collectionPayload
      } = formData

      let result
      if (isNew) {
        result = await createCollection(collectionPayload)
      } else {
        result = await updateCollection(handle, collectionPayload)
      }

      if (result.success) {
        setSaveMessage({ type: 'success', text: result.message || 'Collection saved successfully' })

        if (!isNew && formData.handle !== handle) {
          router.push(`/admin/collections/${formData.handle}`)
        } else if (isNew && result.collection?.handle) {
          router.push(`/admin/collections/${result.collection.handle}`)
        }
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Failed to save collection' })
      }
    } catch (error) {
      console.error('Error saving collection:', error)
      setSaveMessage({ type: 'error', text: 'An error occurred while saving' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteCollection(handle)
      if (result.success) {
        router.push('/admin/collections')
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Failed to delete collection' })
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      setSaveMessage({ type: 'error', text: 'Failed to delete collection' })
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  const updateField = (field: keyof CollectionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === 'title' && isNew) {
      const newHandle = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, handle: newHandle }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'bannerImage' | 'mobileImage' | 'thumbnailImage' = 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image must be less than 5MB')
      return
    }

    setUploadingImage(true)
    setImageUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'image')
      formData.append('folder', 'collections')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()

      if (data.success && data.url) {
        updateField(field, data.url)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Image upload error:', error)
      setImageUploadError(error.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const addCondition = () => {
    updateField('conditions', [
      ...formData.conditions,
      { field: 'tag', operator: 'equals', value: '' }
    ])
  }

  const removeCondition = (index: number) => {
    if (formData.conditions.length > 1) {
      updateField('conditions', formData.conditions.filter((_, i) => i !== index))
    }
  }

  const updateCondition = (index: number, field: string, value: string) => {
    const newConditions = [...formData.conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    updateField('conditions', newConditions)
  }

  const addFaq = () => {
    updateField('faq', [...formData.faq, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    updateField('faq', formData.faq.filter((_, i) => i !== index))
  }

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaq = [...formData.faq]
    newFaq[index] = { ...newFaq[index], [field]: value }
    updateField('faq', newFaq)
  }

  const addProductToCollection = (productHandle: string) => {
    if (!formData.productHandles.includes(productHandle)) {
      const newHandles = [...formData.productHandles, productHandle]
      updateField('productHandles', newHandles)

      const product = allProducts.find(p => p.handle === productHandle)
      if (product) {
        setCollectionProducts([...collectionProducts, product])
      }
    }
  }

  const removeProductFromCollection = (productHandle: string) => {
    const newHandles = formData.productHandles.filter(h => h !== productHandle)
    updateField('productHandles', newHandles)
    setCollectionProducts(collectionProducts.filter(p => p.handle !== productHandle))
  }

  const filteredProducts = allProducts.filter(p =>
    !formData.productHandles.includes(p.handle) &&
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#2e1f15]" />
          <p className="text-neutral-500">Loading collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/collections"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isNew ? 'Create Collection' : 'Edit Collection'}
            </h1>
            {!isNew && (
              <p className="text-sm text-neutral-500">/{formData.handle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <>
              <Link
                href={`/collections/${formData.handle}`}
                target="_blank"
                className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:border-red-900"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-6 py-2 text-sm font-medium text-white transition-all hover:bg-[#2e1f15]/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Collection'}
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 rounded-xl p-4 ${saveMessage.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
        >
          {saveMessage.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {saveMessage.text}
          <button onClick={() => setSaveMessage(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Collection Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Summer Collection"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition-all focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Handle (URL)
                  </label>
                  <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <span className="bg-neutral-50 px-4 py-3 text-neutral-500 dark:bg-neutral-900">/collections/</span>
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => updateField('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 border-0 px-4 py-3 outline-none dark:bg-neutral-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Describe this collection..."
                    rows={4}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition-all focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* Collection Type */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Collection Type</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateField('collectionType', 'manual')}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${formData.collectionType === 'manual'
                    ? 'border-[#2e1f15] bg-[#2e1f15]/5'
                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                    }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${formData.collectionType === 'manual' ? 'bg-[#2e1f15] text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">Manual</p>
                    <p className="mt-1 text-sm text-neutral-500">Add products one by one</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('collectionType', 'automated')}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${formData.collectionType === 'automated'
                    ? 'border-[#2e1f15] bg-[#2e1f15]/5'
                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                    }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${formData.collectionType === 'automated' ? 'bg-[#2e1f15] text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">Automated</p>
                    <p className="mt-1 text-sm text-neutral-500">Products match conditions automatically</p>
                  </div>
                </button>
              </div>

              {/* Conditions for Automated */}
              {formData.collectionType === 'automated' && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Products must match</span>
                    <select
                      value={formData.conditionMatch}
                      onChange={(e) => updateField('conditionMatch', e.target.value)}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <option value="all">all conditions</option>
                      <option value="any">any condition</option>
                    </select>
                  </div>

                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {conditionFields.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {conditionOperators.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
                      />
                      {formData.conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCondition}
                    className="flex items-center gap-2 text-sm font-medium text-[#2e1f15] hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add another condition
                  </button>
                </div>
              )}

              {/* Products for Manual */}
              {formData.collectionType === 'manual' && (
                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-medium text-neutral-900 dark:text-white">
                      Products ({collectionProducts.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowProductPicker(true)}
                      className="flex items-center gap-1 rounded-lg bg-[#2e1f15]/10 px-3 py-1.5 text-sm font-medium text-[#2e1f15] hover:bg-[#2e1f15]/20"
                    >
                      <Plus className="h-4 w-4" /> Add Products
                    </button>
                  </div>

                  {collectionProducts.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-neutral-200 py-8 text-center dark:border-neutral-700">
                      <Package className="mx-auto h-10 w-10 text-neutral-300" />
                      <p className="mt-2 text-sm text-neutral-500">No products added yet</p>
                      <button
                        type="button"
                        onClick={() => setShowProductPicker(true)}
                        className="mt-3 text-sm font-medium text-[#2e1f15] hover:underline"
                      >
                        Browse products
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {collectionProducts.map((product) => (
                        <div
                          key={product.handle}
                          className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700"
                        >
                          <GripVertical className="h-4 w-4 cursor-move text-neutral-400" />
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-100">
                            {product.images?.[0]?.src ? (
                              <Image src={product.images[0].src} alt="" fill className="object-cover" />
                            ) : (
                              <Package className="absolute inset-0 m-auto h-6 w-6 text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900 dark:text-white">{product.title}</p>
                            <p className="text-sm text-neutral-500">₹{product.variants?.[0]?.price || 0}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProductFromCollection(product.handle)}
                            className="text-neutral-400 hover:text-red-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Collection Image</h2>

              {imageUploadError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {imageUploadError}
                  <button onClick={() => setImageUploadError(null)} className="ml-auto">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="relative">
                {formData.image ? (
                  <div className="group relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
                    <Image
                      src={formData.image}
                      alt="Collection image"
                      fill
                      className="object-cover"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center text-white">
                          <Loader2 className="mx-auto h-10 w-10 animate-spin" />
                          <span className="mt-2 block text-sm font-medium">Uploading...</span>
                        </div>
                      </div>
                    )}
                    {!uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-700 hover:bg-neutral-100"
                          title="Change image"
                        >
                          <Upload className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('image', '')}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                          title="Remove image"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-[#2e1f15] hover:text-[#2e1f15] disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <span className="mt-2 font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10" />
                        <span className="mt-2 font-medium">Upload Image</span>
                        <span className="mt-1 text-xs text-neutral-400">Max 5MB • JPG, PNG, WebP</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'image')}
                disabled={uploadingImage}
                className="hidden"
              />

              {formData.image && !uploadingImage && (
                <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Image uploaded successfully</span>
                </div>
              )}
            </div>

            {/* Enhanced SEO & FAQ Container */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <div className="mb-6 flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">SEO & Marketing Content</h2>
                </div>
              </div>

              <div className="space-y-6">
                {/* Page Content Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Page Content Description
                  </label>
                  <RichTextEditor
                    content={formData.contentDescription || ''}
                    onChange={(value) => updateField('contentDescription', value)}
                    placeholder="Enter rich text content to display on the collection page..."
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    This content will be displayed on the collection page for visitors to read.
                  </p>
                </div>

                {/* SEO Section */}
                <div className="border-t border-neutral-100 pt-6 dark:border-neutral-700">
                  <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">Search Engine Optimization</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={formData.seo.title || ''}
                        onChange={(e) => updateField('seo', { ...formData.seo, title: e.target.value })}
                        placeholder={formData.title}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition-all focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Recommended: 50-60 characters
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        SEO Meta Description
                      </label>
                      <textarea
                        value={formData.seo.description || ''}
                        onChange={(e) => updateField('seo', { ...formData.seo, description: e.target.value })}
                        placeholder="Enter a concise description for search engines (150-160 characters)..."
                        rows={3}
                        maxLength={160}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none transition-all focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        {formData.seo.description?.length || 0}/160 characters · This appears in search engine results
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-6 dark:border-neutral-700">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30">
                        <List className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-neutral-900 dark:text-white">Collection FAQ</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addFaq}
                      className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#2e1f15]/90"
                    >
                      <Plus className="h-4 w-4" />
                      Add FAQ
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.faq.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
                      >
                        <button
                          type="button"
                          onClick={() => removeFaq(index)}
                          className="absolute right-3 top-3 text-neutral-400 transition-colors hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="pr-8">
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            Question {index + 1}
                          </label>
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                            placeholder="e.g., What is special about this collection?"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            Answer
                          </label>
                          <textarea
                            value={item.answer}
                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                            placeholder="Provide a detailed answer..."
                            rows={3}
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                      </motion.div>
                    ))}

                    {formData.faq.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 py-8 dark:border-neutral-700">
                        <List className="h-8 w-8 text-neutral-300" />
                        <p className="mt-2 text-sm text-neutral-500">No FAQ items added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Status</h2>
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {formData.published ? 'Published' : 'Draft'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formData.published ? 'Visible on storefront' : 'Not visible to customers'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('published', !formData.published)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${formData.published ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.published ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Sort Order */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Sort Order</h2>
              <select
                value={formData.sortOrder}
                onChange={(e) => updateField('sortOrder', e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="mt-3 text-xs text-neutral-500">
                Homepage placement is managed under{' '}
                <Link href="/admin/homepage/sections" className="text-[#2e1f15] underline underline-offset-2">
                  Storefront → Homepage Sections
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Product Picker Modal */}
      <AnimatePresence>
        {showProductPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowProductPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl dark:bg-neutral-800"
            >
              <div className="border-b border-neutral-200 p-4 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Add Products</h3>
                  <button onClick={() => setShowProductPicker(false)}>
                    <X className="h-5 w-5 text-neutral-400" />
                  </button>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredProducts.length === 0 ? (
                    <p className="py-8 text-center text-neutral-500">No products found</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.handle}
                        onClick={() => addProductToCollection(product.handle)}
                        className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-100">
                          {product.images?.[0]?.src ? (
                            <Image src={product.images[0].src} alt="" fill className="object-cover" />
                          ) : (
                            <Package className="absolute inset-0 m-auto h-6 w-6 text-neutral-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 dark:text-white">{product.title}</p>
                          <p className="text-sm text-neutral-500">₹{product.variants?.[0]?.price || 0}</p>
                        </div>
                        <Plus className="h-5 w-5 text-[#2e1f15]" />
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
                <button
                  onClick={() => setShowProductPicker(false)}
                  className="w-full rounded-xl bg-[#2e1f15] py-2.5 font-medium text-white hover:bg-[#2e1f15]/90"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Delete Collection</h3>
              <p className="mt-2 text-neutral-500">
                Are you sure you want to delete "{formData.title}"? Products in this collection will not be deleted.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
