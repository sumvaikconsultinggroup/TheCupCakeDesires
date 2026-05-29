'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Package,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { deleteAllProducts, importProducts, parseShopifyCSV } from './import-actions'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ParsedProduct {
  handle: string
  title: string
  bodyHtml: string
  vendor: string
  productCategory: string
  type: string
  tags: any
  published: boolean
  options: any[]
  variants: any[]
  images: any[]
  status: 'active' | 'draft' | 'archived'
  // Guesses for the "2 more" properties from the error
  seo: any
  metafields?: any
  giftCard: boolean
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete'

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [products, setProducts] = useState<ParsedProduct[]>([])
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors?: string[] } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setStep('upload')
    setProducts([])
    setExpandedProducts(new Set())
    setOverwriteExisting(false)
    setImportProgress(0)
    setError(null)
    setResult(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setError(null)
    const reader = new FileReader()

    reader.onload = async (e) => {
      const content = e.target?.result as string
      const result = await parseShopifyCSV(content)

      if (result.success && result.products) {
        setProducts(result.products)
        setStep('preview')
      } else {
        setError(result.message)
      }
    }

    reader.onerror = () => {
      setError('Failed to read file')
    }

    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleImport = async () => {
    setStep('importing')
    setImportProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    const result = await importProducts(products, overwriteExisting)

    clearInterval(progressInterval)
    setImportProgress(100)

    if (result.success) {
      setResult({
        imported: result.imported || 0,
        skipped: result.skipped || 0,
        errors: result.errors,
      })
      setStep('complete')
      onImportComplete()
    } else {
      setError(result.message)
      setStep('preview')
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL products? This cannot be undone.')) {
      return
    }

    setDeleting(true)
    const result = await deleteAllProducts()
    setDeleting(false)

    if (result.success) {
      alert(result.message)
      onImportComplete()
    } else {
      setError(result.message)
    }
  }

  const toggleProductExpand = (handle: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(handle)) {
      newExpanded.delete(handle)
    } else {
      newExpanded.add(handle)
    }
    setExpandedProducts(newExpanded)
  }

  const getTotalVariants = () => products.reduce((sum, p) => sum + p.variants.length, 0)
  const getTotalInventory = () =>
    products.reduce((sum, p) => sum + p.variants.reduce((vSum: number, v: any) => vSum + (v.inventoryQty || 0), 0), 0)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F]/10">
                <FileSpreadsheet className="h-5 w-5 text-[#1B198F]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Import Products from Shopify CSV</h2>
                <p className="text-sm text-neutral-500">
                  {step === 'upload' && 'Upload your Shopify product export CSV file'}
                  {step === 'preview' && `${products.length} products ready to import`}
                  {step === 'importing' && 'Importing products...'}
                  {step === 'complete' && 'Import complete!'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Upload Step */}
            {step === 'upload' && (
              <div className="space-y-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all ${
                    isDragging
                      ? 'border-[#1B198F] bg-[#1B198F]/5'
                      : 'border-neutral-300 hover:border-[#1B198F] hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div
                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                      isDragging ? 'bg-[#1B198F]/20' : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}
                  >
                    <Upload className={`h-8 w-8 ${isDragging ? 'text-[#1B198F]' : 'text-neutral-400'}`} />
                  </div>
                  <p className="text-lg font-medium text-neutral-900 dark:text-white">Drop your Shopify CSV here</p>
                  <p className="mt-1 text-neutral-500">or click to browse files</p>
                  <p className="mt-4 text-xs text-neutral-400">
                    Supports Shopify's product export format with variants and images
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    Delete all existing products before importing
                  </p>
                  <button
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete All Products
                  </button>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-[#1B198F] to-[#3D3BBF] p-4 text-white">
                    <p className="text-sm opacity-80">Products</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
                    <p className="text-sm opacity-80">Variants</p>
                    <p className="text-3xl font-bold">{getTotalVariants()}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white">
                    <p className="text-sm opacity-80">Total Inventory</p>
                    <p className="text-3xl font-bold">{getTotalInventory().toLocaleString()}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center gap-3 rounded-xl bg-neutral-100 p-4 dark:bg-neutral-800">
                  <input
                    type="checkbox"
                    id="overwrite"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-[#1B198F] focus:ring-[#1B198F]"
                  />
                  <label htmlFor="overwrite" className="text-sm text-neutral-700 dark:text-neutral-300">
                    Overwrite existing products with same handle
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Product List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Products to Import</h3>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                    {products.map((product, index) => (
                      <div
                        key={product.handle}
                        className={`${index > 0 ? 'border-t border-neutral-200 dark:border-neutral-700' : ''}`}
                      >
                        <button
                          onClick={() => toggleProductExpand(product.handle)}
                          className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          {expandedProducts.has(product.handle) ? (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-neutral-400" />
                          )}
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                            {product.images?.[0]?.src ? (
                              <img
                                src={product.images[0].src}
                                alt={product.title}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-neutral-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900 dark:text-white">{product.title}</p>
                            <p className="text-sm text-neutral-500">
                              {product.variants.length} variant(s) • {product.vendor || 'No vendor'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              product.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {product.status}
                          </span>
                        </button>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {expandedProducts.has(product.handle) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-neutral-50 dark:bg-neutral-800/50"
                            >
                              <div className="space-y-2 px-6 py-3">
                                <p className="text-xs font-medium text-neutral-500 uppercase">Variants</p>
                                {product.variants.map((variant, vi) => (
                                  <div key={vi} className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-700 dark:text-neutral-300">
                                      {variant.option1Value}
                                      {variant.option2Value && ` / ${variant.option2Value}`}
                                      {variant.option3Value && ` / ${variant.option3Value}`}
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <span className="text-neutral-500">Stock: {variant.inventoryQty || 0}</span>
                                      <span className="font-medium text-neutral-900 dark:text-white">
                                        ₹{variant.price?.toLocaleString() || 0}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Importing Step */}
            {step === 'importing' && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="h-16 w-16 animate-spin text-[#1B198F]" />
                <p className="mt-6 text-lg font-medium text-neutral-900 dark:text-white">Importing products...</p>
                <div className="mt-4 w-full max-w-sm">
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${importProgress}%` }}
                      className="h-full rounded-full bg-[#1B198F]"
                    />
                  </div>
                  <p className="mt-2 text-center text-sm text-neutral-500">{importProgress}%</p>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {step === 'complete' && result && (
              <div className="flex flex-col items-center py-12">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-neutral-900 dark:text-white">Import Complete!</h3>
                <div className="mt-4 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{result.imported}</p>
                    <p className="text-sm text-neutral-500">Imported</p>
                  </div>
                  {result.skipped > 0 && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-amber-600">{result.skipped}</p>
                      <p className="text-sm text-neutral-500">Skipped</p>
                    </div>
                  )}
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-6 w-full max-w-md rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      {result.errors.length} error(s) occurred:
                    </p>
                    <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-amber-600 dark:text-amber-300">
                      {result.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <button
              onClick={step === 'complete' ? handleClose : () => setStep('upload')}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {step === 'complete' ? 'Close' : 'Back'}
            </button>

            {step === 'preview' && (
              <button
                onClick={handleImport}
                className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B198F]/90"
              >
                <Upload className="h-4 w-4" />
                Import {products.length} Products
              </button>
            )}

            {step === 'complete' && (
              <button
                onClick={handleClose}
                className="rounded-xl bg-[#1B198F] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B198F]/90"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
