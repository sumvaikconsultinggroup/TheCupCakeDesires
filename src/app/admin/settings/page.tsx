'use client'

import { AlertCircle, Check, Loader2, Save, Upload } from 'lucide-react'
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
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    logoUrl: '/images/Cupcake-Logo.png',
  })

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

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
          currency: data.settings.currency || 'INR',
          timezone: data.settings.timezone || 'Asia/Kolkata',
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
    <div className="space-y-6">
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
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#2e1f15] dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="Asia/Kolkata">India (GMT+5:30)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="Europe/London">London (GMT)</option>
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
    </div>
  )
}
