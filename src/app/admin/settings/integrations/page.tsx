'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Truck,
  MessageSquare,
  Mail,
  BarChart3,
  Database,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Settings,
  Plus,
  RefreshCw,
  Loader2,
  Plug,
  Zap,
  ExternalLink,
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: 'payments' | 'shipping' | 'communication' | 'analytics' | 'erp'
  status: 'connected' | 'disconnected' | 'error'
  href: string
  providers?: { name: string; connected: boolean }[]
}

const integrations: Integration[] = [
  {
    id: 'payments',
    name: 'Payment Gateways',
    description: 'Accept payments via multiple providers with smart routing',
    icon: CreditCard,
    category: 'payments',
    status: 'connected',
    href: '/admin/settings/integrations/payments',
    providers: [
      { name: 'Razorpay', connected: true },
      { name: 'PayU', connected: false },
      { name: 'Stripe', connected: false },
      { name: 'COD', connected: true },
    ],
  },
  {
    id: 'shipping',
    name: 'Shipping Carriers',
    description: 'Multi-carrier shipping with rate shopping and tracking',
    icon: Truck,
    category: 'shipping',
    status: 'connected',
    href: '/admin/settings/integrations/shipping',
    providers: [
      { name: 'Shiprocket', connected: true },
      { name: 'Delhivery', connected: false },
      { name: 'Bluedart', connected: false },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send order updates and marketing messages',
    icon: MessageSquare,
    category: 'communication',
    status: 'disconnected',
    href: '/admin/settings/integrations/whatsapp',
  },
  {
    id: 'email',
    name: 'Email Service',
    description: 'Transactional and marketing emails',
    icon: Mail,
    category: 'communication',
    status: 'connected',
    href: '/admin/settings/integrations/email',
    providers: [
      { name: 'Nodemailer', connected: true },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics & Tracking',
    description: 'Google Analytics, Facebook Pixel, and more',
    icon: BarChart3,
    category: 'analytics',
    status: 'disconnected',
    href: '/admin/settings/integrations/analytics',
  },
  {
    id: 'erp',
    name: 'ERP & Accounting',
    description: 'Sync with Tally, Zoho, QuickBooks',
    icon: Database,
    category: 'erp',
    status: 'disconnected',
    href: '/admin/settings/integrations/erp',
  },
]

const categoryLabels: Record<string, string> = {
  payments: 'Payment Processing',
  shipping: 'Shipping & Fulfillment',
  communication: 'Communication',
  analytics: 'Analytics & Marketing',
  erp: 'Business Tools',
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <Check className="h-3 w-3" />
            Connected
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
            <X className="h-3 w-3" />
            Not Connected
          </span>
        )
    }
  }

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) acc[integration.category] = []
    acc[integration.category].push(integration)
    return acc
  }, {} as Record<string, Integration[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B198F]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Plug className="h-6 w-6 text-[#1B198F]" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Integrations Hub</h2>
          </div>
          <p className="mt-1 text-neutral-500">Connect your store with powerful third-party services</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300">
            <RefreshCw className="h-4 w-4" />
            Sync All
          </button>
        </div>
      </div>

      {/* Integration Health Overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {integrations.filter((i) => i.status === 'connected').length}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">Connected</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700">
              <X className="h-5 w-5 text-neutral-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                {integrations.filter((i) => i.status === 'disconnected').length}
              </p>
              <p className="text-sm text-neutral-500">Available</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {integrations.filter((i) => i.status === 'error').length}
              </p>
              <p className="text-sm text-red-600 dark:text-red-500">Errors</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-purple-50 p-4 dark:bg-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">99.9%</p>
              <p className="text-sm text-purple-600 dark:text-purple-500">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Categories */}
      {Object.entries(groupedIntegrations).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            {categoryLabels[category]}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((integration) => (
              <Link
                key={integration.id}
                href={integration.href}
                className="group rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-neutral-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B198F]/10">
                      <integration.icon className="h-6 w-6 text-[#1B198F]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-white">
                        {integration.name}
                      </h4>
                      <p className="mt-1 text-sm text-neutral-500">{integration.description}</p>
                      {integration.providers && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {integration.providers.map((provider) => (
                            <span
                              key={provider.name}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                                provider.connected
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                              }`}
                            >
                              {provider.connected && <Check className="h-3 w-3" />}
                              {provider.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(integration.status)}
                    <ChevronRight className="h-5 w-5 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-[#1B198F]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
