'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Edit2, Trash2, Save, X, Search,
  ChevronDown, ChevronUp, GripVertical, CheckCircle,
  MessageSquare, FolderOpen, Eye, EyeOff, Loader2
} from 'lucide-react'

interface FAQCategory {
  _id: string
  name: string
  order: number
  isActive: boolean
}

interface FAQ {
  _id: string
  question: string
  answer: string
  category: FAQCategory | string
  order: number
  isActive: boolean
}

export default function FAQsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth()
  const router = useRouter()

  const [categories, setCategories] = useState<FAQCategory[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'faqs' | 'categories'>('faqs')

  // Modals
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)

  // Forms
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    isActive: true
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    order: 0,
    isActive: true
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [catRes, faqRes] = await Promise.all([
        fetch('/api/admin/faq-categories'),
        fetch('/api/admin/faqs')
      ])

      const catData = await catRes.json()
      const faqData = await faqRes.json()

      if (catData.success) setCategories(catData.data)
      if (faqData.success) setFaqs(faqData.data)
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
    if (isAuthenticated) fetchData()
  }, [isAuthenticated, fetchData])

  // FAQ CRUD
  const saveFAQ = async () => {
    if (!faqForm.question || !faqForm.answer || !faqForm.category) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await fetch('/api/admin/faqs', {
        method: editingFAQ ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFAQ ? { ...faqForm, _id: editingFAQ._id } : faqForm)
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingFAQ ? 'FAQ updated' : 'FAQ created')
        setShowFAQModal(false)
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to save FAQ')
    }
  }

  const deleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('FAQ deleted')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete FAQ')
    }
  }

  // Category CRUD
  const saveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Please enter category name')
      return
    }

    try {
      const res = await fetch('/api/admin/faq-categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory ? { ...categoryForm, _id: editingCategory._id } : categoryForm)
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created')
        setShowCategoryModal(false)
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to save category')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure? This will not delete FAQs in this category, but they will lose their reference.')) return
    try {
      const res = await fetch(`/api/admin/faq-categories?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Category deleted')
        fetchData()
      }
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  const openFAQModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq)
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        category: typeof faq.category === 'string' ? faq.category : faq.category._id,
        order: faq.order,
        isActive: faq.isActive
      })
    } else {
      setEditingFAQ(null)
      setFaqForm({ question: '', answer: '', category: categories[0]?._id || '', order: 0, isActive: true })
    }
    setShowFAQModal(true)
  }

  const openCategoryModal = (cat?: FAQCategory) => {
    if (cat) {
      setEditingCategory(cat)
      setCategoryForm({ name: cat.name, order: cat.order, isActive: cat.isActive })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', order: 0, isActive: true })
    }
    setShowCategoryModal(true)
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#2e1f15]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6 dark:bg-neutral-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FAQ Management</h1>
          <p className="text-neutral-500">Manage FAQs and Categories for your storefront</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
          <button
            onClick={() => openFAQModal()}
            className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2e1f15]/90"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all ${
            activeTab === 'faqs' ? 'border-b-2 border-[#2e1f15] text-[#2e1f15]' : 'text-neutral-500'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          FAQs ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all ${
            activeTab === 'categories' ? 'border-b-2 border-[#2e1f15] text-[#2e1f15]' : 'text-neutral-500'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'faqs' ? (
        <div className="grid gap-4">
          {faqs.map((faq) => (
            <div key={faq._id} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{faq.question}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{faq.answer}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-[#2e1f15]/10 px-2 py-0.5 text-xs font-medium text-[#2e1f15]">
                      {typeof faq.category === 'object' ? faq.category.name : 'Uncategorized'}
                    </span>
                    {!faq.isActive && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Inactive</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openFAQModal(faq)} className="rounded-lg p-2 hover:bg-neutral-100"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteFAQ(faq._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div>
                <h3 className="font-bold">{cat.name}</h3>
                <p className="text-xs text-neutral-500">Order: {cat.order}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openCategoryModal(cat)} className="rounded-lg p-2 hover:bg-neutral-100"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => deleteCategory(cat._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFAQModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-neutral-800">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingFAQ ? 'Edit FAQ' : 'Add FAQ'}</h2>
                <button onClick={() => setShowFAQModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Question</label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 outline-none focus:border-[#2e1f15]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Answer</label>
                  <textarea
                    rows={4}
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 outline-none focus:border-[#2e1f15]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      className="w-full rounded-lg border border-neutral-200 p-2 outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Order</label>
                    <input
                      type="number"
                      value={faqForm.order}
                      onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-neutral-200 p-2 outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={faqForm.isActive}
                    onChange={(e) => setFaqForm({ ...faqForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowFAQModal(false)} className="rounded-lg px-4 py-2 font-medium hover:bg-neutral-100">Cancel</button>
                <button onClick={saveFAQ} className="rounded-lg bg-[#2e1f15] px-6 py-2 font-bold text-white hover:bg-[#2e1f15]/90">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-800">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setShowCategoryModal(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full rounded-lg border border-neutral-200 p-2 outline-none focus:border-[#2e1f15]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Order</label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-neutral-200 p-2 outline-none"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowCategoryModal(false)} className="rounded-lg px-4 py-2 font-medium hover:bg-neutral-100">Cancel</button>
                <button onClick={saveCategory} className="rounded-lg bg-[#2e1f15] px-6 py-2 font-bold text-white hover:bg-[#2e1f15]/90">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
