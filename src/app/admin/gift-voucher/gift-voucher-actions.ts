'use server'

import connectDb from '@/lib/mongodb'
import GiftVoucherPage, {
  IGiftVoucherBenefit,
  IGiftVoucherFaq,
  IGiftVoucherStep,
  IGiftVoucherTier,
} from '@/models/GiftVoucherPage'

const STORE_ID = 'default'

const toPlain = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export interface GiftVoucherSettingsPayload {
  enabled?: boolean
  hero?: {
    eyebrow?: string
    scriptWord?: string
    headline?: string
    subheadline?: string
    image?: string
    ctaText?: string
  }
  productHandle?: string
  tiers?: IGiftVoucherTier[]
  benefits?: IGiftVoucherBenefit[]
  howItWorks?: IGiftVoucherStep[]
  faqs?: IGiftVoucherFaq[]
  termsContent?: string
  closing?: {
    eyebrow?: string
    headline?: string
    body?: string
    ctaText?: string
  }
}

export async function getGiftVoucherSettings() {
  try {
    await connectDb()

    let settings: any = await GiftVoucherPage.findOne({ storeId: STORE_ID }).lean()

    if (!settings) {
      const fresh = await GiftVoucherPage.create({ storeId: STORE_ID })
      settings = fresh.toObject ? fresh.toObject() : fresh
    }

    return {
      success: true,
      settings: toPlain({ ...settings, _id: settings?._id?.toString() }),
    }
  } catch (error: any) {
    console.error('getGiftVoucherSettings error:', error)
    return { success: false, message: error.message }
  }
}

export async function updateGiftVoucherSettings(data: GiftVoucherSettingsPayload) {
  try {
    await connectDb()

    const $set: Record<string, any> = {}

    if (typeof data.enabled === 'boolean') $set['enabled'] = data.enabled
    if (data.productHandle) $set['productHandle'] = data.productHandle
    if (typeof data.termsContent === 'string') $set['termsContent'] = data.termsContent

    if (data.hero) {
      for (const k of ['eyebrow', 'scriptWord', 'headline', 'subheadline', 'image', 'ctaText'] as const) {
        if (data.hero[k] !== undefined) $set[`hero.${k}`] = data.hero[k]
      }
    }

    if (data.closing) {
      for (const k of ['eyebrow', 'headline', 'body', 'ctaText'] as const) {
        if (data.closing[k] !== undefined) $set[`closing.${k}`] = data.closing[k]
      }
    }

    // Arrays — replace wholesale (admin sends the canonical version)
    if (Array.isArray(data.tiers)) {
      $set['tiers'] = data.tiers.map((t) => ({
        amount: Number(t.amount),
        label: String(t.label || `$${t.amount}`),
        blurb: String(t.blurb || ''),
        popular: !!t.popular,
        recipientSuggestion: String(t.recipientSuggestion || ''),
      }))
    }
    if (Array.isArray(data.benefits)) {
      $set['benefits'] = data.benefits.map((b) => ({
        icon: String(b.icon || 'Sparkles'),
        title: String(b.title || ''),
        description: String(b.description || ''),
      }))
    }
    if (Array.isArray(data.howItWorks)) {
      $set['howItWorks'] = data.howItWorks.map((s) => ({
        title: String(s.title || ''),
        description: String(s.description || ''),
      }))
    }
    if (Array.isArray(data.faqs)) {
      $set['faqs'] = data.faqs.map((f) => ({
        question: String(f.question || ''),
        answer: String(f.answer || ''),
      }))
    }

    const settings: any = await GiftVoucherPage.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set },
      { new: true, upsert: true }
    ).lean()

    return {
      success: true,
      message: 'Gift voucher page saved',
      settings: toPlain({ ...settings, _id: settings?._id?.toString() }),
    }
  } catch (error: any) {
    console.error('updateGiftVoucherSettings error:', error)
    return { success: false, message: error.message }
  }
}
