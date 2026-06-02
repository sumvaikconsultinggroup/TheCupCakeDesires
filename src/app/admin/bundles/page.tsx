'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ui/ImageUpload'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Search, Filter,
  Package, Percent, Gift, Layers, ShoppingBag, Tag, Clock,
  TrendingUp, Copy, MoreVertical, ChevronDown, Calendar,
  DollarSign, Users, BarChart3, Zap, Target, Sparkles,
  MoveUp, MoveDown, AlertCircle, CheckCircle, ArrowRight,
  ImageIcon, Palette, Type, Link2, Settings2, PlusCircle, Minus
} from 'lucide-react'

interface BundleProduct {
  productId: string | { _id: string; title: string; handle: string; images?: { src: string }[]; variants?: any[] }
  variantId?: string
  quantity: number
  isRequired: boolean
  isGift?: boolean
  customPrice?: number
}

interface TierLevel {
  minQuantity: number
  maxQuantity?: number
  discountType: 'percentage' | 'fixed' | 'free' | 'fixed-price'
  discountValue: number
  label?: string
}

interface BundleOffer {
  _id: string
  name: string
  internalName: string
  description?: string
  shortDescription?: string
  bundleType: 'combo' | 'bogo' | 'quantity' | 'tiered' | 'mix-match' | 'gift-with-purchase'
  products: BundleProduct[]
  discountType: 'percentage' | 'fixed' | 'free' | 'fixed-price'
  discountValue: number
  tiers?: TierLevel[]
  bogoConfig?: { buyQuantity: number; getQuantity: number; getDiscountType: string; getDiscountValue: number }
  originalPrice?: number
  bundlePrice?: number
  savingsAmount?: number
  savingsPercentage?: number
  isActive: boolean
  startDate?: string
  endDate?: string
  targetProductIds: (string | { _id: string; title: string })[]
  showOnAllProducts?: boolean
  usageLimit?: number
  usageCount: number
  priority: number
  displayStyle: 'card' | 'banner' | 'inline' | 'popup' | 'floating'
  badgeText?: string
  badgeColor?: string
  highlightColor?: string
  image?: string
  ctaText?: string
  urgencyText?: string
  viewCount: number
  clickCount: number
  conversionCount: number
}

interface Product {
  _id: string
  title: string
  handle: string
  images?: { src: string }[]
  variants?: { price: number; compareAtPrice?: number }[]
}

const BUNDLE_TYPES = [
  { value: 'combo', label: 'Product Combo', icon: Package, description: 'Bundle multiple products together', color: 'blue' },
  { value: 'bogo', label: 'Buy One Get One', icon: Gift, description: 'BOGO offers (free or discounted)', color: 'green' },
  { value: 'quantity', label: 'Quantity Discount', icon: Layers, description: 'Buy X get Y% off', color: 'purple' },
  { value: 'tiered', label: 'Tiered Pricing', icon: TrendingUp, description: 'Buy more, save more tiers', color: 'orange' },
  { value: 'gift-with-purchase', label: 'Gift with Purchase', icon: Sparkles, description: 'Free gift over threshold', color: 'pink' },
]

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Off', symbol: '%' },
  { value: 'fixed', label: 'Fixed Amount Off', symbol: '₹' },
  { value: 'fixed-price', label: 'Fixed Bundle Price', symbol: '₹' },
  { value: 'free', label: 'Free Item', symbol: '🎁' },
]

const DISPLAY_STYLES = [
  { value: 'card', label: 'Card', description: 'Prominent card display' },
  { value: 'banner', label: 'Banner', description: 'Full-width banner' },
  { value: 'inline', label: 'Inline', description: 'Compact inline display' },
  { value: 'floating', label: 'Floating', description: 'Floating side panel' },
]

export default function BundleOffersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [offers, setOffers] = useState<BundleOffer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState<BundleOffer | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'products' | 'discount' | 'targeting' | 'display' | 'schedule'>('basic')
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    internalName: '',
    description: '',
    shortDescription: '',
    bundleType: 'combo' as BundleOffer['bundleType'],
    products: [] as BundleProduct[],
    discountType: 'percentage' as BundleOffer['discountType'],
    discountValue: 10,
    tiers: [] as TierLevel[],
    bogoConfig: { buyQuantity: 1, getQuantity: 1, getDiscountType: 'free', getDiscountValue: 100 },
    originalPrice: 0,
    bundlePrice: 0,
    targetProductIds: [] as string[],
    showOnAllProducts: false,
    isActive: true,
    startDate: '',
    endDate: '',
    usageLimit: 10000 as number | undefined,
    displayStyle: 'card' as BundleOffer['displayStyle'],
    badgeText: 'BUNDLE DEAL',
    badgeColor: '#ef4444',
    highlightColor: '#3b82f6',
    image: '',
    ctaText: 'Add Bundle to Cart',
    urgencyText: ''
  })

  const [productSearch, setProductSearch] = useState('')
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const fetchData = useCallback(async () => {
    try {
      const [offersRes, productsRes] = await Promise.all([
        fetch('/api/admin/bundle-offers'),
        fetch('/api/products?limit=200')
      ])
      
      if (offersRes.ok) {
        const data = await offersRes.json()
        if (data.success) setOffers(data.data)
      }
      
      if (productsRes.ok) {
        const data = await productsRes.json()
        if (data.success || data.data) setProducts(data.data || [])
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
      name: '', internalName: '', description: '', shortDescription: '',
      bundleType: 'combo', products: [], discountType: 'percentage', discountValue: 10,
      tiers: [], bogoConfig: { buyQuantity: 1, getQuantity: 1, getDiscountType: 'free', getDiscountValue: 100 },
      originalPrice: 0, bundlePrice: 0, targetProductIds: [], showOnAllProducts: false,
      isActive: true, startDate: '', endDate: '', usageLimit: undefined,
      displayStyle: 'card', badgeText: 'BUNDLE DEAL', badgeColor: '#ef4444',
      highlightColor: '#3b82f6', image: '', ctaText: 'Add Bundle to Cart', urgencyText: ''
    })
    setActiveTab('basic')
  }

  const openModal = (offer?: BundleOffer) => {
    if (offer) {
      setEditingOffer(offer)
      setForm({
        name: offer.name,
        internalName: offer.internalName,
        description: offer.description || '',
        shortDescription: offer.shortDescription || '',
        bundleType: offer.bundleType,
        products: offer.products.map(p => ({
          productId: typeof p.productId === 'object' ? p.productId._id : p.productId,
          variantId: p.variantId,
          quantity: p.quantity,
          isRequired: p.isRequired,
          isGift: p.isGift,
          customPrice: p.customPrice
        })),
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        tiers: offer.tiers || [],
        bogoConfig: offer.bogoConfig || { buyQuantity: 1, getQuantity: 1, getDiscountType: 'free', getDiscountValue: 100 },
        originalPrice: offer.originalPrice || 0,
        bundlePrice: offer.bundlePrice || 0,
        targetProductIds: offer.targetProductIds.map(p => typeof p === 'object' ? p._id : p),
        showOnAllProducts: offer.showOnAllProducts || false,
        isActive: offer.isActive,
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
        usageLimit: offer.usageLimit,
        displayStyle: offer.displayStyle,
        badgeText: offer.badgeText || 'BUNDLE DEAL',
        badgeColor: offer.badgeColor || '#ef4444',
        highlightColor: offer.highlightColor || '#3b82f6',
        image: offer.image || '',
        ctaText: offer.ctaText || 'Add Bundle to Cart',
        urgencyText: offer.urgencyText || ''
      })
    } else {
      setEditingOffer(null)
      resetForm()
    }
    setShowModal(true)
  }

  const calculatePrices = () => {
    let originalPrice = 0
    form.products.forEach(p => {
      const product = products.find(pr => pr._id === p.productId)
      if (product?.variants?.[0]?.price) {
        originalPrice += product.variants[0].price * p.quantity
      }
    })
    
    let bundlePrice = originalPrice
    if (form.discountType === 'percentage') {
      bundlePrice = originalPrice * (1 - form.discountValue / 100)
    } else if (form.discountType === 'fixed') {
      bundlePrice = originalPrice - form.discountValue
    } else if (form.discountType === 'fixed-price') {
      bundlePrice = form.discountValue
    }
    
    setForm(prev => ({
      ...prev,
      originalPrice: Math.round(originalPrice),
      bundlePrice: Math.round(Math.max(0, bundlePrice))
    }))
  }

  useEffect(() => {
    if (form.products.length > 0) {
      calculatePrices()
    }
  }, [form.products, form.discountType, form.discountValue])

  const saveOffer = async () => {
    if (!form.name) {
      toast.error('Bundle name is required')
      return
    }
    if (form.products.length === 0 && form.bundleType !== 'quantity') {
      toast.error('Add at least one product to the bundle')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        products: form.products.map(p => ({
          ...p,
          productId: typeof p.productId === 'object' ? (p.productId as any)._id : p.productId
        })),
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined
      }

      const url = editingOffer 
        ? `/api/admin/bundle-offers/${editingOffer._id}`
        : '/api/admin/bundle-offers'

      const res = await fetch(url, {
        method: editingOffer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(editingOffer ? 'Bundle updated!' : 'Bundle created!')
        setShowModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save bundle')
    } finally {
      setSaving(false)
    }
  }

  const deleteOffer = async (id: string) => {
    if (!confirm('Delete this bundle offer?')) return
    
    try {
      const res = await fetch(`/api/admin/bundle-offers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Bundle deleted!')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const duplicateOffer = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bundle-offers/${id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Bundle duplicated!')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to duplicate')
    }
  }

  const toggleActive = async (offer: BundleOffer) => {
    try {
      await fetch(`/api/admin/bundle-offers/${offer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive })
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const addProductToBundle = (productId: string) => {
    if (form.products.find(p => p.productId === productId)) {
      toast.error('Product already in bundle')
      return
    }
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { productId, quantity: 1, isRequired: true, isGift: false }]
    }))
  }

  const removeProductFromBundle = (productId: string) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.filter(p => p.productId !== productId)
    }))
  }

  const updateProductInBundle = (productId: string, updates: Partial<BundleProduct>) => {
    setForm(prev => ({
      ...prev,
      products: prev.products.map(p => p.productId === productId ? { ...p, ...updates } : p)
    }))
  }

  const addTier = () => {
    const lastTier = form.tiers[form.tiers.length - 1]
    const minQty = lastTier ? (lastTier.maxQuantity || lastTier.minQuantity) + 1 : 2
    setForm(prev => ({
      ...prev,
      tiers: [...prev.tiers, { minQuantity: minQty, discountType: 'percentage', discountValue: 10, label: '' }]
    }))
  }

  const updateTier = (index: number, updates: Partial<TierLevel>) => {
    setForm(prev => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => i === index ? { ...t, ...updates } : t)
    }))
  }

  const removeTier = (index: number) => {
    setForm(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }))
  }

  // Filter offers
  const filteredOffers = offers.filter(offer => {
    if (statusFilter === 'active' && !offer.isActive) return false
    if (statusFilter === 'inactive' && offer.isActive) return false
    if (typeFilter !== 'all' && offer.bundleType !== typeFilter) return false
    if (searchQuery && !offer.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Stats
  const stats = {
    total: offers.length,
    active: offers.filter(o => o.isActive).length,
    totalViews: offers.reduce((sum, o) => sum + o.viewCount, 0),
    totalConversions: offers.reduce((sum, o) => sum + o.conversionCount, 0)
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#2e1f15]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Bundle Offers</h1>
            <p className="text-sm text-neutral-500">Create and manage product bundle deals</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cocoa to-rose-accent px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
          >
            <Plus className="h-5 w-5" />
            Create Bundle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total Bundles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-neutral-500">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">Total Views</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">Conversions</p>
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
              placeholder="Search bundles..."
              className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-800"
          >
            <option value="all">All Types</option>
            {BUNDLE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-white py-20 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
              <Package className="h-10 w-10 text-[#2e1f15]" />
            </div>
            <h3 className="mt-6 text-xl font-bold">No bundle offers yet</h3>
            <p className="mt-2 text-neutral-500">Create your first bundle to boost sales</p>
            <button
              onClick={() => openModal()}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#2e1f15] px-6 py-3 font-semibold text-white"
            >
              <Plus className="h-5 w-5" />
              Create Bundle
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredOffers.map((offer) => {
              const typeInfo = BUNDLE_TYPES.find(t => t.value === offer.bundleType)
              const TypeIcon = typeInfo?.icon || Package
              
              return (
                <motion.div
                  key={offer._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-xl dark:bg-neutral-800 ${
                    offer.isActive ? 'border-neutral-200 dark:border-neutral-700' : 'border-dashed border-neutral-300 opacity-70'
                  }`}
                >
                  {/* Badge */}
                  {offer.badgeText && (
                    <div
                      className="absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ backgroundColor: offer.badgeColor }}
                    >
                      {offer.badgeText}
                    </div>
                  )}

                  {/* Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${typeInfo?.color}-100 dark:bg-${typeInfo?.color}-900/30`}>
                          <TypeIcon className={`h-6 w-6 text-${typeInfo?.color}-600`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-neutral-900 dark:text-white">{offer.name}</h3>
                          <p className="text-xs text-neutral-500">{typeInfo?.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleActive(offer)}
                          className={`rounded-lg p-2 transition-colors ${
                            offer.isActive ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'
                          }`}
                        >
                          {offer.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openModal(offer)}
                          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateOffer(offer._id)}
                          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteOffer(offer._id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {offer.shortDescription && (
                      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {offer.shortDescription}
                      </p>
                    )}

                    {/* Products Preview */}
                    {offer.products.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-3">
                          {offer.products.slice(0, 4).map((p, i) => {
                            const product = typeof p.productId === 'object' ? p.productId : null
                            return (
                              <div
                                key={i}
                                className="h-10 w-10 overflow-hidden rounded-lg border-2 border-white bg-neutral-100 dark:border-neutral-800"
                              >
                                {product?.images?.[0]?.src ? (
                                  <Image
                                    src={product.images[0].src}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-4 w-4 text-neutral-400" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <span className="text-sm text-neutral-500">
                          {offer.products.length} product{offer.products.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Pricing */}
                    {offer.bundlePrice && offer.originalPrice && (
                      <div className="mt-4 flex items-baseline gap-3">
                        <span className="text-2xl font-bold" style={{ color: offer.highlightColor }}>
                          ₹{offer.bundlePrice.toLocaleString()}
                        </span>
                        <span className="text-lg text-neutral-400 line-through">
                          ₹{offer.originalPrice.toLocaleString()}
                        </span>
                        {offer.savingsPercentage && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                            Save {offer.savingsPercentage}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 dark:border-neutral-700">
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {offer.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {offer.conversionCount}
                      </span>
                      {offer.usageLimit && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {offer.usageCount}/{offer.usageLimit}
                        </span>
                      )}
                    </div>
                    {offer.endDate && (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <Clock className="h-3.5 w-3.5" />
                        Ends {new Date(offer.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <div>
                  <h2 className="text-xl font-bold">{editingOffer ? 'Edit Bundle' : 'Create Bundle Offer'}</h2>
                  <p className="text-sm text-neutral-500">Configure your bundle deal</p>
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
                {(['basic', 'products', 'discount', 'targeting', 'display', 'schedule'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-b-2 border-[#2e1f15] text-[#2e1f15]'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {/* Basic Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    {/* Bundle Type */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Bundle Type</label>
                      <div className="grid grid-cols-3 gap-3">
                        {BUNDLE_TYPES.map(type => (
                          <button
                            key={type.value}
                            onClick={() => setForm({ ...form, bundleType: type.value as any })}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                              form.bundleType === type.value
                                ? 'border-[#2e1f15] bg-[#2e1f15]/5 ring-2 ring-[#2e1f15]/20'
                                : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                            }`}
                          >
                            <type.icon className={`h-6 w-6 ${form.bundleType === type.value ? 'text-[#2e1f15]' : 'text-neutral-400'}`} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name & Internal Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Bundle Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm({
                              ...form,
                              name: val,
                              internalName: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                            })
                          }}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="Summer Fitness Bundle"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Internal Name</label>
                        <input
                          type="text"
                          value={form.internalName}
                          onChange={(e) => setForm({ ...form, internalName: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                    </div>

                    {/* Descriptions */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Short Description (150 chars)</label>
                      <input
                        type="text"
                        value={form.shortDescription}
                        onChange={(e) => setForm({ ...form, shortDescription: e.target.value.slice(0, 150) })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Get the complete fitness stack at 20% off"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Full Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        rows={3}
                        placeholder="Detailed description of the bundle..."
                      />
                    </div>
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div className="space-y-6">
                    {/* Product Selector */}
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Add Products to Bundle</label>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products..."
                          className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                        {products
                          .filter(p => p.title.toLowerCase().includes(debouncedProductSearch.toLowerCase()))
                          .map(p => {
                            const isSelected = form.products.some(bp => bp.productId === p._id)
                            return (
                              <div key={p._id} className="flex items-center gap-3 border-b border-neutral-100 p-3 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => isSelected ? removeProductFromBundle(p._id) : addProductToBundle(p._id)}
                                  className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15] focus:ring-[#2e1f15]"
                                />
                                <div className="h-10 w-10 overflow-hidden rounded bg-neutral-100">
                                  {p.images?.[0]?.src && (
                                    <Image src={p.images[0].src} alt={p.title} width={40} height={40} className="h-full w-full object-cover" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{p.title}</p>
                                  <p className="text-xs text-neutral-500">₹{p.variants?.[0]?.price}</p>
                                </div>
                              </div>
                            )
                          })}
                        {products.filter(p => p.title.toLowerCase().includes(debouncedProductSearch.toLowerCase())).length === 0 && (
                          <div className="p-4 text-center text-sm text-neutral-500">No products found</div>
                        )}
                      </div>
                    </div>

                    {/* Selected Products */}
                    <div className="space-y-3">
                      {form.products.map((bundleProduct, index) => {
                        const product = products.find(p => p._id === bundleProduct.productId)
                        if (!product) return null

                        return (
                          <div
                            key={bundleProduct.productId as string}
                            className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
                          >
                            <div className="h-16 w-16 overflow-hidden rounded-lg bg-neutral-100">
                              {product.images?.[0]?.src ? (
                                <Image
                                  src={product.images[0].src}
                                  alt={product.title}
                                  width={64}
                                  height={64}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-6 w-6 text-neutral-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{product.title}</h4>
                              <p className="text-sm text-neutral-500">
                                ₹{product.variants?.[0]?.price?.toLocaleString() || '0'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateProductInBundle(bundleProduct.productId as string, { quantity: Math.max(1, bundleProduct.quantity - 1) })}
                                  className="rounded-lg border p-1.5 hover:bg-neutral-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-medium">{bundleProduct.quantity}</span>
                                <button
                                  onClick={() => updateProductInBundle(bundleProduct.productId as string, { quantity: bundleProduct.quantity + 1 })}
                                  className="rounded-lg border p-1.5 hover:bg-neutral-100"
                                >
                                  <PlusCircle className="h-4 w-4" />
                                </button>
                              </div>
                              <label className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                                <input
                                  type="checkbox"
                                  checked={bundleProduct.isGift}
                                  onChange={(e) => updateProductInBundle(bundleProduct.productId as string, { isGift: e.target.checked })}
                                  className="h-4 w-4 rounded text-[#2e1f15]"
                                />
                                Gift
                              </label>
                              <button
                                onClick={() => removeProductFromBundle(bundleProduct.productId as string)}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {form.products.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 py-12">
                        <Package className="h-10 w-10 text-neutral-300" />
                        <p className="mt-3 text-neutral-500">No products added yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Discount Tab */}
                {activeTab === 'discount' && (
                  <div className="space-y-6">
                    {form.bundleType === 'tiered' ? (
                      /* Tiered Pricing */
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <label className="text-sm font-semibold">Pricing Tiers</label>
                          <button
                            onClick={addTier}
                            className="flex items-center gap-1 rounded-lg bg-[#2e1f15] px-3 py-1.5 text-sm font-medium text-white"
                          >
                            <Plus className="h-4 w-4" />
                            Add Tier
                          </button>
                        </div>
                        <div className="space-y-3">
                          {form.tiers.map((tier, index) => (
                            <div key={index} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-500">Buy</span>
                                <input
                                  type="number"
                                  value={tier.minQuantity}
                                  onChange={(e) => updateTier(index, { minQuantity: parseInt(e.target.value) || 1 })}
                                  className="w-16 rounded border px-2 py-1 text-center"
                                  min="1"
                                />
                                <span className="text-sm text-neutral-500">+</span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-neutral-400" />
                              <select
                                value={tier.discountType}
                                onChange={(e) => updateTier(index, { discountType: e.target.value as any })}
                                className="rounded border px-2 py-1"
                              >
                                {DISCOUNT_TYPES.map(d => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={tier.discountValue}
                                onChange={(e) => updateTier(index, { discountValue: parseFloat(e.target.value) || 0 })}
                                className="w-20 rounded border px-2 py-1 text-center"
                              />
                              <input
                                type="text"
                                value={tier.label || ''}
                                onChange={(e) => updateTier(index, { label: e.target.value })}
                                className="flex-1 rounded border px-2 py-1"
                                placeholder="Label (e.g., 'Best Value')"
                              />
                              <button
                                onClick={() => removeTier(index)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : form.bundleType === 'bogo' ? (
                      /* BOGO Config */
                      <div className="space-y-4">
                        <label className="text-sm font-semibold">Buy One Get One Configuration</label>
                        <div className="flex items-center gap-4">
                          <div>
                            <label className="mb-1 block text-xs text-neutral-500">Buy Quantity</label>
                            <input
                              type="number"
                              value={form.bogoConfig.buyQuantity}
                              onChange={(e) => setForm({ ...form, bogoConfig: { ...form.bogoConfig, buyQuantity: parseInt(e.target.value) || 1 } })}
                              className="w-20 rounded border px-3 py-2 text-center"
                              min="1"
                            />
                          </div>
                          <ArrowRight className="h-5 w-5 text-neutral-400 mt-5" />
                          <div>
                            <label className="mb-1 block text-xs text-neutral-500">Get Quantity</label>
                            <input
                              type="number"
                              value={form.bogoConfig.getQuantity}
                              onChange={(e) => setForm({ ...form, bogoConfig: { ...form.bogoConfig, getQuantity: parseInt(e.target.value) || 1 } })}
                              className="w-20 rounded border px-3 py-2 text-center"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-neutral-500">At</label>
                            <select
                              value={form.bogoConfig.getDiscountType}
                              onChange={(e) => setForm({ ...form, bogoConfig: { ...form.bogoConfig, getDiscountType: e.target.value } })}
                              className="rounded border px-3 py-2"
                            >
                              <option value="free">Free (100% off)</option>
                              <option value="percentage">% Off</option>
                              <option value="fixed">₹ Off</option>
                            </select>
                          </div>
                          {form.bogoConfig.getDiscountType !== 'free' && (
                            <div>
                              <label className="mb-1 block text-xs text-neutral-500">Value</label>
                              <input
                                type="number"
                                value={form.bogoConfig.getDiscountValue}
                                onChange={(e) => setForm({ ...form, bogoConfig: { ...form.bogoConfig, getDiscountValue: parseFloat(e.target.value) || 0 } })}
                                className="w-24 rounded border px-3 py-2"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Standard Discount */
                      <>
                        <div>
                          <label className="mb-3 block text-sm font-semibold">Discount Type</label>
                          <div className="grid grid-cols-4 gap-3">
                            {DISCOUNT_TYPES.map(d => (
                              <button
                                key={d.value}
                                onClick={() => setForm({ ...form, discountType: d.value as any })}
                                className={`rounded-lg border p-3 text-center transition-all ${
                                  form.discountType === d.value
                                    ? 'border-[#2e1f15] bg-[#2e1f15]/5 ring-2 ring-[#2e1f15]/20'
                                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                                }`}
                              >
                                <span className="text-2xl">{d.symbol}</span>
                                <p className="mt-1 text-xs font-medium">{d.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-sm font-medium">
                            Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                          </label>
                          <input
                            type="number"
                            value={form.discountValue}
                            onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                            className="w-40 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                            min="0"
                            max={form.discountType === 'percentage' ? 100 : undefined}
                          />
                        </div>
                      </>
                    )}

                    {/* Price Preview */}
                    {form.products.length > 0 && (
                      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 dark:from-green-900/20 dark:to-emerald-900/20">
                        <h4 className="font-semibold text-green-800 dark:text-green-300">Price Preview</h4>
                        <div className="mt-3 flex items-baseline gap-4">
                          <div>
                            <p className="text-xs text-neutral-500">Original</p>
                            <p className="text-lg text-neutral-500 line-through">₹{form.originalPrice.toLocaleString()}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-xs text-green-600">Bundle Price</p>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-400">₹{form.bundlePrice.toLocaleString()}</p>
                          </div>
                          <div className="ml-auto">
                            <p className="text-xs text-neutral-500">Savings</p>
                            <p className="text-2xl font-bold text-green-600">
                              {form.originalPrice > 0 ? Math.round(((form.originalPrice - form.bundlePrice) / form.originalPrice) * 100) : 0}% OFF
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Targeting Tab */}
                {activeTab === 'targeting' && (
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.showOnAllProducts}
                          onChange={(e) => setForm({ ...form, showOnAllProducts: e.target.checked })}
                          className="h-5 w-5 rounded text-[#2e1f15]"
                        />
                        <span className="font-medium">Show on all products</span>
                      </label>
                      <p className="ml-8 mt-1 text-sm text-neutral-500">Display this bundle offer on every product page</p>
                    </div>

                    {!form.showOnAllProducts && (
                      <div>
                        <label className="mb-3 block text-sm font-semibold">Target Specific Products</label>
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                          {products
                            .filter(p => p.title.toLowerCase().includes(debouncedProductSearch.toLowerCase()))
                            .map(p => {
                              const isSelected = form.targetProductIds.includes(p._id)
                              return (
                                <div key={p._id} className="flex items-center gap-3 border-b border-neutral-100 p-3 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setForm(prev => ({ ...prev, targetProductIds: prev.targetProductIds.filter(id => id !== p._id) }))
                                      } else {
                                        setForm(prev => ({ ...prev, targetProductIds: [...prev.targetProductIds, p._id] }))
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15] focus:ring-[#2e1f15]"
                                  />
                                  <div className="h-10 w-10 overflow-hidden rounded bg-neutral-100">
                                    {p.images?.[0]?.src && (
                                      <Image src={p.images[0].src} alt={p.title} width={40} height={40} className="h-full w-full object-cover" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{p.title}</p>
                                    <p className="text-xs text-neutral-500">₹{p.variants?.[0]?.price}</p>
                                  </div>
                                </div>
                              )
                            })}
                          {products.filter(p => p.title.toLowerCase().includes(debouncedProductSearch.toLowerCase())).length === 0 && (
                            <div className="p-4 text-center text-sm text-neutral-500">No products found</div>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">Select products where this bundle should appear</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Usage Limit (optional)</label>
                      <input
                        type="number"
                        value={form.usageLimit || ''}
                        onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-40 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Unlimited"
                        min="1"
                      />
                      <p className="mt-1 text-xs text-neutral-500">Maximum number of times this bundle can be purchased</p>
                    </div>
                  </div>
                )}

                {/* Display Tab */}
                {activeTab === 'display' && (
                  <div className="space-y-6">
                    <div>
                      <label className="mb-3 block text-sm font-semibold">Display Style</label>
                      <div className="grid grid-cols-4 gap-3">
                        {DISPLAY_STYLES.map(style => (
                          <button
                            key={style.value}
                            onClick={() => setForm({ ...form, displayStyle: style.value as any })}
                            className={`rounded-lg border p-4 text-center transition-all ${
                              form.displayStyle === style.value
                                ? 'border-[#2e1f15] bg-[#2e1f15]/5 ring-2 ring-[#2e1f15]/20'
                                : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                            }`}
                          >
                            <p className="font-medium">{style.label}</p>
                            <p className="mt-1 text-xs text-neutral-500">{style.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Badge Text</label>
                        <input
                          type="text"
                          value={form.badgeText}
                          onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="BUNDLE DEAL"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">CTA Button Text</label>
                        <input
                          type="text"
                          value={form.ctaText}
                          onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="Add Bundle to Cart"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Badge Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={form.badgeColor}
                            onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                            className="h-10 w-14 cursor-pointer rounded border"
                          />
                          <input
                            type="text"
                            value={form.badgeColor}
                            onChange={(e) => setForm({ ...form, badgeColor: e.target.value })}
                            className="flex-1 rounded-lg border border-neutral-300 px-3 dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Highlight Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={form.highlightColor}
                            onChange={(e) => setForm({ ...form, highlightColor: e.target.value })}
                            className="h-10 w-14 cursor-pointer rounded border"
                          />
                          <input
                            type="text"
                            value={form.highlightColor}
                            onChange={(e) => setForm({ ...form, highlightColor: e.target.value })}
                            className="flex-1 rounded-lg border border-neutral-300 px-3 dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Urgency Text</label>
                      <input
                        type="text"
                        value={form.urgencyText}
                        onChange={(e) => setForm({ ...form, urgencyText: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Limited time offer! Only 5 left"
                      />
                    </div>

                    <div>
                      <ImageUpload
                        label="Bundle Image"
                        value={form.image}
                        onChange={(url) => setForm({ ...form, image: url })}
                        aspectRatio="video"
                        hint="Optional promotional image for the bundle"
                      />
                    </div>
                  </div>
                )}

                {/* Schedule Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          className="h-5 w-5 rounded text-[#2e1f15]"
                        />
                        <span className="font-medium">Active</span>
                      </label>
                      <p className="ml-8 mt-1 text-sm text-neutral-500">Bundle will be visible when active</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">Start Date (optional)</label>
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">End Date (optional)</label>
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                    </div>

                    {form.startDate || form.endDate ? (
                      <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <Calendar className="h-5 w-5" />
                          <span className="font-medium">Schedule Summary</span>
                        </div>
                        <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                          {form.startDate && form.endDate
                            ? `Active from ${new Date(form.startDate).toLocaleDateString()} to ${new Date(form.endDate).toLocaleDateString()}`
                            : form.startDate
                            ? `Starts on ${new Date(form.startDate).toLocaleDateString()}`
                            : `Ends on ${new Date(form.endDate).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-700">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          No schedule set. Bundle will be active immediately and indefinitely (while enabled).
                        </p>
                      </div>
                    )}
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
                <button
                  onClick={saveOffer}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cocoa to-rose-accent px-6 py-2.5 font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-5 w-5" />}
                  {editingOffer ? 'Update Bundle' : 'Create Bundle'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
