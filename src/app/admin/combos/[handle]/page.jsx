// c:\Users\dell\Desktop\gibbon-ecomm\src\app\admin\combos\[handle]\page.jsx

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Package, Plus, Save, Search, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createCombo, getCombo, getProductsForCombo, updateCombo } from '../combo-actions'

export default function ComboFormPage() {
  const router = useRouter()
  const params = useParams()
  const isEdit = params.handle && params.handle !== 'new'

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [availableProducts, setAvailableProducts] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const [formData, setFormData] = useState({
    handle: '',
    title: '',
    description: '',
    items: [],
    discount: 0,
    status: 'draft',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      loadCombo()
    }
  }, [isEdit])

  useEffect(() => {
    if (showProductSearch) {
      searchProducts()
    }
  }, [productSearch, showProductSearch])

  const loadCombo = async () => {
    try {
      const result = await getCombo(params.handle)
      if (result.success) {
        setFormData(result.combo)
      } else {
        toast.error('Combo not found')
        router.push('/admin/combos')
      }
    } catch (error) {
      toast.error('Failed to load combo')
    }
    setLoading(false)
  }

  const searchProducts = async () => {
    setSearchLoading(true)
    try {
      const result = await getProductsForCombo(productSearch)
      if (result.success) {
        setAvailableProducts(result.products)
      }
    } catch (error) {
      console.error('Search error:', error)
    }
    setSearchLoading(false)
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const addProductToCombo = (product, variant = null) => {
    const newItem = {
      productId: product._id,
      variantId: variant?._id || null,
      variantDetails: variant
        ? {
            option1Value: variant.option1Value,
            option2Value: variant.option2Value,
            option3Value: variant.option3Value,
            sku: variant.sku,
            image: variant.image,
          }
        : null,
      titleSnapshot: product.title,
      imageSnapshot: variant?.image || product.images?.[0]?.src || '',
      priceSnapshot: variant?.price || product.variants?.[0]?.price || 0,
      quantity: 1,
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))

    setShowProductSearch(false)
    setProductSearch('')
    toast.success('Product added to combo')
  }

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItemQuantity = (index, quantity) => {
    if (quantity < 1) return

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, quantity } : item)),
    }))
  }

  const calculateTotals = () => {
    const totalOriginalPrice = formData.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)
    const totalPrice = Math.max(totalOriginalPrice - (formData.discount || 0), 0)
    const savings = totalOriginalPrice - totalPrice
    const discountPercentage = totalOriginalPrice > 0 ? Math.round((savings / totalOriginalPrice) * 100) : 0

    return { totalOriginalPrice, totalPrice, savings, discountPercentage }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.handle?.trim()) {
      newErrors.handle = 'Handle is required'
    }

    if (formData.items.length < 2) {
      newErrors.items = 'At least 2 products are required for a combo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the errors')
      return
    }

    setSaving(true)
    try {
      const result = isEdit ? await updateCombo(params.handle, formData) : await createCombo(formData)

      if (result.success) {
        toast.success(isEdit ? 'Combo updated successfully' : 'Combo created successfully')
        router.push('/admin/combos')
      } else {
        toast.error(result.message || 'Failed to save combo')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
    setSaving(false)
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/combos')} className="rounded-lg p-2 hover:bg-neutral-100">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{isEdit ? 'Edit Combo' : 'Create Combo'}</h1>
              <p className="text-sm text-neutral-500">{isEdit ? 'Update combo details' : 'Bundle products together'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleChange('status', formData.status === 'active' ? 'draft' : 'active')}
              className={`rounded-lg px-4 py-2 font-medium ${
                formData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {formData.status === 'active' ? 'Active' : 'Draft'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#1B198F] px-6 py-2 text-white hover:bg-[#1B198F]/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Combo'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/50">
            <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const val = e.target.value
                    handleChange('title', val)
                    if (!isEdit) {
                      handleChange('handle', val.toLowerCase().replace(/\s+/g, '-'))
                    }
                  }}
                  className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                    errors.title
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-neutral-200 focus:border-[#1B198F] focus:ring-[#1B198F]/20'
                  }`}
                  placeholder="Summer Bundle Deal"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Handle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.handle}
                  onChange={(e) => handleChange('handle', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  disabled={isEdit}
                  className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none ${
                    isEdit ? 'bg-neutral-50 text-neutral-500' : ''
                  } ${
                    errors.handle
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-neutral-200 focus:border-[#1B198F] focus:ring-[#1B198F]/20'
                  }`}
                  placeholder="summer-bundle-deal"
                />
                {errors.handle && <p className="mt-1 text-sm text-red-600">{errors.handle}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 focus:outline-none"
                  placeholder="Describe this combo..."
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/50">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Products in Combo</h2>
              <button
                onClick={() => setShowProductSearch(true)}
                className="flex items-center gap-2 rounded-lg bg-[#1B198F] px-4 py-2 text-sm text-white hover:bg-[#1B198F]/90"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>

            {errors.items && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.items}
              </div>
            )}

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.imageSnapshot ? (
                      <Image src={item.imageSnapshot} alt={item.titleSnapshot} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{item.titleSnapshot}</p>
                    {item.variantDetails && (
                      <p className="text-sm text-neutral-500">
                        {[
                          item.variantDetails.option1Value,
                          item.variantDetails.option2Value,
                          item.variantDetails.option3Value,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                    )}
                    <p className="text-sm font-medium text-[#1B198F]">₹{item.priceSnapshot}</p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                      className="rounded-lg border border-neutral-200 p-1 hover:bg-neutral-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      className="rounded-lg border border-neutral-200 p-1 hover:bg-neutral-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">
                      ₹{(item.priceSnapshot * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Remove */}
                  <button onClick={() => removeItem(index)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}

              {formData.items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <Package className="h-16 w-16" />
                  <p className="mt-2">No products added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/50">
            <h2 className="mb-4 text-lg font-semibold">Pricing</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Flat Discount (₹)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
                  min="0"
                  className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2 rounded-lg bg-neutral-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Original Price:</span>
                  <span className="font-medium">₹{totals.totalOriginalPrice.toLocaleString()}</span>
                </div>
                {formData.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Discount:</span>
                      <span className="font-medium text-red-600">-₹{formData.discount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Savings:</span>
                      <span className="font-medium text-green-600">
                        ₹{totals.savings.toLocaleString()} ({totals.discountPercentage}%)
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-neutral-200 pt-2">
                  <span className="font-semibold text-neutral-900">Final Price:</span>
                  <span className="text-xl font-bold text-[#1B198F]">₹{totals.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Search Modal */}
      <AnimatePresence>
        {showProductSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowProductSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
            >
              <div className="border-b border-neutral-200 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add Product</h3>
                  <button onClick={() => setShowProductSearch(false)} className="rounded-lg p-2 hover:bg-neutral-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="relative mt-4">
                  <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-neutral-200 py-2 pr-4 pl-10 focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-6">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-[#1B198F]" />
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                    <Package className="h-16 w-16" />
                    <p className="mt-2">No products found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableProducts.map((product) => (
                      <div key={product._id} className="rounded-lg border border-neutral-200 p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                            {product.images?.[0]?.src ? (
                              <Image src={product.images[0].src} alt={product.title} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Package className="h-6 w-6 text-neutral-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-neutral-900">{product.title}</p>
                            <p className="text-sm text-neutral-500">{product.variants?.length || 0} variants</p>
                          </div>
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
                            {product.variants.map((variant) => (
                              <button
                                key={variant._id}
                                onClick={() => addProductToCombo(product, variant)}
                                className="flex w-full items-center justify-between rounded-lg border border-neutral-200 p-3 text-left transition hover:border-[#1B198F] hover:bg-blue-50/50"
                              >
                                <div>
                                  <p className="text-sm font-medium text-neutral-900">
                                    {[variant.option1Value, variant.option2Value, variant.option3Value]
                                      .filter(Boolean)
                                      .join(' / ')}
                                  </p>
                                  {variant.sku && <p className="text-xs text-neutral-500">SKU: {variant.sku}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-[#1B198F]">₹{variant.price}</p>
                                  {variant.inventoryQty !== undefined && (
                                    <p className="text-xs text-neutral-500">{variant.inventoryQty} in stock</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
