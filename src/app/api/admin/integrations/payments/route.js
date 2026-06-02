import connectDb from '@/lib/mongodb'
import {
  getStripePublishableKey,
  isStripeConfigured,
  isStripeTestMode,
  isStripeWebhookConfigured,
} from '@/lib/stripe'
import PaymentSettings from '@/models/PaymentSettings'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STORE_ID = 'default'

// GET /api/admin/integrations/payments
export async function GET() {
  try {
    await connectDb()

    let settings = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()

    if (!settings) {
      settings = await PaymentSettings.create({ storeId: STORE_ID })
      settings = settings.toObject()
    }

    const { _id, ...rest } = settings

    return NextResponse.json({
      success: true,
      settings: {
        ...rest,
        stripe: {
          ...rest.stripe,
          publishableKeyConfigured: !!getStripePublishableKey(),
          webhookConfigured: isStripeWebhookConfigured(),
          testMode: isStripeTestMode(),
        },
      },
      envState: {
        configured: isStripeConfigured(),
        webhookConfigured: isStripeWebhookConfigured(),
        testMode: isStripeTestMode(),
        publishableKey: getStripePublishableKey(),
      },
    })
  } catch (error) {
    console.error('Get payment settings error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/integrations/payments
export async function POST(request) {
  try {
    await connectDb()

    const body = await request.json()
    const { stripe, defaultCurrency, taxRate, taxInclusive, freeShippingThreshold, defaultShippingCost, pickupAddress } = body

    const $set = {}
    if (stripe) {
      if (typeof stripe.enabled === 'boolean') $set['stripe.enabled'] = stripe.enabled
      if (stripe.supportedMethods) $set['stripe.supportedMethods'] = stripe.supportedMethods
      if (typeof stripe.statementDescriptor === 'string')
        $set['stripe.statementDescriptor'] = stripe.statementDescriptor.slice(0, 22)
    }
    if (defaultCurrency) $set['defaultCurrency'] = defaultCurrency
    if (typeof taxRate === 'number') $set['taxRate'] = taxRate
    if (typeof taxInclusive === 'boolean') $set['taxInclusive'] = taxInclusive
    if (typeof freeShippingThreshold === 'number') $set['freeShippingThreshold'] = freeShippingThreshold
    if (typeof defaultShippingCost === 'number') $set['defaultShippingCost'] = defaultShippingCost
    if (pickupAddress) $set['pickupAddress'] = pickupAddress

    const settings = await PaymentSettings.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set },
      { upsert: true, new: true }
    ).lean()

    const { _id, ...rest } = settings

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
      settings: rest,
    })
  } catch (error) {
    console.error('Update payment settings error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
