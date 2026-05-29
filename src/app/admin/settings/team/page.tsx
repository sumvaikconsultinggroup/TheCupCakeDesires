'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminAuth } from '@/context/AdminAuthContext'
import toast from 'react-hot-toast'
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Edit,
  Trash2,
  X,
  Loader2,
  Crown,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  CreditCard,
  PanelTop,
  Home,
  Video,
  Menu,
  Newspaper,
  MessageSquare,
  Tag,
  Sparkles,
  Package,
  FolderOpen,
  Boxes,
  Percent,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Globe
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'staff'
  avatar?: string
  status: 'active' | 'invited'
  lastActive?: string
  permissions: string[]
}

const routePermissions = [
  { route: '/admin', label: 'Dashboard', icon: LayoutDashboard, category: 'Core' },
  { route: '/admin/orders', label: 'All Orders', icon: ShoppingCart, category: 'Orders' },
  { route: '/admin/payments', label: 'Payments', icon: CreditCard, category: 'Orders' },
  { route: '/admin/homepage', label: 'Homepage Builder', icon: Home, category: 'Storefront' },
  { route: '/admin/videos', label: 'Video Reels', icon: Video, category: 'Storefront' },
  { route: '/admin/navigation', label: 'Navigation', icon: Menu, category: 'Storefront' },
  { route: '/admin/blog', label: 'Blog', icon: Newspaper, category: 'Storefront' },
  { route: '/admin/reviews', label: 'Reviews', icon: MessageSquare, category: 'Storefront' },
  { route: '/admin/combos', label: 'Combos', icon: Tag, category: 'Storefront' },
  { route: '/admin/recommendations', label: 'Recommendations', icon: Sparkles, category: 'Storefront' },
  { route: '/admin/products', label: 'Products', icon: Package, category: 'Catalog' },
  { route: '/admin/collections', label: 'Collections', icon: FolderOpen, category: 'Catalog' },
  { route: '/admin/bundles', label: 'Bundle Offers', icon: Tag, category: 'Catalog' },
  { route: '/admin/inventory', label: 'Inventory', icon: Boxes, category: 'Catalog' },
  { route: '/admin/customers', label: 'Customers', icon: Users, category: 'Customers' },
  { route: '/admin/discounts', label: 'Discounts', icon: Percent, category: 'Marketing' },
  { route: '/admin/analytics', label: 'Analytics Overview', icon: BarChart3, category: 'Analytics' },
  { route: '/admin/reports', label: 'Reports', icon: FileText, category: 'Analytics' },
  { route: '/admin/finance', label: 'Finance', icon: CreditCard, category: 'Analytics' },
  { route: '/admin/analytics/live-activity', label: 'Live Activity', icon: Users, category: 'Analytics' },
  { route: '/admin/analytics/abandoned-carts', label: 'Abandoned Carts', icon: ShoppingCart, category: 'Analytics' },
  { route: '/admin/settings', label: 'Settings', icon: SettingsIcon, category: 'Settings' },
  { route: '/admin/product-auth', label: 'Product Authentication', icon: Shield, category: 'Settings' },
  { route: '/admin/seo', label: 'SEO', icon: Globe, category: 'SEO' },
]

const categories = ['Core', 'Orders', 'Storefront', 'Catalog', 'Customers', 'Marketing', 'Analytics', 'Settings', 'SEO']

export default function TeamPage() {
  const { user: currentAdminUser } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('staff')
  const [inviting, setInviting] = useState(false)

  // Edit form state
  const [editRole, setEditRole] = useState('')
  const [editPermissions, setEditPermissions] = useState<string[]>([])

  const isOwner = currentAdminUser?.role === 'owner'

  useEffect(() => {
    if (currentAdminUser) {
      fetchMembers()
    }
  }, [currentAdminUser])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/team')
      const data = await response.json()

      if (data.success) {
        setMembers(data.members)
      } else {
        toast.error(data.message || 'Failed to load team members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!isOwner) {
      toast.error('Only owners can invite team members')
      return
    }

    if (!inviteEmail) {
      toast.error('Please enter an email address')
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Invitation sent successfully!')
        setMembers([...members, data.member])
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteName('')
        setInviteRole('staff')
      } else {
        toast.error(data.message || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      toast.error('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateMember = async () => {
    if (!isOwner || !editingMember) return

    try {
      const response = await fetch(`/api/admin/team/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Member updated successfully')
        fetchMembers()
        setShowEditModal(false)
        setEditingMember(null)
      } else {
        toast.error(data.message || 'Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update member')
    }
  }

  const handleUpdatePermissions = async () => {
    if (!isOwner || !editingMember) return

    try {
      const response = await fetch(`/api/admin/team/${editingMember.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: editPermissions,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Permissions updated successfully')
        fetchMembers()
        setShowPermissionsModal(false)
        setEditingMember(null)
      } else {
        toast.error(data.message || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    }
  }

  const handleDeleteMember = async (member: TeamMember) => {
    if (!isOwner) {
      toast.error('Only owners can remove team members')
      return
    }

    if (member.role === 'owner') {
      toast.error('Cannot remove owner account')
      return
    }

    if (!confirm(`Are you sure you want to remove ${member.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/team/${member.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Member removed successfully')
        setMembers(members.filter(m => m.id !== member.id))
      } else {
        toast.error(data.message || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setEditRole(member.role)
    setShowEditModal(true)
  }

  const openPermissionsModal = (member: TeamMember) => {
    setEditingMember(member)
    setEditPermissions(member.permissions)
    setShowPermissionsModal(true)
  }

  const togglePermission = (route: string) => {
    setEditPermissions(prev =>
      prev.includes(route) ? prev.filter(p => p !== route) : [...prev, route]
    )
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const selectAllInCategory = (category: string) => {
    const categoryRoutes = routePermissions.filter(p => p.category === category).map(p => p.route)
    const allSelected = categoryRoutes.every(route => editPermissions.includes(route))
    
    if (allSelected) {
      setEditPermissions(prev => prev.filter(p => !categoryRoutes.includes(p)))
    } else {
      setEditPermissions(prev => [...new Set([...prev, ...categoryRoutes])])
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
      case 'admin':
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
      case 'staff':
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
      default:
        return 'bg-neutral-50 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        )
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Invited
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Loading team members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Light Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
        <div className="relative p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-100 p-3 dark:bg-indigo-900/30">
                <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Team Management</h1>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Manage your team members and permissions</p>
              </div>
            </div>
            {isOwner && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite Member
              </motion.button>
            )}
          </div>
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Total Members</p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{members.length}</p>
            </div>
            <div className="rounded-xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Active</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{members.filter(m => m.status === 'active').length}</p>
            </div>
            <div className="rounded-xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 p-4">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Invited</p>
              <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{members.filter(m => m.status === 'invited').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-xl bg-white border border-neutral-200 p-5 hover:shadow-lg transition-all dark:bg-neutral-800 dark:border-neutral-700"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white truncate">{member.name}</h3>
                  {member.role === 'owner' && (
                    <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${getRoleColor(member.role)}`}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
              {getStatusBadge(member.status)}
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              <span>Last active</span>
              <span className="font-medium">{member.lastActive || 'Never'}</span>
            </div>

            <div className="flex items-center justify-between text-xs mb-4">
              <span className="text-neutral-500 dark:text-neutral-400">Permissions</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{member.permissions.length} routes</span>
            </div>

            {isOwner && member.role !== 'owner' && (
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(member)}
                  className="flex-1 rounded-lg bg-neutral-50 border border-neutral-200 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600"
                >
                  <Edit className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => openPermissionsModal(member)}
                  className="flex-1 rounded-lg bg-blue-50 border border-blue-200 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                >
                  <Shield className="mx-auto h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteMember(member)}
                  className="flex-1 rounded-lg bg-red-50 border border-red-200 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                >
                  <Trash2 className="mx-auto h-4 w-4" />
                </button>
              </div>
            )}

            {member.role === 'owner' && isOwner && (
              <button
                onClick={() => openPermissionsModal(member)}
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                View Permissions
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 p-6 shadow-xl dark:bg-neutral-800 dark:border-neutral-700"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Invite Team Member</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Send an invitation to join your team</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30"
                  >
                    <option value="admin">Admin - Full access except settings</option>
                    <option value="staff">Staff - Limited access</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 p-6 shadow-xl dark:bg-neutral-800 dark:border-neutral-700"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Edit Role</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Change member's role and access level</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 dark:bg-neutral-900 dark:border-neutral-700">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Member</p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-white">{editingMember.name}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{editingMember.email}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Select Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/30"
                  >
                    <option value="admin">Admin - Full access except settings</option>
                    <option value="staff">Staff - Limited access</option>
                  </select>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleUpdateMember}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Update Role
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && editingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowPermissionsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white border border-neutral-200 shadow-xl dark:bg-neutral-800 dark:border-neutral-700"
            >
              {/* Header */}
              <div className="border-b border-neutral-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Access Control</h3>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {editingMember.name} • {editingMember.role.charAt(0).toUpperCase() + editingMember.role.slice(1)}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/60 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      <Shield className="h-3.5 w-3.5" />
                      {editPermissions.length} / {routePermissions.length} routes enabled
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-900/60 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {editingMember.role === 'owner' && !isOwner ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Shield className="mx-auto h-14 w-14 text-neutral-300 dark:text-neutral-600" />
                    <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">Protected Account</p>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">You cannot modify owner permissions</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Scrollable content */}
                  <div className="max-h-[calc(90vh-220px)] overflow-y-auto p-6">
                    <div className="space-y-3">
                      {categories.map((category) => {
                        const categoryPerms = routePermissions.filter(p => p.category === category)
                        const selectedCount = categoryPerms.filter(p => editPermissions.includes(p.route)).length
                        const allSelected = selectedCount === categoryPerms.length
                        const isExpanded = expandedCategories.includes(category)

                        return (
                          <div
                            key={category}
                            className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                          >
                            {/* Category Header */}
                            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/50">
                              <button
                                onClick={() => toggleCategory(category)}
                                className="flex flex-1 items-center gap-2.5"
                              >
                                <motion.div
                                  animate={{ rotate: isExpanded ? 90 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                                </motion.div>
                                <div className="text-left">
                                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{category}</h4>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {selectedCount} of {categoryPerms.length} enabled
                                  </p>
                                </div>
                              </button>
                              <button
                                onClick={() => selectAllInCategory(category)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                  allSelected
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
                                }`}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>

                            {/* Category Routes */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-neutral-200 dark:border-neutral-700"
                                >
                                  <div className="grid gap-2 p-3 sm:grid-cols-2">
                                    {categoryPerms.map((perm) => {
                                      const isChecked = editPermissions.includes(perm.route)
                                      const Icon = perm.icon

                                      return (
                                        <label
                                          key={perm.route}
                                          className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 transition-all ${
                                            isChecked
                                              ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
                                              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50'
                                          }`}
                                        >
                                          <div className="relative shrink-0">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => togglePermission(perm.route)}
                                              className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-neutral-300 transition-all checked:border-indigo-600 checked:bg-indigo-600 dark:border-neutral-600 dark:checked:border-indigo-500 dark:checked:bg-indigo-500"
                                            />
                                            <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                                          </div>
                                          <Icon className={`h-4 w-4 shrink-0 ${isChecked ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium ${isChecked ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                              {perm.label}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">{perm.route}</p>
                                          </div>
                                        </label>
                                      )
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPermissionsModal(false)}
                        className="flex-1 rounded-lg border border-neutral-300 bg-white py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleUpdatePermissions}
                        className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        Save Permissions
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}