'use server'

import { revalidatePath } from 'next/cache'

import { getCurrentUser } from '@/lib/auth'
import {
  getDefaultHomepageSectionsConfig,
  mergeHomepageSectionsConfig,
  type HomepageSectionsConfig,
} from '@/lib/homepage-sections-defaults'
import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import HomepageSectionsSettings from '@/models/HomepageSectionsSettings'

const STORE_ID = 'default'

const toPlain = <T>(v: T): T => JSON.parse(JSON.stringify(v))

function assertHomepageAccess(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) return { ok: false as const, message: 'Unauthorized' }
  if (user.role !== 'owner' && !user.permissions?.includes('/admin/homepage')) {
    return { ok: false as const, message: "You don't have access to homepage settings." }
  }
  return { ok: true as const }
}

export async function getHomepageSectionsSettings() {
  try {
    await connectDb()
    let doc: any = await HomepageSectionsSettings.findOne({ storeId: STORE_ID }).lean()
    if (!doc) {
      const fresh = await HomepageSectionsSettings.create({
        storeId: STORE_ID,
        sections: getDefaultHomepageSectionsConfig(),
      })
      doc = fresh.toObject ? fresh.toObject() : fresh
    }

    const sections = mergeHomepageSectionsConfig(doc.sections)

    return {
      success: true,
      settings: toPlain({
        _id: doc?._id?.toString(),
        sections,
      }),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load homepage sections'
    console.error('getHomepageSectionsSettings error:', error)
    return { success: false, message }
  }
}

export async function updateHomepageSectionsSettings(sections: HomepageSectionsConfig) {
  try {
    const user = await getCurrentUser()
    const access = assertHomepageAccess(user)
    if (!access.ok) return { success: false, message: access.message }

    await connectDb()

    const merged = mergeHomepageSectionsConfig(sections)

    const updated: any = await HomepageSectionsSettings.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set: { sections: merged } },
      { new: true, upsert: true }
    ).lean()

    try {
      revalidatePath('/')
    } catch (e) {
      console.warn('revalidatePath(/) failed (non-fatal):', e)
    }

    return {
      success: true,
      message: 'Homepage sections saved — storefront refreshed.',
      settings: toPlain({
        _id: updated?._id?.toString(),
        sections: mergeHomepageSectionsConfig(updated.sections),
      }),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save homepage sections'
    console.error('updateHomepageSectionsSettings error:', error)
    return { success: false, message }
  }
}

export async function getPublishedCollectionsForPicker() {
  try {
    const user = await getCurrentUser()
    const access = assertHomepageAccess(user)
    if (!access.ok) return { success: false, message: access.message, collections: [] as const }

    await connectDb()
    const collections = await Collection.find({ published: true, isDeleted: { $ne: true } })
      .select('handle title image')
      .sort({ title: 1 })
      .lean()

    return {
      success: true,
      collections: toPlain(
        collections.map((c: any) => ({
          handle: c.handle,
          title: c.title,
          image: c.image || '',
        }))
      ),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load collections'
    return { success: false, message, collections: [] as const }
  }
}
