'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Info,
  Key,
  Loader2,
  Save,
  ShieldCheck,
  Webhook,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getPaymentSettings, updatePaymentSettings } from './payment-actions'

interface EnvState {
  configured: boolean
  webhookConfigured: boolean
  testMode: boolean
  publishableKey: string | null
}

interface StripeSettings {
  enabled: boolean
  supportedMethods: string[]
  statementDescriptor: string
  publishableKeyConfigured: boolean
  webhookConfigured: boolean
  testMode: boolean
}

const ALL_METHODS = [
  { key: 'card', label: 'Cards (Visa, Mastercard, Amex)' },
  { key: 'apple_pay', label: 'Apple Pay' },
  { key: 'google_pay', label: 'Google Pay' },
  { key: 'afterpay_clearpay', label: 'Afterpay' },
  { key: 'link', label: 'Stripe Link (one-tap)' },
]

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-2 w-2 rounded-full ${
        ok ? 'bg-emerald-500' : 'bg-amber-400'
      }`}
      aria-hidden
    />
  )
}

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [envState, setEnvState] = useState<EnvState | null>(null)
  const [stripe, setStripe] = useState<StripeSettings>({
    enabled: true,
    supportedMethods: ['card', 'apple_pay', 'google_pay', 'link'],
    statementDescriptor: 'The Cupcake Desire',
    publishableKeyConfigured: false,
    webhookConfigured: false,
    testMode: true,
  })
  const [taxRate, setTaxRate] = useState(10)
  const [taxInclusive, setTaxInclusive] = useState(true)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100)
  const [defaultShippingCost, setDefaultShippingCost] = useState(9.95)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getPaymentSettings()
        if (res.success && res.settings) {
          const s = res.settings
          setStripe({
            enabled: s.stripe?.enabled ?? true,
            supportedMethods: s.stripe?.supportedMethods ?? ['card'],
            statementDescriptor: s.stripe?.statementDescriptor ?? 'The Cupcake Desire',
            publishableKeyConfigured: s.stripe?.publishableKeyConfigured ?? false,
            webhookConfigured: s.stripe?.webhookConfigured ?? false,
            testMode: s.stripe?.testMode ?? true,
          })
          setTaxRate(s.taxRate ?? 10)
          setTaxInclusive(s.taxInclusive ?? true)
          setFreeShippingThreshold(s.freeShippingThreshold ?? 100)
          setDefaultShippingCost(s.defaultShippingCost ?? 9.95)
          setEnvState(res.envState ?? null)
        } else {
          toast.error(res.message || 'Could not load settings')
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggleMethod = (key: string) => {
    setStripe((prev) => {
      const exists = prev.supportedMethods.includes(key)
      return {
        ...prev,
        supportedMethods: exists
          ? prev.supportedMethods.filter((m) => m !== key)
          : [...prev.supportedMethods, key],
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updatePaymentSettings({
        stripe: {
          enabled: stripe.enabled,
          supportedMethods: stripe.supportedMethods,
          statementDescriptor: stripe.statementDescriptor,
        },
        taxRate,
        taxInclusive,
        freeShippingThreshold,
        defaultShippingCost,
      })
      if (res.success) {
        toast.success(res.message || 'Saved')
      } else {
        toast.error(res.message || 'Could not save')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cocoa" />
      </div>
    )
  }

  const fullyConfigured =
    envState?.configured && envState?.webhookConfigured && stripe.enabled

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-bake-display text-[28px] font-medium text-cocoa">
            Payments · Stripe
          </h1>
          <p className="text-sm text-neutral-600">
            The Cupcake Desire processes every order through Stripe. Operational toggles live here;
            keys + webhook secrets live in{' '}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[12px]">
              .env.local
            </code>
            .
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Live status strip */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                fullyConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bake-display text-[18px] font-medium text-cocoa">
                {fullyConfigured ? 'Stripe is live and ready' : 'Stripe needs configuration'}
              </p>
              <p className="text-sm text-neutral-600">
                {stripe.testMode ? (
                  <>
                    Currently in <span className="font-medium text-cocoa">Test mode</span>{' '}
                    (sk_test_…). Swap to live keys to take real payments.
                  </>
                ) : (
                  <span className="font-medium text-emerald-700">Live mode active.</span>
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
              <Key className="h-4 w-4 text-neutral-500" />
              <StatusDot ok={!!envState?.configured} />
              <span className="font-medium text-neutral-700">Secret key</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
              <CreditCard className="h-4 w-4 text-neutral-500" />
              <StatusDot ok={stripe.publishableKeyConfigured} />
              <span className="font-medium text-neutral-700">Publishable</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
              <Webhook className="h-4 w-4 text-neutral-500" />
              <StatusDot ok={stripe.webhookConfigured} />
              <span className="font-medium text-neutral-700">Webhook</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Env-vars helper */}
      <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">
              Add these to <code className="font-mono">.env.local</code>:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-amber-200 bg-white p-3 text-[12px] leading-relaxed text-neutral-800">
{`STRIPE_SECRET_KEY=sk_test_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…`}
            </pre>
            <p className="mt-2">
              Grab the keys from{' '}
              <Link
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-cocoa underline decoration-rose-accent underline-offset-2 hover:text-rose-accent"
              >
                Stripe Dashboard → API keys <ExternalLink className="h-3 w-3" />
              </Link>{' '}
              and the webhook secret from{' '}
              <Link
                href="https://dashboard.stripe.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-cocoa underline decoration-rose-accent underline-offset-2 hover:text-rose-accent"
              >
                Webhooks <ExternalLink className="h-3 w-3" />
              </Link>{' '}
              (endpoint URL:{' '}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">
                /api/stripe/webhook
              </code>
              ).
            </p>
          </div>
        </div>
      </section>

      {/* Operational settings */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-bake-display mb-1 text-[20px] font-medium text-cocoa">
          Stripe behaviour
        </h2>
        <p className="mb-5 text-sm text-neutral-600">
          What gets offered at checkout and how the line appears on a customer&apos;s statement.
        </p>

        <label className="mb-5 flex items-center gap-3">
          <input
            type="checkbox"
            checked={stripe.enabled}
            onChange={(e) => setStripe({ ...stripe, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-neutral-300 text-cocoa focus:ring-cocoa"
          />
          <span className="text-sm font-medium text-neutral-800">
            Stripe checkout enabled (turn off to pause new payments)
          </span>
        </label>

        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-neutral-800">Payment methods on offer</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALL_METHODS.map((m) => {
              const on = stripe.supportedMethods.includes(m.key)
              return (
                <label
                  key={m.key}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    on
                      ? 'border-cocoa bg-cocoa/5 text-cocoa'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <span>{m.label}</span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => toggleMethod(m.key)}
                  />
                  {on && <CheckCircle2 className="h-4 w-4 text-cocoa" />}
                </label>
              )
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">
            Statement descriptor
          </label>
          <input
            type="text"
            maxLength={22}
            value={stripe.statementDescriptor}
            onChange={(e) =>
              setStripe({ ...stripe, statementDescriptor: e.target.value.toUpperCase() })
            }
            className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm uppercase tracking-wider focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Appears on customer card statements. Max 22 characters, letters and numbers.
          </p>
        </div>
      </section>

      {/* Tax + shipping defaults */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-bake-display mb-1 text-[20px] font-medium text-cocoa">
          Tax &amp; shipping defaults
        </h2>
        <p className="mb-5 text-sm text-neutral-600">
          Used by checkout when calculating line totals.
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">
              GST rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={taxInclusive}
                onChange={(e) => setTaxInclusive(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-cocoa focus:ring-cocoa"
              />
              <span className="text-sm font-medium text-neutral-800">
                Prices include GST
              </span>
            </label>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">
              Free-shipping threshold (AUD)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">
              Standard delivery cost (AUD)
            </label>
            <input
              type="number"
              min="0"
              step="0.05"
              value={defaultShippingCost}
              onChange={(e) => setDefaultShippingCost(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-cocoa focus:outline-none focus:ring-2 focus:ring-cocoa/15"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cocoa px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-rose-accent disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
