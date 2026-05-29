'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminAuth } from '@/context/AdminAuthContext'
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Mail,
  Calendar,
  Clock,
  X,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Crown,
  Users,
} from 'lucide-react'

interface StaffMember {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'staff'
  permissions: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

const PERMISSION_GROUPS = {
  products: ['products.view', 'products.create', 'products.edit', 'products.delete'],
  orders: ['orders.view', 'orders.edit', 'orders.fulfill'],
  customers: ['customers.view', 'customers.edit'],
  discounts: ['discounts.view', 'discounts.create', 'discounts.edit', 'discounts.delete'],
  analytics: ['analytics.view'],
  settings: ['settings.view', 'settings.edit'],
  staff: ['staff.view', 'staff.invite', 'staff.edit', 'staff.delete'],
}

const PERMISSION_LABELS: Record<string, string> = {
  'products.view': 'View products',
  'products.create': 'Create products',
  'products.edit': 'Edit products',
  'products.delete': 'Delete products',
  'orders.view': 'View orders',
  'orders.edit': 'Edit orders',
  'orders.fulfill': 'Fulfill orders',
  'customers.view': 'View customers',
  'customers.edit': 'Edit customers',
  'discounts.view': 'View discounts',
  'discounts.create': 'Create discounts',
  'discounts.edit': 'Edit discounts',
  'discounts.delete': 'Delete discounts',
  'analytics.view': 'View analytics',
  'settings.view': 'View settings',
  'settings.edit': 'Edit settings',
  'staff.view': 'View staff',
  'staff.invite': 'Invite staff',
  'staff.edit': 'Edit staff',
  'staff.delete': 'Delete staff',
}

export default function StaffPage() {
  const { user, hasPermission } = useAdminAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'staff' as 'admin' | 'staff',
    permissions: [] as string[],
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/staff')
      const data = await res.json()
      if (data.success) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        setInviteResult({ email: data.staff.email, tempPassword: data.staff.tempPassword })
        fetchStaff()
        setFormData({ email: '', name: '', role: 'staff', permissions: [], isActive: true })
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to invite staff member' })
    }
    setSaving(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Staff updated successfully' })
        setShowEditModal(false)
        fetchStaff()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update staff' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return

    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Staff member removed' })
        fetchStaff()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete staff' })
    }
  }

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      const data = await res.json()

      if (data.success) {
        fetchStaff()
      }
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      email: member.email,
      name: member.name,
      role: member.role === 'owner' ? 'admin' : member.role,
      permissions: member.permissions,
      isActive: member.isActive,
    })
    setShowEditModal(true)
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: 'Copied to clipboard!' })
    setTimeout(() => setMessage(null), 2000)
  }

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const roleIcons = {
    owner: Crown,
    admin: ShieldCheck,
    staff: Shield,
  }

  const roleColors = {
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-purple-100 text-purple-700',
    staff: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Staff</h1>
          <p className="text-neutral-500">Manage your team and permissions</p>
        </div>
        {hasPermission('staff.invite') && (
          <button
            onClick={() => { setShowInviteModal(true); setInviteResult(null) }}
            className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1B198F]/90"
          >
            <UserPlus className="h-4 w-4" />
            Invite Staff
          </button>
        )}
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
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B198F]/10">
              <Users className="h-6 w-6 text-[#1B198F]" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Staff</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{staff.length}</p>
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
              <p className="text-2xl font-bold text-green-600">{staff.filter(s => s.isActive).length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <ShieldCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Admins</p>
              <p className="text-2xl font-bold text-purple-600">
                {staff.filter(s => s.role === 'admin' || s.role === 'owner').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 outline-none transition-all focus:border-[#1B198F] focus:ring-2 focus:ring-[#1B198F]/20 dark:border-neutral-700 dark:bg-neutral-800"
        />
      </div>

      {/* Staff List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
          ))
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-500">
            No staff members found
          </div>
        ) : (
          filteredStaff.map((member) => {
            const RoleIcon = roleIcons[member.role]
            const isCurrentUser = user?.id === member.id
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B198F]/10 text-lg font-bold text-[#1B198F]">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {member.name}
                        {isCurrentUser && <span className="ml-2 text-xs text-neutral-400">(You)</span>}
                      </p>
                      <p className="text-sm text-neutral-500">{member.email}</p>
                    </div>
                  </div>
                  {!isCurrentUser && member.role !== 'owner' && hasPermission('staff.edit') && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-[#1B198F]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {hasPermission('staff.delete') && (
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[member.role]}`}>
                    <RoleIcon className="h-3.5 w-3.5" />
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    member.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 space-y-1 text-sm text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </div>
                  {member.lastLogin && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Last login: {new Date(member.lastLogin).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {!isCurrentUser && member.role !== 'owner' && hasPermission('staff.edit') && (
                  <button
                    onClick={() => handleToggleActive(member)}
                    className={`mt-4 w-full rounded-xl py-2 text-sm font-medium transition-colors ${
                      member.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 p-6 dark:border-neutral-700">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Invite Staff Member</h2>
                <button onClick={() => setShowInviteModal(false)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {inviteResult ? (
                <div className="p-6 space-y-4">
                  <div className="rounded-xl bg-green-50 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-2 font-semibold text-green-800">Staff Invited Successfully!</h3>
                    <p className="text-sm text-green-600">Share these credentials with the new staff member</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={inviteResult.email}
                          readOnly
                          className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(inviteResult.email)}
                          className="rounded-lg p-2 hover:bg-neutral-100"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Temporary Password</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={inviteResult.tempPassword}
                          readOnly
                          className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(inviteResult.tempPassword)}
                          className="rounded-lg p-2 hover:bg-neutral-100"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowInviteModal(false); setInviteResult(null) }}
                    className="w-full rounded-xl bg-[#1B198F] py-3 font-medium text-white hover:bg-[#1B198F]/90"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Staff member name"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="staff@gibbonnutrition.com"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <option value="staff">Staff</option>
                      {user?.role === 'owner' && <option value="admin">Admin</option>}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 rounded-xl border border-neutral-200 py-3 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B198F] py-3 font-medium text-white hover:bg-[#1B198F]/90 disabled:opacity-50"
                    >
                      {saving ? 'Inviting...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 p-6 dark:border-neutral-700">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Edit Staff Member</h2>
                <button onClick={() => setShowEditModal(false)} className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#1B198F] dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="staff">Staff</option>
                    {user?.role === 'owner' && <option value="admin">Admin</option>}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Permissions</label>
                  <div className="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                      <div key={group}>
                        <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {permissions.map(perm => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => togglePermission(perm)}
                              className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                                formData.permissions.includes(perm)
                                  ? 'bg-[#1B198F] text-white'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {PERMISSION_LABELS[perm]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formData.isActive ? 'bg-[#1B198F]' : 'bg-neutral-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      formData.isActive ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </button>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 rounded-xl border border-neutral-200 py-3 font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B198F] py-3 font-medium text-white hover:bg-[#1B198F]/90 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
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
