'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUser } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import HeroSettings, { IHeroCornerPair } from '@/models/HeroSettings'

const STORE_ID = 'default'

const toPlain = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export interface HeroSettingsPayload {
  enabled?: boolean
  images?: string[]
  topLeft?: Partial<IHeroCornerPair>
  topRight?: Partial<IHeroCornerPair>
  bottomLeft?: Partial<IHeroCornerPair>
  bottomRight?: Partial<IHeroCornerPair>
  center?: { eyebrow?: string; title?: string; footer?: string }
}

export async function getHeroSettings() {
  try {
    await connectDb()
    let doc: any = await HeroSettings.findOne({ storeId: STORE_ID }).lean()
    if (!doc) {
      const fresh = await HeroSettings.create({ storeId: STORE_ID })
      doc = fresh.toObject ? fresh.toObject() : fresh
    }
    return {
      success: true,
      settings: toPlain({ ...doc, _id: doc?._id?.toString() }),
    }
  } catch (error: any) {
    console.error('getHeroSettings error:', error)
    return { success: false, message: error?.message || 'Failed to load hero settings' }
  }
}

export async function updateHeroSettings(data: HeroSettingsPayload) {
  try {
    const user = await getCurrentUser()
    if (!user) return { success: false, message: 'Unauthorized' }
    if (user.role !== 'owner' && !user.permissions?.includes('/admin/homepage')) {
      return { success: false, message: "You don't have access to homepage settings." }
    }

    await connectDb()

    const $set: Record<string, any> = {}

    if (typeof data.enabled === 'boolean') $set['enabled'] = data.enabled

    if (Array.isArray(data.images)) {
      if (data.images.length !== 4) {
        return { success: false, message: 'Provide exactly 4 hero images.' }
      }
      $set['images'] = data.images.map((s) => String(s || '').trim())
    }

    for (const corner of ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const) {
      const v = data[corner]
      if (v) {
        if (typeof v.line1 === 'string') $set[`${corner}.line1`] = v.line1
        if (typeof v.line2 === 'string') $set[`${corner}.line2`] = v.line2
      }
    }

    if (data.center) {
      for (const k of ['eyebrow', 'title', 'footer'] as const) {
        if (typeof data.center[k] === 'string') $set[`center.${k}`] = data.center[k]
      }
    }

    const updated: any = await HeroSettings.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set },
      { new: true, upsert: true }
    ).lean()

    // On-demand ISR — flush the cached '/' so the saved hero shows up on the
    // very next request instead of waiting for the 60-second background revalidate.
    try {
      revalidatePath('/')
    } catch (e) {
      console.warn('revalidatePath(/) failed (non-fatal):', e)
    }

    return {
      success: true,
      message: 'Hero saved — storefront refreshed.',
      settings: toPlain({ ...updated, _id: updated?._id?.toString() }),
    }
  } catch (error: any) {
    console.error('updateHeroSettings error:', error)
    return { success: false, message: error?.message || 'Failed to save hero' }
  }
}
