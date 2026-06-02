'use server'

import connectDb from '@/lib/mongodb'
import {
  getStripePublishableKey,
  isStripeConfigured,
  isStripeTestMode,
  isStripeWebhookConfigured,
} from '@/lib/stripe'
import PaymentSettings from '@/models/PaymentSettings'

const STORE_ID = 'default'

export async function getPaymentSettings() {
  try {
    await connectDb()

    let settings: any = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()

    if (!settings) {
      const fresh = await PaymentSettings.create({ storeId: STORE_ID })
      settings = fresh.toObject ? fresh.toObject() : fresh
    }

    // Live env-derived flags so the UI always shows the truth.
    const envState = {
      configured: isStripeConfigured(),
      webhookConfigured: isStripeWebhookConfigured(),
      testMode: isStripeTestMode(),
      publishableKey: getStripePublishableKey(),
    }

    return {
      success: true,
      settings: {
        ...settings,
        _id: settings?._id?.toString(),
        stripe: {
          ...settings.stripe,
          publishableKeyConfigured: !!envState.publishableKey,
          webhookConfigured: envState.webhookConfigured,
          testMode: envState.testMode,
        },
      },
      envState,
    }
  } catch (error: any) {
    console.error('getPaymentSettings error:', error)
    return { success: false, message: error.message }
  }
}

/** Update only operational toggles. Keys + webhook secrets live in env, never the DB. */
export async function updatePaymentSettings(data: {
  stripe?: {
    enabled?: boolean
    supportedMethods?: string[]
    statementDescriptor?: string
  }
  defaultCurrency?: string
  taxRate?: number
  taxInclusive?: boolean
  freeShippingThreshold?: number
  defaultShippingCost?: number
  pickupAddress?: Record<string, any>
}) {
  try {
    await connectDb()

    const $set: Record<string, any> = {}
    if (data.stripe) {
      if (typeof data.stripe.enabled === 'boolean') $set['stripe.enabled'] = data.stripe.enabled
      if (data.stripe.supportedMethods)
        $set['stripe.supportedMethods'] = data.stripe.supportedMethods
      if (data.stripe.statementDescriptor !== undefined)
        $set['stripe.statementDescriptor'] = data.stripe.statementDescriptor.slice(0, 22)
    }
    if (data.defaultCurrency) $set['defaultCurrency'] = data.defaultCurrency
    if (typeof data.taxRate === 'number') $set['taxRate'] = data.taxRate
    if (typeof data.taxInclusive === 'boolean') $set['taxInclusive'] = data.taxInclusive
    if (typeof data.freeShippingThreshold === 'number')
      $set['freeShippingThreshold'] = data.freeShippingThreshold
    if (typeof data.defaultShippingCost === 'number')
      $set['defaultShippingCost'] = data.defaultShippingCost
    if (data.pickupAddress) $set['pickupAddress'] = data.pickupAddress

    const settings: any = await PaymentSettings.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set },
      { new: true, upsert: true }
    ).lean()

    return {
      success: true,
      message: 'Settings saved',
      settings: { ...settings, _id: settings?._id?.toString() },
    }
  } catch (error: any) {
    console.error('updatePaymentSettings error:', error)
    return { success: false, message: error.message }
  }
}
