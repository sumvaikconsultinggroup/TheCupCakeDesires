'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Plus, Edit2, Trash2, GripVertical, Eye, EyeOff, Save, X, 
  Image as ImageIcon, LayoutGrid, ShoppingBag, Tag, Sparkles, Percent,
  ChevronDown, ChevronUp, Monitor, Smartphone, Clock, Video, Type,
  Columns, MoveUp, MoveDown, Copy, Settings2, Palette, Link2, Play
} from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ui/ImageUpload'

interface Banner {
  _id: string
  title: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  image: { desktop: string; mobile?: string; alt: string }
  overlay?: { enabled: boolean; color: string; opacity: number }
  textPosition: 'left' | 'center' | 'right'
  textColor: string
  order: number
  isActive: boolean
  badge?: string
  story?: {
    type: 'youtube' | 'video'
    url: string
  }
}

interface Section {
  _id: string
  name: string
  type: string
  title?: string
  subtitle?: string
  order: number
  isActive: boolean
  productSource: string
  products?: any[]
  collectionHandle?: string
  productTag?: string
  productLimit: number
  layout: {
    columns: number
    columnsTablet?: number
    columnsMobile?: number
    rows?: number
    gap?: number
    showViewAll?: boolean
    viewAllLink?: string
  }
  style: {
    backgroundColor?: string
    textColor?: string
    paddingTop?: number
    paddingBottom?: number
    fullWidth?: boolean
    darkMode?: boolean
  }
  banner?: { image: string; mobileImage?: string; alt?: string; link?: string; height?: number }
  showOnDesktop: boolean
  showOnMobile: boolean
}

interface Product {
  _id: string
  title: string
  handle: string
  images?: { src: string }[]
  variants?: { price: number }[]
}

const SECTION_TYPES = [
  { value: 'product-grid', label: 'Product Grid', icon: LayoutGrid, description: 'Display products in a grid layout' },
  { value: 'product-carousel', label: 'Product Carousel', icon: ShoppingBag, description: 'Scrollable product carousel' },
  { value: 'banner-strip', label: 'Banner Strip', icon: ImageIcon, description: 'Full-width promotional banner' },
  { value: 'featured-collection', label: 'Featured Collection', icon: Tag, description: 'Highlight a specific collection' },
  { value: 'countdown-timer', label: 'Countdown Timer', icon: Clock, description: 'Sale countdown with products' },
  { value: 'video-banner', label: 'Video Banner', icon: Video, description: 'Full-width video section' },
  { value: 'text-block', label: 'Text Block', icon: Type, description: 'Rich text content section' },
]

const PRODUCT_SOURCES = [
  { value: 'manual', label: 'Manual Selection', description: 'Choose specific products' },
  { value: 'bestseller', label: 'Bestsellers', description: 'Auto-fetch bestselling products' },
  { value: 'new', label: 'New Arrivals', description: 'Auto-fetch newest products' },
  { value: 'sale', label: 'On Sale', description: 'Auto-fetch discounted products' },
  { value: 'tag', label: 'By Tag', description: 'Products with specific tag' },
  { value: 'collection', label: 'By Collection', description: 'Products from a collection' },
]

export default function HomepageBuilderPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()
  
  const [banners, setBanners] = useState<Banner[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'banners' | 'sections'>('banners')
  
  // Modal states
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  
  // Banner form
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    buttonText: '',
    buttonLink: '',
    desktopImage: '',
    mobileImage: '',
    imageAlt: '',
    overlayEnabled: true,
    overlayColor: '#000000',
    overlayOpacity: 0.4,
    textPosition: 'left' as 'left' | 'center' | 'right',
    textColor: '#ffffff',
    badge: '',
    storyType: 'youtube' as 'youtube' | 'video',
    storyUrl: ''
  })
  
  // Section form
  const [sectionForm, setSectionForm] = useState({
    name: '',
    type: 'product-grid',
    title: '',
    subtitle: '',
    productSource: 'bestseller',
    products: [] as string[],
    collectionHandle: '',
    productTag: '',
    productLimit: 8,
    columns: 4,
    columnsTablet: 3,
    columnsMobile: 2,
    gap: 24,
    showViewAll: true,
    viewAllLink: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    paddingTop: 60,
    paddingBottom: 60,
    fullWidth: false,
    darkMode: false,
    bannerImage: '',
    bannerMobileImage: '',
    bannerLink: '',
    bannerHeight: 400,
    showOnDesktop: true,
    showOnMobile: true
  })

  const fetchData = useCallback(async () => {
    try {
      const [bannersRes, sectionsRes, productsRes, collectionsRes] = await Promise.all([
        fetch('/api/admin/home-banners'),
        fetch('/api/admin/home-sections'),
        fetch('/api/products?limit=100'),
        fetch('/api/collections')
      ])
      
      if (bannersRes.ok) {
        const data = await bannersRes.json()
        if (data.success) setBanners(data.data)
      }
      
      if (sectionsRes.ok) {
        const data = await sectionsRes.json()
        if (data.success) setSections(data.data)
      }
      
      if (productsRes.ok) {
        const data = await productsRes.json()
        if (data.success || data.data) setProducts(data.data || [])
      }
      
      if (collectionsRes.ok) {
        const data = await collectionsRes.json()
        if (data.success || data.data) setCollections(data.data || [])
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

  // Banner CRUD
  const openBannerModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        buttonText: banner.buttonText || '',
        buttonLink: banner.buttonLink || '',
        desktopImage: banner.image.desktop,
        mobileImage: banner.image.mobile || '',
        imageAlt: banner.image.alt,
        overlayEnabled: banner.overlay?.enabled ?? true,
        overlayColor: banner.overlay?.color || '#000000',
        overlayOpacity: banner.overlay?.opacity ?? 0.4,
        textPosition: banner.textPosition,
        textColor: banner.textColor,
        badge: banner.badge || '',
        storyType: banner.story?.type || 'youtube',
        storyUrl: banner.story?.url || ''
      })
    } else {
      setEditingBanner(null)
      setBannerForm({
        title: '', subtitle: '', description: '', buttonText: '', buttonLink: '',
        desktopImage: '', mobileImage: '', imageAlt: '',
        overlayEnabled: true, overlayColor: '#000000', overlayOpacity: 0.4,
        textPosition: 'left', textColor: '#ffffff',
        badge: '',
        storyType: 'youtube',
        storyUrl: ''
      })
    }
    setShowBannerModal(true)
  }

  const saveBanner = async () => {
    if (!bannerForm.title || !bannerForm.desktopImage) {
      toast.error('Title and desktop image are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle || undefined,
        description: bannerForm.description || undefined,
        buttonText: bannerForm.buttonText || undefined,
        buttonLink: bannerForm.buttonLink || undefined,
        image: {
          desktop: bannerForm.desktopImage,
          mobile: bannerForm.mobileImage || undefined,
          alt: bannerForm.imageAlt || bannerForm.title
        },
        overlay: {
          enabled: bannerForm.overlayEnabled,
          color: bannerForm.overlayColor,
          opacity: bannerForm.overlayOpacity
        },
        textPosition: bannerForm.textPosition,
        textColor: bannerForm.textColor,
        badge: bannerForm.badge || undefined,
        story: bannerForm.storyUrl ? {
          type: bannerForm.storyType,
          url: bannerForm.storyUrl
        } : undefined
      }

      const url = editingBanner 
        ? `/api/admin/home-banners/${editingBanner._id}`
        : '/api/admin/home-banners'
      
      const res = await fetch(url, {
        method: editingBanner ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(editingBanner ? 'Banner updated!' : 'Banner created!')
        setShowBannerModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    
    try {
      const res = await fetch(`/api/admin/home-banners/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Banner deleted!')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const toggleBannerActive = async (banner: Banner) => {
    try {
      await fetch(`/api/admin/home-banners/${banner._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !banner.isActive })
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  // Section CRUD
  const openSectionModal = (section?: Section) => {
    if (section) {
      setEditingSection(section)
      setSectionForm({
        name: section.name,
        type: section.type,
        title: section.title || '',
        subtitle: section.subtitle || '',
        productSource: section.productSource,
        products: section.products?.map((p: any) => p._id || p) || [],
        collectionHandle: section.collectionHandle || '',
        productTag: section.productTag || '',
        productLimit: section.productLimit,
        columns: section.layout.columns,
        columnsTablet: section.layout.columnsTablet || 3,
        columnsMobile: section.layout.columnsMobile || 2,
        gap: section.layout.gap || 24,
        showViewAll: section.layout.showViewAll ?? true,
        viewAllLink: section.layout.viewAllLink || '',
        backgroundColor: section.style.backgroundColor || '#ffffff',
        textColor: section.style.textColor || '#000000',
        paddingTop: section.style.paddingTop || 60,
        paddingBottom: section.style.paddingBottom || 60,
        fullWidth: section.style.fullWidth || false,
        darkMode: section.style.darkMode || false,
        bannerImage: section.banner?.image || '',
        bannerMobileImage: section.banner?.mobileImage || '',
        bannerLink: section.banner?.link || '',
        bannerHeight: section.banner?.height || 400,
        showOnDesktop: section.showOnDesktop,
        showOnMobile: section.showOnMobile
      })
    } else {
      setEditingSection(null)
      setSectionForm({
        name: '', type: 'product-grid', title: '', subtitle: '',
        productSource: 'bestseller', products: [], collectionHandle: '', productTag: '',
        productLimit: 8, columns: 4, columnsTablet: 3, columnsMobile: 2, gap: 24,
        showViewAll: true, viewAllLink: '',
        backgroundColor: '#ffffff', textColor: '#000000',
        paddingTop: 60, paddingBottom: 60, fullWidth: false, darkMode: false,
        bannerImage: '', bannerMobileImage: '', bannerLink: '', bannerHeight: 400,
        showOnDesktop: true, showOnMobile: true
      })
    }
    setShowSectionModal(true)
  }

  const saveSection = async () => {
    if (!sectionForm.name || !sectionForm.type) {
      toast.error('Name and type are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: sectionForm.name,
        type: sectionForm.type,
        title: sectionForm.title || undefined,
        subtitle: sectionForm.subtitle || undefined,
        productSource: sectionForm.productSource,
        products: sectionForm.productSource === 'manual' ? sectionForm.products : [],
        collectionHandle: sectionForm.collectionHandle || undefined,
        productTag: sectionForm.productTag || undefined,
        productLimit: sectionForm.productLimit,
        layout: {
          columns: sectionForm.columns,
          columnsTablet: sectionForm.columnsTablet,
          columnsMobile: sectionForm.columnsMobile,
          gap: sectionForm.gap,
          showViewAll: sectionForm.showViewAll,
          viewAllLink: sectionForm.viewAllLink || undefined
        },
        style: {
          backgroundColor: sectionForm.backgroundColor,
          textColor: sectionForm.textColor,
          paddingTop: sectionForm.paddingTop,
          paddingBottom: sectionForm.paddingBottom,
          fullWidth: sectionForm.fullWidth,
          darkMode: sectionForm.darkMode
        },
        banner: sectionForm.bannerImage ? {
          image: sectionForm.bannerImage,
          mobileImage: sectionForm.bannerMobileImage || undefined,
          link: sectionForm.bannerLink || undefined,
          height: sectionForm.bannerHeight
        } : undefined,
        showOnDesktop: sectionForm.showOnDesktop,
        showOnMobile: sectionForm.showOnMobile
      }

      const url = editingSection 
        ? `/api/admin/home-sections/${editingSection._id}`
        : '/api/admin/home-sections'
      
      const res = await fetch(url, {
        method: editingSection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(editingSection ? 'Section updated!' : 'Section created!')
        setShowSectionModal(false)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return
    
    try {
      const res = await fetch(`/api/admin/home-sections/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Section deleted!')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const toggleSectionActive = async (section: Section) => {
    try {
      await fetch(`/api/admin/home-sections/${section._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !section.isActive })
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const moveItem = async (type: 'banners' | 'sections', id: string, direction: 'up' | 'down') => {
    const items = type === 'banners' ? banners : sections
    const index = items.findIndex(i => i._id === id)
    
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const currentItem = items[index]
    const swapItem = items[swapIndex]

    try {
      await fetch('/api/admin/home-content/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          items: [
            { id: currentItem._id, order: swapItem.order },
            { id: swapItem._id, order: currentItem.order }
          ]
        })
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to reorder')
    }
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
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Homepage Builder</h1>
            <p className="text-sm text-neutral-500">Manage your homepage banners and sections</p>
          </div>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <Eye className="h-4 w-4" />
            Preview Homepage
          </a>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'banners'
                ? 'border-b-2 border-[#2e1f15] text-[#2e1f15]'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Hero Banners ({banners.length})
          </button>
          {/* <button
            onClick={() => setActiveTab('sections')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sections'
                ? 'border-b-2 border-[#2e1f15] text-[#2e1f15]'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Content Sections ({sections.length})
          </button> */}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'banners' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                Hero banners displayed in the homepage slider. Drag to reorder.
              </p>
              <button
                onClick={() => openBannerModal()}
                className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2.5 font-medium text-white hover:bg-[#2e1f15]/90"
              >
                <Plus className="h-5 w-5" />
                Add Banner
              </button>
            </div>

            {banners.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white py-16 dark:border-neutral-700 dark:bg-neutral-800">
                <ImageIcon className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
                <h3 className="mt-4 text-lg font-semibold">No banners yet</h3>
                <p className="mt-2 text-neutral-500">Create your first hero banner</p>
                <button
                  onClick={() => openBannerModal()}
                  className="mt-6 flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2.5 font-medium text-white"
                >
                  <Plus className="h-5 w-5" />
                  Add Banner
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {banners.map((banner, index) => (
                  <div
                    key={banner._id}
                    className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-lg dark:bg-neutral-800 ${
                      banner.isActive ? 'border-neutral-200 dark:border-neutral-700' : 'border-dashed border-neutral-300 opacity-60'
                    }`}
                  >
                    <div className="relative aspect-[2/1] bg-neutral-100">
                      {banner.image.desktop && (
                        <Image
                          src={banner.image.desktop}
                          alt={banner.image.alt}
                          fill
                          className="object-cover"
                        />
                      )}
                      {banner.overlay?.enabled && (
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            backgroundColor: banner.overlay.color, 
                            opacity: banner.overlay.opacity 
                          }}
                        />
                      )}
                      <div className={`absolute inset-0 flex flex-col justify-center p-6 ${
                        banner.textPosition === 'center' ? 'items-center text-center' :
                        banner.textPosition === 'right' ? 'items-end text-right' : 'items-start'
                      }`}>
                        <h3 className="text-xl font-bold" style={{ color: banner.textColor }}>
                          {banner.title}
                        </h3>
                        {banner.subtitle && (
                          <p className="mt-1 text-sm opacity-80" style={{ color: banner.textColor }}>
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                      
                      {/* Order Badge */}
                      <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100 p-3 dark:border-neutral-700">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveItem('banners', banner._id, 'up')}
                          disabled={index === 0}
                          className="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-700"
                        >
                          <MoveUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveItem('banners', banner._id, 'down')}
                          disabled={index === banners.length - 1}
                          className="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-700"
                        >
                          <MoveDown className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleBannerActive(banner)}
                          className={`rounded p-1.5 transition-colors ${
                            banner.isActive ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'
                          }`}
                        >
                          {banner.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openBannerModal(banner)}
                          className="rounded p-1.5 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteBanner(banner._id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                Homepage sections displayed below the hero banner. Drag to reorder.
              </p>
              <button
                onClick={() => openSectionModal()}
                className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2.5 font-medium text-white hover:bg-[#2e1f15]/90"
              >
                <Plus className="h-5 w-5" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white py-16 dark:border-neutral-700 dark:bg-neutral-800">
                <LayoutGrid className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
                <h3 className="mt-4 text-lg font-semibold">No sections yet</h3>
                <p className="mt-2 text-neutral-500">Create your first homepage section</p>
                <button
                  onClick={() => openSectionModal()}
                  className="mt-6 flex items-center gap-2 rounded-lg bg-[#2e1f15] px-4 py-2.5 font-medium text-white"
                >
                  <Plus className="h-5 w-5" />
                  Add Section
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => {
                  const typeInfo = SECTION_TYPES.find(t => t.value === section.type)
                  const sourceInfo = PRODUCT_SOURCES.find(s => s.value === section.productSource)
                  
                  return (
                    <div
                      key={section._id}
                      className={`group rounded-xl border bg-white transition-all hover:shadow-md dark:bg-neutral-800 ${
                        section.isActive ? 'border-neutral-200 dark:border-neutral-700' : 'border-dashed border-neutral-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Order & Drag */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-sm font-bold dark:bg-neutral-700">
                            {index + 1}
                          </span>
                          <GripVertical className="h-4 w-4 cursor-grab text-neutral-400" />
                        </div>

                        {/* Type Icon */}
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          section.type === 'product-grid' ? 'bg-blue-100 text-blue-600' :
                          section.type === 'product-carousel' ? 'bg-purple-100 text-purple-600' :
                          section.type === 'banner-strip' ? 'bg-orange-100 text-orange-600' :
                          section.type === 'featured-collection' ? 'bg-green-100 text-green-600' :
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {typeInfo?.icon && <typeInfo.icon className="h-6 w-6" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">{section.name}</h3>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-700">
                              {typeInfo?.label}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-neutral-500">
                            {section.title && <span>"{section.title}"</span>}
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3.5 w-3.5" />
                              {sourceInfo?.label} • {section.productLimit} products
                            </span>
                            <span className="flex items-center gap-1">
                              <Columns className="h-3.5 w-3.5" />
                              {section.layout.columns} columns
                            </span>
                            {!section.showOnMobile && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Smartphone className="h-3.5 w-3.5 line-through" />
                                Hidden on mobile
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Preview color */}
                        <div 
                          className="h-8 w-8 rounded-lg border border-neutral-200"
                          style={{ backgroundColor: section.style.backgroundColor }}
                          title={`Background: ${section.style.backgroundColor}`}
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveItem('sections', section._id, 'up')}
                            disabled={index === 0}
                            className="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-700"
                          >
                            <MoveUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveItem('sections', section._id, 'down')}
                            disabled={index === sections.length - 1}
                            className="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-700"
                          >
                            <MoveDown className="h-4 w-4" />
                          </button>
                          <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
                          <button
                            onClick={() => toggleSectionActive(section)}
                            className={`rounded p-1.5 transition-colors ${
                              section.isActive ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100'
                            }`}
                          >
                            {section.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => openSectionModal(section)}
                            className="rounded p-1.5 text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSection(section._id)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner Modal */}
      <AnimatePresence>
        {showBannerModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowBannerModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <h2 className="text-xl font-bold">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
                <button onClick={() => setShowBannerModal(false)} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Title *</label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Banner headline"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                      <input
                        type="text"
                        value={bannerForm.subtitle}
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Supporting text"
                      />
                    </div>
                  </div>
                  
                  {/* Badge */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Badge</label>
                    <input
                      type="text"
                      value={bannerForm.badge}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                      placeholder="e.g. NEW ARRIVAL"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Description</label>
                    <textarea
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                      placeholder="Optional longer description"
                      rows={2}
                    />
                  </div>

                  {/* Story */}
                  <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <h3 className="mb-3 font-medium">Story Content</h3>
                    <div className="mb-4 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="storyType"
                          value="youtube"
                          checked={bannerForm.storyType === 'youtube'}
                          onChange={(e) => setBannerForm({ ...bannerForm, storyType: 'youtube' as any })}
                          className="text-[#2e1f15]"
                        />
                        <span className="text-sm">YouTube Link</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="storyType"
                          value="video"
                          checked={bannerForm.storyType === 'video'}
                          onChange={(e) => setBannerForm({ ...bannerForm, storyType: 'video' as any })}
                          className="text-[#2e1f15]"
                        />
                        <span className="text-sm">Video Upload</span>
                      </label>
                    </div>

                    {bannerForm.storyType === 'youtube' ? (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium">YouTube URL</label>
                        <input
                          type="text"
                          value={bannerForm.storyUrl}
                          onChange={(e) => setBannerForm({ ...bannerForm, storyUrl: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    ) : (
                      <ImageUpload
                        label="Upload Video"
                        value={bannerForm.storyUrl}
                        onChange={(url) => setBannerForm({ ...bannerForm, storyUrl: url })}
                        hint="MP4, WebM up to 50MB"
                      />
                    )}
                  </div>

                  {/* Button */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Button Text</label>
                      <input
                        type="text"
                        value={bannerForm.buttonText}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Shop Now"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Button Link</label>
                      <input
                        type="text"
                        value={bannerForm.buttonLink}
                        onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="/collections/all-items"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload
                      label="Desktop Image *"
                      value={bannerForm.desktopImage}
                      onChange={(url) => setBannerForm({ ...bannerForm, desktopImage: url })}
                      aspectRatio="banner"
                      hint="Recommended: 1920x640px"
                    />
                    <ImageUpload
                      label="Mobile Image (optional)"
                      value={bannerForm.mobileImage}
                      onChange={(url) => setBannerForm({ ...bannerForm, mobileImage: url })}
                      aspectRatio="square"
                      hint="Recommended: 800x800px"
                    />
                  </div>

                  {/* Style Options */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Text Position</label>
                      <select
                        value={bannerForm.textPosition}
                        onChange={(e) => setBannerForm({ ...bannerForm, textPosition: e.target.value as any })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={bannerForm.textColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                          className="h-10 w-14 cursor-pointer rounded border"
                        />
                        <input
                          type="text"
                          value={bannerForm.textColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                          className="flex-1 rounded-lg border border-neutral-300 px-3 dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Overlay Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={bannerForm.overlayOpacity}
                        onChange={(e) => setBannerForm({ ...bannerForm, overlayOpacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-xs text-neutral-500">{Math.round(bannerForm.overlayOpacity * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <button onClick={() => setShowBannerModal(false)} className="rounded-lg px-4 py-2.5 text-neutral-600 hover:bg-neutral-100">
                  Cancel
                </button>
                <button
                  onClick={saveBanner}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-6 py-2.5 font-medium text-white hover:bg-[#2e1f15]/90 disabled:opacity-50"
                >
                  {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-5 w-5" />}
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Section Modal */}
      <AnimatePresence>
        {showSectionModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowSectionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <h2 className="text-xl font-bold">{editingSection ? 'Edit Section' : 'Add Section'}</h2>
                <button onClick={() => setShowSectionModal(false)} className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Section Name *</label>
                      <input
                        type="text"
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="e.g., Featured Products"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Section Type *</label>
                      <select
                        value={sectionForm.type}
                        onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                      >
                        {SECTION_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Display Title & Subtitle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Display Title</label>
                      <input
                        type="text"
                        value={sectionForm.title}
                        onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Best Sellers"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Subtitle</label>
                      <input
                        type="text"
                        value={sectionForm.subtitle}
                        onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-[#2e1f15] dark:border-neutral-600 dark:bg-neutral-700"
                        placeholder="Our most popular products"
                      />
                    </div>
                  </div>

                  {/* Product Source */}
                  <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <h3 className="mb-3 font-medium flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Product Source
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {PRODUCT_SOURCES.map(source => (
                        <button
                          key={source.value}
                          onClick={() => setSectionForm({ ...sectionForm, productSource: source.value })}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            sectionForm.productSource === source.value
                              ? 'border-[#2e1f15] bg-[#2e1f15]/5 ring-1 ring-[#2e1f15]'
                              : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700'
                          }`}
                        >
                          <p className="font-medium text-sm">{source.label}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{source.description}</p>
                        </button>
                      ))}
                    </div>

                    {sectionForm.productSource === 'manual' && (
                      <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium">Select Products</label>
                        <select
                          multiple
                          value={sectionForm.products}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, opt => opt.value)
                            setSectionForm({ ...sectionForm, products: selected })
                          }}
                          className="w-full rounded-lg border border-neutral-300 p-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                          style={{ minHeight: '120px' }}
                        >
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.title}</option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-neutral-500">Hold Ctrl/Cmd to select multiple</p>
                      </div>
                    )}

                    {sectionForm.productSource === 'tag' && (
                      <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium">Product Tag</label>
                        <input
                          type="text"
                          value={sectionForm.productTag}
                          onChange={(e) => setSectionForm({ ...sectionForm, productTag: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="e.g., featured, summer-sale"
                        />
                      </div>
                    )}

                    {sectionForm.productSource === 'collection' && (
                      <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium">Collection</label>
                        <select
                          value={sectionForm.collectionHandle}
                          onChange={(e) => setSectionForm({ ...sectionForm, collectionHandle: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        >
                          <option value="">Select collection...</option>
                          {collections.map(c => (
                            <option key={c._id || c.handle} value={c.handle}>{c.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="mb-1.5 block text-sm font-medium">Product Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={sectionForm.productLimit}
                        onChange={(e) => setSectionForm({ ...sectionForm, productLimit: parseInt(e.target.value) || 8 })}
                        className="w-32 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Layout */}
                  <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <h3 className="mb-3 font-medium flex items-center gap-2">
                      <Columns className="h-4 w-4" />
                      Layout Settings
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Desktop Columns</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={sectionForm.columns}
                          onChange={(e) => setSectionForm({ ...sectionForm, columns: parseInt(e.target.value) || 4 })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Tablet Columns</label>
                        <input
                          type="number"
                          min="1"
                          max="4"
                          value={sectionForm.columnsTablet}
                          onChange={(e) => setSectionForm({ ...sectionForm, columnsTablet: parseInt(e.target.value) || 3 })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Mobile Columns</label>
                        <input
                          type="number"
                          min="1"
                          max="2"
                          value={sectionForm.columnsMobile}
                          onChange={(e) => setSectionForm({ ...sectionForm, columnsMobile: parseInt(e.target.value) || 2 })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Gap (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="48"
                          value={sectionForm.gap}
                          onChange={(e) => setSectionForm({ ...sectionForm, gap: parseInt(e.target.value) || 24 })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sectionForm.showViewAll}
                          onChange={(e) => setSectionForm({ ...sectionForm, showViewAll: e.target.checked })}
                          className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15]"
                        />
                        <span className="text-sm">Show "View All" link</span>
                      </label>
                      {sectionForm.showViewAll && (
                        <input
                          type="text"
                          value={sectionForm.viewAllLink}
                          onChange={(e) => setSectionForm({ ...sectionForm, viewAllLink: e.target.value })}
                          className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none dark:border-neutral-600 dark:bg-neutral-700"
                          placeholder="/collections/all-items"
                        />
                      )}
                    </div>
                  </div>

                  {/* Style */}
                  <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <h3 className="mb-3 font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Style Settings
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Background</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={sectionForm.backgroundColor}
                            onChange={(e) => setSectionForm({ ...sectionForm, backgroundColor: e.target.value })}
                            className="h-9 w-12 cursor-pointer rounded border"
                          />
                          <input
                            type="text"
                            value={sectionForm.backgroundColor}
                            onChange={(e) => setSectionForm({ ...sectionForm, backgroundColor: e.target.value })}
                            className="flex-1 rounded-lg border border-neutral-300 px-2 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Text Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={sectionForm.textColor}
                            onChange={(e) => setSectionForm({ ...sectionForm, textColor: e.target.value })}
                            className="h-9 w-12 cursor-pointer rounded border"
                          />
                          <input
                            type="text"
                            value={sectionForm.textColor}
                            onChange={(e) => setSectionForm({ ...sectionForm, textColor: e.target.value })}
                            className="flex-1 rounded-lg border border-neutral-300 px-2 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Padding Top</label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={sectionForm.paddingTop}
                          onChange={(e) => setSectionForm({ ...sectionForm, paddingTop: parseInt(e.target.value) || 60 })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium">Padding Bottom</label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={sectionForm.paddingBottom}
                          onChange={(e) => setSectionForm({ ...sectionForm, paddingBottom: parseInt(e.target.value) || 60 })}
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none dark:border-neutral-600 dark:bg-neutral-700"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sectionForm.fullWidth}
                          onChange={(e) => setSectionForm({ ...sectionForm, fullWidth: e.target.checked })}
                          className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15]"
                        />
                        <span className="text-sm">Full Width</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sectionForm.showOnDesktop}
                          onChange={(e) => setSectionForm({ ...sectionForm, showOnDesktop: e.target.checked })}
                          className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15]"
                        />
                        <Monitor className="h-4 w-4" />
                        <span className="text-sm">Desktop</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sectionForm.showOnMobile}
                          onChange={(e) => setSectionForm({ ...sectionForm, showOnMobile: e.target.checked })}
                          className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15]"
                        />
                        <Smartphone className="h-4 w-4" />
                        <span className="text-sm">Mobile</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
                <button onClick={() => setShowSectionModal(false)} className="rounded-lg px-4 py-2.5 text-neutral-600 hover:bg-neutral-100">
                  Cancel
                </button>
                <button
                  onClick={saveSection}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#2e1f15] px-6 py-2.5 font-medium text-white hover:bg-[#2e1f15]/90 disabled:opacity-50"
                >
                  {saving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save className="h-5 w-5" />}
                  {editingSection ? 'Update' : 'Create'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
