'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Bell,
  Mail,
  MessageSquare,
  Tag,
  Users,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Clock,
  Activity,
  Filter,
  ArrowRight,
} from 'lucide-react'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: {
    type: string
    label: string
    icon: React.ElementType
  }
  conditions: {
    field: string
    operator: string
    value: string
  }[]
  actions: {
    type: string
    label: string
    config: Record<string, any>
  }[]
  isActive: boolean
  runCount: number
  lastRun?: string
  createdAt: string
}

const triggerTypes = [
  { type: 'order.created', label: 'Order Created', icon: ShoppingCart },
  { type: 'order.paid', label: 'Payment Received', icon: CreditCard },
  { type: 'order.fulfilled', label: 'Order Fulfilled', icon: Package },
  { type: 'shipment.delivered', label: 'Shipment Delivered', icon: Truck },
  { type: 'shipment.exception', label: 'Shipping Exception', icon: AlertTriangle },
  { type: 'payment.failed', label: 'Payment Failed', icon: CreditCard },
  { type: 'inventory.low', label: 'Low Stock Alert', icon: Package },
  { type: 'customer.created', label: 'New Customer', icon: Users },
]

const actionTypes = [
  { type: 'email.send', label: 'Send Email', icon: Mail },
  { type: 'whatsapp.send', label: 'Send WhatsApp', icon: MessageSquare },
  { type: 'notification.send', label: 'Send Notification', icon: Bell },
  { type: 'order.tag', label: 'Add Order Tag', icon: Tag },
  { type: 'order.status', label: 'Change Order Status', icon: ShoppingCart },
  { type: 'staff.assign', label: 'Assign to Staff', icon: Users },
]

export default function AutomationPage() {
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'COD Order Confirmation',
      description: 'Send WhatsApp confirmation for COD orders above ₹1000',
      trigger: { type: 'order.created', label: 'Order Created', icon: ShoppingCart },
      conditions: [
        { field: 'paymentMethod', operator: 'equals', value: 'cod' },
        { field: 'totalAmount', operator: 'greaterThan', value: '1000' },
      ],
      actions: [
        { type: 'whatsapp.send', label: 'Send WhatsApp', config: { template: 'cod_confirmation' } },
        { type: 'order.tag', label: 'Add Order Tag', config: { tag: 'high-value-cod' } },
      ],
      isActive: true,
      runCount: 156,
      lastRun: '2 hours ago',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Failed Payment Follow-up',
      description: 'Send recovery email when payment fails',
      trigger: { type: 'payment.failed', label: 'Payment Failed', icon: CreditCard },
      conditions: [],
      actions: [
        { type: 'email.send', label: 'Send Email', config: { template: 'payment_failed' } },
        { type: 'notification.send', label: 'Send Notification', config: { channel: 'slack' } },
      ],
      isActive: true,
      runCount: 23,
      lastRun: '1 day ago',
      createdAt: '2024-01-10',
    },
    {
      id: '3',
      name: 'Delivery Confirmation',
      description: 'Send thank you message after delivery',
      trigger: { type: 'shipment.delivered', label: 'Shipment Delivered', icon: Truck },
      conditions: [],
      actions: [
        { type: 'whatsapp.send', label: 'Send WhatsApp', config: { template: 'delivery_thanks' } },
      ],
      isActive: false,
      runCount: 89,
      lastRun: '5 days ago',
      createdAt: '2024-01-05',
    },
    {
      id: '4',
      name: 'Low Stock Alert',
      description: 'Notify team when inventory drops below threshold',
      trigger: { type: 'inventory.low', label: 'Low Stock Alert', icon: Package },
      conditions: [
        { field: 'inventoryQty', operator: 'lessThan', value: '10' },
      ],
      actions: [
        { type: 'notification.send', label: 'Send Notification', config: { channel: 'email' } },
        { type: 'staff.assign', label: 'Assign to Staff', config: { role: 'inventory_manager' } },
      ],
      isActive: true,
      runCount: 12,
      lastRun: '3 hours ago',
      createdAt: '2024-01-20',
    },
  ])

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, isActive: !rule.isActive } : rule))
    )
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B198F]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-[#1B198F]" />
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Automation</h1>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
              Beta
            </span>
          </div>
          <p className="text-neutral-500">Automate repetitive tasks with powerful rules</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1B198F]/90"
        >
          <Plus className="h-4 w-4" />
          Create Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B198F]/10">
              <Zap className="h-5 w-5 text-[#1B198F]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{rules.length}</p>
              <p className="text-sm text-neutral-500">Total Rules</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {rules.filter((r) => r.isActive).length}
              </p>
              <p className="text-sm text-neutral-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {rules.reduce((sum, r) => sum + r.runCount, 0)}
              </p>
              <p className="text-sm text-neutral-500">Total Runs</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">2h</p>
              <p className="text-sm text-neutral-500">Last Run</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Triggers */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1B198F]/5 to-purple-500/5 p-5 dark:from-[#1B198F]/10 dark:to-purple-500/10">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Available Triggers</h3>
        <div className="flex flex-wrap gap-2">
          {triggerTypes.map((trigger) => (
            <span
              key={trigger.type}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm dark:bg-neutral-800 dark:text-neutral-300"
            >
              <trigger.icon className="h-3.5 w-3.5 text-[#1B198F]" />
              {trigger.label}
            </span>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <motion.div
            key={rule.id}
            layout
            className={`rounded-2xl bg-white p-5 shadow-sm transition-all dark:bg-neutral-800 ${
              !rule.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    rule.isActive
                      ? 'bg-[#1B198F]/10 text-[#1B198F]'
                      : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-700'
                  }`}
                >
                  <rule.trigger.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{rule.name}</h3>
                    {rule.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-neutral-700">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">{rule.description}</p>

                  {/* Rule Flow */}
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <rule.trigger.icon className="h-3 w-3" />
                      {rule.trigger.label}
                    </span>
                    {rule.conditions.length > 0 && (
                      <>
                        <ArrowRight className="h-4 w-4 text-neutral-300" />
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Filter className="h-3 w-3" />
                          {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                    <ArrowRight className="h-4 w-4 text-neutral-300" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Zap className="h-3 w-3" />
                      {rule.actions.length} action{rule.actions.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" />
                      {rule.runCount} runs
                    </span>
                    {rule.lastRun && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Last: {rule.lastRun}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`rounded-lg p-2 transition-colors ${
                    rule.isActive
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                      : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                  title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                >
                  {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                  title="Edit rule"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700"
                  title="Duplicate rule"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  title="Delete rule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {rules.length === 0 && (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm dark:bg-neutral-800">
          <Zap className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
            No automation rules yet
          </h3>
          <p className="mt-2 text-neutral-500">Create your first rule to automate repetitive tasks</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1B198F] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Create Rule
          </button>
        </div>
      )}
    </div>
  )
}
