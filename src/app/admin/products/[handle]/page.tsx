'use client'

import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  DollarSign,
  Eye,
  FileText,
  GripVertical,
  ImageIcon,
  Layers,
  List,
  Loader2,
  Package,
  Plus,
  Save,
  Search as SearchIcon,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getCategories,
  getProductByHandle,
  updateProduct,
} from '../product-actions'

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  ),
})

interface VariantImage {
  src: string
  position: number
  altText?: string
  isPrimary: boolean
}

interface ProductVariant {
  option1Value?: string
  option2Value?: string
  option3Value?: string
  price: number
  compareAtPrice?: number
  inventoryQty?: number
  sku?: string
  barcode?: string
  costPerItem?: number
  requiresShipping?: boolean
  taxable?: boolean
  weightUnit?: string
  grams?: number
  image?: string // Legacy single image
  images?: VariantImage[] // New: Multiple images per variant
  inventoryManagement?: 'shopify' | 'manual' | 'none'
}

interface ProductImage {
  src: string
  alt?: string
  position?: number
  variantId?: string
}

interface ProductFormData {
  title: string
  handle: string
  bodyHtml: string
  vendor: string
  productCategory: string
  type: string
  tags: string[]
  published: boolean
  status: 'active' | 'draft' | 'archived'
  /** Lets customers attach a company logo on the storefront (corporate slices). */
  allowLogoUpload: boolean
  /** Smallest quantity a customer can buy (e.g. 3 for per-cupcake pricing). */
  minOrderQty: number
  images: ProductImage[]
  variants: ProductVariant[]
  seo: {
    title?: string
    description?: string
  }
  options: { name: string; values: string[] }[]
  ingredients: string
  howToUse: string
  faq: { question: string; answer: string }[]
}

const defaultCategories = [
  'Protein',
  'Pre-Workout',
  'Mass Gainer',
  'BCAA',
  'Creatine',
  'Fat Burner',
  'Vitamins',
  'Accessories',
]

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

const base64ToFile = (base64: string, filename: string = 'image.jpg'): File => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

export default function ProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const handle = params.handle as string
  const isNew = handle === 'new'
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'variants' | 'seo' | 'details'>('basic')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    handle: '',
    bodyHtml: '',
    vendor: '',
    productCategory: '',
    type: '',
    tags: [],
    published: true,
    status: 'active',
    allowLogoUpload: false,
    minOrderQty: 1,
    images: [],
    variants: [{ option1Value: 'Default', price: 0, compareAtPrice: 0, inventoryQty: 0, sku: '' }],
    seo: { title: '', description: '' },
    options: [],
    ingredients: '',
    howToUse: '',
    faq: [],
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!isNew) {
      fetchProduct()
    }
    fetchCategories()
  }, [handle])

  const fetchProduct = async () => {
    try {
      const result = await getProductByHandle(handle)
      if (result.success && result.product) {
        const product = result.product
        setFormData({
          title: product.title || '',
          handle: product.handle || '',
          bodyHtml: product.bodyHtml || '',
          vendor: product.vendor || '',
          productCategory: product.productCategory || '',
          type: product.type || '',
          tags: product.tags || [],
          published: product.published ?? true,
          status: product.status || 'active',
          allowLogoUpload: product.allowLogoUpload ?? false,
          minOrderQty: product.minOrderQty ?? 1,
          images: product.images || [],
          variants:
            product.variants?.length > 0
              ? product.variants.map((v: any) => ({
                  option1Value: v.option1Value || 'Default',
                  option2Value: v.option2Value || '',
                  option3Value: v.option3Value || '',
                  price: v.price || 0,
                  compareAtPrice: v.compareAtPrice || 0,
                  inventoryQty: v.inventoryQty || 0,
                  sku: v.sku || '',
                  barcode: v.barcode || '',
                  costPerItem: v.costPerItem || 0,
                  requiresShipping: v.requiresShipping ?? true,
                  taxable: v.taxable ?? true,
                  weightUnit: v.weightUnit || 'kg',
                  grams: v.grams || 0,
                }))
              : [{ option1Value: 'Default', price: 0, compareAtPrice: 0, inventoryQty: 0, sku: '' }],
          seo: product.seo || { title: '', description: '' },
          options: product.options || [],
          ingredients: product.ingredients || '',
          howToUse: product.howToUse || '',
          faq: product.faq || [],
        })
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Product not found' })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setSaveMessage({ type: 'error', text: 'Failed to load product' })
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    try {
      const cats = await getCategories()
      if (cats.length > 0) {
        setCategories([...new Set([...defaultCategories, ...cats])])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage(null)

    try {
      // Deep copy formData to avoid mutating state directly
      const dataToSubmit = JSON.parse(JSON.stringify(formData))

      // Upload main images via API to avoid 1MB server action limit
      if (dataToSubmit.images && dataToSubmit.images.length > 0) {
        const processedImages = await Promise.all(
          dataToSubmit.images.map(async (img: ProductImage, index: number) => {
            if (img.src && img.src.startsWith('data:')) {
              try {
                const file = base64ToFile(img.src, `product-image-${index}.jpg`)
                const formData = new FormData()
                formData.append('file', file)
                formData.append('type', 'image')

                const res = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                })
                if (!res.ok) throw new Error('Failed to upload image')
                const data = await res.json()
                return { ...img, src: data.url }
              } catch (err) {
                console.error('Image upload failed', err)
                throw err
              }
            }
            return img
          })
        )
        dataToSubmit.images = processedImages
      }

      // Upload variant images
      if (dataToSubmit.variants && dataToSubmit.variants.length > 0) {
        const processedVariants = await Promise.all(
          dataToSubmit.variants.map(async (variant: ProductVariant, index: number) => {
            if (variant.image && variant.image.startsWith('data:')) {
              try {
                const file = base64ToFile(variant.image, `variant-image-${index}.jpg`)
                const formData = new FormData()
                formData.append('file', file)
                formData.append('type', 'image')

                const res = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                })
                if (!res.ok) throw new Error('Failed to upload variant image')
                const data = await res.json()
                return { ...variant, image: data.url }
              } catch (err) {
                console.error('Variant image upload failed', err)
                throw err
              }
            }
            return variant
          })
        )
        dataToSubmit.variants = processedVariants
      }

      let result
      if (isNew) {
        result = await createProduct(dataToSubmit)
      } else {
        result = await updateProduct(handle, dataToSubmit)
      }

      if (result.success) {
        setHasChanges(false)
        setSaveMessage({ type: 'success', text: result.message || 'Product saved successfully' })

        // If handle changed, redirect to new URL
        if (!isNew && formData.handle !== handle) {
          router.push(`/admin/products/${formData.handle}`)
        } else if (isNew && result.product?.handle) {
          router.push(`/admin/products/${result.product.handle}`)
        }
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Failed to save product' })
      }
    } catch (error) {
      console.error('Error saving product:', error)
      setSaveMessage({ type: 'error', text: 'An error occurred while saving' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteProduct(handle)
      if (result.success) {
        router.push('/admin/products')
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Failed to delete product' })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setSaveMessage({ type: 'error', text: 'Failed to delete product' })
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const result = await duplicateProduct(handle)
      if (result.success && result.product) {
        router.push(`/admin/products/${result.product.handle}`)
      } else {
        setSaveMessage({ type: 'error', text: result.message || 'Failed to duplicate product' })
      }
    } catch (error) {
      console.error('Error duplicating product:', error)
      setSaveMessage({ type: 'error', text: 'Failed to duplicate product' })
    }
    setDuplicating(false)
  }

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)

    // Auto-generate handle from title for new products
    if (field === 'title' && isNew) {
      const newHandle = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, handle: newHandle }))
    }
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    updateField('variants', newVariants)
  }

  const addVariant = () => {
    updateField('variants', [
      ...formData.variants,
      { option1Value: '', price: 0, compareAtPrice: 0, inventoryQty: 0, sku: '' },
    ])
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length > 1) {
      updateField(
        'variants',
        formData.variants.filter((_, i) => i !== index)
      )
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateField('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    updateField(
      'tags',
      formData.tags.filter((t) => t !== tag)
    )
  }

  // Update the handleImageUpload function (around line 410)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    try {
      const imagePromises = Array.from(files).map((file) => {
        return new Promise<ProductImage>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              src: e.target?.result as string, // base64 string
              alt: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              position: 0, // Will be set correctly below
              variantId: undefined, // Default to no variant association
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })

      const base64Images = await Promise.all(imagePromises)
      const newImages = base64Images.map((img, i) => ({
        ...img,
        position: formData.images.length + i,
      }))

      updateField('images', [...formData.images, ...newImages])
    } catch (error) {
      console.error('Error processing images:', error)
      setSaveMessage({ type: 'error', text: 'Failed to process images. Please try again.' })
    }
  }

  // Add function to update image variant association
  const updateImageVariant = (imageIndex: number, variantId: string | undefined) => {
    const newImages = [...formData.images]
    newImages[imageIndex] = { ...newImages[imageIndex], variantId }
    updateField('images', newImages)
  }

  const removeImage = (index: number) => {
    updateField(
      'images',
      formData.images.filter((_, i) => i !== index)
    )
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...formData.images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    updateField(
      'images',
      newImages.map((img, i) => ({ ...img, position: i }))
    )
  }

  const addFaq = () => {
    updateField('faq', [...formData.faq, { question: '', answer: '' }])
  }

  const removeFaq = (index: number) => {
    updateField(
      'faq',
      formData.faq.filter((_, i) => i !== index)
    )
  }

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaq = [...formData.faq]
    newFaq[index] = { ...newFaq[index], [field]: value }
    updateField('faq', newFaq)
  }

  const handleVariantImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const base64 = await fileToBase64(file)
        updateVariant(index, 'image', base64)
      } catch (error) {
        console.error('Error reading file', error)
      }
    }
  }

  // Calculate total inventory
  const totalInventory = formData.variants.reduce((sum, v) => sum + (v.inventoryQty || 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#2e1f15]" />
          <p className="text-neutral-500">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isNew ? 'Add Product' : 'Edit Product'}
            </h1>
            {!isNew && <p className="text-sm text-neutral-500">/{formData.handle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Duplicate
              </button>
              <Link
                href={`/products/${formData.handle}`}
                target="_blank"
                className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-6 py-2 text-sm font-medium text-white transition-all hover:bg-[#2e1f15]/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 rounded-xl p-4 ${
            saveMessage.type === 'success'
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {[
          { id: 'basic', label: 'Basic Info', icon: FileText },
          { id: 'media', label: 'Media', icon: ImageIcon },
          { id: 'variants', label: 'Variants & Pricing', icon: Layers },
          { id: 'seo', label: 'SEO', icon: SearchIcon },
          { id: 'details', label: 'Details', icon: List },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-[#2e1f15] shadow-sm dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="e.g., Premium Whey Protein - Chocolate"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Handle (URL)
                      </label>
                      <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <span className="bg-neutral-50 px-4 py-3 text-neutral-500 dark:bg-neutral-900">/products/</span>
                        <input
                          type="text"
                          value={formData.handle}
                          onChange={(e) =>
                            updateField('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                          }
                          className="flex-1 border-0 px-4 py-3 outline-none dark:bg-neutral-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Description
                      </label>
                      <RichTextEditor
                        content={formData.bodyHtml}
                        onChange={(html) => updateField('bodyHtml', html)}
                        placeholder="Write a detailed product description..."
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        Use the toolbar to format text, add headings, lists, links, and images.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Vendor
                        </label>
                        <input
                          type="text"
                          value={formData.vendor}
                          onChange={(e) => updateField('vendor', e.target.value)}
                          placeholder="e.g., The Cupcake Desire"
                          className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Product Type
                        </label>
                        <input
                          type="text"
                          value={formData.type}
                          onChange={(e) => updateField('type', e.target.value)}
                          placeholder="e.g., Supplement"
                          className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Tags</h2>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-[#2e1f15]/10 px-3 py-1 text-sm text-[#2e1f15]"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded-xl bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white"
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {['bestseller', 'newarrival', 'sale', 'trending', 'limited edition', 'flashdeal'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => !formData.tags.includes(tag) && updateField('tags', [...formData.tags, tag])}
                        className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-500 hover:border-[#2e1f15] hover:text-[#2e1f15] dark:border-neutral-700"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Note: The first tag is used for categorization, so please keep it from the predefined ones.
                  </p>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Product Images</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-xl border-2 border-neutral-200 bg-neutral-100 dark:border-neutral-700"
                    >
                      <div className="relative aspect-square">
                        <Image src={image.src} alt={image.alt || ''} fill className="object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 hover:bg-neutral-100"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 hover:bg-neutral-100"
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>
                        {index === 0 && (
                          <span className="absolute top-2 left-2 rounded bg-[#2e1f15] px-2 py-1 text-xs font-medium text-white">
                            Main
                          </span>
                        )}
                        {image.variantId && (
                          <span className="absolute top-2 right-2 rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
                            Variant
                          </span>
                        )}
                      </div>

                      {/* Variant Association Dropdown */}
                      <div className="bg-white p-3 dark:bg-neutral-800">
                        <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                          Associate with Variant
                        </label>
                        <select
                          value={image.variantId || ''}
                          onChange={(e) => updateImageVariant(index, e.target.value || undefined)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                        >
                          <option value="">All Variants (Default)</option>
                          {formData.variants.map((variant, vIndex) => (
                            <option key={vIndex} value={`variant-${vIndex}`}>
                              {variant.option1Value || `Variant ${vIndex + 1}`}
                              {variant.option2Value ? ` / ${variant.option2Value}` : ''}
                              {variant.price ? ` - $${variant.price}` : ''}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={image.alt || ''}
                          onChange={(e) => {
                            const newImages = [...formData.images]
                            newImages[index] = { ...newImages[index], alt: e.target.value }
                            updateField('images', newImages)
                          }}
                          placeholder="Alt text (optional)"
                          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-[#2e1f15] hover:text-[#2e1f15] dark:border-neutral-600"
                  >
                    <Upload className="h-8 w-8" />
                    <span className="mt-2 text-sm font-medium">Add Image</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-neutral-500">
                    <strong>Tip:</strong> Drag images to reorder. First image will be the main product image.
                  </p>
                  <p className="text-sm text-neutral-500">
                    <strong>Variant Images:</strong> Associate images with specific variants. When a variant is
                    selected, its image will be displayed first.
                  </p>
                </div>
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Variants & Pricing</h2>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1 rounded-lg bg-[#2e1f15]/10 px-3 py-1.5 text-sm font-medium text-[#2e1f15] hover:bg-[#2e1f15]/20"
                  >
                    <Plus className="h-4 w-4" /> Add Variant
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                          <GripVertical className="h-4 w-4" />
                          Variant {index + 1}
                        </span>
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Variant Image Section */}
                      <div className="mb-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            <ImageIcon className="mr-1 inline h-3 w-3" />
                            Variant Image
                          </span>
                          <span className="rounded bg-[#2e1f15]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#2e1f15]">
                            Shopify+
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {variant.image ? (
                            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <Image src={variant.image} alt={`Variant ${index + 1}`} fill className="object-cover" />
                              <button
                                type="button"
                                onClick={() => updateVariant(index, 'image', '')}
                                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-[#2e1f15] hover:text-[#2e1f15] dark:border-neutral-600">
                              <Upload className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleVariantImageUpload(index, e)}
                              />
                            </label>
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-neutral-500">Upload an image specific to this variant</p>
                            {formData.images?.length > 0 && (
                              <select
                                value={variant.image || ''}
                                onChange={(e) => updateVariant(index, 'image', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
                              >
                                <option value="">Or select from product images</option>
                                {formData.images.map((img, imgIndex) => (
                                  <option key={imgIndex} value={img.src}>
                                    Image {imgIndex + 1}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">
                            Option (Size/Flavor)
                          </label>
                          <input
                            type="text"
                            value={variant.option1Value || ''}
                            onChange={(e) => updateVariant(index, 'option1Value', e.target.value)}
                            placeholder="e.g., 1kg, Chocolate"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">Price ($) *</label>
                          <input
                            type="number"
                            value={variant.price || ''}
                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="1499"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">Compare at Price</label>
                          <input
                            type="number"
                            value={variant.compareAtPrice || ''}
                            onChange={(e) => updateVariant(index, 'compareAtPrice', parseFloat(e.target.value) || 0)}
                            placeholder="1999"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">Inventory Qty</label>
                          <input
                            type="number"
                            value={variant.inventoryQty || ''}
                            onChange={(e) => updateVariant(index, 'inventoryQty', parseInt(e.target.value) || 0)}
                            placeholder="100"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">SKU</label>
                          <input
                            type="text"
                            value={variant.sku || ''}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            placeholder="WHEY-CHO-1KG"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-500">Cost per Item</label>
                          <input
                            type="number"
                            value={variant.costPerItem || ''}
                            onChange={(e) => updateVariant(index, 'costPerItem', parseFloat(e.target.value) || 0)}
                            placeholder="Cost"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                      </div>

                      {/* Inventory Management */}
                      <div className="mt-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            Inventory Management
                          </span>
                          <select
                            value={variant.inventoryManagement || 'manual'}
                            onChange={(e) => updateVariant(index, 'inventoryManagement', e.target.value)}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
                          >
                            <option value="manual">Track inventory manually</option>
                            <option value="none">Don't track inventory</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Search Engine Optimization</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo.title || ''}
                      onChange={(e) => updateField('seo', { ...formData.seo, title: e.target.value })}
                      placeholder={formData.title || 'Page title for search engines'}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      {(formData.seo.title || formData.title).length}/70 characters
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.seo.description || ''}
                      onChange={(e) => updateField('seo', { ...formData.seo, description: e.target.value })}
                      rows={3}
                      placeholder="Brief description for search engine results..."
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      {(formData.seo.description || '').length}/160 characters
                    </p>
                  </div>
                  {/* Preview */}
                  <div className="mt-6 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900">
                    <p className="mb-2 text-xs font-medium text-neutral-500">Search Engine Preview</p>
                    <div className="space-y-1">
                      <p className="text-lg text-blue-600 hover:underline">
                        {formData.seo.title || formData.title || 'Page Title'}
                      </p>
                      <p className="text-sm text-green-700">
                        https://cupcakedesires.com/products/{formData.handle || 'product-handle'}
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {formData.seo.description || 'Add a meta description to show in search results...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Additional Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Ingredients
                      </label>
                      <textarea
                        value={formData.ingredients}
                        onChange={(e) => updateField('ingredients', e.target.value)}
                        rows={6}
                        placeholder="List the ingredients..."
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        How to Use
                      </label>
                      <textarea
                        value={formData.howToUse}
                        onChange={(e) => updateField('howToUse', e.target.value)}
                        rows={6}
                        placeholder="Instructions on how to use the product..."
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 transition-all outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">FAQ</h2>
                    <button
                      type="button"
                      onClick={addFaq}
                      className="flex items-center gap-1 rounded-lg bg-[#2e1f15]/10 px-3 py-1.5 text-sm font-medium text-[#2e1f15] hover:bg-[#2e1f15]/20"
                    >
                      <Plus className="h-4 w-4" /> Add Question
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.faq.map((item, index) => (
                      <div
                        key={index}
                        className="relative rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
                      >
                        <button
                          type="button"
                          onClick={() => removeFaq(index)}
                          className="absolute top-2 right-2 text-neutral-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                            placeholder="Question"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                          <textarea
                            value={item.answer}
                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                            rows={3}
                            placeholder="Answer"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                      </div>
                    ))}
                    {formData.faq.length === 0 && (
                      <p className="text-center text-sm text-neutral-500">No FAQs added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Product Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {formData.published ? 'Published' : 'Hidden'}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formData.published ? 'Visible on storefront' : 'Not visible to customers'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('published', !formData.published)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formData.published ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        formData.published ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Corporate logo printing */}
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                  <div className="pr-3">
                    <p className="font-medium text-neutral-900 dark:text-white">Company logo upload</p>
                    <p className="text-sm text-neutral-500">
                      {formData.allowLogoUpload
                        ? 'Customers can attach their logo on the product page'
                        : 'Off — no logo uploader shown'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('allowLogoUpload', !formData.allowLogoUpload)}
                    aria-label="Toggle company logo upload"
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      formData.allowLogoUpload ? 'bg-green-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        formData.allowLogoUpload ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Minimum order quantity */}
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
                  <div className="pr-3">
                    <p className="font-medium text-neutral-900 dark:text-white">Minimum order quantity</p>
                    <p className="text-sm text-neutral-500">
                      Smallest quantity a customer can buy. Use with a per-unit price (e.g. $5 each, min 3 = $15).
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={formData.minOrderQty}
                    onChange={(e) => updateField('minOrderQty', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 shrink-0 rounded-lg border border-neutral-300 px-3 py-2 text-center focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Category Card */}
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Category</h2>
              <select
                value={formData.productCategory}
                onChange={(e) => updateField('productCategory', e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Stats */}
            {!isNew && (
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
                <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Summary</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-neutral-500">
                      <DollarSign className="h-4 w-4" />
                      Price
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      ${formData.variants[0]?.price?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-neutral-500">
                      <Package className="h-4 w-4" />
                      Total Inventory
                    </span>
                    <span
                      className={`font-bold ${totalInventory < 10 ? 'text-amber-600' : 'text-neutral-900 dark:text-white'}`}
                    >
                      {totalInventory} units
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-neutral-500">
                      <Layers className="h-4 w-4" />
                      Variants
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">{formData.variants.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-neutral-500">
                      <Tag className="h-4 w-4" />
                      Category
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {formData.productCategory || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Delete Product</h3>
            <p className="mt-2 text-neutral-500">
              Are you sure you want to delete "{formData.title}"? This action cannot be undone.
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
        </div>
      )}
    </div>
  )
}
