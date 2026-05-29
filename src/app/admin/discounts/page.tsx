'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Percent,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Tag,
  DollarSign,
  Users,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Save,
  AlertCircle,
  ChevronDown,
  Check,
} from 'lucide-react'

interface Discount {
  _id?: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number
  usageLimit?: number
  usageCount: number
  startsAt?: string
  expiresAt?: string
  isActive: boolean
  appliesTo: 'all' | 'products' | 'categories'
  productIds?: string[]
  categoryNames?: string[]
  createdAt?: string
}

interface Product {
  _id: string
  title: string
  handle: string
}


export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [formData, setFormData] = useState<Partial<Discount>>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    usageLimit: undefined,
    isActive: true,
    appliesTo: 'all',
    startsAt: '',
    expiresAt: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  useEffect(() => {
    fetchDiscounts()
  }, [])

  useEffect(() => {
    if (showModal) {
      fetchProducts()
      fetchCategories()
    }
  }, [showModal])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowProductDropdown(false)
        setShowCategoryDropdown(false)
      }
    }

    if (showProductDropdown || showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProductDropdown, showCategoryDropdown])

  const fetchDiscounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/promoCode/getPromoCodes')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDiscounts(data.data || [])
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to fetch promo codes' })
        }
      } else {
        const errorData = await res.json()
        setMessage({ type: 'error', text: errorData.message || 'Failed to fetch promo codes' })
      }
    } catch (error) {
      console.error('Error fetching discounts:', error)
      setMessage({ type: 'error', text: 'Failed to fetch promo codes' })
    }
    setLoading(false)
  }

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/products?all=true')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setProducts(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setLoadingProducts(false)
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      let url: string
      let method: string

      if (editingDiscount) {
        // Update existing promo code
        url = `/api/promoCode/updatePromoCode?id=${editingDiscount._id}`
        method = 'PUT'
      } else {
        // Create new promo code
        url = '/api/promoCode/createPromoCode'
        method = 'POST'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
          productIds: formData.appliesTo === 'products' ? (formData.productIds || []) : undefined,
          categoryNames: formData.appliesTo === 'categories' ? (formData.categoryNames || []) : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: editingDiscount ? 'Discount updated!' : 'Discount created!' })
        setShowModal(false)
        setShowProductDropdown(false)
        setShowCategoryDropdown(false)
        fetchDiscounts()
        resetForm()
      } else {
        setMessage({ type: 'error', text: data.message || 'Something went wrong' })
      }
    } catch (error) {
      console.error('Error saving discount:', error)
      setMessage({ type: 'error', text: 'Failed to save discount. Please try again.' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return
    
    try {
      const res = await fetch(`/api/promoCode/createPromoCode?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Discount deleted successfully!' })
        fetchDiscounts()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete discount' })
      }
    } catch (error) {
      console.error('Error deleting discount:', error)
      setMessage({ type: 'error', text: 'Failed to delete discount. Please try again.' })
    }
  }

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/promoCode/updatePromoCode?id=${discount._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !discount.isActive }),
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        fetchDiscounts()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update discount status' })
      }
    } catch (error) {
      console.error('Error toggling discount status:', error)
      setMessage({ type: 'error', text: 'Failed to update discount status. Please try again.' })
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      usageLimit: undefined,
      isActive: true,
      appliesTo: 'all',
      startsAt: '',
      expiresAt: '',
      productIds: [],
      categoryNames: [],
    })
    setEditingDiscount(null)
    setShowProductDropdown(false)
    setShowCategoryDropdown(false)
  }

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      minOrderAmount: discount.minOrderAmount || 0,
      usageLimit: discount.usageLimit,
      isActive: discount.isActive,
      appliesTo: discount.appliesTo,
      startsAt: discount.startsAt ? new Date(discount.startsAt).toISOString().split('T')[0] : '',
      expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().split('T')[0] : '',
      productIds: discount.productIds || [],
      categoryNames: discount.categoryNames || [],
    })
    setShowModal(true)
  }

  const toggleProductSelection = (productId: string) => {
    const currentIds = formData.productIds || []
    const newIds = currentIds.includes(productId)
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId]
    setFormData({ ...formData, productIds: newIds })
  }

  const toggleCategorySelection = (categoryName: string) => {
    const currentNames = formData.categoryNames || []
    const newNames = currentNames.includes(categoryName)
      ? currentNames.filter(name => name !== categoryName)
      : [...currentNames, categoryName]
    setFormData({ ...formData, categoryNames: newNames })
  }

  const getSelectedProductNames = () => {
    if (!formData.productIds || formData.productIds.length === 0) return 'Select products...'
    const selectedProducts = products.filter(p => formData.productIds?.includes(p._id))
    if (selectedProducts.length === 0) return 'Select products...'
    if (selectedProducts.length === 1) return selectedProducts[0].title
    return `${selectedProducts.length} products selected`
  }

  const getSelectedCategoryNames = () => {
    if (!formData.categoryNames || formData.categoryNames.length === 0) return 'Select categories...'
    if (formData.categoryNames.length === 1) return formData.categoryNames[0]
    return `${formData.categoryNames.length} categories selected`
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setMessage({ type: 'success', text: `Copied "${code}" to clipboard!` })
    setTimeout(() => setMessage(null), 2000)
  }

  const filteredDiscounts = discounts.filter(d => 
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatus = (discount: Discount) => {
    if (!discount.isActive) return { label: 'Inactive', color: 'bg-neutral-100 text-neutral-600' }
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return { label: 'Expired', color: 'bg-red-100 text-red-600' }
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) return { label: 'Limit Reached', color: 'bg-amber-100 text-amber-600' }
    return { label: 'Active', color: 'bg-green-100 text-green-600' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Discounts</h1>
          <p className="text-neutral-500">Create and manage discount codes for your store</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1B198F]/90"
        >
          <Plus className="h-4 w-4" />
          Create Discount
        </button>
      </div>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ${
              message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B198F]/10">
              <Percent className="h-6 w-6 text-[#1B198F]" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Discounts</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{discounts.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Active</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {discounts.filter(d => d.isActive && (!d.expiresAt || new Date(d.expiresAt) > new Date())).length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Usage</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {discounts.reduce((acc, d) => acc + d.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Expired</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {discounts.filter(d => d.expiresAt && new Date(d.expiresAt) < new Date()).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search discount codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      </div>

      {/* Discounts Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Applies To</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Usage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Expires</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-10 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                    </td>
                  </tr>
                ))
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No discount codes found
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount, i) => {
                  const status = getStatus(discount)
                  return (
                    <motion.tr
                      key={discount._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#1B198F]">{discount.code}</span>
                          <button
                            onClick={() => copyCode(discount.code)}
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {discount.discountType === 'percentage' ? `${discount.discountValue}%` : `₹${discount.discountValue}`}
                        </span>
                        {discount.minOrderAmount > 0 && (
                          <span className="ml-2 text-sm text-neutral-500">
                            (min ₹{discount.minOrderAmount})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                          {discount.appliesTo === 'all' && <Package className="h-3 w-3" />}
                          {discount.appliesTo === 'all' ? 'All Products' : 
                           discount.appliesTo === 'products' ? 
                             (discount.productIds && discount.productIds.length > 0 
                               ? `${discount.productIds.length} Product${discount.productIds.length > 1 ? 's' : ''}`
                               : 'No Products') : 
                           discount.appliesTo === 'categories' ?
                             (discount.categoryNames && discount.categoryNames.length > 0
                               ? `${discount.categoryNames.length} Categor${discount.categoryNames.length > 1 ? 'ies' : 'y'}`
                               : 'No Categories')
                             : 'Categories'}
                        </span>
                        {(discount.appliesTo === 'categories' && discount.categoryNames && discount.categoryNames.length > 0) && (
                          <div className="mt-1 text-xs text-neutral-500">
                            {discount.categoryNames.slice(0, 2).join(', ')}
                            {discount.categoryNames.length > 2 && ` +${discount.categoryNames.length - 2} more`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900 dark:text-white">{discount.usageCount}</span>
                          {discount.usageLimit && (
                            <span className="text-neutral-500">/ {discount.usageLimit}</span>
                          )}
                        </div>
                        {discount.usageLimit && (
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                            <div
                              className="h-full rounded-full bg-[#1B198F]"
                              style={{ width: `${Math.min((discount.usageCount / discount.usageLimit) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {discount.expiresAt ? (
                          new Date(discount.expiresAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        ) : (
                          'No expiry'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(discount)}
                            className={`rounded-lg p-2 transition-colors ${
                              discount.isActive
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-neutral-400 hover:bg-neutral-100'
                            }`}
                            title={discount.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {discount.isActive ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => openEditModal(discount)}
                            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-[#1B198F]"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(discount._id!)}
                            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowModal(false)
              setShowProductDropdown(false)
              setShowCategoryDropdown(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 p-6 dark:border-neutral-700">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {editingDiscount ? 'Edit Discount' : 'Create Discount'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setShowProductDropdown(false)
                    setShowCategoryDropdown(false)
                  }}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* Code */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Discount Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SUMMER20"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 font-mono uppercase outline-none focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-700 dark:bg-neutral-900"
                      required
                    />
                  </div>

                  {/* Discount Type & Value */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Discount Type
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Value
                      </label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        min="0"
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                        required
                      />
                    </div>
                  </div>

                  {/* Min Order & Usage Limit */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Minimum Order (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                        min="0"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Usage Limit
                      </label>
                      <input
                        type="number"
                        value={formData.usageLimit || ''}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
                        min="1"
                        placeholder="Unlimited"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                  </div>

                  {/* Applies To */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Applies To
                    </label>
                    <select
                      value={formData.appliesTo}
                      onChange={(e) => {
                        const newAppliesTo = e.target.value as any
                        setFormData({ 
                          ...formData, 
                          appliesTo: newAppliesTo,
                          productIds: newAppliesTo !== 'products' ? [] : formData.productIds,
                          categoryNames: newAppliesTo !== 'categories' ? [] : formData.categoryNames,
                        })
                      }}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <option value="all">All Products</option>
                      <option value="products">Specific Products</option>
                      <option value="categories">Specific Categories</option>
                    </select>
                  </div>

                  {/* Products Multi-Select */}
                  {formData.appliesTo === 'products' && (
                    <div className="relative dropdown-container">
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Select Products
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProductDropdown(!showProductDropdown)
                            setShowCategoryDropdown(false)
                          }}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left outline-none focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        >
                          <div className="flex items-center justify-between">
                            <span className={formData.productIds && formData.productIds.length > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}>
                              {getSelectedProductNames()}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {showProductDropdown && (
                          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                            {loadingProducts ? (
                              <div className="px-4 py-3 text-center text-sm text-neutral-500">Loading products...</div>
                            ) : products.length === 0 ? (
                              <div className="px-4 py-3 text-center text-sm text-neutral-500">No products found</div>
                            ) : (
                              <div className="p-2">
                                {products.map((product) => {
                                  const isSelected = formData.productIds?.includes(product._id)
                                  return (
                                    <label
                                      key={product._id}
                                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected || false}
                                        onChange={() => toggleProductSelection(product._id)}
                                        className="h-4 w-4 rounded border-neutral-300 text-[#1B198F] focus:ring-[#1B198F]"
                                      />
                                      <span className="flex-1 text-sm text-neutral-900 dark:text-white">{product.title}</span>
                                      {isSelected && <Check className="h-4 w-4 text-[#1B198F]" />}
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Categories Multi-Select */}
                  {formData.appliesTo === 'categories' && (
                    <div className="relative dropdown-container">
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Select Categories
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCategoryDropdown(!showCategoryDropdown)
                            setShowProductDropdown(false)
                          }}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left outline-none focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                        >
                          <div className="flex items-center justify-between">
                            <span className={formData.categoryNames && formData.categoryNames.length > 0 ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}>
                              {getSelectedCategoryNames()}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {showCategoryDropdown && (
                          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                            {categories.length === 0 ? (
                              <div className="px-4 py-3 text-center text-sm text-neutral-500">No categories found</div>
                            ) : (
                              <div className="p-2">
                                {categories.map((category) => {
                                  const isSelected = formData.categoryNames?.includes(category)
                                  return (
                                    <label
                                      key={category}
                                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected || false}
                                        onChange={() => toggleCategorySelection(category)}
                                        className="h-4 w-4 rounded border-neutral-300 text-[#1B198F] focus:ring-[#1B198F]"
                                      />
                                      <span className="flex-1 text-sm text-neutral-900 dark:text-white">{category}</span>
                                      {isSelected && <Check className="h-4 w-4 text-[#1B198F]" />}
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Start Date & Expiry Date */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        formData.isActive ? 'bg-[#1B198F]' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          formData.isActive ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setShowProductDropdown(false)
                      setShowCategoryDropdown(false)
                    }}
                    className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B198F] px-4 py-3 font-medium text-white transition-colors hover:bg-[#1B198F]/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingDiscount ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
