'use client'

import { useAdminAuth } from '@/context/AdminAuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  BarChart3,
  Boxes,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Edit,
  FileText,
  FolderOpen,
  Gift,
  Globe,
  Home,
  LayoutDashboard,
  Loader2,
  Mail,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  Percent,
  Settings as SettingsIcon,
  Shield,
  ShoppingCart,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

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
  { route: '/admin/navigation', label: 'Navigation', icon: Menu, category: 'Storefront' },
  { route: '/admin/blog', label: 'Blog', icon: Newspaper, category: 'Storefront' },
  { route: '/admin/reviews', label: 'Reviews', icon: MessageSquare, category: 'Storefront' },
  { route: '/admin/faqs', label: 'FAQs', icon: MessageSquare, category: 'Storefront' },
  { route: '/admin/gift-voucher', label: 'Gift Voucher', icon: Gift, category: 'Storefront' },
  { route: '/admin/products', label: 'Products', icon: Package, category: 'Catalog' },
  { route: '/admin/collections', label: 'Collections', icon: FolderOpen, category: 'Catalog' },
  { route: '/admin/inventory', label: 'Inventory', icon: Boxes, category: 'Catalog' },
  { route: '/admin/customers', label: 'Customers', icon: Users, category: 'Customers' },
  { route: '/admin/discounts', label: 'Discounts', icon: Percent, category: 'Marketing' },
  { route: '/admin/analytics', label: 'Analytics Overview', icon: BarChart3, category: 'Analytics' },
  { route: '/admin/reports', label: 'Reports', icon: FileText, category: 'Analytics' },
  { route: '/admin/finance', label: 'Finance', icon: CreditCard, category: 'Analytics' },
  { route: '/admin/analytics/live-activity', label: 'Live Activity', icon: Users, category: 'Analytics' },
  { route: '/admin/analytics/abandoned-carts', label: 'Abandoned Carts', icon: ShoppingCart, category: 'Analytics' },
  { route: '/admin/settings', label: 'Settings', icon: SettingsIcon, category: 'Settings' },
  { route: '/admin/seo', label: 'SEO', icon: Globe, category: 'SEO' },
]

const categories = ['Core', 'Orders', 'Storefront', 'Catalog', 'Customers', 'Marketing', 'Analytics', 'Settings', 'SEO']

const roleBadgeClass: Record<TeamMember['role'], string> = {
  owner: 'border-rose-200 bg-rose-50 text-rose-700',
  admin: 'border-cocoa/15 bg-cocoa/5 text-cocoa',
  staff: 'border-amber-200 bg-amber-50 text-amber-800',
}

export default function TeamPage() {
  const { user: currentAdminUser } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff')
  const [inviting, setInviting] = useState(false)

  // Edit role form
  const [editRole, setEditRole] = useState<'admin' | 'staff' | 'owner'>('staff')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [savingRole, setSavingRole] = useState(false)

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
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Invitation sent.')
        setMembers([data.member, ...members])
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
    setSavingRole(true)
    try {
      const response = await fetch(`/api/admin/team/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Role updated')
        fetchMembers()
        setShowEditModal(false)
        setEditingMember(null)
      } else {
        toast.error(data.message || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('Failed to update role')
    } finally {
      setSavingRole(false)
    }
  }

  const handleUpdatePermissions = async () => {
    if (!isOwner || !editingMember) return
    setSavingPermissions(true)
    try {
      const response = await fetch(`/api/admin/team/${editingMember.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPermissions }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Permissions saved')
        fetchMembers()
        setShowPermissionsModal(false)
        setEditingMember(null)
      } else {
        toast.error(data.message || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    } finally {
      setSavingPermissions(false)
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
    if (!confirm(`Remove ${member.name} from the team?`)) return
    try {
      const response = await fetch(`/api/admin/team/${member.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        toast.success('Member removed')
        setMembers(members.filter((m) => m.id !== member.id))
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
    setEditPermissions(member.permissions || [])
    setShowPermissionsModal(true)
  }

  const togglePermission = (route: string) =>
    setEditPermissions((prev) =>
      prev.includes(route) ? prev.filter((p) => p !== route) : [...prev, route]
    )

  const toggleCategory = (category: string) =>
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )

  const selectAllInCategory = (category: string) => {
    const categoryRoutes = routePermissions.filter((p) => p.category === category).map((p) => p.route)
    const allSelected = categoryRoutes.every((route) => editPermissions.includes(route))
    if (allSelected) {
      setEditPermissions((prev) => prev.filter((p) => !categoryRoutes.includes(p)))
    } else {
      setEditPermissions((prev) => Array.from(new Set([...prev, ...categoryRoutes])))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">
            Team & Roles
          </h1>
          <p className="text-sm text-neutral-600">
            Invite admins and staff to the CupCake Desires admin panel. Owners can grant or
            revoke access to individual sections from here.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        )}
      </div>

      {/* Stats strip */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Total members', value: members.length, accent: 'bg-cocoa/5 text-cocoa' },
          {
            label: 'Active',
            value: members.filter((m) => m.status === 'active').length,
            accent: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Owners',
            value: members.filter((m) => m.role === 'owner').length,
            accent: 'bg-rose-50 text-rose-700',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {s.label}
            </p>
            <p className={`mt-2 inline-flex items-center rounded-xl px-3 py-1.5 text-xl font-semibold ${s.accent}`}>
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {/* Members list */}
      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="font-bake-display text-[18px] font-medium text-cocoa">Members</h2>
          <p className="text-sm text-neutral-600">
            Each member sees only the routes you grant them.
          </p>
        </div>

        <ul className="divide-y divide-neutral-200">
          {members.length === 0 && (
            <li className="px-6 py-12 text-center text-sm text-neutral-500">
              No team members yet. Invite your first teammate to get started.
            </li>
          )}
          {members.map((member, idx) => (
            <motion.li
              key={member.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.18) }}
              className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cocoa text-base font-semibold text-ivory">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bake-display truncate text-[16px] font-medium text-cocoa">
                      {member.name}
                    </p>
                    {member.role === 'owner' && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-rose-accent" />
                    )}
                  </div>
                  <p className="truncate text-sm text-neutral-500">{member.email}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Last active · {member.lastActive || 'Never'} · {member.permissions.length} permission
                    {member.permissions.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadgeClass[member.role]}`}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>

                {isOwner && (
                  <>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => openEditModal(member)}
                        title="Edit role"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openPermissionsModal(member)}
                      title="Manage permissions"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-cocoa transition hover:border-rose-accent hover:text-rose-accent"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleDeleteMember(member)}
                        title="Remove member"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-red-600 transition hover:border-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* ───────── Invite modal ───────── */}
      <AnimatePresence>
        {showInviteModal && (
          <Modal title="Invite a team member" onClose={() => setShowInviteModal(false)}>
            <div className="space-y-4">
              <Field label="Full name">
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Alex Baker"
                  className={inputCls}
                />
              </Field>
              <Field label="Email address *">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@cupcakedesires.com"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </Field>
              <Field
                label="Role"
                hint="Admin has full panel access except Team & Roles. Staff is read-mostly on orders/products."
              >
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'staff')}
                  className={inputCls}
                >
                  <option value="admin">Admin — full access except settings</option>
                  <option value="staff">Staff — limited access</option>
                </select>
              </Field>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  We&rsquo;ll email a temporary password. Ask them to change it from{' '}
                  <strong>Settings → Forgot / change password</strong> after they sign in.
                </p>
              </div>

              <button
                onClick={handleInvite}
                disabled={!inviteEmail || inviting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {inviting ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ───────── Edit role modal ───────── */}
      <AnimatePresence>
        {showEditModal && editingMember && (
          <Modal title="Change role" onClose={() => setShowEditModal(false)}>
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Member
                </p>
                <p className="mt-1 font-bake-display text-[16px] font-medium text-cocoa">
                  {editingMember.name}
                </p>
                <p className="text-sm text-neutral-600">{editingMember.email}</p>
              </div>

              <Field label="Role">
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className={inputCls}
                >
                  <option value="admin">Admin — full access except settings</option>
                  <option value="staff">Staff — limited access</option>
                </select>
              </Field>

              <p className="text-xs text-neutral-500">
                Changing role resets their permission set to the default for that role. Fine-tune
                from <strong>Manage permissions</strong>.
              </p>

              <button
                onClick={handleUpdateMember}
                disabled={savingRole}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
              >
                {savingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {savingRole ? 'Saving…' : 'Update role'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ───────── Permissions modal ───────── */}
      <AnimatePresence>
        {showPermissionsModal && editingMember && (
          <Modal
            title="Access control"
            subtitle={`${editingMember.name} · ${editingMember.role.charAt(0).toUpperCase()}${editingMember.role.slice(1)}`}
            wide
            onClose={() => setShowPermissionsModal(false)}
          >
            {editingMember.role === 'owner' && !isOwner ? (
              <div className="py-12 text-center">
                <Shield className="mx-auto h-10 w-10 text-neutral-300" />
                <p className="mt-3 font-bake-display text-[18px] font-medium text-cocoa">
                  Protected account
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  You can&rsquo;t modify owner permissions.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2 text-xs text-neutral-600">
                  <Shield className="h-3.5 w-3.5" />
                  {editPermissions.length} / {routePermissions.length} routes enabled
                </div>

                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {categories.map((category) => {
                    const categoryPerms = routePermissions.filter((p) => p.category === category)
                    const selectedCount = categoryPerms.filter((p) =>
                      editPermissions.includes(p.route)
                    ).length
                    const allSelected = selectedCount === categoryPerms.length
                    const isExpanded = expandedCategories.includes(category)

                    return (
                      <div
                        key={category}
                        className="overflow-hidden rounded-xl border border-neutral-200"
                      >
                        <div className="flex items-center justify-between bg-neutral-50 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="h-4 w-4 text-neutral-400" />
                            </motion.div>
                            <div>
                              <p className="text-sm font-medium text-cocoa">{category}</p>
                              <p className="text-xs text-neutral-500">
                                {selectedCount} of {categoryPerms.length} enabled
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => selectAllInCategory(category)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              allSelected
                                ? 'bg-cocoa text-ivory hover:bg-rose-accent'
                                : 'bg-white text-cocoa hover:bg-neutral-100'
                            }`}
                          >
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-neutral-200"
                            >
                              <div className="grid gap-2 p-3 sm:grid-cols-2">
                                {categoryPerms.map((perm) => {
                                  const isChecked = editPermissions.includes(perm.route)
                                  const Icon = perm.icon
                                  return (
                                    <label
                                      key={perm.route}
                                      className={`group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                                        isChecked
                                          ? 'border-rose-accent/40 bg-rose-50'
                                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                                      }`}
                                    >
                                      <div className="relative h-4 w-4 shrink-0">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => togglePermission(perm.route)}
                                          className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-neutral-300 transition checked:border-cocoa checked:bg-cocoa"
                                        />
                                        <Check className="pointer-events-none absolute left-0 top-0 h-4 w-4 p-0.5 text-ivory opacity-0 transition-opacity peer-checked:opacity-100" />
                                      </div>
                                      <Icon
                                        className={`h-4 w-4 shrink-0 ${isChecked ? 'text-rose-accent' : 'text-neutral-400'}`}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`text-sm font-medium ${
                                            isChecked ? 'text-cocoa' : 'text-neutral-600'
                                          }`}
                                        >
                                          {perm.label}
                                        </p>
                                        <p className="truncate text-xs text-neutral-400">{perm.route}</p>
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

                <div className="mt-5 flex gap-3 border-t border-neutral-200 pt-4">
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-cocoa transition hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePermissions}
                    disabled={savingPermissions}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-50"
                  >
                    {savingPermissions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {savingPermissions ? 'Saving…' : 'Save permissions'}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────── Local UI helpers ─────────────────── */

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-cocoa transition focus:border-rose-accent focus:outline-none focus:ring-4 focus:ring-rose-accent/15'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cocoa">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  )
}

function Modal({
  title,
  subtitle,
  wide,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  wide?: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(46,31,21,0.45)]`}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="font-bake-display text-[20px] font-medium text-cocoa">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-cocoa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
