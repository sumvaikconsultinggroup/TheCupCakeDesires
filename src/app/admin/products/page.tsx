'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  X,
  Package,
  AlertTriangle,
  Download,
  Upload,
} from 'lucide-react'
import ImportModal from './ImportModal'
import { getProducts, deleteProduct, getProductStats, duplicateProduct, bulkDeleteProducts, bulkUpdateProductStatus } from './product-actions'

interface Product {
  _id: string
  handle: string
  title: string
  description?: string
  images?: { src: string }[]
  variants?: { price: number; compareAtPrice?: number; inventoryQty?: number; option1Value?: string }[]
  published?: boolean
  status?: string
  productCategory?: string
  createdAt?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  const productsPerPage = 10

  useEffect(() => {
    fetchProducts()
  }, [currentPage, statusFilter, sortBy, sortOrder, searchQuery])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Use Server Action instead of API route
      const result = await getProducts({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: productsPerPage,
      })
      
      if (result.success) {
        setProducts(result.products || [])
        setTotalProducts(result.total || 0)
      } else {
        console.error('Error fetching products:', result.message)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (handle: string) => {
    try {
      // Use Server Action instead of API route
      const result = await deleteProduct(handle)
      if (result.success) {
        fetchProducts()
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleDuplicate = async (handle: string) => {
    try {
      const result = await duplicateProduct(handle)
      if (result.success) {
        fetchProducts()
        setActionMenuOpen(null)
      } else {
        console.error('Error duplicating product:', result.message)
      }
    } catch (error) {
      console.error('Error duplicating product:', error)
    }
  }

  const handleBulkAction = async (action: 'delete' | 'publish' | 'unpublish') => {
    if (selectedProducts.size === 0) return

    setLoading(true)
    try {
      const handles = Array.from(selectedProducts)
      let result

      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${handles.length} products?`)) {
          setLoading(false)
          return
        }
        result = await bulkDeleteProducts(handles)
      } else if (action === 'publish') {
        result = await bulkUpdateProductStatus(handles, 'active')
      } else if (action === 'unpublish') {
        result = await bulkUpdateProductStatus(handles, 'draft')
      }

      if (result?.success) {
        setSelectedProducts(new Set())
        await fetchProducts()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.handle)))
    }
  }

  const toggleSelect = (handle: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(handle)) {
      newSelected.delete(handle)
    } else {
      newSelected.add(handle)
    }
    setSelectedProducts(newSelected)
  }

  const totalPages = Math.ceil(totalProducts / productsPerPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Products</h1>
          <p className="text-neutral-500">{totalProducts} products in your store</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#2e1f15]/90"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showFilters
                ? 'border-[#2e1f15] bg-[#2e1f15]/10 text-[#2e1f15]'
                : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedProducts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-4 rounded-xl bg-[#2e1f15]/10 p-4"
          >
            <span className="text-sm font-medium text-[#2e1f15]">
              {selectedProducts.size} product(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('unpublish')}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
              >
                Unpublish
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="ml-auto text-sm text-neutral-500 hover:text-neutral-700"
            >
              Clear selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
                <th className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15] focus:ring-[#2e1f15]"
                  />
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Product
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <button className="flex items-center gap-1 hover:text-neutral-900">
                    Inventory <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Category
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Price
                </th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><div className="h-4 w-4 animate-pulse rounded bg-neutral-200" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 animate-pulse rounded-xl bg-neutral-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                          <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="h-6 w-16 animate-pulse rounded-full bg-neutral-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-12 animate-pulse rounded bg-neutral-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 animate-pulse rounded bg-neutral-200" /></td>
                    <td className="px-4 py-4"><div className="ml-auto h-4 w-16 animate-pulse rounded bg-neutral-200" /></td>
                    <td className="px-4 py-4"><div className="ml-auto h-8 w-8 animate-pulse rounded bg-neutral-200" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-neutral-300" />
                    <p className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">No products found</p>
                    <p className="mt-1 text-neutral-500">Get started by adding your first product</p>
                    <Link
                      href="/admin/products/new"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2e1f15] px-4 py-2 text-sm font-medium text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const price = product.variants?.[0]?.price || 0
                  const compareAtPrice = product.variants?.[0]?.compareAtPrice
                  const inventory = product.variants?.reduce((sum, v) => sum + (v.inventoryQty || 0), 0) || 0
                  
                  return (
                    <tr key={product._id} className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.handle)}
                          onChange={() => toggleSelect(product.handle)}
                          className="h-4 w-4 rounded border-neutral-300 text-[#2e1f15] focus:ring-[#2e1f15]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-neutral-100">
                            {product.images?.[0]?.src ? (
                              <Image
                                src={product.images[0].src}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="absolute inset-0 m-auto h-6 w-6 text-neutral-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product.handle}`}
                              className="font-medium text-neutral-900 hover:text-[#2e1f15] dark:text-white"
                            >
                              {product.title}
                            </Link>
                            <p className="text-sm text-neutral-500">{product.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : product.status === 'draft'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {product.status === 'active' ? (
                            <><Check className="h-3 w-3" /> Active</>
                          ) : product.status === 'draft' ? (
                            <><X className="h-3 w-3" /> Draft</>
                          ) : (
                            <><Archive className="h-3 w-3" /> Archived</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`font-medium ${
                            inventory === 0
                              ? 'text-red-600'
                              : inventory < 10
                              ? 'text-amber-600'
                              : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {inventory} in stock
                        </span>
                        {inventory < 10 && inventory > 0 && (
                          <span className="ml-2 text-xs text-amber-500">Low stock</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                          {product.productCategory || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            ₹{price.toLocaleString()}
                          </span>
                          {compareAtPrice && compareAtPrice > price && (
                            <span className="ml-2 text-sm text-neutral-400 line-through">
                              ₹{compareAtPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === product._id ? null : product._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          <AnimatePresence>
                            {actionMenuOpen === product._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl bg-white py-2 shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700"
                              >
                                <Link
                                  href={`/admin/products/${product.handle}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                >
                                  <Edit className="h-4 w-4" /> Edit
                                </Link>
                                <Link
                                  href={`/products/${product.handle}`}
                                  target="_blank"
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                >
                                  <Eye className="h-4 w-4" /> View
                                </Link>
                                <button
                                  onClick={() => handleDuplicate(product.handle)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                >
                                  <Copy className="h-4 w-4" /> Duplicate
                                </button>
                                <hr className="my-2 border-neutral-200 dark:border-neutral-700" />
                                <button
                                  onClick={() => setDeleteConfirm(product.handle)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-4 dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              Showing {(currentPage - 1) * productsPerPage + 1} to{' '}
              {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-50 dark:border-neutral-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                    currentPage === i + 1
                      ? 'bg-[#2e1f15] text-white'
                      : 'border border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 disabled:opacity-50 dark:border-neutral-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Delete Product</h3>
              <p className="mt-2 text-neutral-500">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setActionMenuOpen(null)} />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          fetchProducts()
          setShowImportModal(false)
        }}
      />
    </div>
  )
}
