'use client'

import {
  AlertCircle,
  AtSign,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

interface StoreSettings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  timezone: string
  logoUrl?: string
}

interface AdminAccount {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'staff'
}

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    currency: 'AUD',
    timezone: 'Australia/Melbourne',
    logoUrl: '/images/Cupcake-Logo.png',
  })

  // Admin account (used for OTP-secured Forgot Password + Email Change UI)
  const [account, setAccount] = useState<AdminAccount | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    try {
      const res = await fetch('/api/admin/account/me')
      const data = await res.json()
      if (data.success && data.account) setAccount(data.account)
    } catch (err) {
      console.error('Failed to load admin account:', err)
    }
  }

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success && data.settings) {
        setSettings({
          storeName: data.settings.storeName || '',
          storeEmail: data.settings.storeEmail || '',
          storePhone: data.settings.storePhone || '',
          storeAddress: data.settings.storeAddress || '',
          currency: data.settings.currency || 'AUD',
          timezone: data.settings.timezone || 'Australia/Melbourne',
          logoUrl: data.settings.logoUrl || '/images/Cupcake-Logo.png',
        })
      } else {
        setError(data.error || 'Failed to load settings')
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err)
      setError('Failed to load settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.url) {
        setSettings((prev) => ({ ...prev, logoUrl: data.url }))
        // Auto-save after upload
        await handleSave()
      } else {
        setError(data.error || 'Failed to upload logo')
      }
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      setError('Failed to upload logo. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#2e1f15]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 p-4 text-green-700">
          <Check className="h-5 w-5" />
          Settings saved successfully!
        </div>
      )}

      {/* Store Logo */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Store Logo</h2>
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-40 overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={settings.logoUrl || '/images/Cupcake-Logo.png'}
              alt="Store Logo"
              fill
              className="object-contain p-2"
            />
          </div>
          <div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-300"
            >
              {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingLogo ? 'Uploading...' : 'Change Logo'}
            </button>
            <p className="mt-2 text-xs text-neutral-500">Recommended: 400x100px PNG or SVG (Max 5MB)</p>
          </div>
        </div>
      </div>

      {/* Store Details */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Store Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Store Name</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.storeEmail}
              onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.storePhone}
              onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Address</label>
            <input
              type="text"
              value={settings.storeAddress}
              onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-white">Regional Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="AUD">Australian Dollar (A$)</option>
              <option value="NZD">New Zealand Dollar (NZ$)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="Australia/Melbourne">Melbourne (AEST/AEDT)</option>
              <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
              <option value="Australia/Brisbane">Brisbane (AEST)</option>
              <option value="Australia/Perth">Perth (AWST)</option>
              <option value="Australia/Adelaide">Adelaide (ACST/ACDT)</option>
              <option value="Pacific/Auckland">Auckland (NZST/NZDT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#2e1f15] px-6 py-3 font-medium text-white transition-all hover:bg-[#2e1f15]/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Account security — Forgot password + (owner-only) change email */}
      <PasswordResetCard account={account} />
      {account?.role === 'owner' && <ChangeEmailCard account={account} onUpdated={fetchAccount} />}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Forgot password — sends 6-digit OTP to current admin email, then resets */
/* ─────────────────────────────────────────────────────────────────────── */
function PasswordResetCard({ account }: { account: AdminAccount | null }) {
  const [step, setStep] = useState<'idle' | 'code'>('idle')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const requestCode = async () => {
    setError(null)
    setSuccess(null)
    setSending(true)
    try {
      const res = await fetch('/api/admin/account/request-password-otp', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not send code')
        return
      }
      setSuccess(data.message || 'Code sent.')
      setStep('code')
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setSending(false)
    }
  }

  const submit = async () => {
    setError(null)
    setSuccess(null)
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords don’t match.')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/admin/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not update password')
        return
      }
      setSuccess(data.message || 'Password updated.')
      setStep('idle')
      setCode('')
      setNewPassword('')
      setConfirm('')
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Forgot / change password
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            We&rsquo;ll email a 6-digit code to{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {account?.email || 'your admin email'}
            </span>{' '}
            so you can set a new password.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {step === 'idle' && (
        <button
          onClick={requestCode}
          disabled={sending || !account}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2e1f15] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2e1f15]/90 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {sending ? 'Sending…' : 'Send verification code'}
        </button>
      )}

      {step === 'code' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              6-digit code
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              New password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Confirm password
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button
              onClick={submit}
              disabled={verifying || code.length !== 6}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2e1f15] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2e1f15]/90 disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {verifying ? 'Updating…' : 'Verify & set new password'}
            </button>
            <button
              onClick={requestCode}
              disabled={sending}
              className="text-sm text-neutral-600 underline decoration-rose-300 underline-offset-4 hover:text-rose-600 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send a new code'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────── */
/* Change account email — OWNER ONLY                                    */
/* OTP goes to OLD email (proof of control), then new email is applied. */
/* ───────────────────────────────────────────────────────────────────── */
function ChangeEmailCard({
  account,
  onUpdated,
}: {
  account: AdminAccount
  onUpdated: () => void
}) {
  const [step, setStep] = useState<'idle' | 'code'>('idle')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const requestCode = async () => {
    setError(null)
    setSuccess(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Enter a valid email.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/admin/account/request-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not send code')
        return
      }
      setSuccess(data.message || 'Code sent.')
      setStep('code')
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setSending(false)
    }
  }

  const submit = async () => {
    setError(null)
    setSuccess(null)
    setVerifying(true)
    try {
      const res = await fetch('/api/admin/account/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not update email')
        return
      }
      setSuccess(data.message || 'Email updated.')
      setStep('idle')
      setCode('')
      setNewEmail('')
      onUpdated()
    } catch (e: any) {
      setError(e?.message || 'Network error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <AtSign className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            Change account email
            <span className="ml-2 inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
              OWNER ONLY
            </span>
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Current:{' '}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {account.email}
            </span>
            . A code goes to your current email to prove it&rsquo;s really you.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {step === 'idle' && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@cupcakedesires.com"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={requestCode}
            disabled={sending || !newEmail}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e1f15] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2e1f15]/90 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {sending ? 'Sending…' : 'Send code'}
          </button>
        </div>
      )}

      {step === 'code' && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            onClick={submit}
            disabled={verifying || code.length !== 6}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2e1f15] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2e1f15]/90 disabled:opacity-50"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {verifying ? 'Verifying…' : 'Verify & change email'}
          </button>
          <button
            onClick={requestCode}
            disabled={sending}
            className="text-sm text-neutral-600 underline decoration-rose-300 underline-offset-4 hover:text-rose-600 disabled:opacity-50 sm:col-span-2"
          >
            {sending ? 'Sending…' : 'Send a new code'}
          </button>
        </div>
      )}
    </div>
  )
}
