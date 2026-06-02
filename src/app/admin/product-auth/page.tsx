// src/app/admin/product-auth/page.tsx

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  RotateCcw,
  Search,
  Shield,
  Square,
  Trash2,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface AuthCode {
  _id: string
  authCode: string
  isDeleted: boolean
  verificationCount: number
  createdAt: string
}

export default function ProductAuthAdminPage() {
  const [authCodes, setAuthCodes] = useState<AuthCode[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [codesInput, setCodesInput] = useState('')
  const [insertResult, setInsertResult] = useState<{
    total: number
    duplicatesInInput: number
    alreadyExists: number
    inserted: number
  } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showDeleted, setShowDeleted] = useState(false)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deleted: 0,
    totalVerifications: 0,
  })
  const limit = 50

  const fetchAuthCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/product-auth/list?page=${page}&limit=${limit}&showDeleted=${showDeleted}`)
      if (res.ok) {
        const data = await res.json()
        setAuthCodes(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Error fetching auth codes:', error)
      toast.error('Failed to load authentication codes')
    }
    setLoading(false)
  }, [page, showDeleted])

  useEffect(() => {
    fetchAuthCodes()
  }, [fetchAuthCodes])

  const handleBulkInsert = async () => {
    if (!codesInput.trim()) {
      toast.error('Please enter authentication codes')
      return
    }

    setLoading(true)
    setInsertResult(null)

    try {
      const codes = codesInput
        .split(/[\n,\s]+/)
        .map((code) => code.trim())
        .filter((code) => code.length > 0)

      if (codes.length === 0) {
        toast.error('No valid codes found')
        setLoading(false)
        return
      }

      const res = await fetch('/api/product-auth/bulk-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Successfully inserted ${data.stats.inserted} codes!`)
        setInsertResult(data.stats)
        fetchAuthCodes()
        setCodesInput('')
      } else {
        if (data.stats) {
          setInsertResult(data.stats)
        }
        toast.error(data.message || 'Failed to insert codes')
      }
    } catch (error) {
      console.error('Error inserting codes:', error)
      toast.error('Failed to insert codes')
    }
    setLoading(false)
  }

  const handleBulkAction = async (action: 'delete' | 'restore') => {
    if (selectedCodes.length === 0) {
      toast.error('Please select codes first')
      return
    }

    const confirmMessage =
      action === 'delete'
        ? `Are you sure you want to delete ${selectedCodes.length} selected code(s)?`
        : `Are you sure you want to restore ${selectedCodes.length} selected code(s)?`

    if (!confirm(confirmMessage)) return

    setLoading(true)
    try {
      const res = await fetch('/api/product-auth/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, codes: selectedCodes }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setSelectedCodes([])
        fetchAuthCodes()
      } else {
        toast.error(data.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to perform action')
    }
    setLoading(false)
  }

  const handleBulkActionAll = async (action: 'delete' | 'restore') => {
    const confirmMessage =
      action === 'delete'
        ? 'Are you sure you want to delete ALL active codes? This cannot be undone easily.'
        : 'Are you sure you want to restore ALL deleted codes?'

    if (!confirm(confirmMessage)) return

    setLoading(true)
    try {
      const res = await fetch('/api/product-auth/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setSelectedCodes([])
        fetchAuthCodes()
      } else {
        toast.error(data.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to perform action')
    }
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCodesInput(text)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const template = 'AfeT9aHiM\nB7gH3kLmN\nC9jK2pQrS\n# Add your codes here (one per line)'
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'auth-codes-template.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const toggleSelectAll = () => {
    if (selectedCodes.length === filteredCodes.length) {
      setSelectedCodes([])
    } else {
      setSelectedCodes(filteredCodes.map((code) => code.authCode))
    }
  }

  const toggleSelectCode = (authCode: string) => {
    setSelectedCodes((prev) => (prev.includes(authCode) ? prev.filter((c) => c !== authCode) : [...prev, authCode]))
  }

  const filteredCodes = authCodes.filter((code) => code.authCode.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Product Authentication</h1>
          <p className="text-neutral-500">Manage authentication codes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-xl border-2 border-[#2e1f15] bg-white px-4 py-2 font-semibold text-[#2e1f15] hover:bg-[#2e1f15]/5"
          >
            <Download className="h-5 w-5" />
            Template
          </button>
          <button
            onClick={() => {
              setShowModal(true)
              setInsertResult(null)
              setCodesInput('')
            }}
            className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-4 py-2 font-semibold text-white hover:bg-[#2e1f15]/90"
          >
            <Upload className="h-5 w-5" />
            Insert Codes
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Codes', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Deleted', value: stats.deleted },
          { label: 'Total Verifications', value: stats.totalVerifications },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pr-4 pl-12 outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20"
          />
        </div>

        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className={`rounded-xl px-4 py-3 font-semibold transition-all ${
            showDeleted
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          {showDeleted ? 'Show Active' : 'Show Deleted'}
        </button>

        {selectedCodes.length > 0 && (
          <>
            <button
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
            >
              <Trash2 className="h-5 w-5" />
              Delete Selected ({selectedCodes.length})
            </button>
            <button
              onClick={() => handleBulkAction('restore')}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
            >
              <RotateCcw className="h-5 w-5" />
              Restore Selected ({selectedCodes.length})
            </button>
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleBulkActionAll('delete')}
            className="flex items-center gap-2 rounded-xl border-2 border-red-600 bg-white px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </button>
          <button
            onClick={() => handleBulkActionAll('restore')}
            className="flex items-center gap-2 rounded-xl border-2 border-green-600 bg-white px-4 py-3 font-semibold text-green-600 hover:bg-green-50"
          >
            <RotateCcw className="h-4 w-4" />
            Restore All
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-6 py-4 text-left">
                  <button onClick={toggleSelectAll} className="flex items-center gap-2">
                    {selectedCodes.length === filteredCodes.length && filteredCodes.length > 0 ? (
                      <CheckSquare className="h-5 w-5 text-[#2e1f15]" />
                    ) : (
                      <Square className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">Verifications</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-10 animate-pulse rounded bg-neutral-200" />
                    </td>
                  </tr>
                ))
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    {searchQuery
                      ? 'No codes found matching your search'
                      : 'No codes found. Insert codes to get started.'}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code._id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelectCode(code.authCode)}>
                        {selectedCodes.includes(code.authCode) ? (
                          <CheckSquare className="h-5 w-5 text-[#2e1f15]" />
                        ) : (
                          <Square className="h-5 w-5 text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <code className="font-mono font-bold text-[#2e1f15]">{code.authCode}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          code.isDeleted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {code.isDeleted ? 'Deleted' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-neutral-900">{code.verificationCount}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {new Date(code.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-400 ring-1 ring-neutral-300 ring-inset hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-400 ring-1 ring-neutral-300 ring-inset hover:bg-neutral-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Insert Modal - Same as before */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-3xl rounded-2xl bg-white p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-6 text-2xl font-bold text-neutral-900">Bulk Insert Authentication Codes</h2>

              {insertResult ? (
                <div className="space-y-6">
                  <div className="rounded-xl bg-blue-50 p-6">
                    <Shield className="mx-auto mb-3 h-12 w-12 text-blue-600" />
                    <h3 className="mb-4 text-center text-xl font-bold text-blue-900">Insert Complete!</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm text-neutral-600">Total Codes Submitted</p>
                        <p className="text-2xl font-bold text-neutral-900">{insertResult.total}</p>
                      </div>
                      <div className="rounded-lg bg-white p-4">
                        <p className="text-sm text-neutral-600">Successfully Inserted</p>
                        <p className="text-2xl font-bold text-green-600">{insertResult.inserted}</p>
                      </div>
                      {insertResult.duplicatesInInput > 0 && (
                        <div className="rounded-lg bg-white p-4">
                          <p className="text-sm text-neutral-600">Duplicates in Input</p>
                          <p className="text-2xl font-bold text-amber-600">{insertResult.duplicatesInInput}</p>
                        </div>
                      )}
                      {insertResult.alreadyExists > 0 && (
                        <div className="rounded-lg bg-white p-4">
                          <p className="text-sm text-neutral-600">Already in Database</p>
                          <p className="text-2xl font-bold text-orange-600">{insertResult.alreadyExists}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowModal(false)
                      setInsertResult(null)
                      setCodesInput('')
                    }}
                    className="w-full rounded-xl bg-[#2e1f15] px-6 py-3 font-semibold text-white hover:bg-[#2e1f15]/90"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <p className="mb-2 font-semibold">How to insert codes:</p>
                        <ul className="list-inside list-disc space-y-1">
                          <li>Paste codes below (one per line, comma-separated, or space-separated)</li>
                          <li>Or upload a text/CSV file containing codes</li>
                          <li>Codes must be 5-20 characters long</li>
                          <li>Maximum 10,000 codes at once</li>
                          <li>Duplicate codes will be automatically filtered</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-semibold text-neutral-700">Upload File (Optional)</label>
                    <div className="flex gap-2">
                      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 transition-all hover:border-[#2e1f15] hover:bg-blue-50">
                        <FileText className="h-5 w-5 text-neutral-500" />
                        <span className="font-medium text-neutral-700">Choose File (.txt, .csv)</span>
                        <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-semibold text-neutral-700">
                      Authentication Codes
                      <span className="ml-2 text-sm font-normal text-neutral-500">
                        ({codesInput.split(/[\n,\s]+/).filter((c) => c.trim().length > 0).length} codes)
                      </span>
                    </label>
                    <textarea
                      value={codesInput}
                      onChange={(e) => setCodesInput(e.target.value)}
                      placeholder="AfeT9aHiM&#10;B7gH3kLmN&#10;C9jK2pQrS&#10;..."
                      rows={12}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 font-mono text-sm outline-none focus:border-[#2e1f15] focus:ring-2 focus:ring-[#2e1f15]/20"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBulkInsert}
                      disabled={loading || !codesInput.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2e1f15] px-6 py-3 font-semibold text-white hover:bg-[#2e1f15]/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Inserting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          Insert Codes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="rounded-xl border-2 border-neutral-200 px-6 py-3 font-semibold hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
